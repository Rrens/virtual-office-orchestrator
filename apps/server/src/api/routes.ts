import type { FastifyInstance } from 'fastify';
import { getAgentDefinitions, spawnAgentInstance } from '../agents/registry.js';
import { createTask, getTaskById, updateTaskStatus } from '../tasks/service.js';
import { workflowEngine } from '../workflows/engine.js';
import { goalPlanner } from '../orchestrator/planner.js';
import { approvalService } from '../approvals/service.js';
import { memoryService } from '../memory/service.js';
import { budgetTracker } from '../memory/budget.js';
import { closedLoopService, type CustomerFeedbackInput } from '../feedback/closed-loop.js';
import { publishEvent } from '../events/kafka.js';
import { prisma } from '../db.js';
import { randomUUID } from 'crypto';
import { requireFounder } from './auth.js';
import type { AgentRole, TaskStatus, MemoryScope } from '@virtual-office/shared';

import { readLogs, listLogDates, type LogLevel } from '../utils/logger.js';
import { exportProject } from '../utils/exporter.js';
import { graphifyService } from '../graphify/service.js';
import { DEPARTMENT_LEADS } from '../orchestrator/hierarchicalPlanner.js';

export async function registerRoutes(app: FastifyInstance) {
  // Organizations & Projects
  app.post('/api/projects', { preHandler: requireFounder }, async (req, reply) => {
    const { name, goal, autonomyLevel = 1, prdFiles = [] } = req.body as {
      name: string;
      goal: string;
      autonomyLevel?: number;
      prdFiles?: Array<{ name: string; content: string; sizeBytes?: number; mimeType?: string }>;
    };

    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: { name: 'Default Company' },
      });
    }

    const project = await prisma.project.create({
      data: {
        organizationId: org.id,
        name,
        goal,
        autonomyLevel,
        status: 'draft',
      },
    });

    if (Array.isArray(prdFiles) && prdFiles.length > 0) {
      await prisma.memoryStore.create({
        data: {
          scope: 'project',
          scopeId: project.id,
          key: 'prd_files',
          value: JSON.stringify(prdFiles),
        },
      });
    }

    return reply.status(201).send(project);
  });

  app.get('/api/projects', async () => {
    return prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { agentInstances: true } } },
    });
  });

  app.get('/api/projects/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        agentInstances: { include: { definition: true } },
        workflowExecutions: { include: { tasks: true } },
      },
    });

    if (!project) return reply.status(404).send({ error: 'Project not found' });
    return project;
  });

  // Workflow & Planning
  app.post('/api/projects/:id/plan', { preHandler: requireFounder }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    const plan = await goalPlanner.plan(id, project.goal);
    return plan;
  });

  app.post('/api/projects/:id/start', { preHandler: requireFounder }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const executionId = await workflowEngine.startProjectWorkflow(id);
      return reply.status(201).send({ workflowExecutionId: executionId, message: 'Workflow started successfully' });
    } catch (err) {
      return reply.status(400).send({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/projects/:id/pause', { preHandler: requireFounder }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return reply.status(404).send({ error: 'Project not found' });
    if (project.status !== 'running') return reply.status(400).send({ error: 'Project is not running' });

    await prisma.project.update({ where: { id }, data: { status: 'paused' } });
    await publishEvent({
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      projectId: id,
      type: 'project.paused',
    });
    return { message: 'Project paused' };
  });

  app.post('/api/projects/:id/resume', { preHandler: requireFounder }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return reply.status(404).send({ error: 'Project not found' });
    if (project.status !== 'paused') return reply.status(400).send({ error: 'Project is not paused' });

    await prisma.project.update({ where: { id }, data: { status: 'running' } });
    await publishEvent({
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      projectId: id,
      type: 'project.resumed',
    });
    return { message: 'Project resumed' };
  });

  app.post('/api/projects/:id/cancel', { preHandler: requireFounder }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return reply.status(404).send({ error: 'Project not found' });
    if (['completed', 'cancelled'].includes(project.status)) {
      return reply.status(400).send({ error: 'Project already finalized' });
    }

    const updated = await prisma.project.update({ where: { id }, data: { status: 'cancelled' } });
    await prisma.workflowExecution.updateMany({
      where: { projectId: id, status: { notIn: ['completed', 'cancelled'] } },
      data: { status: 'cancelled', completedAt: new Date() },
    });
    await prisma.task.updateMany({
      where: { workflowExecution: { projectId: id }, status: { notIn: ['COMPLETED', 'APPROVED', 'CANCELLED'] } },
      data: { status: 'CANCELLED' },
    });
    await publishEvent({
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      projectId: id,
      type: 'project.cancelled',
    });
    return { message: 'Project cancelled', project: updated };
  });

  // Project tasks and events (PRD §31)
  app.get('/api/projects/:id/tasks', async (req, reply) => {
    const { id } = req.params as { id: string };
    const tasks = await prisma.task.findMany({
      where: { workflowExecution: { projectId: id } },
      orderBy: { createdAt: 'asc' },
      include: {
        assignedAgent: { include: { definition: true } },
        artifacts: true,
      },
    });
    return tasks;
  });

  app.get('/api/projects/:id/events', async (req, reply) => {
    const { id } = req.params as { id: string };
    const events = await prisma.eventLog.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return events;
  });

  // Global events log (PRD §31)
  app.get('/api/events', async (req) => {
    const { limit = '100' } = req.query as { limit?: string };
    return prisma.eventLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit), 500),
    });
  });

  // Workflows (PRD §31)
  app.get('/api/workflows', async (req) => {
    const { projectId } = req.query as { projectId?: string };
    return prisma.workflowExecution.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        tasks: {
          include: {
            assignedAgent: { include: { definition: true } },
          },
        },
      },
    });
  });

  app.get('/api/workflows/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const workflow = await prisma.workflowExecution.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            assignedAgent: { include: { definition: true } },
            artifacts: true,
            reviews: true,
          },
        },
      },
    });
    if (!workflow) return reply.status(404).send({ error: 'Workflow execution not found' });
    return workflow;
  });

  app.post('/api/workflows/:id/resume', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { failedTaskId } = req.body as { failedTaskId: string };
    try {
      await workflowEngine.resumeFromFailure(id, failedTaskId);
      return { message: 'Workflow resumed from failure' };
    } catch (err) {
      return reply.status(400).send({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Agent Definitions & Instances
  app.get('/api/agents', async (req) => {
    const { projectId } = req.query as { projectId?: string };
    if (projectId) {
      return prisma.agentInstance.findMany({
        where: { projectId },
        include: { definition: { include: { department: true } } },
      });
    }
    return prisma.agentInstance.findMany({
      include: { definition: { include: { department: true } } },
    });
  });

  // PRD §31: GET /api/agents/:id alias
  app.get('/api/agents/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    let instance = await prisma.agentInstance.findUnique({
      where: { id },
      include: {
        definition: { include: { department: true } },
        project: true,
        assignedTasks: { take: 5, orderBy: { updatedAt: 'desc' } },
        agentRuns: { take: 10, orderBy: { createdAt: 'desc' }, include: { toolCalls: true, task: true } },
      },
    });

    if (!instance) {
      instance = await prisma.agentInstance.findFirst({
        where: { definition: { role: id as AgentRole } },
        include: {
          definition: { include: { department: true } },
          project: true,
          assignedTasks: { take: 5, orderBy: { updatedAt: 'desc' } },
          agentRuns: { take: 10, orderBy: { createdAt: 'desc' }, include: { toolCalls: true, task: true } },
        },
      });
    }

    if (!instance) {
      const def = await prisma.agentDefinition.findFirst({
        where: { OR: [{ id }, { role: id as AgentRole }] },
        include: { department: true },
      });

      if (def) {
        return {
          id: `def-${def.role}`,
          definitionId: def.id,
          definition: def,
          projectId: null,
          project: null,
          status: 'IDLE',
          currentTask: null,
          assignedTasks: [],
          agentRuns: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      return {
        id: `virtual-${id}`,
        definitionId: id,
        definition: {
          id,
          role: id,
          name: id === 'security-guard' ? 'Pak Joko' : id === 'receptionist' ? 'Siti' : id,
          persona: id === 'security-guard' ? 'Head of Physical Security & Tower Access Control' : id === 'receptionist' ? 'Front Desk & Guest Reception Specialist' : 'Virtual Office Agent',
          modelTier: 'TIER_1_LOCAL',
          tools: [],
          permissions: [],
          department: { id: 'lobby', name: 'Front Desk & Security', code: 'LOBBY' },
        },
        projectId: null,
        project: null,
        status: 'IDLE',
        currentTask: null,
        assignedTasks: [],
        agentRuns: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return instance;
  });

  // Departments list
  app.get('/api/departments', async () => {
    return prisma.department.findMany({ orderBy: { name: 'asc' } });
  });

  app.get('/api/agents/definitions', async () => {
    const defs = await getAgentDefinitions();
    const modelMems = await prisma.memoryStore.findMany({
      where: {
        scope: 'organization',
        scopeId: 'default',
        key: { startsWith: 'preferred_model_' },
      },
    });

    const modelMap = new Map<string, { modelName: string; tier: string }>();
    for (const mem of modelMems) {
      try {
        const role = mem.key.replace('preferred_model_', '');
        modelMap.set(role, JSON.parse(mem.value));
      } catch {}
    }

    return defs.map((d) => ({
      ...d,
      preferredModel: modelMap.get(d.role) ?? null,
    }));
  });

  // Create new Agent Definition
  app.post('/api/agents/definitions', async (req, reply) => {
    const { name, role, persona, modelTier = 'tier1_ollama', tools = [], permissions = [], departmentId } = req.body as {
      name: string;
      role: string;
      persona: string;
      modelTier?: string;
      tools?: string[];
      permissions?: string[];
      departmentId: string;
    };

    if (!name || !role || !departmentId) {
      return reply.status(400).send({ error: 'Name, role, and departmentId are required' });
    }

    const created = await prisma.agentDefinition.create({
      data: {
        name,
        role,
        persona: persona || `Agent for ${name}`,
        modelTier,
        tools,
        permissions,
        departmentId,
      },
      include: { department: true },
    });

    return reply.status(201).send(created);
  });

  // Update Agent Definition (Rename, edit persona, change tools, permissions, department)
  app.patch('/api/agents/definitions/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { name, persona, modelTier, tools, permissions, departmentId, role } = req.body as {
      name?: string;
      persona?: string;
      modelTier?: string;
      tools?: string[];
      permissions?: string[];
      departmentId?: string;
      role?: string;
    };

    const updated = await prisma.agentDefinition.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(persona && { persona }),
        ...(modelTier && { modelTier }),
        ...(tools && { tools }),
        ...(permissions && { permissions }),
        ...(departmentId && { departmentId }),
        ...(role && { role }),
      },
      include: { department: true },
    });

    return updated;
  });

  // Delete Agent Definition
  app.delete('/api/agents/definitions/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    await prisma.agentDefinition.delete({ where: { id } });
    return { success: true };
  });

  // Batch LLM Preset Override for all agents
  app.post('/api/agents/models/batch-override', async (req, reply) => {
    const { preset, modelName, tier } = req.body as {
      preset?: 'local' | 'balanced' | 'max';
      modelName?: string;
      tier?: string;
    };

    let chosenModel = modelName;
    let chosenTier = tier;

    if (preset === 'local') {
      chosenModel = 'qwen2.5-coder:7b';
      chosenTier = 'tier1_ollama';
    } else if (preset === 'balanced') {
      chosenModel = '9Router-3-Specialized-Code';
      chosenTier = 'tier2_9router';
    } else if (preset === 'max') {
      chosenModel = 'claude-3-5-sonnet';
      chosenTier = 'tier3_cloud';
    }

    if (!chosenModel || !chosenTier) {
      return reply.status(400).send({ error: 'Model and tier are required' });
    }

    const definitions = await prisma.agentDefinition.findMany();
    for (const def of definitions) {
      await prisma.memoryStore.upsert({
        where: {
          scope_scopeId_key: {
            scope: 'organization',
            scopeId: 'default',
            key: `preferred_model_${def.role}`,
          },
        },
        update: {
          value: JSON.stringify({ modelName: chosenModel, tier: chosenTier, updatedAt: new Date().toISOString() }),
        },
        create: {
          scope: 'organization',
          scopeId: 'default',
          key: `preferred_model_${def.role}`,
          value: JSON.stringify({ modelName: chosenModel, tier: chosenTier, updatedAt: new Date().toISOString() }),
        },
      });
    }

    return { success: true, count: definitions.length, modelName: chosenModel, tier: chosenTier };
  });

  // Available Model Options for Per-Agent Configuration
  app.get('/api/agents/models/options', async () => {
    return [
      { id: 'qwen2.5-coder:3b', name: 'Qwen 2.5 Coder 3B (Local Fast)', tier: 'tier1_ollama', cost: 'Free (Local)' },
      { id: 'qwen2.5-coder:7b', name: 'Qwen 2.5 Coder 7B (Local Balanced)', tier: 'tier1_ollama', cost: 'Free (Local)' },
      { id: 'llama3.1:8b', name: 'Llama 3.1 8B (Local General)', tier: 'tier1_ollama', cost: 'Free (Local)' },
      { id: 'qwen3.5:4b', name: 'Qwen 3.5 4B (Local General)', tier: 'tier1_ollama', cost: 'Free (Local)' },
      { id: '9Router-3-Specialized-Code', name: '9Router Specialized Code', tier: 'tier2_9router', cost: 'Low' },
      { id: '9Router-4-Lightweight-Response', name: '9Router Lightweight Response', tier: 'tier2_9router', cost: 'Low' },
      { id: '9Router-2-High-Performance', name: '9Router High Performance', tier: 'tier2_9router', cost: 'Medium' },
      { id: '9Router-1-Primary-Heavy', name: '9Router Primary Heavy', tier: 'tier2_9router', cost: 'Medium' },
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet (Cloud)', tier: 'tier3_cloud', cost: 'High' },
      { id: 'gpt-4o', name: 'GPT-4o (Cloud)', tier: 'tier3_cloud', cost: 'High' },
    ];
  });

  // Get agent model config
  app.get('/api/agents/instances/:id/model', async (req, reply) => {
    const { id } = req.params as { id: string };
    const mem = await prisma.memoryStore.findUnique({
      where: {
        scope_scopeId_key: {
          scope: 'agent',
          scopeId: id,
          key: 'preferred_model',
        },
      },
    });

    if (mem) {
      try {
        return JSON.parse(mem.value);
      } catch {}
    }

    let roleKey = id;
    if (id.startsWith('def-') || id.startsWith('virtual-')) {
      roleKey = id.replace(/^(def-|virtual-)/, '');
    } else {
      const inst = await prisma.agentInstance.findUnique({
        where: { id },
        include: { definition: true },
      });
      if (inst?.definition?.role) {
        roleKey = inst.definition.role;
      }
    }

    const roleMem = await prisma.memoryStore.findUnique({
      where: {
        scope_scopeId_key: {
          scope: 'organization',
          scopeId: 'default',
          key: `preferred_model_${roleKey}`,
        },
      },
    });

    if (roleMem) {
      try {
        return JSON.parse(roleMem.value);
      } catch {}
    }

    return { modelName: null, tier: null };
  });

  // Override model per agent instance
  app.patch('/api/agents/instances/:id/model', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { modelName, tier } = req.body as { modelName: string; tier: string };

    const mem = await prisma.memoryStore.upsert({
      where: {
        scope_scopeId_key: {
          scope: 'agent',
          scopeId: id,
          key: 'preferred_model',
        },
      },
      update: {
        value: JSON.stringify({ modelName, tier, updatedAt: new Date().toISOString() }),
      },
      create: {
        scope: 'agent',
        scopeId: id,
        key: 'preferred_model',
        value: JSON.stringify({ modelName, tier, updatedAt: new Date().toISOString() }),
      },
    });

    return { success: true, modelName, tier };
  });

  // Override model globally per role
  app.patch('/api/agents/roles/:role/model', async (req, reply) => {
    const { role } = req.params as { role: string };
    const { modelName, tier } = req.body as { modelName: string; tier: string };

    await prisma.memoryStore.upsert({
      where: {
        scope_scopeId_key: {
          scope: 'organization',
          scopeId: 'default',
          key: `preferred_model_${role}`,
        },
      },
      update: {
        value: JSON.stringify({ modelName, tier, updatedAt: new Date().toISOString() }),
      },
      create: {
        scope: 'organization',
        scopeId: 'default',
        key: `preferred_model_${role}`,
        value: JSON.stringify({ modelName, tier, updatedAt: new Date().toISOString() }),
      },
    });

    return { success: true, role, modelName, tier };
  });

  app.get('/api/agents/instances/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    let instance = await prisma.agentInstance.findUnique({
      where: { id },
      include: {
        definition: { include: { department: true } },
        project: true,
        assignedTasks: {
          take: 5,
          orderBy: { updatedAt: 'desc' },
        },
        agentRuns: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { toolCalls: true, task: true },
        },
      },
    });

    if (!instance) {
      instance = await prisma.agentInstance.findFirst({
        where: { definition: { role: id as AgentRole } },
        include: {
          definition: { include: { department: true } },
          project: true,
          assignedTasks: { take: 5, orderBy: { updatedAt: 'desc' } },
          agentRuns: { take: 10, orderBy: { createdAt: 'desc' }, include: { toolCalls: true, task: true } },
        },
      });
    }

    if (!instance) {
      const def = await prisma.agentDefinition.findFirst({
        where: { OR: [{ id }, { role: id as AgentRole }] },
        include: { department: true },
      });

      if (def) {
        return {
          id: `def-${def.role}`,
          definitionId: def.id,
          definition: def,
          projectId: null,
          project: null,
          status: 'IDLE',
          currentTask: null,
          assignedTasks: [],
          agentRuns: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      return {
        id: `virtual-${id}`,
        definitionId: id,
        definition: {
          id,
          role: id,
          name: id === 'security-guard' ? 'Pak Joko' : id === 'receptionist' ? 'Siti' : id,
          persona: id === 'security-guard' ? 'Head of Physical Security & Tower Access Control' : id === 'receptionist' ? 'Front Desk & Guest Reception Specialist' : 'Virtual Office Agent',
          modelTier: 'TIER_1_LOCAL',
          tools: [],
          permissions: [],
          department: { id: 'lobby', name: 'Front Desk & Security', code: 'LOBBY' },
        },
        projectId: null,
        project: null,
        status: 'IDLE',
        currentTask: null,
        assignedTasks: [],
        agentRuns: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return instance;
  });

  app.post('/api/projects/:projectId/agents', { preHandler: requireFounder }, async (req, reply) => {
    const { projectId } = req.params as { projectId: string };
    const { role, avatarUrl } = req.body as { role: AgentRole; avatarUrl?: string };

    const instance = await spawnAgentInstance(projectId, role, avatarUrl);
    return reply.status(201).send(instance);
  });

  // Tasks
  app.post('/api/tasks', async (req, reply) => {
    const body = req.body as any;
    const task = await createTask(body);
    return reply.status(201).send(task);
  });

  app.get('/api/tasks/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const task = await getTaskById(id);
    if (!task) return reply.status(404).send({ error: 'Task not found' });
    return task;
  });

  app.patch('/api/tasks/:id/status', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { status, assignedAgentId } = req.body as {
      status: TaskStatus;
      assignedAgentId?: string;
    };

    const task = await updateTaskStatus(id, status, assignedAgentId);

    const taskWithWorkflow = await prisma.task.findUnique({
      where: { id },
      include: { workflowExecution: true, assignedAgent: { include: { definition: true } } },
    });

    if (taskWithWorkflow?.workflowExecution?.projectId) {
      const eventType = status === 'COMPLETED' || status === 'APPROVED' ? 'task.completed'
        : status === 'RUNNING' || status === 'ASSIGNED' ? 'task.started'
        : status === 'REVIEW' ? 'task.review'
        : status === 'BLOCKED' || status === 'FAILED' ? 'task.blocked'
        : 'task.started';

      await publishEvent({
        eventId: randomUUID(),
        timestamp: new Date().toISOString(),
        type: eventType,
        projectId: taskWithWorkflow.workflowExecution.projectId,
        taskId: id,
        previousStatus: taskWithWorkflow.status as TaskStatus,
        newStatus: status,
        agentRole: taskWithWorkflow.agentRole,
        message: `Status tugas "${taskWithWorkflow.title}" diubah menjadi ${status}`,
      });
    }

    return task;
  });

  // Approvals
  app.get('/api/approvals', async (req) => {
    const { projectId } = req.query as { projectId?: string };
    if (projectId) return approvalService.getPending(projectId);
    return prisma.approval.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      include: { agentInstance: { include: { definition: true } }, task: true },
    });
  });

  app.post('/api/approvals/:id/approve', { preHandler: requireFounder }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { decidedBy = 'founder' } = req.body as { decidedBy?: string };
    try {
      await approvalService.decide(id, 'approved', decidedBy);
      return { message: 'Approved' };
    } catch (err) {
      return reply.status(400).send({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/approvals/:id/reject', { preHandler: requireFounder }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { decidedBy = 'founder' } = req.body as { decidedBy?: string };
    try {
      await approvalService.decide(id, 'rejected', decidedBy);
      return { message: 'Rejected' };
    } catch (err) {
      return reply.status(400).send({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Memory
  app.get('/api/memory/:scope/:scopeId', async (req) => {
    const { scope, scopeId } = req.params as { scope: MemoryScope; scopeId: string };
    return memoryService.getScopeContext(scope, scopeId);
  });

  app.post('/api/memory/:scope/:scopeId', async (req, reply) => {
    const { scope, scopeId } = req.params as { scope: MemoryScope; scopeId: string };
    const { key, value } = req.body as { key: string; value: string };
    await memoryService.set(scope, scopeId, key, value);
    return reply.status(201).send({ message: 'Memory stored' });
  });

  // Budget
  app.get('/api/projects/:id/budget', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      return await budgetTracker.getProjectCostSummary(id);
    } catch (err) {
      return reply.status(404).send({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Artifacts & Codebase Endpoints
  app.get('/api/tasks/:taskId/artifacts', async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const artifacts = await prisma.artifact.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: { agentInstance: { include: { definition: true } } },
    });
    return artifacts;
  });

  // PRD: Get all artifacts for a project (Codebase File Explorer)
  app.get('/api/projects/:id/artifacts', async (req, reply) => {
    const { id } = req.params as { id: string };
    const artifacts = await prisma.artifact.findMany({
      where: {
        task: {
          workflowExecution: {
            projectId: id,
          },
        },
      },
      orderBy: [{ path: 'asc' }, { createdAt: 'desc' }],
      include: {
        task: true,
        agentInstance: {
          include: { definition: { include: { department: true } } },
        },
      },
    });
    return artifacts;
  });

  app.get('/api/artifacts/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const artifact = await prisma.artifact.findUnique({
      where: { id },
      include: { task: true, agentInstance: { include: { definition: true } } },
    });
    if (!artifact) return reply.status(404).send({ error: 'Artifact not found' });
    return artifact;
  });

  // Edit artifact content from Code Studio
  app.patch('/api/artifacts/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { content } = req.body as { content: string };
    const updated = await prisma.artifact.update({
      where: { id },
      data: {
        content,
        sizeBytes: Buffer.byteLength(content, 'utf8'),
      },
    });
    return updated;
  });

  // Create new file / artifact in project
  app.post('/api/projects/:id/artifacts', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { name, path, content, mimeType = 'text/plain', type = 'code' } = req.body as {
      name: string;
      path: string;
      content: string;
      mimeType?: string;
      type?: string;
    };

    const task = await prisma.task.findFirst({
      where: { workflowExecution: { projectId: id } },
    });
    const agent = await prisma.agentInstance.findFirst({
      where: { projectId: id },
    });

    if (!task || !agent) {
      return reply.status(400).send({ error: 'Proyek harus memiliki task dan agent untuk membuat artefak file' });
    }

    const created = await prisma.artifact.create({
      data: {
        taskId: task.id,
        agentInstanceId: agent.id,
        name,
        path: path.startsWith('/') ? path.slice(1) : path,
        content,
        sizeBytes: Buffer.byteLength(content, 'utf8'),
        mimeType,
        type,
      },
    });
    return reply.status(201).send(created);
  });

  // Multi-department tasks endpoint for Kanban Board
  app.get('/api/projects/:id/department-tasks', async (req, reply) => {
    const { id } = req.params as { id: string };
    const tasks = await prisma.task.findMany({
      where: { workflowExecution: { projectId: id } },
      include: {
        assignedAgent: {
          include: {
            definition: { include: { department: true } },
          },
        },
        artifacts: {
          select: { id: true, name: true, path: true, type: true, sizeBytes: true },
        },
        approvals: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return tasks;
  });

  // Create task for specific division
  app.post('/api/projects/:id/department-tasks', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { title, description, agentRole } = req.body as {
      title: string;
      description: string;
      agentRole: string;
    };

    let workflow = await prisma.workflowExecution.findFirst({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
    });

    if (!workflow) {
      workflow = await prisma.workflowExecution.create({
        data: {
          projectId: id,
          status: 'running',
          dagJson: JSON.stringify({ nodes: [], edges: [] }),
        },
      });
    }

    let agent = await prisma.agentInstance.findFirst({
      where: { projectId: id, definition: { role: agentRole } },
    });

    if (!agent) {
      const def = await prisma.agentDefinition.findUnique({ where: { role: agentRole } });
      if (def) {
        agent = await prisma.agentInstance.create({
          data: {
            projectId: id,
            definitionId: def.id,
            status: 'idle',
          },
        });
      }
    }

    const newTask = await prisma.task.create({
      data: {
        workflowExecutionId: workflow.id,
        title,
        description: description || `Tugas untuk divisi ${agentRole}`,
        agentRole,
        assignedAgentId: agent?.id ?? null,
        status: 'QUEUED',
        inputArtifacts: [],
        outputArtifacts: [],
      },
      include: {
        assignedAgent: {
          include: {
            definition: { include: { department: true } },
          },
        },
        artifacts: true,
      },
    });

    return reply.status(201).send(newTask);
  });

  // Closed-loop Customer Feedback
  app.post('/api/projects/:id/feedback', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Omit<CustomerFeedbackInput, 'projectId'>;

    try {
      const result = await closedLoopService.processFeedback({
        projectId: id,
        ...body,
      });
      return reply.status(201).send(result);
    } catch (err) {
      return reply.status(400).send({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Centralized log viewer
  app.get('/api/logs', async (req) => {
    const { date, level, module, search, limit } = req.query as {
      date?: string;
      level?: LogLevel;
      module?: string;
      search?: string;
      limit?: string;
    };

    const logs = await readLogs({
      date,
      level,
      module,
      search,
      limit: limit ? Number(limit) : 200,
    });

    const dates = await listLogDates();

    return { date: date || new Date().toISOString().split('T')[0], dates, logs };
  });

  // Export project as ZIP download
  app.post('/api/projects/:id/export', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const result = await exportProject(id);
      return reply
        .header('Content-Type', 'application/zip')
        .header('Content-Disposition', `attachment; filename="${result.zipFileName}"`)
        .header('Content-Length', result.zipBuffer.length.toString())
        .header('X-Files-Written', result.filesWritten.toString())
        .send(result.zipBuffer);
    } catch (err) {
      return reply.status(400).send({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Graphify Knowledge Graph
  app.get('/api/projects/:id/graph', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const summary = await graphifyService.buildProjectGraph(id);
      return { success: true, ...summary };
    } catch (err) {
      return reply.status(404).send({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/projects/:id/graph/search', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { q = '' } = req.query as { q?: string };
    try {
      const result = await graphifyService.querySubgraph(id, q);
      return { success: true, ...result };
    } catch (err) {
      return reply.status(400).send({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Hierarchical Orchestrator Tree
  app.get('/api/projects/:id/hierarchy', async (req, reply) => {
    const { id } = req.params as { id: string };
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        workflowExecutions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            tasks: {
              include: {
                assignedAgent: { include: { definition: true } },
                dependencies: true,
              },
            },
          },
        },
      },
    });

    if (!project) return reply.status(404).send({ error: 'Project not found' });

    const execution = project.workflowExecutions[0];
    let milestones: any[] = [];
    if (execution?.dagJson) {
      try {
        const parsed = JSON.parse(execution.dagJson);
        milestones = parsed.milestones || [];
      } catch {}
    }

    const tasks = execution?.tasks || [];
    const departmentsSet = new Set<string>();

    tasks.forEach((t) => {
      const dept = Object.entries(DEPARTMENT_LEADS).find(([_, cfg]) =>
        cfg.members.includes(t.agentRole as AgentRole)
      )?.[0] || 'engineering';
      departmentsSet.add(dept);
    });

    const departmentTrees = Array.from(departmentsSet).map((dept) => {
      const leadCfg = DEPARTMENT_LEADS[dept] || DEPARTMENT_LEADS.engineering;
      const milestone = milestones.find((m) => m.department === dept);
      const deptTasks = tasks.filter((t) => {
        return leadCfg.members.includes(t.agentRole as AgentRole);
      });
      const completedTasks = deptTasks.filter((t) => t.status === 'COMPLETED' || t.status === 'APPROVED').length;

      return {
        department: dept,
        subOrchestrator: {
          role: leadCfg.leadRole,
          name: leadCfg.leadName,
          title: leadCfg.subOrchestratorTitle,
        },
        directive: milestone?.directive || `Deliverables for ${dept}`,
        totalTasks: deptTasks.length,
        completedTasks,
        tasks: deptTasks,
      };
    });

    return {
      chiefOrchestrator: {
        role: 'orchestrator',
        name: 'Rendy',
        title: 'Chief Orchestrator (CEO)',
      },
      projectGoal: project.goal,
      departments: departmentTrees,
      totalTasks: tasks.length,
    };
  });
}

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

export async function registerRoutes(app: FastifyInstance) {
  // Organizations & Projects
  app.post('/api/projects', { preHandler: requireFounder }, async (req, reply) => {
    const { name, goal, autonomyLevel = 1 } = req.body as {
      name: string;
      goal: string;
      autonomyLevel?: number;
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
    const instance = await prisma.agentInstance.findUnique({
      where: { id },
      include: {
        definition: { include: { department: true } },
        project: true,
        assignedTasks: { take: 5, orderBy: { updatedAt: 'desc' } },
        agentRuns: { take: 10, orderBy: { createdAt: 'desc' }, include: { toolCalls: true, task: true } },
      },
    });
    if (!instance) return reply.status(404).send({ error: 'Agent instance not found' });
    return instance;
  });

  app.get('/api/agents/definitions', async () => {
    return getAgentDefinitions();
  });

  app.get('/api/agents/instances/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const instance = await prisma.agentInstance.findUnique({
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

    if (!instance) return reply.status(404).send({ error: 'Agent instance not found' });
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

  // Artifacts
  app.get('/api/tasks/:taskId/artifacts', async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const artifacts = await prisma.artifact.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: { agentInstance: { include: { definition: true } } },
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
}

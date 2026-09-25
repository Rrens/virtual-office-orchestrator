import type { FastifyInstance } from 'fastify';
import { getAgentDefinitions, spawnAgentInstance } from '../agents/registry.js';
import { createTask, getTaskById, updateTaskStatus } from '../tasks/service.js';
import { workflowEngine } from '../workflows/engine.js';
import { goalPlanner } from '../orchestrator/planner.js';
import { approvalService } from '../approvals/service.js';
import { memoryService } from '../memory/service.js';
import { budgetTracker } from '../memory/budget.js';
import { closedLoopService, type CustomerFeedbackInput } from '../feedback/closed-loop.js';
import { prisma } from '../db.js';
import type { AgentRole, TaskStatus, MemoryScope } from '@virtual-office/shared';

export async function registerRoutes(app: FastifyInstance) {
  // Organizations & Projects
  app.post('/api/projects', async (req, reply) => {
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
  app.post('/api/projects/:id/plan', async (req, reply) => {
    const { id } = req.params as { id: string };
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    const plan = await goalPlanner.plan(id, project.goal);
    return plan;
  });

  app.post('/api/projects/:id/start', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const executionId = await workflowEngine.startProjectWorkflow(id);
      return reply.status(201).send({ workflowExecutionId: executionId, message: 'Workflow started successfully' });
    } catch (err) {
      return reply.status(400).send({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Agent Definitions & Instances
  app.get('/api/agents/definitions', async () => {
    return getAgentDefinitions();
  });

  app.post('/api/projects/:projectId/agents', async (req, reply) => {
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

  app.post('/api/approvals/:id/approve', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { decidedBy = 'founder' } = req.body as { decidedBy?: string };
    try {
      await approvalService.decide(id, 'approved', decidedBy);
      return { message: 'Approved' };
    } catch (err) {
      return reply.status(400).send({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/approvals/:id/reject', async (req, reply) => {
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
}

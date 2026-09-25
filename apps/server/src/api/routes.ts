import type { FastifyInstance } from 'fastify';
import { getAgentDefinitions, registerAgentDefinition, spawnAgentInstance } from '../agents/registry.js';
import { createTask, getTaskById, updateTaskStatus } from '../tasks/service.js';
import { prisma } from '../db.js';
import type { AgentRole, TaskStatus } from '@virtual-office/shared';

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
}

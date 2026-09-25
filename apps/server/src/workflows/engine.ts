import { prisma } from '../db.js';
import { goalPlanner } from '../orchestrator/planner.js';
import { spawnAgentInstance } from '../agents/registry.js';
import { publishEvent } from '../events/kafka.js';
import { randomUUID } from 'crypto';
import type { AgentRole } from '@virtual-office/shared';

export class WorkflowEngine {
  async startProjectWorkflow(projectId: string): Promise<string> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) throw new Error(`Project '${projectId}' not found`);

    // Update status to planning
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'planning' },
    });

    // Generate DAG Execution Plan via GoalPlanner
    const plan = await goalPlanner.plan(projectId, project.goal);

    // Validate DAG cycle
    this.validateDAG(plan.tasks);

    // Store WorkflowExecution
    const execution = await prisma.workflowExecution.create({
      data: {
        projectId,
        status: 'running',
        dagJson: JSON.stringify(plan),
        startedAt: new Date(),
      },
    });

    // Create Tasks and Dependencies in DB
    const taskIdMap = new Map<string, string>(); // DAG id -> DB uuid

    for (const taskSpec of plan.tasks) {
      const dbTask = await prisma.task.create({
        data: {
          workflowExecutionId: execution.id,
          title: taskSpec.title,
          description: taskSpec.description,
          agentRole: taskSpec.agentRole,
          status: taskSpec.dependencies.length === 0 ? 'QUEUED' : 'PENDING',
          inputArtifacts: taskSpec.inputArtifacts,
          outputArtifacts: taskSpec.expectedArtifacts,
        },
      });
      taskIdMap.set(taskSpec.id, dbTask.id);
    }

    // Save dependencies using DB UUIDs
    for (const taskSpec of plan.tasks) {
      const dbTaskId = taskIdMap.get(taskSpec.id)!;
      for (const depDagId of taskSpec.dependencies) {
        const dbDepId = taskIdMap.get(depDagId);
        if (dbDepId) {
          await prisma.taskDependency.create({
            data: {
              taskId: dbTaskId,
              dependsOnTaskId: dbDepId,
            },
          });
        }
      }
    }

    // Spawn required AgentInstances for the project
    const requiredRoles = Array.from(new Set(plan.tasks.map((t) => t.agentRole))) as AgentRole[];
    for (const role of requiredRoles) {
      const existing = await prisma.agentInstance.findFirst({
        where: { projectId, definition: { role } },
      });
      if (!existing) {
        await spawnAgentInstance(projectId, role);
      }
    }

    // Update project status to running
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'running' },
    });

    await publishEvent({
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      projectId,
      workflowExecutionId: execution.id,
      type: 'workflow.started',
      totalTasks: plan.tasks.length,
    });

    return execution.id;
  }

  async resolveAndQueueTasks(workflowExecutionId: string): Promise<string[]> {
    const pendingTasks = await prisma.task.findMany({
      where: {
        workflowExecutionId,
        status: 'PENDING',
      },
      include: {
        dependencies: {
          include: {
            dependsOnTask: true,
          },
        },
      },
    });

    const readyTaskIds: string[] = [];

    for (const task of pendingTasks) {
      const allCompleted = task.dependencies.every(
        (dep) => dep.dependsOnTask.status === 'COMPLETED' || dep.dependsOnTask.status === 'APPROVED'
      );

      if (allCompleted) {
        await prisma.task.update({
          where: { id: task.id },
          data: { status: 'QUEUED' },
        });

        const execution = await prisma.workflowExecution.findUnique({
          where: { id: workflowExecutionId },
          select: { projectId: true },
        });

        if (execution) {
          await publishEvent({
            eventId: randomUUID(),
            timestamp: new Date().toISOString(),
            projectId: execution.projectId,
            workflowExecutionId,
            type: 'task.started',
            taskId: task.id,
            previousStatus: 'PENDING',
            newStatus: 'QUEUED',
          });
        }

        readyTaskIds.push(task.id);
      }
    }

    return readyTaskIds;
  }

  private validateDAG(tasks: Array<{ id: string; dependencies: string[] }>): void {
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const adjList = new Map<string, string[]>();

    for (const t of tasks) {
      adjList.set(t.id, t.dependencies);
    }

    const hasCycle = (node: string): boolean => {
      if (recStack.has(node)) return true;
      if (visited.has(node)) return false;

      visited.add(node);
      recStack.add(node);

      const neighbors = adjList.get(node) ?? [];
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) return true;
      }

      recStack.delete(node);
      return false;
    };

    for (const t of tasks) {
      if (hasCycle(t.id)) {
        throw new Error(`Cycle detected in DAG task graph at node '${t.id}'`);
      }
    }
  }
}

export const workflowEngine = new WorkflowEngine();

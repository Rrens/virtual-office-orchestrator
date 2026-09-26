import { prisma } from '../db.js';
import { goalPlanner, sanitizeAndBreakCycles } from '../orchestrator/planner.js';
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

    // Sanitize and break any circular dependencies before validating
    sanitizeAndBreakCycles(plan.tasks);

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

    // Save dependencies using DB UUIDs, skipping duplicates
    const seenDeps = new Set<string>();
    for (const taskSpec of plan.tasks) {
      const dbTaskId = taskIdMap.get(taskSpec.id)!;
      for (const depDagId of taskSpec.dependencies) {
        const dbDepId = taskIdMap.get(depDagId);
        if (dbDepId) {
          const depKey = `${dbTaskId}-${dbDepId}`;
          if (seenDeps.has(depKey)) continue;
          seenDeps.add(depKey);
          await prisma.taskDependency.create({
            data: {
              taskId: dbTaskId,
              dependsOnTaskId: dbDepId,
            },
          });
        }
      }
    }

    // Spawn required AgentInstances for the project (including sub-orchestrator leads and qa-engineer)
    const subOrchestratorRoles = (plan.milestones ?? []).map((m) => m.leadRole);
    const requiredRoles = Array.from(new Set([...plan.tasks.map((t) => t.agentRole), ...subOrchestratorRoles, 'qa-engineer'])) as AgentRole[];
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

    const milestoneDesc = plan.milestones?.length
      ? `${plan.milestones.length} divisi (${plan.milestones.map((m) => m.department).join(', ')}) via Sub-Orchestrator`
      : `${plan.departments.join(', ')}`;

    await publishEvent({
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      projectId,
      workflowExecutionId: execution.id,
      type: 'workflow.started',
      agentRole: 'orchestrator',
      message: `Chief Orchestrator (Rendy) mendelegasikan ke ${milestoneDesc} — total ${plan.tasks.length} task terdistribusi.`,
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
            agentRole: task.agentRole,
            message: `Task "${task.title}" siap dikerjakan oleh ${task.agentRole}.`,
            previousStatus: 'PENDING',
            newStatus: 'QUEUED',
          });
        }

        readyTaskIds.push(task.id);
      }
    }

    return readyTaskIds;
  }

  async checkWorkflowCompletion(workflowExecutionId: string): Promise<void> {
    const remaining = await prisma.task.count({
      where: {
        workflowExecutionId,
        status: { notIn: ['COMPLETED', 'APPROVED', 'CANCELLED', 'FAILED'] },
      },
    });

    if (remaining === 0) {
      const execution = await prisma.workflowExecution.findUnique({
        where: { id: workflowExecutionId },
        include: {
          tasks: { include: { artifacts: true } },
          project: true,
        },
      });

      if (!execution) return;

      const completedAt = new Date();
      const durationMs = execution.startedAt
        ? completedAt.getTime() - new Date(execution.startedAt).getTime()
        : 0;

      await prisma.workflowExecution.update({
        where: { id: workflowExecutionId },
        data: { status: 'completed', completedAt },
      });

      await prisma.project.update({
        where: { id: execution.projectId },
        data: { status: 'completed' },
      });

      await publishEvent({
        eventId: randomUUID(),
        timestamp: new Date().toISOString(),
        projectId: execution.projectId,
        workflowExecutionId,
        type: 'workflow.completed',
        agentRole: 'orchestrator',
        message: `Workflow selesai! ${execution.tasks.length} task dikerjakan dalam ${Math.round(durationMs / 1000)}s.`,
        durationMs,
      });

      // Generate final report (PRD §10)
      await this.generateFinalReport(execution);
    }
  }

  private async generateFinalReport(execution: any): Promise<void> {
    const completedTasks = execution.tasks.filter((t: any) => 
      t.status === 'COMPLETED' || t.status === 'APPROVED'
    );
    const failedTasks = execution.tasks.filter((t: any) => t.status === 'FAILED');
    const artifactCount = execution.tasks.reduce((sum: number, t: any) => sum + t.artifacts.length, 0);

    const reportContent = `# Workflow Execution Report

**Project:** ${execution.project.name}
**Goal:** ${execution.project.goal}
**Started:** ${execution.startedAt?.toISOString() || 'N/A'}
**Completed:** ${execution.completedAt?.toISOString() || 'N/A'}
**Status:** ${execution.status}

## Summary
- **Total Tasks:** ${execution.tasks.length}
- **Completed:** ${completedTasks.length}
- **Failed:** ${failedTasks.length}
- **Artifacts Generated:** ${artifactCount}
- **Tokens Used:** ${execution.project.usedTokens.toLocaleString()}

## Completed Tasks
${completedTasks.map((t: any) => `- ${t.title} (${t.agentRole})`).join('\n')}

${failedTasks.length > 0 ? `## Failed Tasks\n${failedTasks.map((t: any) => `- ${t.title} (${t.agentRole})`).join('\n')}` : ''}

## Artifacts
${execution.tasks.flatMap((t: any) => t.artifacts.map((a: any) => `- ${a.name} (${a.path})`)).join('\n') || 'No artifacts generated.'}
`;

    await prisma.artifact.create({
      data: {
        taskId: execution.tasks[0]?.id || execution.id,
        agentInstanceId: execution.tasks[0]?.assignedAgentId || execution.id,
        type: 'report',
        name: 'Final Workflow Report',
        path: `reports/${execution.id}/final-report.md`,
        mimeType: 'text/markdown',
        sizeBytes: Buffer.byteLength(reportContent),
        content: reportContent,
      },
    });
  }

  async diagnoseAndHandleFailure(workflowExecutionId: string, failedTaskId: string): Promise<void> {
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: workflowExecutionId },
      include: { tasks: { include: { dependencies: true } } },
    });
    if (!execution) return;

    // Pause all downstream tasks that depend on the failed task (directly or transitively)
    const downstream = this.getDownstreamTasks(failedTaskId, execution.tasks as any);
    if (downstream.length > 0) {
      await prisma.task.updateMany({
        where: { id: { in: downstream }, status: 'PENDING' },
        data: { status: 'BLOCKED' },
      });
    }

    // Publish diagnostic event
    await publishEvent({
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      projectId: execution.projectId,
      workflowExecutionId,
      type: 'workflow.failure_diagnosed',
      failedTaskId,
      blockedCount: downstream.length,
    } as any);
  }

  async resumeFromFailure(workflowExecutionId: string, failedTaskId: string): Promise<void> {
    // Unblock downstream tasks and reset failed task to QUEUED for retry
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: workflowExecutionId },
      include: { tasks: { include: { dependencies: true } } },
    });
    if (!execution) return;

    const downstream = this.getDownstreamTasks(failedTaskId, execution.tasks as any);

    await prisma.task.update({
      where: { id: failedTaskId },
      data: { status: 'QUEUED', retryCount: 0 },
    });

    if (downstream.length > 0) {
      await prisma.task.updateMany({
        where: { id: { in: downstream }, status: 'BLOCKED' },
        data: { status: 'PENDING' },
      });
    }

    await this.resolveAndQueueTasks(workflowExecutionId);

    await publishEvent({
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      projectId: execution.projectId,
      workflowExecutionId,
      type: 'task.started',
      taskId: failedTaskId,
      previousStatus: 'FAILED',
      newStatus: 'QUEUED',
    });
  }

  private getDownstreamTasks(
    failedTaskId: string,
    tasks: Array<{ id: string; dependencies: Array<{ dependsOnTaskId: string }> }>
  ): string[] {
    const downstream = new Set<string>();
    const queue = [failedTaskId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      tasks.forEach((t) => {
        if (t.dependencies.some((d) => d.dependsOnTaskId === current) && !downstream.has(t.id)) {
          downstream.add(t.id);
          queue.push(t.id);
        }
      });
    }

    return Array.from(downstream);
  }

  private validateDAG(tasks: Array<{ id: string; dependencies: string[] }>): void {
    // Ensure all cycles are eliminated defensively
    sanitizeAndBreakCycles(tasks);

    const visited = new Set<string>();
    const recStack = new Set<string>();
    const adjList = new Map<string, string[]>();

    for (const t of tasks) {
      adjList.set(t.id, t.dependencies || []);
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
        console.warn(`[WorkflowEngine] Unexpected cycle remaining at '${t.id}', clearing dependencies to guarantee progress`);
        t.dependencies = [];
      }
    }
  }
}

export const workflowEngine = new WorkflowEngine();

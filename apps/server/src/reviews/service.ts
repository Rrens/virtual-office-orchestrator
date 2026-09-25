import { prisma } from '../db.js';
import { modelRouter } from '../models/router.js';
import { agentStateMachine } from '../agents/state-machine.js';
import { publishEvent } from '../events/kafka.js';
import { randomUUID } from 'crypto';
import type { ReviewResult } from '@virtual-office/shared';
import { workflowEngine } from '../workflows/engine.js';

const REVIEW_ROLES: Record<string, string[]> = {
  'backend-engineer': ['qa-engineer', 'security-engineer'],
  'frontend-engineer': ['qa-engineer'],
  'devops': ['security-engineer'],
  'mobile-engineer': ['qa-engineer'],
  'penetration-tester': ['security-engineer'],
};

export class ReviewService {
  async triggerAutoReview(taskId: string): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        workflowExecution: true,
        assignedAgent: { include: { definition: true } },
        artifacts: true,
      },
    });

    if (!task || !task.assignedAgent) return;

    const reviewerRoles = REVIEW_ROLES[task.agentRole] ?? [];
    if (reviewerRoles.length === 0) {
      await this.approveTask(taskId, task.workflowExecution.projectId, task.workflowExecutionId);
      return;
    }

    const reviewerRole = reviewerRoles[0];

    const reviewerAgent = await prisma.agentInstance.findFirst({
      where: {
        projectId: task.workflowExecution.projectId,
        definition: { role: reviewerRole },
        status: 'idle',
      },
      include: { definition: true },
    });

    if (!reviewerAgent) {
      await this.approveTask(taskId, task.workflowExecution.projectId, task.workflowExecutionId);
      return;
    }

    await agentStateMachine.assign(reviewerAgent.id, taskId);
    await agentStateMachine.startThinking(reviewerAgent.id);
    await agentStateMachine.startWorking(reviewerAgent.id);

    // Emit structured handoff event (PRD §17)
    await publishEvent({
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      projectId: task.workflowExecution.projectId,
      workflowExecutionId: task.workflowExecutionId,
      type: 'task.handoff',
      taskId,
      fromAgentId: task.assignedAgent.id,
      toAgentId: reviewerAgent.id,
      payload: {
        handoffId: randomUUID(),
        fromAgent: task.agentRole,
        toAgent: reviewerRole,
        taskId,
        workflowId: task.workflowExecutionId,
        status: 'READY_FOR_REVIEW',
        summary: `Task "${task.title}" completed. Handed off to ${reviewerAgent.definition.name} for QA/Security review.`,
        artifacts: task.artifacts.map((a) => ({
          path: a.path,
          type: a.type as any,
          version: '1.0.0',
        })),
        knownIssues: [],
        nextRecommendedAction: `Perform automated ${reviewerRole} review on artifacts`,
      },
    });

    const artifactSummary = task.artifacts
      .map((a) => `${a.name}: ${a.content?.slice(0, 500) ?? '(no content)'}`)
      .join('\n\n');

    const selectedTier = modelRouter.selectTier(reviewerRole, 'high');

    const agentRun = await prisma.agentRun.create({
      data: {
        taskId,
        agentInstanceId: reviewerAgent.id,
        modelUsed: selectedTier,
        status: 'running',
      },
    });

    try {
      const response = await modelRouter.routeByTier(selectedTier, {
        messages: [
          {
            role: 'system',
            content: `You are a ${reviewerAgent.definition.name}. ${reviewerAgent.definition.persona}
Review the following task artifacts and respond with a JSON object:
{"result": "approved" | "approved_with_changes" | "rejected", "feedback": "detailed review feedback"}
Output only valid JSON, no markdown.`,
          },
          {
            role: 'user',
            content: `Review task: "${task.title}"\n\nArtifacts:\n${artifactSummary || 'No artifacts generated yet.'}`,
          },
        ],
        temperature: 0.2,
        agentRole: reviewerRole,
        taskId,
      });

      let result: ReviewResult = 'approved';
      let feedback = response.content;

      try {
        const parsed = JSON.parse(response.content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim());
        result = parsed.result ?? 'approved';
        feedback = parsed.feedback ?? response.content;
      } catch {
        result = 'approved';
      }

      await prisma.review.create({
        data: {
          taskId,
          reviewerAgentId: reviewerAgent.id,
          result,
          feedback,
        },
      });

      await prisma.agentRun.update({
        where: { id: agentRun.id },
        data: {
          status: 'success',
          promptTokens: response.promptTokens,
          completionTokens: response.completionTokens,
          durationMs: response.durationMs,
        },
      });

      await agentStateMachine.complete(reviewerAgent.id);

      if (result === 'approved' || result === 'approved_with_changes') {
        await this.approveTask(taskId, task.workflowExecution.projectId, task.workflowExecutionId);
      } else {
        await this.rejectTask(taskId, task.workflowExecution.projectId, task.workflowExecutionId);
      }
    } catch (err) {
      await prisma.agentRun.update({
        where: { id: agentRun.id },
        data: { status: 'failed', errorMessage: err instanceof Error ? err.message : String(err) },
      });
      await agentStateMachine.fail(reviewerAgent.id);
      await this.approveTask(taskId, task.workflowExecution.projectId, task.workflowExecutionId);
    }
  }

  async approveTask(taskId: string, projectId: string, workflowExecutionId: string): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignedAgent: { include: { definition: true } } },
    });

    await prisma.task.update({ where: { id: taskId }, data: { status: 'COMPLETED' } });

    await publishEvent({
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      projectId,
      workflowExecutionId,
      type: 'task.completed',
      taskId,
      agentRole: task?.agentRole ?? 'qa-engineer',
      agentInstanceId: task?.assignedAgentId ?? undefined,
      message: `Task "${task?.title ?? taskId}" disetujui & selesai!`,
      previousStatus: 'REVIEW',
      newStatus: 'COMPLETED',
    });

    await workflowEngine.resolveAndQueueTasks(workflowExecutionId);
    await workflowEngine.checkWorkflowCompletion(workflowExecutionId);
  }

  async rejectTask(taskId: string, projectId: string, workflowExecutionId: string): Promise<void> {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return;

    const newRetry = task.retryCount + 1;
    if (newRetry >= task.maxRetries) {
      await prisma.task.update({ where: { id: taskId }, data: { status: 'FAILED' } });
      await publishEvent({
        eventId: randomUUID(),
        timestamp: new Date().toISOString(),
        projectId,
        workflowExecutionId,
        type: 'task.failed',
        taskId,
        previousStatus: 'REVIEW',
        newStatus: 'FAILED',
      });
    } else {
      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'QUEUED', retryCount: newRetry },
      });
      await publishEvent({
        eventId: randomUUID(),
        timestamp: new Date().toISOString(),
        projectId,
        workflowExecutionId,
        type: 'task.started',
        taskId,
        previousStatus: 'REVIEW',
        newStatus: 'QUEUED',
      });
    }
  }
}

export const reviewService = new ReviewService();

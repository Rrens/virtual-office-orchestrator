import { prisma } from '../db.js';
import { modelRouter } from '../models/router.js';
import { agentStateMachine } from '../agents/state-machine.js';
import { publishEvent } from '../events/kafka.js';
import { randomUUID } from 'crypto';
import type { ReviewResult } from '@virtual-office/shared';
import { workflowEngine } from '../workflows/engine.js';
import { spawnAgentInstance } from '../agents/registry.js';
import { logger } from '../utils/logger.js';
import type { AgentRole } from '@virtual-office/shared';

const REVIEW_ROLES: Record<string, string[]> = {
  'backend-engineer':     ['qa-engineer', 'security-engineer'],
  'frontend-engineer':    ['qa-engineer'],
  'mobile-engineer':      ['qa-engineer'],
  'devops':               ['qa-engineer', 'security-engineer'],
  'penetration-tester':   ['security-engineer'],
  'ai-engineer':          ['qa-engineer'],
  'performance-engineer': ['qa-engineer'],
  'data-engineer':        ['qa-engineer'],
  'product-manager':      ['qa-engineer'],
  'ui-ux-designer':       ['qa-engineer'],
  'design-system-designer': ['qa-engineer'],
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

    const projectId = task.workflowExecution.projectId;
    const reviewerRoles = REVIEW_ROLES[task.agentRole] ?? [];

    if (reviewerRoles.length === 0) {
      await this.approveTask(taskId, projectId, task.workflowExecutionId, null, 'Auto-approved: no reviewer required for this role.');
      return;
    }

    const reviewerRole = reviewerRoles[0] as AgentRole;

    // Find idle reviewer
    let reviewerAgent = await prisma.agentInstance.findFirst({
      where: {
        projectId,
        definition: { role: reviewerRole },
        status: 'idle',
      },
      include: { definition: true },
    });

    // Auto-spawn QA if not present
    if (!reviewerAgent) {
      logger.info('ReviewService', `No idle ${reviewerRole} found — auto-spawning for project ${projectId}`);
      try {
        const spawned = await spawnAgentInstance(projectId, reviewerRole);
        reviewerAgent = await prisma.agentInstance.findUnique({
          where: { id: spawned.id },
          include: { definition: true },
        });
      } catch (err) {
        logger.warn('ReviewService', `Failed to spawn ${reviewerRole}: ${err instanceof Error ? err.message : err}`);
        await this.approveTask(taskId, projectId, task.workflowExecutionId, null, 'Auto-approved: failed to spawn reviewer.');
        return;
      }
    }

    if (!reviewerAgent) {
      await this.approveTask(taskId, projectId, task.workflowExecutionId, null, 'Auto-approved: reviewer unavailable.');
      return;
    }

    // Create Approval record (pending)
    const approval = await prisma.approval.create({
      data: {
        projectId,
        taskId,
        agentInstanceId: reviewerAgent.id,
        title: `QA Review: ${task.title}`,
        description: `${reviewerAgent.definition.name} sedang mereview output dari ${task.assignedAgent.definition.name} untuk task "${task.title}"`,
        status: 'pending',
      },
    });

    await publishEvent({
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      projectId,
      workflowExecutionId: task.workflowExecutionId,
      type: 'approval.requested',
      approvalId: approval.id,
      agentRole: reviewerRole,
      agentInstanceId: reviewerAgent.id,
      title: approval.title,
      description: approval.description,
      message: `${reviewerAgent.definition.name} mulai review "${task.title}"`,
    });

    await agentStateMachine.assign(reviewerAgent.id, taskId);
    await agentStateMachine.startThinking(reviewerAgent.id);
    await agentStateMachine.startWorking(reviewerAgent.id);

    // Emit handoff event
    await publishEvent({
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      projectId,
      workflowExecutionId: task.workflowExecutionId,
      type: 'task.handoff',
      taskId,
      agentRole: reviewerRole,
      agentInstanceId: reviewerAgent.id,
      message: `Task "${task.title}" di-handoff ke ${reviewerAgent.definition.name} untuk review`,
      fromAgentId: task.assignedAgent.id,
      toAgentId: reviewerAgent.id,
      payload: {
        handoffId: randomUUID(),
        fromAgent: task.agentRole,
        toAgent: reviewerRole,
        taskId,
        workflowId: task.workflowExecutionId,
        status: 'READY_FOR_REVIEW',
        summary: `Task "${task.title}" selesai. Diserahkan ke ${reviewerAgent.definition.name} untuk review.`,
        artifacts: task.artifacts.map((a) => ({ path: a.path, type: a.type as any, version: '1.0.0' })),
        knownIssues: [],
        nextRecommendedAction: `Lakukan ${reviewerRole} review pada artifacts`,
      },
    });

    const artifactSummary = task.artifacts
      .map((a) => `${a.name}: ${a.content?.slice(0, 500) ?? '(no content)'}`)
      .join('\n\n');

    const selectedTier = modelRouter.selectTier(reviewerRole, 'high');

    logger.info('ReviewService', `${reviewerAgent.definition.name} mereview "${task.title}" dengan model ${selectedTier}`, {
      model: selectedTier,
      agentRole: reviewerRole,
      taskId,
    });

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
            content: `Kamu adalah ${reviewerAgent.definition.name}. ${reviewerAgent.definition.persona}

Tugasmu adalah melakukan QA review terhadap output task berikut.
Berikan response dalam format JSON:
{"result": "approved" | "approved_with_changes" | "rejected", "feedback": "detail feedback review", "bugs": ["bug 1", "bug 2"], "score": 1-10}
Output hanya valid JSON, tanpa markdown.`,
          },
          {
            role: 'user',
            content: `Review task: "${task.title}"\n\nOutput artifacts:\n${artifactSummary || 'Tidak ada artifact.'}`,
          },
        ],
        temperature: 0.2,
        agentRole: reviewerRole,
        taskId,
      });

      let result: ReviewResult = 'approved';
      let feedback = response.content;
      let bugs: string[] = [];
      let score = 8;

      try {
        const parsed = JSON.parse(response.content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim());
        result = parsed.result ?? 'approved';
        feedback = parsed.feedback ?? response.content;
        bugs = parsed.bugs ?? [];
        score = parsed.score ?? 8;
      } catch {
        result = 'approved';
      }

      await prisma.review.create({
        data: { taskId, reviewerAgentId: reviewerAgent.id, result, feedback },
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

      // Publish review.created event
      await publishEvent({
        eventId: randomUUID(),
        timestamp: new Date().toISOString(),
        projectId,
        workflowExecutionId: task.workflowExecutionId,
        type: 'approval.approved',
        approvalId: approval.id,
        agentRole: reviewerRole,
        agentInstanceId: reviewerAgent.id,
        message: `${reviewerAgent.definition.name} selesai review "${task.title}" — ${result} (skor: ${score}/10)`,
        decidedBy: reviewerAgent.definition.name,
      } as any);

      logger.info('ReviewService', `Review selesai: "${task.title}" → ${result} (skor ${score}/10)`, {
        model: selectedTier,
        agentRole: reviewerRole,
        result,
        score,
        bugs,
      });

      if (result === 'approved' || result === 'approved_with_changes') {
        await prisma.approval.update({ where: { id: approval.id }, data: { status: 'approved', decidedBy: reviewerAgent.definition.name, decidedAt: new Date() } });
        await this.approveTask(taskId, projectId, task.workflowExecutionId, reviewerAgent.id, feedback);
      } else {
        await prisma.approval.update({ where: { id: approval.id }, data: { status: 'rejected', decidedBy: reviewerAgent.definition.name, decidedAt: new Date() } });
        await this.rejectTask(taskId, projectId, task.workflowExecutionId);
      }
    } catch (err) {
      await prisma.agentRun.update({
        where: { id: agentRun.id },
        data: { status: 'failed', errorMessage: err instanceof Error ? err.message : String(err) },
      });
      await agentStateMachine.fail(reviewerAgent.id);
      await prisma.approval.update({ where: { id: approval.id }, data: { status: 'approved', decidedBy: 'auto-fallback' } });
      await this.approveTask(taskId, projectId, task.workflowExecutionId, null, 'Auto-approved: reviewer error.');
    }
  }

  async approveTask(taskId: string, projectId: string, workflowExecutionId: string, reviewerAgentId: string | null, feedback?: string): Promise<void> {
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
      message: `Task "${task?.title ?? taskId}" disetujui${feedback ? ` — ${feedback.slice(0, 80)}` : ''}`,
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
        agentRole: task.agentRole,
        message: `Task "${task.title}" ditolak QA dan telah mencapai batas retry.`,
        previousStatus: 'REVIEW',
        newStatus: 'FAILED',
      });
    } else {
      await prisma.task.update({ where: { id: taskId }, data: { status: 'QUEUED', retryCount: newRetry } });
      await publishEvent({
        eventId: randomUUID(),
        timestamp: new Date().toISOString(),
        projectId,
        workflowExecutionId,
        type: 'task.started',
        taskId,
        agentRole: task.agentRole,
        message: `Task "${task.title}" dikembalikan untuk diperbaiki (retry ${newRetry}).`,
        previousStatus: 'REVIEW',
        newStatus: 'QUEUED',
      });
    }
  }
}

export const reviewService = new ReviewService();

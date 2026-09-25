import { createConsumer } from '../events/kafka.js';
import { workflowEngine } from './engine.js';
import { agentStateMachine } from '../agents/state-machine.js';
import { prisma } from '../db.js';
import { modelRouter } from '../models/router.js';
import { publishEvent } from '../events/kafka.js';
import { randomUUID } from 'crypto';
import { KAFKA_TOPICS } from '@virtual-office/shared';
import { ReviewService } from '../reviews/service.js';
import { BudgetTracker } from '../memory/budget.js';
import { logger } from '../utils/logger.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const reviewService = new ReviewService();
const budgetTracker = new BudgetTracker();

export async function startTaskConsumer(): Promise<void> {
  const consumer = await createConsumer('virtual-office-task-workers');

  await consumer.subscribe({
    topics: [KAFKA_TOPICS.TASK_EVENTS, KAFKA_TOPICS.WORKFLOW_EVENTS],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) return;

      let event: any;
      try {
        event = JSON.parse(message.value.toString());
      } catch {
        return;
      }

      try {
        if (event.type === 'workflow.started') {
          await handleWorkflowStarted(event);
        } else if (event.type === 'task.started' && event.newStatus === 'QUEUED') {
          await handleTaskQueued(event);
        } else if (event.type === 'task.completed') {
          await handleTaskCompleted(event);
        }
      } catch (err) {
        console.error(`[TaskConsumer] Error processing event ${event.type}:`, err instanceof Error ? err.message : err);
      }
    },
  });

  // Boot scan: pick up any QUEUED tasks that survived a server restart
  await scanAndAssignQueuedTasks();

  // Periodic scanner: every 30s re-check for stuck QUEUED tasks
  setInterval(async () => {
    try {
      await scanAndAssignQueuedTasks();
    } catch (err) {
      console.warn('[TaskConsumer] Periodic scan error:', err instanceof Error ? err.message : err);
    }
  }, 30_000);

  console.log('[TaskConsumer] Kafka consumer started');
}

async function scanAndAssignQueuedTasks(): Promise<void> {
  const queuedTasks = await prisma.task.findMany({
    where: { status: 'QUEUED', assignedAgentId: null },
    include: { workflowExecution: true },
    take: 20,
  });

  if (queuedTasks.length > 0) {
    logger.info('TaskScanner', `Found ${queuedTasks.length} unassigned QUEUED task(s)`, {
      tasks: queuedTasks.map((t) => ({ id: t.id, title: t.title, role: t.agentRole })),
    });
  }

  for (const task of queuedTasks) {
    try {
      await handleTaskQueued({ taskId: task.id });
    } catch (err) {
      logger.warn('TaskScanner', `Failed to assign task ${task.id}: ${err instanceof Error ? err.message : err}`);
    }
  }
}

async function handleWorkflowStarted(event: any): Promise<void> {
  logger.info('TaskConsumer', `Workflow started ${event.workflowExecutionId}, resolving queue`);
  await workflowEngine.resolveAndQueueTasks(event.workflowExecutionId);
}

async function handleTaskQueued(event: any): Promise<void> {
  const task = await prisma.task.findUnique({
    where: { id: event.taskId },
    include: { workflowExecution: true },
  });

  if (!task || task.status !== 'QUEUED') return;

  const agent = await prisma.agentInstance.findFirst({
    where: {
      projectId: task.workflowExecution.projectId,
      definition: { role: task.agentRole },
      status: 'idle',
    },
    include: { definition: true },
  });

  if (!agent) {
    logger.warn('TaskConsumer', `No idle agent for role '${task.agentRole}', task ${task.id} stays QUEUED`);
    return;
  }

  logger.info('TaskConsumer', `Assigning task "${task.title}" to ${agent.definition.name}`, {
    taskId: task.id,
    agentId: agent.id,
    role: task.agentRole,
  });

  await prisma.task.update({ where: { id: task.id }, data: { status: 'ASSIGNED', assignedAgentId: agent.id } });
  await agentStateMachine.assign(agent.id, task.id);
  await agentStateMachine.startThinking(agent.id);
  await agentStateMachine.startWorking(agent.id);

  await publishEvent({
    eventId: randomUUID(),
    timestamp: new Date().toISOString(),
    projectId: task.workflowExecution.projectId,
    workflowExecutionId: task.workflowExecutionId,
    type: 'task.assigned',
    taskId: task.id,
    agentRole: task.agentRole,
    agentInstanceId: agent.id,
    message: `${agent.definition.name} mulai mengerjakan: "${task.title}"`,
    previousStatus: 'QUEUED',
    newStatus: 'ASSIGNED',
  });

  // Spawn task execution concurrently in background without blocking Kafka event loop
  executeTask(task, agent).catch((err) => {
    console.error(`[TaskConsumer] Concurrent execution error on task ${task.id}:`, err);
  });
}

async function executeTask(task: any, agent: any): Promise<void> {
  const selectedTier = modelRouter.selectTier(task.agentRole, 'medium');

  logger.info('ModelRouter', `Executing task "${task.title}" with role ${task.agentRole} using tier ${selectedTier}`);

  const agentRun = await prisma.agentRun.create({
    data: {
      taskId: task.id,
      agentInstanceId: agent.id,
      modelUsed: selectedTier,
      status: 'running',
    },
  });

  try {
    const isCodeRole = ['backend-engineer', 'frontend-engineer', 'mobile-engineer', 'devops', 'qa-engineer', 'security-engineer', 'ai-engineer', 'data-engineer', 'performance-engineer'].includes(task.agentRole);
    const isDesignRole = ['ui-ux-designer', 'design-system-designer', 'brand-designer'].includes(task.agentRole);

    const systemPrompt = isCodeRole
      ? `You are a ${agent.definition.name}. ${agent.definition.persona}

CRITICAL RULES:
- You MUST output ACTUAL, RUNNABLE code — not descriptions, not explanations.
- Every expected artifact must be a real file with complete implementation.
- Use proper file headers with the filename as a comment.
- Output format: write each file as a fenced code block with the filename above it.
- Example format:
  ## src/api/users.ts
  \`\`\`typescript
  import express from 'express';
  // ... full implementation
  \`\`\`
- No placeholders like "// implement this later". Write the full implementation.
- No abstract descriptions. Only working code.`
      : isDesignRole
      ? `You are a ${agent.definition.name}. ${agent.definition.persona}

CRITICAL RULES:
- Output a complete, detailed design specification document.
- Include: color palette (hex codes), typography (font names, sizes, weights), spacing system, component specs, and wireframe descriptions.
- For UI components, describe exact layout, dimensions, and interactions.
- Be specific and actionable — a developer must be able to implement this directly.`
      : `You are a ${agent.definition.name}. ${agent.definition.persona}

CRITICAL RULES:
- Output a complete, detailed, professional document.
- Be specific with data, metrics, decisions, and recommendations.
- No vague statements. Every claim must have supporting detail.
- Format with clear headers, bullet points, and tables where appropriate.`;

    const userPrompt = `# Task: ${task.title}

## Description
${task.description}

## Expected Output Files
${task.outputArtifacts.map((a: string) => `- ${a}`).join('\n')}

## Instructions
${isCodeRole
  ? `Write the complete, production-ready implementation for each expected file. Include all imports, error handling, and business logic. Do NOT write pseudocode or descriptions.`
  : `Write a complete, detailed, professional deliverable for this task.`}

Deliver the full output now.`;

    const response = await modelRouter.routeByTier(selectedTier, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      agentRole: task.agentRole,
      taskId: task.id,
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

    // Emit deployment event for DevOps agent tasks (PRD §29)
    if (task.agentRole === 'devops') {
      await publishEvent({
        eventId: randomUUID(),
        timestamp: new Date().toISOString(),
        projectId: task.workflowExecution?.projectId ?? task.workflowExecutionId,
        workflowExecutionId: task.workflowExecutionId,
        type: 'deployment.started',
        environment: 'staging',
        agentInstanceId: agent.id,
      } as any);

      setTimeout(async () => {
        await publishEvent({
          eventId: randomUUID(),
          timestamp: new Date().toISOString(),
          projectId: task.workflowExecution?.projectId ?? task.workflowExecutionId,
          workflowExecutionId: task.workflowExecutionId,
          type: 'deployment.completed',
          environment: 'staging',
          agentInstanceId: agent.id,
        } as any);
      }, 1000);
    }

    // Save output artifact
    await prisma.artifact.create({
      data: {
        taskId: task.id,
        agentInstanceId: agent.id,
        type: 'documentation',
        name: `${task.title} Output`,
        path: `artifacts/${task.id}/output.md`,
        mimeType: 'text/markdown',
        sizeBytes: Buffer.byteLength(response.content),
        content: response.content,
      },
    });

    // Track token usage and auto-pause if budget exceeded
    const workflowExecForBudget = await prisma.workflowExecution.findUnique({
      where: { id: task.workflowExecutionId },
      select: { projectId: true },
    });
    if (workflowExecForBudget) {
      await budgetTracker.recordUsage(
        workflowExecForBudget.projectId,
        selectedTier,
        response.promptTokens,
        response.completionTokens
      );
    }

    await prisma.task.update({
      where: { id: task.id },
      data: { status: 'REVIEW' },
    });

    await agentStateMachine.startReviewing(agent.id);

    await publishEvent({
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      projectId: task.workflowExecution?.projectId ?? task.workflowExecutionId,
      workflowExecutionId: task.workflowExecutionId,
      type: 'task.review',
      taskId: task.id,
      agentRole: task.agentRole,
      agentInstanceId: agent.id,
      message: `${agent.definition.name} menyelesaikan "${task.title}" — menunggu review.`,
      previousStatus: 'RUNNING',
      newStatus: 'REVIEW',
    });

    const project = await prisma.project.findUnique({
      where: { id: task.workflowExecution?.projectId ?? '' },
    });

    if (project && project.autonomyLevel >= 2) {
      await reviewService.triggerAutoReview(task.id);
    }
  } catch (err) {
    await handleTaskFailure(task, agent, agentRun.id, err);
  }
}

async function handleTaskFailure(task: any, agent: any, agentRunId: string, err: unknown): Promise<void> {
  const errorMessage = err instanceof Error ? err.message : String(err);
  const newRetryCount = (task.retryCount ?? 0) + 1;

  await prisma.agentRun.update({
    where: { id: agentRunId },
    data: { status: 'failed', errorMessage },
  });

  await agentStateMachine.fail(agent.id);

  if (newRetryCount < MAX_RETRIES) {
    // Try to reassign to a different idle agent of the same role (PRD §36: Agent failure -> reassign)
    const workflowExec = await prisma.workflowExecution.findUnique({
      where: { id: task.workflowExecutionId },
      select: { projectId: true },
    });

    const alternateAgent = workflowExec
      ? await prisma.agentInstance.findFirst({
          where: {
            projectId: workflowExec.projectId,
            definition: { role: task.agentRole },
            status: 'idle',
            id: { not: agent.id },
          },
        })
      : null;

    const assignedAgentId = alternateAgent ? alternateAgent.id : null;

    await prisma.task.update({
      where: { id: task.id },
      data: {
        status: 'QUEUED',
        retryCount: newRetryCount,
        assignedAgentId,
      },
    });

    setTimeout(async () => {
      if (workflowExec) {
        await publishEvent({
          eventId: randomUUID(),
          timestamp: new Date().toISOString(),
          projectId: workflowExec.projectId,
          workflowExecutionId: task.workflowExecutionId,
          type: 'task.started',
          taskId: task.id,
          agentRole: task.agentRole,
          agentInstanceId: agent.id,
          message: `Retry #${newRetryCount}: ${task.agentRole} mengulang task "${task.title}"`,
          previousStatus: 'FAILED',
          newStatus: 'QUEUED',
        });
      }
    }, RETRY_DELAY_MS * newRetryCount);
  } else {
    await prisma.task.update({
      where: { id: task.id },
      data: { status: 'FAILED' },
    });

    await agentStateMachine.escalate(agent.id);

    // PRD §36: pause downstream tasks and diagnose workflow failure
    await workflowEngine.diagnoseAndHandleFailure(task.workflowExecutionId, task.id);

    const workflowExec = await prisma.workflowExecution.findUnique({
      where: { id: task.workflowExecutionId },
      select: { projectId: true },
    });

    if (workflowExec) {
      await publishEvent({
        eventId: randomUUID(),
        timestamp: new Date().toISOString(),
        projectId: workflowExec.projectId,
        workflowExecutionId: task.workflowExecutionId,
        type: 'task.failed',
        taskId: task.id,
        agentRole: task.agentRole,
        agentInstanceId: agent.id,
        message: `${agent.definition.name} gagal menyelesaikan "${task.title}": ${errorMessage.slice(0, 80)}`,
        previousStatus: 'RUNNING',
        newStatus: 'FAILED',
      });
    }
  }
}

async function handleTaskCompleted(event: any): Promise<void> {
  await workflowEngine.resolveAndQueueTasks(event.workflowExecutionId);
}

import { createConsumer } from '../events/kafka.js';
import { workflowEngine } from './engine.js';
import { agentStateMachine } from '../agents/state-machine.js';
import { spawnAgentInstance } from '../agents/registry.js';
import { prisma } from '../db.js';
import { modelRouter } from '../models/router.js';
import { publishEvent } from '../events/kafka.js';
import { randomUUID } from 'crypto';
import path from 'path';
import { KAFKA_TOPICS, type AgentRole } from '@virtual-office/shared';
import { ReviewService } from '../reviews/service.js';
import { BudgetTracker } from '../memory/budget.js';
import { logger } from '../utils/logger.js';
import { extractCodeFiles } from '../utils/exporter.js';

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

  // Recovery: tasks stuck in ASSIGNED because a previous worker died/restarted before completion
  const stuckThresholdMs = 2 * 60 * 1000;
  const stuckAssignedTasks = await prisma.task.findMany({
    where: {
      status: 'ASSIGNED',
      updatedAt: { lt: new Date(Date.now() - stuckThresholdMs) },
    },
    include: { workflowExecution: true },
    take: 20,
  });

  if (stuckAssignedTasks.length > 0) {
    logger.info('TaskScanner', `Found ${stuckAssignedTasks.length} zombie ASSIGNED task(s) after restart, resetting to QUEUED`, {
      tasks: stuckAssignedTasks.map((t) => ({ id: t.id, title: t.title, role: t.agentRole })),
    });
  }

  for (const task of stuckAssignedTasks) {
    try {
      // Mark any dangling running agentRun as failed
      await prisma.agentRun.updateMany({
        where: {
          taskId: task.id,
          status: 'running',
        },
        data: {
          status: 'failed',
          errorMessage: 'Worker restarted before completion — task recovered by scanner',
        },
      });

      // Free the agent previously bound to this task
      if (task.assignedAgentId) {
        await prisma.agentInstance.updateMany({
          where: { id: task.assignedAgentId, currentTaskId: task.id },
          data: { status: 'idle', currentTaskId: null },
        });
      }

      // Reset task to queued
      await prisma.task.update({
        where: { id: task.id },
        data: { status: 'QUEUED', assignedAgentId: null },
      });

      await handleTaskQueued({ taskId: task.id });
    } catch (err) {
      logger.warn('TaskScanner', `Failed to recover stuck ASSIGNED task ${task.id}: ${err instanceof Error ? err.message : err}`);
    }
  }
}

async function handleWorkflowStarted(event: any): Promise<void> {
  logger.info('TaskConsumer', `Workflow started ${event.workflowExecutionId}, resolving queue`);
  await workflowEngine.resolveAndQueueTasks(event.workflowExecutionId);
}

async function resolveAgentForTask(task: { id: string; agentRole: string; workflowExecution: { projectId: string } }) {
  // 1. Try to find an idle agent with matching role
  let agent = await prisma.agentInstance.findFirst({
    where: {
      projectId: task.workflowExecution.projectId,
      definition: { role: task.agentRole as AgentRole },
      status: 'idle',
    },
    include: { definition: true },
  });

  if (agent) return agent;

  // 2. Try any agent with matching role (reset stuck agents if needed)
  const stuckAgent = await prisma.agentInstance.findFirst({
    where: {
      projectId: task.workflowExecution.projectId,
      definition: { role: task.agentRole as AgentRole },
    },
    orderBy: { updatedAt: 'desc' },
    include: { definition: true },
  });

  if (stuckAgent) {
    logger.info('TaskConsumer', `Resetting stuck agent ${stuckAgent.definition.name} (${stuckAgent.id}) to idle`, {
      agentId: stuckAgent.id,
      role: task.agentRole,
    });
    await prisma.agentInstance.update({ where: { id: stuckAgent.id }, data: { status: 'idle' } });
    return stuckAgent;
  }

  // 3. Auto-spawn agent if definition exists
  try {
    const definition = await prisma.agentDefinition.findUnique({
      where: { role: task.agentRole as AgentRole },
    });
    if (definition) {
      logger.info('TaskConsumer', `Auto-spawning agent for role '${task.agentRole}'`, { taskId: task.id });
      const spawned = await spawnAgentInstance(task.workflowExecution.projectId, task.agentRole as AgentRole);
      return await prisma.agentInstance.findUnique({
        where: { id: spawned.id },
        include: { definition: true },
      });
    }
  } catch (err) {
    logger.warn('TaskConsumer', `Failed to auto-spawn agent for role '${task.agentRole}': ${err instanceof Error ? err.message : err}`);
  }

  // 4. Fallback to CEO / orchestrator
  try {
    const orchestrator = await prisma.agentInstance.findFirst({
      where: {
        projectId: task.workflowExecution.projectId,
        definition: { role: 'orchestrator' },
      },
      include: { definition: true },
    });

    if (orchestrator) {
      logger.info('TaskConsumer', `Falling back task ${task.id} to orchestrator`, { role: task.agentRole });
      return orchestrator;
    }
  } catch (err) {
    logger.warn('TaskConsumer', `Failed to find orchestrator fallback: ${err instanceof Error ? err.message : err}`);
  }

  return null;
}

async function handleTaskQueued(event: any): Promise<void> {
  const task = await prisma.task.findUnique({
    where: { id: event.taskId },
    include: { workflowExecution: true },
  });

  if (!task || task.status !== 'QUEUED') return;

  const agent = await resolveAgentForTask(task);

  if (!agent) {
    logger.warn('TaskConsumer', `No agent could be resolved for role '${task.agentRole}', task ${task.id} stays QUEUED`);
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
  // Check for per-agent or per-role model override ("biar ga boncos")
  let preferredModel: { modelName: string; tier: string } | null = null;
  const instanceMem = await prisma.memoryStore.findUnique({
    where: {
      scope_scopeId_key: {
        scope: 'agent',
        scopeId: agent.id,
        key: 'preferred_model',
      },
    },
  });
  if (instanceMem) {
    try { preferredModel = JSON.parse(instanceMem.value); } catch {}
  }

  if (!preferredModel) {
    const roleMem = await prisma.memoryStore.findUnique({
      where: {
        scope_scopeId_key: {
          scope: 'organization',
          scopeId: 'default',
          key: `preferred_model_${task.agentRole}`,
        },
      },
    });
    if (roleMem) {
      try { preferredModel = JSON.parse(roleMem.value); } catch {}
    }
  }

  const selectedTier = preferredModel?.tier || modelRouter.selectTier(task.agentRole, 'medium');

  // Determine human-readable model name for logs
  const modelName = preferredModel?.modelName || (
    selectedTier === 'tier1_ollama'
      ? (task.agentRole?.includes('engineer') ? 'qwen2.5-coder:3b' : 'qwen3.5:4b')
      : selectedTier === 'tier2_9router'
      ? (task.agentRole?.includes('engineer') || task.agentRole?.includes('devops') ? '9Router-3-Specialized-Code' : '9Router-4-Lightweight-Response')
      : 'gpt-4o-mini (Cloud)'
  );

  logger.info(
    'ModelRouter',
    `${agent.definition.name} (${task.agentRole}) mulai eksekusi "${task.title}" via ${modelName}${preferredModel ? ' [Custom Override]' : ''}`,
    { taskId: task.id, agentId: agent.id, tier: selectedTier, customConfigured: Boolean(preferredModel) },
    modelName,
    task.agentRole
  );

  const agentRun = await prisma.agentRun.create({
    data: {
      taskId: task.id,
      agentInstanceId: agent.id,
      modelUsed: `${selectedTier}:${modelName}`,
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

    // Auto-extract runnable source files from code role outputs
    let extractedFiles: Array<{ filePath: string; content: string }> = [];
    if (isCodeRole && response.content) {
      try {
        extractedFiles = extractCodeFiles(response.content);
      } catch (ex) {
        logger.warn('TaskConsumer', `Failed to extract code files for task ${task.id}: ${String(ex)}`);
      }
    }

    // Save individual extracted code files as artifacts for the Code Studio
    for (const file of extractedFiles.slice(0, 50)) {
      const ext = path.extname(file.filePath).toLowerCase();
      const mimeType = ext === '.ts' || ext === '.tsx' ? 'text/typescript' : ext === '.js' || ext === '.jsx' ? 'text/javascript' : ext === '.json' ? 'application/json' : ext === '.css' ? 'text/css' : ext === '.html' ? 'text/html' : ext === '.prisma' ? 'text/prisma' : 'text/plain';
      await prisma.artifact.create({
        data: {
          taskId: task.id,
          agentInstanceId: agent.id,
          type: 'source_code',
          name: path.basename(file.filePath),
          path: file.filePath,
          mimeType,
          sizeBytes: Buffer.byteLength(file.content),
          content: file.content,
        },
      });
    }

    // Save the aggregated output artifact as well
    await prisma.artifact.create({
      data: {
        taskId: task.id,
        agentInstanceId: agent.id,
        type: extractedFiles.length > 0 ? 'source_bundle' : 'documentation',
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

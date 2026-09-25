import { createConsumer } from '../events/kafka.js';
import { workflowEngine } from './engine.js';
import { agentStateMachine } from '../agents/state-machine.js';
import { prisma } from '../db.js';
import { modelRouter } from '../models/router.js';
import { publishEvent } from '../events/kafka.js';
import { randomUUID } from 'crypto';
import { KAFKA_TOPICS } from '@virtual-office/shared';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

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

  console.log('[TaskConsumer] Kafka consumer started');
}

async function handleWorkflowStarted(event: any): Promise<void> {
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
    console.warn(`[TaskConsumer] No idle agent for role '${task.agentRole}', task ${task.id} stays QUEUED`);
    return;
  }

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
    previousStatus: 'QUEUED',
    newStatus: 'ASSIGNED',
  });

  await executeTask(task, agent);
}

async function executeTask(task: any, agent: any): Promise<void> {
  const agentRun = await prisma.agentRun.create({
    data: {
      taskId: task.id,
      agentInstanceId: agent.id,
      modelUsed: agent.definition.modelTier,
      status: 'running',
    },
  });

  try {
    const response = await modelRouter.routeByTier(agent.definition.modelTier, {
      messages: [
        {
          role: 'system',
          content: `You are a ${agent.definition.name}. ${agent.definition.persona}`,
        },
        {
          role: 'user',
          content: `Task: ${task.title}\n\n${task.description}\n\nExpected output artifacts: ${task.outputArtifacts.join(', ')}.\n\nAnalyze the task and provide your professional output.`,
        },
      ],
      temperature: 0.4,
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
      previousStatus: 'RUNNING',
      newStatus: 'REVIEW',
    });

    // Auto-approve for autonomy level >= 2
    const project = await prisma.project.findUnique({
      where: { id: task.workflowExecution?.projectId ?? '' },
    });

    if (project && project.autonomyLevel >= 2) {
      await autoApproveTask(task, agent, response.content);
    }
  } catch (err) {
    await handleTaskFailure(task, agent, agentRun.id, err);
  }
}

async function autoApproveTask(task: any, agent: any, output: string): Promise<void> {
  await prisma.artifact.create({
    data: {
      taskId: task.id,
      agentInstanceId: agent.id,
      type: 'documentation',
      name: `${task.title} Output`,
      path: `artifacts/${task.id}/output.md`,
      mimeType: 'text/markdown',
      sizeBytes: Buffer.byteLength(output),
      content: output,
    },
  });

  await prisma.task.update({ where: { id: task.id }, data: { status: 'COMPLETED' } });
  await agentStateMachine.complete(agent.id);

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
      type: 'task.completed',
      taskId: task.id,
      previousStatus: 'REVIEW',
      newStatus: 'COMPLETED',
    });

    await workflowEngine.resolveAndQueueTasks(task.workflowExecutionId);

    const remaining = await prisma.task.count({
      where: {
        workflowExecutionId: task.workflowExecutionId,
        status: { notIn: ['COMPLETED', 'APPROVED', 'CANCELLED'] },
      },
    });

    if (remaining === 0) {
      await prisma.workflowExecution.update({
        where: { id: task.workflowExecutionId },
        data: { status: 'completed', completedAt: new Date() },
      });

      await prisma.project.update({
        where: { id: workflowExec.projectId },
        data: { status: 'completed' },
      });

      await publishEvent({
        eventId: randomUUID(),
        timestamp: new Date().toISOString(),
        projectId: workflowExec.projectId,
        workflowExecutionId: task.workflowExecutionId,
        type: 'workflow.completed',
        durationMs: 0,
      });
    }
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
    await prisma.task.update({
      where: { id: task.id },
      data: { status: 'QUEUED', retryCount: newRetryCount },
    });

    setTimeout(async () => {
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
          type: 'task.started',
          taskId: task.id,
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
        previousStatus: 'RUNNING',
        newStatus: 'FAILED',
      });
    }
  }
}

async function handleTaskCompleted(event: any): Promise<void> {
  await workflowEngine.resolveAndQueueTasks(event.workflowExecutionId);
}

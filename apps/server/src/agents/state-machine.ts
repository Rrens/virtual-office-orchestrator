import { prisma } from '../db.js';
import { publishEvent } from '../events/kafka.js';
import { randomUUID } from 'crypto';
import type { AgentStatus } from '@virtual-office/shared';

type AgentStatusType = AgentStatus;

const VALID_TRANSITIONS: Record<AgentStatusType, AgentStatusType[]> = {
  idle: ['assigned'],
  assigned: ['thinking', 'idle'],
  thinking: ['working', 'error'],
  working: ['reviewing', 'waiting', 'error', 'completed'],
  waiting: ['working', 'error'],
  reviewing: ['completed', 'working'],
  completed: ['idle'],
  error: ['assigned', 'escalated'],
  escalated: ['idle'],
};

export class AgentStateMachine {
  async transition(
    agentInstanceId: string,
    newStatus: AgentStatusType,
    taskId?: string | null
  ): Promise<void> {
    const agent = await prisma.agentInstance.findUnique({
      where: { id: agentInstanceId },
      select: { id: true, status: true, projectId: true },
    });

    if (!agent) throw new Error(`Agent instance '${agentInstanceId}' not found`);

    const current = agent.status as AgentStatusType;
    const allowed = VALID_TRANSITIONS[current] ?? [];

    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid agent state transition: ${current} → ${newStatus} for agent ${agentInstanceId}`
      );
    }

    await prisma.agentInstance.update({
      where: { id: agentInstanceId },
      data: {
        status: newStatus,
        currentTaskId: taskId !== undefined ? taskId : undefined,
        updatedAt: new Date(),
      },
    });

    await publishEvent({
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      projectId: agent.projectId,
      type: `agent.${newStatus}` as any,
      agentInstanceId,
      taskId: taskId ?? null,
      previousStatus: current,
    });
  }

  async assign(agentInstanceId: string, taskId: string): Promise<void> {
    await this.transition(agentInstanceId, 'assigned', taskId);
  }

  async startThinking(agentInstanceId: string): Promise<void> {
    await this.transition(agentInstanceId, 'thinking');
  }

  async startWorking(agentInstanceId: string): Promise<void> {
    await this.transition(agentInstanceId, 'working');
  }

  async startReviewing(agentInstanceId: string): Promise<void> {
    await this.transition(agentInstanceId, 'reviewing');
  }

  async complete(agentInstanceId: string): Promise<void> {
    await this.transition(agentInstanceId, 'completed', null);
    await this.transition(agentInstanceId, 'idle', null);
  }

  async wait(agentInstanceId: string): Promise<void> {
    await this.transition(agentInstanceId, 'waiting');
  }

  async fail(agentInstanceId: string): Promise<void> {
    await this.transition(agentInstanceId, 'error');
  }

  async escalate(agentInstanceId: string): Promise<void> {
    await this.transition(agentInstanceId, 'escalated');
  }
}

export const agentStateMachine = new AgentStateMachine();

import { prisma } from '../db.js';
import { publishEvent } from '../events/kafka.js';
import { randomUUID } from 'crypto';
import type { ApprovalStatus } from '@virtual-office/shared';

export interface CreateApprovalDto {
  projectId: string;
  taskId?: string;
  agentInstanceId: string;
  title: string;
  description: string;
}

export class ApprovalService {
  async requestApproval(dto: CreateApprovalDto): Promise<string> {
    const approval = await prisma.approval.create({
      data: {
        projectId: dto.projectId,
        taskId: dto.taskId ?? null,
        agentInstanceId: dto.agentInstanceId,
        title: dto.title,
        description: dto.description,
        status: 'pending',
      },
    });

    if (dto.taskId) {
      await prisma.task.update({
        where: { id: dto.taskId },
        data: { status: 'BLOCKED' },
      });
    }

    await publishEvent({
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      projectId: dto.projectId,
      type: 'approval.requested',
      approvalId: approval.id,
      title: dto.title,
      description: dto.description,
      agentInstanceId: dto.agentInstanceId,
    });

    return approval.id;
  }

  async decide(approvalId: string, status: 'approved' | 'rejected', decidedBy: string): Promise<void> {
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
    });

    if (!approval) throw new Error(`Approval '${approvalId}' not found`);

    await prisma.approval.update({
      where: { id: approvalId },
      data: {
        status,
        decidedBy,
        decidedAt: new Date(),
      },
    });

    if (approval.taskId) {
      await prisma.task.update({
        where: { id: approval.taskId },
        data: { status: status === 'approved' ? 'QUEUED' : 'FAILED' },
      });
    }

    await publishEvent({
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      projectId: approval.projectId,
      type: status === 'approved' ? 'approval.approved' : 'approval.rejected',
      approvalId,
      decidedBy,
    });
  }

  async getPending(projectId: string) {
    return prisma.approval.findMany({
      where: { projectId, status: 'pending' },
      include: {
        agentInstance: { include: { definition: true } },
        task: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}

export const approvalService = new ApprovalService();

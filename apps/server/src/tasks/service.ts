import { prisma } from '../db.js';
import type { AgentRole, TaskStatus } from '@virtual-office/shared';

export interface CreateTaskDto {
  workflowExecutionId: string;
  title: string;
  description: string;
  agentRole: AgentRole;
  dependencies?: string[];
  inputArtifacts?: string[];
  outputArtifacts?: string[];
}

export async function createTask(dto: CreateTaskDto) {
  const { dependencies = [], ...taskData } = dto;

  return prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        ...taskData,
        status: dependencies.length > 0 ? 'PENDING' : 'QUEUED',
        inputArtifacts: dto.inputArtifacts ?? [],
        outputArtifacts: dto.outputArtifacts ?? [],
      },
    });

    if (dependencies.length > 0) {
      await tx.taskDependency.createMany({
        data: dependencies.map((depId) => ({
          taskId: task.id,
          dependsOnTaskId: depId,
        })),
      });
    }

    return task;
  });
}

export async function getTaskById(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      dependencies: { include: { dependsOnTask: true } },
      dependentOn: { include: { task: true } },
      assignedAgent: { include: { definition: true } },
      artifacts: true,
      reviews: true,
    },
  });
}

export async function updateTaskStatus(taskId: string, status: TaskStatus, assignedAgentId?: string | null) {
  return prisma.task.update({
    where: { id: taskId },
    data: {
      status,
      assignedAgentId: assignedAgentId !== undefined ? assignedAgentId : undefined,
    },
  });
}

export async function getReadyTasks(workflowExecutionId: string) {
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

  return pendingTasks.filter((task) =>
    task.dependencies.every((dep) => dep.dependsOnTask.status === 'COMPLETED')
  );
}

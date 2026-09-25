import { prisma } from '../db.js';
import type { AgentRole, Department, ModelTier } from '@virtual-office/shared';

export interface CreateAgentDefinitionDto {
  role: AgentRole;
  departmentName: Department;
  name: string;
  persona: string;
  modelTier: ModelTier;
  tools: string[];
  permissions: string[];
}

export async function getOrCreateDepartment(name: Department, description: string) {
  return prisma.department.upsert({
    where: { name },
    update: {},
    create: { name, description },
  });
}

export async function registerAgentDefinition(dto: CreateAgentDefinitionDto) {
  const department = await getOrCreateDepartment(
    dto.departmentName,
    `Department for ${dto.departmentName} operations`
  );

  return prisma.agentDefinition.upsert({
    where: { role: dto.role },
    update: {
      name: dto.name,
      persona: dto.persona,
      modelTier: dto.modelTier,
      tools: dto.tools,
      permissions: dto.permissions,
    },
    create: {
      role: dto.role,
      departmentId: department.id,
      name: dto.name,
      persona: dto.persona,
      modelTier: dto.modelTier,
      tools: dto.tools,
      permissions: dto.permissions,
    },
  });
}

export async function getAgentDefinitions() {
  return prisma.agentDefinition.findMany({
    include: { department: true },
    orderBy: { role: 'asc' },
  });
}

export async function getAgentDefinitionByRole(role: AgentRole) {
  return prisma.agentDefinition.findUnique({
    where: { role },
    include: { department: true },
  });
}

export async function spawnAgentInstance(projectId: string, role: AgentRole, avatarUrl?: string) {
  const definition = await getAgentDefinitionByRole(role);
  if (!definition) {
    throw new Error(`Agent definition for role '${role}' not found`);
  }

  return prisma.agentInstance.create({
    data: {
      projectId,
      definitionId: definition.id,
      status: 'idle',
      avatarUrl: avatarUrl ?? null,
    },
    include: { definition: true },
  });
}

export async function updateAgentStatus(agentInstanceId: string, status: string, currentTaskId?: string | null) {
  return prisma.agentInstance.update({
    where: { id: agentInstanceId },
    data: {
      status,
      currentTaskId: currentTaskId !== undefined ? currentTaskId : undefined,
    },
  });
}

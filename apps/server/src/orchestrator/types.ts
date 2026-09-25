import type { AgentRole } from '@virtual-office/shared';

export interface DAGTask {
  id: string;
  title: string;
  description: string;
  agentRole: AgentRole;
  dependencies: string[];
  inputArtifacts: string[];
  expectedArtifacts: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  department?: string;
  subOrchestratorRole?: AgentRole;
  subOrchestratorName?: string;
  milestoneId?: string;
  milestoneTitle?: string;
}

export interface DepartmentMilestone {
  id: string;
  department: string;
  leadRole: AgentRole;
  leadName: string;
  directive: string;
  dependencies: string[];
  taskCount: number;
}

export interface ExecutionPlan {
  projectId: string;
  goal: string;
  departments: string[];
  milestones?: DepartmentMilestone[];
  tasks: DAGTask[];
  createdAt: string;
}


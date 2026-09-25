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
}

export interface ExecutionPlan {
  projectId: string;
  goal: string;
  departments: string[];
  tasks: DAGTask[];
  createdAt: string;
}

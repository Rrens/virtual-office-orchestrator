// Agent types
export type AgentStatus =
  | 'idle'
  | 'assigned'
  | 'thinking'
  | 'working'
  | 'waiting'
  | 'reviewing'
  | 'completed'
  | 'error'
  | 'escalated';

export type AgentRole =
  | 'orchestrator'
  | 'business-strategist'
  | 'product-manager'
  | 'business-analyst'
  | 'ux-researcher'
  | 'product-analyst'
  | 'ui-ux-designer'
  | 'design-system-designer'
  | 'brand-designer'
  | 'backend-engineer'
  | 'frontend-engineer'
  | 'mobile-engineer'
  | 'qa-engineer'
  | 'security-engineer'
  | 'penetration-tester'
  | 'devops'
  | 'performance-engineer'
  | 'ai-engineer'
  | 'digital-marketer'
  | 'seo-specialist'
  | 'content-creator'
  | 'growth-analyst'
  | 'sales-representative'
  | 'sales-researcher'
  | 'account-manager'
  | 'customer-service'
  | 'customer-success'
  | 'data-engineer'
  | 'data-analyst'
  | 'operations-manager';

export type ModelTier = 'tier1_ollama' | 'tier2_9router' | 'tier3_cloud';

export type Department =
  | 'executive'
  | 'product'
  | 'design'
  | 'engineering'
  | 'growth'
  | 'sales'
  | 'customer'
  | 'data'
  | 'operations';

export interface AgentDefinition {
  id: string;
  role: AgentRole;
  department: Department;
  name: string;
  persona: string;
  modelTier: ModelTier;
  tools: string[];
  permissions: string[];
  createdAt: Date;
}

export interface AgentInstance {
  id: string;
  definitionId: string;
  projectId: string;
  status: AgentStatus;
  currentTaskId: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Task types
export type TaskStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'ASSIGNED'
  | 'RUNNING'
  | 'REVIEW'
  | 'APPROVED'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'CANCELLED'
  | 'FAILED';

export interface Task {
  id: string;
  workflowExecutionId: string;
  title: string;
  description: string;
  agentRole: AgentRole;
  assignedAgentId: string | null;
  status: TaskStatus;
  retryCount: number;
  maxRetries: number;
  inputArtifacts: string[];
  outputArtifacts: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskDependency {
  taskId: string;
  dependsOnTaskId: string;
}

// Project types
export type ProjectStatus = 'draft' | 'planning' | 'running' | 'paused' | 'completed' | 'cancelled';
export type AutonomyLevel = 0 | 1 | 2 | 3 | 4;

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  goal: string;
  status: ProjectStatus;
  autonomyLevel: AutonomyLevel;
  budgetTokens: number | null;
  usedTokens: number;
  createdAt: Date;
  updatedAt: Date;
}

// Workflow types
export type WorkflowExecutionStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed';

export interface WorkflowExecution {
  id: string;
  projectId: string;
  status: WorkflowExecutionStatus;
  dagJson: string;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

// Artifact types
export type ArtifactType = 'code' | 'documentation' | 'design' | 'report' | 'config' | 'test' | 'other';

export interface Artifact {
  id: string;
  taskId: string;
  agentInstanceId: string;
  type: ArtifactType;
  name: string;
  path: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
}

// Review types
export type ReviewResult = 'approved' | 'approved_with_changes' | 'rejected';

export interface Review {
  id: string;
  taskId: string;
  reviewerAgentId: string;
  result: ReviewResult;
  feedback: string;
  createdAt: Date;
}

// Approval types
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Approval {
  id: string;
  projectId: string;
  taskId: string | null;
  agentInstanceId: string;
  title: string;
  description: string;
  status: ApprovalStatus;
  decidedBy: string | null;
  decidedAt: Date | null;
  createdAt: Date;
}

// Handoff payload
export interface HandoffPayload {
  handoffId: string;
  fromAgent: string;
  toAgent: string;
  taskId: string;
  workflowId: string;
  status: 'READY_FOR_REVIEW';
  summary: string;
  artifacts: Array<{
    path: string;
    type: ArtifactType;
    version: string;
  }>;
  knownIssues: string[];
  nextRecommendedAction: string;
}

// Memory types
export type MemoryScope = 'working' | 'project' | 'agent' | 'organization';

export interface Memory {
  id: string;
  scope: MemoryScope;
  scopeId: string;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

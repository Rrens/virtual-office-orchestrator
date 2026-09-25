// Kafka topic names
export const KAFKA_TOPICS = {
  AGENT_EVENTS: 'agent-events',
  TASK_EVENTS: 'task-events',
  WORKFLOW_EVENTS: 'workflow-events',
  TOOL_EVENTS: 'tool-events',
  APPROVAL_EVENTS: 'approval-events',
  SYSTEM_LOGS: 'system-logs',
} as const;

export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];

// Base event shape
export interface BaseEvent {
  eventId: string;
  timestamp: string;
  projectId: string;
  workflowExecutionId?: string;
  agentRole?: string;
  agentInstanceId?: string;
  message?: string;
}

// Agent events
export interface AgentCreatedEvent extends BaseEvent {
  type: 'agent.created';
  agentInstanceId: string;
  agentRole: string;
  department: string;
}

export interface AgentAssignedEvent extends BaseEvent {
  type: 'agent.assigned';
  agentInstanceId: string;
  taskId: string;
}

export interface AgentStatusChangedEvent extends BaseEvent {
  type: 'agent.thinking' | 'agent.working' | 'agent.waiting' | 'agent.reviewing' | 'agent.completed' | 'agent.failed' | 'agent.escalated';
  agentInstanceId: string;
  taskId: string | null;
  previousStatus: string;
}

// Task events
export interface TaskCreatedEvent extends BaseEvent {
  type: 'task.created';
  taskId: string;
  title: string;
  agentRole: string;
  dependencies: string[];
}

export interface TaskStatusChangedEvent extends BaseEvent {
  type: 'task.assigned' | 'task.started' | 'task.blocked' | 'task.review' | 'task.completed' | 'task.failed';
  taskId: string;
  previousStatus: string;
  newStatus: string;
}

import type { HandoffPayload } from './types.js';

export interface TaskHandoffEvent extends BaseEvent {
  type: 'task.handoff';
  taskId: string;
  fromAgentId: string;
  toAgentId: string;
  payload: HandoffPayload;
}

// Deployment events (PRD §29)
export interface DeploymentEvent extends BaseEvent {
  type: 'deployment.started' | 'deployment.completed' | 'deployment.failed';
  environment: string;
  agentInstanceId: string;
  manifestArtifactId?: string;
  errorMessage?: string;
}

// Workflow events
export interface WorkflowStartedEvent extends BaseEvent {
  type: 'workflow.started';
  workflowExecutionId: string;
  totalTasks: number;
}

export interface WorkflowCompletedEvent extends BaseEvent {
  type: 'workflow.completed';
  workflowExecutionId: string;
  durationMs: number;
}

// Approval events
export interface ApprovalRequestedEvent extends BaseEvent {
  type: 'approval.requested';
  approvalId: string;
  title: string;
  description: string;
  agentInstanceId: string;
}

export interface ApprovalDecidedEvent extends BaseEvent {
  type: 'approval.approved' | 'approval.rejected';
  approvalId: string;
  decidedBy: string;
}

// Tool events
export interface ToolEvent extends BaseEvent {
  type: 'tool.started' | 'tool.completed' | 'tool.failed';
  toolCallId: string;
  toolName: string;
  agentInstanceId: string;
  durationMs?: number;
  errorMessage?: string;
}

// Project status events
export interface ProjectStatusEvent extends BaseEvent {
  type: 'project.paused' | 'project.resumed' | 'project.cancelled';
}

// Union of all events
export type VirtualOfficeEvent =
  | AgentCreatedEvent
  | AgentAssignedEvent
  | AgentStatusChangedEvent
  | TaskCreatedEvent
  | TaskStatusChangedEvent
  | TaskHandoffEvent
  | WorkflowStartedEvent
  | WorkflowCompletedEvent
  | ApprovalRequestedEvent
  | ApprovalDecidedEvent
  | ToolEvent
  | ProjectStatusEvent
  | DeploymentEvent;

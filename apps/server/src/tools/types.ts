import type { ToolCall } from '@prisma/client';

export interface ToolInput {
  [key: string]: unknown;
}

export interface ToolOutput {
  success: boolean;
  data?: unknown;
  stdout?: string;
  stderr?: string;
  artifacts?: string[];
  durationMs: number;
  errorCategory?: 'permission_denied' | 'validation_error' | 'execution_error' | 'timeout';
  errorMessage?: string;
}

export interface ToolDefinition {
  name: string;
  version: string;
  description: string;
  requiredPermission: string;
  inputSchema: Record<string, { type: string; required: boolean; description: string }>;
  timeout: number;
  requiresApproval: boolean;
  execute(input: ToolInput, context: ToolExecutionContext): Promise<ToolOutput>;
}

export interface ToolExecutionContext {
  agentInstanceId: string;
  agentRole: string;
  projectId: string;
  taskId: string;
  workspaceDir: string;
  permissions: string[];
}

export interface GatewayResult {
  allowed: boolean;
  denyReason?: string;
  toolCallId?: string;
  output?: ToolOutput;
}

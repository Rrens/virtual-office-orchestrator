import { prisma } from '../db.js';
import { publishEvent } from '../events/kafka.js';
import { randomUUID } from 'crypto';
import type { ToolDefinition, ToolExecutionContext, ToolInput, GatewayResult } from './types.js';

const PERMISSION_MAP: Record<string, string[]> = {
  'workspace.read': ['workspace.read', 'all.read'],
  'workspace.write': ['workspace.write'],
  'git.commit': ['git.commit'],
  'terminal.sandbox': ['terminal.sandbox'],
  'database.dev': ['database.dev'],
  'browser.fetch': ['browser.fetch'],
  'deployment.staging': ['deployment.staging'],
  'deployment.prod': ['deployment.prod'],
};

export class ToolGateway {
  private registry: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition) {
    this.registry.set(tool.name, tool);
  }

  getAvailable(): ToolDefinition[] {
    return Array.from(this.registry.values());
  }

  private hasPermission(agentPermissions: string[], required: string): boolean {
    const grants = PERMISSION_MAP[required] ?? [required];
    return agentPermissions.some((p) => grants.includes(p));
  }

  async execute(
    toolName: string,
    input: ToolInput,
    context: ToolExecutionContext
  ): Promise<GatewayResult> {
    const tool = this.registry.get(toolName);

    if (!tool) {
      return { allowed: false, denyReason: `Tool '${toolName}' not found in registry` };
    }

    if (!this.hasPermission(context.permissions, tool.requiredPermission)) {
      await this.auditDenied(toolName, input, context, 'permission_denied');
      return {
        allowed: false,
        denyReason: `Agent '${context.agentRole}' lacks permission '${tool.requiredPermission}' for tool '${toolName}'`,
      };
    }

    // Validate required input fields
    for (const [key, schema] of Object.entries(tool.inputSchema)) {
      if (schema.required && (input[key] === undefined || input[key] === null)) {
        return {
          allowed: false,
          denyReason: `Missing required input field '${key}' for tool '${toolName}'`,
        };
      }
    }

    const toolCallId = randomUUID();

    const toolCallRecord = await prisma.toolCall.create({
      data: {
        id: toolCallId,
        agentRunId: context.taskId,
        toolName,
        inputJson: JSON.stringify(input),
        status: 'running',
      },
    });

    await publishEvent({
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      projectId: context.projectId,
      type: 'tool.started',
      toolCallId,
      toolName,
      agentInstanceId: context.agentInstanceId,
    });

    try {
      const output = await Promise.race([
        tool.execute(input, context),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Tool execution timeout')), tool.timeout)
        ),
      ]);

      await prisma.toolCall.update({
        where: { id: toolCallId },
        data: {
          outputJson: JSON.stringify(output.data ?? {}),
          status: output.success ? 'success' : 'failed',
          durationMs: output.durationMs,
          errorMessage: output.errorMessage ?? null,
        },
      });

      await publishEvent({
        eventId: randomUUID(),
        timestamp: new Date().toISOString(),
        projectId: context.projectId,
        type: output.success ? 'tool.completed' : 'tool.failed',
        toolCallId,
        toolName,
        agentInstanceId: context.agentInstanceId,
        durationMs: output.durationMs,
        errorMessage: output.errorMessage,
      });

      return { allowed: true, toolCallId, output };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      await prisma.toolCall.update({
        where: { id: toolCallId },
        data: { status: 'failed', errorMessage },
      });

      await publishEvent({
        eventId: randomUUID(),
        timestamp: new Date().toISOString(),
        projectId: context.projectId,
        type: 'tool.failed',
        toolCallId,
        toolName,
        agentInstanceId: context.agentInstanceId,
        errorMessage,
      });

      return {
        allowed: true,
        toolCallId,
        output: {
          success: false,
          durationMs: 0,
          errorCategory: 'execution_error',
          errorMessage,
        },
      };
    }
  }

  private async auditDenied(
    toolName: string,
    input: ToolInput,
    context: ToolExecutionContext,
    reason: string
  ) {
    await prisma.toolCall.create({
      data: {
        agentRunId: context.taskId,
        toolName,
        inputJson: JSON.stringify(input),
        status: 'failed',
        errorMessage: `Permission denied: ${reason}`,
        durationMs: 0,
      },
    });
  }
}

export const toolGateway = new ToolGateway();

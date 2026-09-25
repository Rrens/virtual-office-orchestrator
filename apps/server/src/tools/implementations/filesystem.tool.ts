import fs from 'fs/promises';
import path from 'path';
import type { ToolDefinition, ToolExecutionContext, ToolInput, ToolOutput } from '../types.js';

export const workspaceReadTool: ToolDefinition = {
  name: 'workspace.read',
  version: '1.0.0',
  description: 'Read files and directories from the project workspace',
  requiredPermission: 'workspace.read',
  timeout: 5000,
  requiresApproval: false,
  inputSchema: {
    filePath: { type: 'string', required: true, description: 'Relative path in workspace' },
  },
  async execute(input: ToolInput, context: ToolExecutionContext): Promise<ToolOutput> {
    const startTime = Date.now();
    const targetPath = path.resolve(context.workspaceDir, String(input.filePath));

    if (!targetPath.startsWith(context.workspaceDir)) {
      return {
        success: false,
        durationMs: Date.now() - startTime,
        errorCategory: 'permission_denied',
        errorMessage: 'Path traversal out of workspace is prohibited',
      };
    }

    try {
      const content = await fs.readFile(targetPath, 'utf-8');
      return {
        success: true,
        data: { content, bytes: Buffer.byteLength(content) },
        durationMs: Date.now() - startTime,
      };
    } catch (err) {
      return {
        success: false,
        durationMs: Date.now() - startTime,
        errorCategory: 'execution_error',
        errorMessage: err instanceof Error ? err.message : String(err),
      };
    }
  },
};

export const workspaceWriteTool: ToolDefinition = {
  name: 'workspace.write',
  version: '1.0.0',
  description: 'Write or create files in the project workspace',
  requiredPermission: 'workspace.write',
  timeout: 10000,
  requiresApproval: false,
  inputSchema: {
    filePath: { type: 'string', required: true, description: 'Relative path in workspace' },
    content: { type: 'string', required: true, description: 'Content to write' },
  },
  async execute(input: ToolInput, context: ToolExecutionContext): Promise<ToolOutput> {
    const startTime = Date.now();
    const targetPath = path.resolve(context.workspaceDir, String(input.filePath));

    if (!targetPath.startsWith(context.workspaceDir)) {
      return {
        success: false,
        durationMs: Date.now() - startTime,
        errorCategory: 'permission_denied',
        errorMessage: 'Path traversal out of workspace is prohibited',
      };
    }

    try {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, String(input.content), 'utf-8');
      return {
        success: true,
        data: { writtenPath: input.filePath, bytes: Buffer.byteLength(String(input.content)) },
        artifacts: [String(input.filePath)],
        durationMs: Date.now() - startTime,
      };
    } catch (err) {
      return {
        success: false,
        durationMs: Date.now() - startTime,
        errorCategory: 'execution_error',
        errorMessage: err instanceof Error ? err.message : String(err),
      };
    }
  },
};

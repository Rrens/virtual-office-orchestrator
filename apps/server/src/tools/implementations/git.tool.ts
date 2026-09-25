import { exec } from 'child_process';
import { promisify } from 'util';
import type { ToolDefinition, ToolExecutionContext, ToolInput, ToolOutput } from '../types.js';

const execAsync = promisify(exec);

export const gitCommitTool: ToolDefinition = {
  name: 'git.commit',
  version: '1.0.0',
  description: 'Stage and commit workspace files with conventional commit message',
  requiredPermission: 'git.commit',
  timeout: 15000,
  requiresApproval: false,
  inputSchema: {
    message: { type: 'string', required: true, description: 'Conventional commit message (feat, fix, etc.)' },
    files: { type: 'string', required: false, description: 'File pattern to add (default .)' },
  },
  async execute(input: ToolInput, context: ToolExecutionContext): Promise<ToolOutput> {
    const startTime = Date.now();
    const filesToStage = String(input.files ?? '.');
    const commitMsg = String(input.message);

    try {
      await execAsync(`git add ${filesToStage}`, { cwd: context.workspaceDir });
      const { stdout } = await execAsync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, {
        cwd: context.workspaceDir,
      });

      return {
        success: true,
        data: { commitOutput: stdout.trim() },
        stdout: stdout.trim(),
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

import { exec } from 'child_process';
import { promisify } from 'util';
import type { ToolDefinition, ToolExecutionContext, ToolInput, ToolOutput } from '../types.js';

const execAsync = promisify(exec);

const ALLOWED_COMMANDS = [
  'ls',
  'pwd',
  'cat',
  'grep',
  'find',
  'echo',
  'head',
  'tail',
  'wc',
  'npm',
  'npx',
  'node',
  'tsx',
  'go',
  'python3',
];

export const terminalSandboxTool: ToolDefinition = {
  name: 'terminal.sandbox',
  version: '1.0.0',
  description: 'Execute whitelisted shell commands in the project workspace',
  requiredPermission: 'terminal.sandbox',
  timeout: 60000,
  requiresApproval: true,
  inputSchema: {
    command: { type: 'string', required: true, description: 'Shell command to execute' },
  },
  async execute(input: ToolInput, context: ToolExecutionContext): Promise<ToolOutput> {
    const startTime = Date.now();
    const command = String(input.command).trim();

    const firstToken = command.split(/\s+/)[0];
    if (!ALLOWED_COMMANDS.includes(firstToken)) {
      return {
        success: false,
        durationMs: Date.now() - startTime,
        errorCategory: 'permission_denied',
        errorMessage: `Command '${firstToken}' is not in the allowed sandbox whitelist`,
      };
    }

    // Block dangerous characters and redirects
    const dangerousPattern = /[;&|`$(){}\[\]<>]/;
    if (dangerousPattern.test(command)) {
      return {
        success: false,
        durationMs: Date.now() - startTime,
        errorCategory: 'permission_denied',
        errorMessage: 'Command contains prohibited shell metacharacters',
      };
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: context.workspaceDir,
        timeout: 60000,
        env: {
          PATH: process.env.PATH,
          NODE_ENV: process.env.NODE_ENV,
          HOME: process.env.HOME,
        },
      });

      return {
        success: true,
        stdout,
        stderr,
        data: { command },
        durationMs: Date.now() - startTime,
      };
    } catch (err) {
      return {
        success: false,
        durationMs: Date.now() - startTime,
        errorCategory: 'execution_error',
        errorMessage: err instanceof Error ? err.message : String(err),
        stderr: (err as any).stderr ?? '',
      };
    }
  },
};

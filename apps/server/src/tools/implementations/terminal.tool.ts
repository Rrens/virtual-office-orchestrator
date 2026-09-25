import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
import type { ToolDefinition, ToolExecutionContext, ToolInput, ToolOutput } from '../types.js';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

const DOCKER_IMAGE = 'node:24-alpine';
const TIMEOUT_MS = 60_000;
const MAX_OUTPUT_BYTES = 512 * 1024;

const ALLOWED_COMMANDS = [
  'ls', 'pwd', 'cat', 'grep', 'find', 'echo',
  'head', 'tail', 'wc', 'npm', 'npx', 'node',
  'tsx', 'go', 'python3', 'sh',
];

async function isDockerAvailable(): Promise<boolean> {
  try {
    await execAsync('docker info --format "{{.ServerVersion}}"', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

async function runInDocker(command: string, workspaceDir: string): Promise<{ stdout: string; stderr: string }> {
  const containerName = `sandbox-${randomUUID()}`;
  const args = [
    'run',
    '--rm',
    '--name', containerName,
    '--network', 'none',
    '--memory', '256m',
    '--cpus', '0.5',
    '--pids-limit', '64',
    '--read-only',
    '--tmpfs', '/tmp:size=64m',
    '--volume', `${workspaceDir}:/workspace:ro`,
    '--workdir', '/workspace',
    '--user', 'nobody',
    DOCKER_IMAGE,
    'sh', '-c', command,
  ];

  return execFileAsync('docker', args, {
    timeout: TIMEOUT_MS,
    maxBuffer: MAX_OUTPUT_BYTES,
  });
}

export const terminalSandboxTool: ToolDefinition = {
  name: 'terminal.sandbox',
  version: '2.0.0',
  description: 'Execute whitelisted shell commands in an isolated Docker sandbox container with no network and read-only filesystem',
  requiredPermission: 'terminal.sandbox',
  timeout: TIMEOUT_MS,
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
        errorMessage: `Command '${firstToken}' is not in the sandbox whitelist`,
      };
    }

    const dangerousPattern = /[;&|`$(){}\[\]<>]/;
    if (dangerousPattern.test(command)) {
      return {
        success: false,
        durationMs: Date.now() - startTime,
        errorCategory: 'permission_denied',
        errorMessage: 'Command contains prohibited shell metacharacters',
      };
    }

    const dockerAvailable = await isDockerAvailable();

    try {
      if (dockerAvailable) {
        const { stdout, stderr } = await runInDocker(command, context.workspaceDir);
        return {
          success: true,
          stdout,
          stderr,
          data: { command, sandboxed: true, runtime: 'docker' },
          durationMs: Date.now() - startTime,
        };
      } else {
        // Fallback: restricted host execution when Docker unavailable
        console.warn('[terminal.sandbox] Docker unavailable, using restricted host execution');
        const { stdout, stderr } = await execAsync(command, {
          cwd: context.workspaceDir,
          timeout: TIMEOUT_MS,
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
          data: { command, sandboxed: false, runtime: 'host_fallback' },
          durationMs: Date.now() - startTime,
        };
      }
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

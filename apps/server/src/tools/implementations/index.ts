import { toolGateway } from '../gateway.js';
import { workspaceReadTool, workspaceWriteTool } from './filesystem.tool.js';
import { gitCommitTool } from './git.tool.js';
import { terminalSandboxTool } from './terminal.tool.js';
import { browserFetchTool } from './browser.tool.js';

export function registerAllTools() {
  toolGateway.register(workspaceReadTool);
  toolGateway.register(workspaceWriteTool);
  toolGateway.register(gitCommitTool);
  toolGateway.register(terminalSandboxTool);
  toolGateway.register(browserFetchTool);
}

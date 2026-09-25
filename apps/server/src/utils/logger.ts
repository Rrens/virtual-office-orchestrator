import fs from 'fs';
import path from 'path';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  model?: string;
  agentRole?: string;
  data?: any;
}

const LOGS_DIR = path.resolve(process.cwd(), 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function getLogFilePath(date?: Date): string {
  const d = date || new Date();
  const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(LOGS_DIR, `${dateStr}.log`);
}

export function writeLog(level: LogLevel, module: string, message: string, data?: any, model?: string, agentRole?: string): void {
  const now = new Date();
  const entry: LogEntry = {
    timestamp: now.toISOString(),
    level,
    module,
    message,
    ...(model ? { model } : {}),
    ...(agentRole ? { agentRole } : {}),
    ...(data !== undefined ? { data } : {}),
  };

  const line = JSON.stringify(entry) + '\n';
  const filePath = getLogFilePath(now);

  fs.appendFile(filePath, line, (err) => {
    if (err) console.error('[Logger] Failed to write log:', err);
  });

  const timeShort = now.toLocaleTimeString();
  const color =
    level === 'error' ? '\x1b[31m' :
    level === 'warn' ? '\x1b[33m' :
    level === 'debug' ? '\x1b[90m' : '\x1b[36m';
  const modelTag = model ? ` \x1b[35m[${model}]\x1b[0m` : '';
  console.log(`${color}[${timeShort}][${level.toUpperCase()}][${module}]${modelTag}\x1b[0m ${message}`);
}

export const logger = {
  info: (module: string, message: string, data?: any, model?: string, agentRole?: string) => writeLog('info', module, message, data, model, agentRole),
  warn: (module: string, message: string, data?: any) => writeLog('warn', module, message, data),
  error: (module: string, message: string, data?: any) => writeLog('error', module, message, data),
  debug: (module: string, message: string, data?: any) => writeLog('debug', module, message, data),
};

export interface ReadLogsFilter {
  date?: string; // YYYY-MM-DD
  level?: LogLevel;
  module?: string;
  search?: string;
  limit?: number;
}

export async function readLogs(filter: ReadLogsFilter = {}): Promise<LogEntry[]> {
  const dateStr = filter.date || new Date().toISOString().split('T')[0];
  const filePath = path.join(LOGS_DIR, `${dateStr}.log`);

  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = await fs.promises.readFile(filePath, 'utf-8');
  const lines = content.split('\n').filter(Boolean);

  let logs: LogEntry[] = [];
  for (const line of lines) {
    try {
      logs.push(JSON.parse(line));
    } catch {}
  }

  if (filter.level) {
    logs = logs.filter((l) => l.level === filter.level);
  }
  if (filter.module) {
    logs = logs.filter((l) => l.module.toLowerCase().includes(filter.module!.toLowerCase()));
  }
  if (filter.search) {
    const q = filter.search.toLowerCase();
    logs = logs.filter(
      (l) =>
        l.message.toLowerCase().includes(q) ||
        JSON.stringify(l.data || {}).toLowerCase().includes(q)
    );
  }

  // Newest first
  logs.reverse();

  if (filter.limit) {
    logs = logs.slice(0, filter.limit);
  }

  return logs;
}

export async function listLogDates(): Promise<string[]> {
  if (!fs.existsSync(LOGS_DIR)) return [];
  const files = await fs.promises.readdir(LOGS_DIR);
  return files
    .filter((f) => f.endsWith('.log'))
    .map((f) => f.replace('.log', ''))
    .sort()
    .reverse();
}

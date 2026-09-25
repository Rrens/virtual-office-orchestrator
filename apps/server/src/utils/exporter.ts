import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { prisma } from '../db.js';

const EXPORT_BASE = path.resolve(process.cwd(), 'exported-projects');

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function safePath(base: string, filePath: string): string {
  const resolved = path.resolve(base, filePath);
  if (!resolved.startsWith(base)) {
    throw new Error(`Path traversal detected: ${filePath}`);
  }
  return resolved;
}

export interface ExportResult {
  projectName: string;
  zipFileName: string;
  zipBuffer: Buffer;
  filesWritten: number;
  totalBytes: number;
  files: string[];
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function extractCodeFiles(markdown: string): Array<{ filePath: string; content: string }> {
  const files: Array<{ filePath: string; content: string }> = [];

  const headerBlockRegex = /(?:###?|####)\s+([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+)\s*\n+```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  while ((match = headerBlockRegex.exec(markdown)) !== null) {
    const rawPath = match[1].trim();
    const code = match[2];
    if (rawPath && code && !rawPath.startsWith('http') && rawPath.includes('.')) {
      files.push({ filePath: rawPath, content: code });
    }
  }

  if (files.length === 0) {
    const commentBlockRegex = /```(?:typescript|javascript|ts|js|json|sql|prisma|dockerfile|yaml|yml|html|css|bash|sh)?\n(?:\/\/\s*|#\s*)([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+)\n([\s\S]*?)```/g;
    while ((match = commentBlockRegex.exec(markdown)) !== null) {
      const rawPath = match[1].trim();
      const code = match[2];
      if (rawPath && code && rawPath.includes('.')) {
        files.push({ filePath: rawPath, content: code });
      }
    }
  }

  return files;
}

export async function exportProject(projectId: string): Promise<ExportResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      workflowExecutions: {
        include: {
          tasks: {
            include: {
              artifacts: true,
              assignedAgent: { include: { definition: true } },
            },
          },
        },
      },
      agentInstances: { include: { definition: true } },
    },
  });

  if (!project) throw new Error(`Project '${projectId}' not found`);

  const slug = slugify(project.name);
  const zip = new JSZip();
  const rootFolder = zip.folder(slug)!;

  const filesWritten: string[] = [];
  let totalBytes = 0;

  for (const execution of project.workflowExecutions) {
    for (const task of execution.tasks) {
      for (const artifact of task.artifacts) {
        if (!artifact.content) continue;

        // Extract code files from markdown
        const extractedFiles = extractCodeFiles(artifact.content);
        if (extractedFiles.length > 0) {
          for (const extFile of extractedFiles) {
            const content = extFile.content.trim();
            rootFolder.file(extFile.filePath, content);
            filesWritten.push(extFile.filePath);
            totalBytes += Buffer.byteLength(content);
          }
        }

        // Keep raw artifact doc
        const docFileName = artifact.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
        const docRelPath = artifact.type === 'report'
          ? `docs/final-report.md`
          : `docs/${task.agentRole}-${docFileName}.md`;

        rootFolder.file(docRelPath, artifact.content);
        filesWritten.push(docRelPath);
        totalBytes += artifact.sizeBytes;
      }
    }
  }

  // project-metadata.json
  const tasks = project.workflowExecutions[0]?.tasks ?? [];
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED' || t.status === 'APPROVED').length;

  const metadata = {
    id: project.id,
    name: project.name,
    goal: project.goal,
    status: project.status,
    autonomyLevel: project.autonomyLevel,
    usedTokens: project.usedTokens,
    exportedAt: new Date().toISOString(),
    agents: project.agentInstances.map((a) => ({
      name: a.definition.name,
      role: a.definition.role,
      status: a.status,
    })),
    tasks: tasks.map((t) => ({
      title: t.title,
      agentRole: t.agentRole,
      status: t.status,
      artifactCount: t.artifacts.length,
    })),
  };

  rootFolder.file('project-metadata.json', JSON.stringify(metadata, null, 2));
  filesWritten.push('project-metadata.json');

  // README.md
  const readme = `# ${project.name}

> Dihasilkan oleh Virtual Office AI — ${new Date().toLocaleDateString('id-ID')}

## Business Goal
${project.goal}

## Status
- **Project Status:** ${project.status}
- **Tasks:** ${completedCount}/${tasks.length} selesai
- **Total Tokens Used:** ${project.usedTokens.toLocaleString()}

## Tim Agent
${project.agentInstances.map((a) => `- **${a.definition.name}** (${a.definition.role}) — ${a.status}`).join('\n')}

## Daftar Task
${tasks.map((t, i) => `${i + 1}. **${t.title}** — \`${t.agentRole}\` — ${t.status}`).join('\n')}

## File yang Dihasilkan
${filesWritten.map((f) => `- \`${f}\``).join('\n')}
`;

  rootFolder.file('README.md', readme);
  filesWritten.push('README.md');

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  // Also save to disk for reference
  ensureDir(EXPORT_BASE);
  const diskPath = path.join(EXPORT_BASE, `${slug}.zip`);
  fs.writeFileSync(diskPath, zipBuffer);

  return {
    projectName: project.name,
    zipFileName: `${slug}.zip`,
    zipBuffer,
    filesWritten: filesWritten.length,
    totalBytes,
    files: filesWritten,
  };
}

import { modelRouter } from '../models/router.js';
import { prisma } from '../db.js';
import type { DAGTask, ExecutionPlan } from './types.js';
import type { AgentRole } from '@virtual-office/shared';
import { hierarchicalPlanner } from './hierarchicalPlanner.js';

const VALID_ROLES = [
  'orchestrator', 'business-strategist', 'product-manager', 'business-analyst',
  'ux-researcher', 'product-analyst', 'ui-ux-designer', 'design-system-designer',
  'brand-designer', 'backend-engineer', 'frontend-engineer', 'mobile-engineer',
  'qa-engineer', 'security-engineer', 'penetration-tester', 'devops',
  'performance-engineer', 'ai-engineer', 'digital-marketer', 'seo-specialist',
  'content-creator', 'growth-analyst', 'sales-representative', 'sales-researcher',
  'account-manager', 'customer-service', 'customer-success', 'data-engineer',
  'data-analyst', 'operations-manager'
];

const DEPARTMENT_ROLE_MAP: Record<string, string> = {
  'engineering': 'backend-engineer',
  'product': 'product-manager',
  'design': 'ui-ux-designer',
  'executive': 'orchestrator',
  'growth': 'digital-marketer',
  'sales': 'sales-representative',
  'customer': 'customer-service',
  'data': 'data-engineer',
  'operations': 'operations-manager',
};

function normalizeRole(role: string): AgentRole {
  const clean = String(role).toLowerCase().trim();
  if (VALID_ROLES.includes(clean)) return clean as AgentRole;
  if (DEPARTMENT_ROLE_MAP[clean]) return DEPARTMENT_ROLE_MAP[clean] as AgentRole;
  return 'backend-engineer';
}

const ORCHESTRATOR_SYSTEM_PROMPT = `You are the Chief Orchestrator of an AI Virtual Company.
Your job is to decompose high-level business goals into a structured Directed Acyclic Graph (DAG) of actionable tasks.

Available Agent Roles:
- Executive: orchestrator, business-strategist
- Product: product-manager, business-analyst, ux-researcher, product-analyst
- Design: ui-ux-designer, design-system-designer, brand-designer
- Engineering: backend-engineer, frontend-engineer, mobile-engineer, qa-engineer, security-engineer, penetration-tester, devops, performance-engineer, ai-engineer
- Growth: digital-marketer, seo-specialist, content-creator, growth-analyst
- Sales: sales-representative, sales-researcher, account-manager
- Customer: customer-service, customer-success
- Data: data-engineer, data-analyst
- Operations: operations-manager

RULES:
1. Decompose the goal into 4 to 8 concrete tasks.
2. Select ONLY the agents relevant to this specific goal.
3. Every task must declare its dependencies (which tasks must complete first). Independent tasks can run parallel.
4. The graph MUST be a valid DAG (no cycles).
5. Output strict valid JSON ONLY, no markdown, no backticks, no comments.

JSON Output Schema:
{
  "departments": ["product", "engineering", ...],
  "tasks": [
    {
      "id": "TASK-1",
      "title": "Brief title",
      "description": "Specific deliverables and instructions",
      "agentRole": "product-manager",
      "dependencies": [],
      "inputArtifacts": [],
      "expectedArtifacts": ["docs/prd.md"],
      "estimatedComplexity": "medium"
    }
  ]
}`;

export function sanitizeAndBreakCycles<T extends { id: string; dependencies: string[] }>(tasks: T[]): T[] {
  const taskIds = new Set(tasks.map((t) => t.id));

  // 1. Remove non-existent IDs, self-references, and duplicates
  for (const task of tasks) {
    task.dependencies = Array.from(
      new Set((task.dependencies || []).filter((d) => typeof d === 'string' && d !== task.id && taskIds.has(d)))
    );
  }

  // 2. Iteratively break all cycles until graph is strictly acyclic
  let maxIterations = tasks.length * 2;
  while (maxIterations-- > 0) {
    const visited = new Set<string>();
    const recStack = new Set<string>();
    let cycleBroken = false;

    const findAndBreakCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recStack.add(nodeId);

      const task = tasks.find((t) => t.id === nodeId);
      if (!task) {
        recStack.delete(nodeId);
        return false;
      }

      for (let i = 0; i < task.dependencies.length; i++) {
        const depId = task.dependencies[i];

        if (recStack.has(depId)) {
          console.warn(`[GoalPlanner] Breaking detected circular dependency: removed edge ${nodeId} -> ${depId}`);
          task.dependencies.splice(i, 1);
          recStack.delete(nodeId);
          return true; // Break cycle and restart search
        }

        if (!visited.has(depId)) {
          if (findAndBreakCycle(depId)) {
            recStack.delete(nodeId);
            return true;
          }
        }
      }

      recStack.delete(nodeId);
      return false;
    };

    for (const task of tasks) {
      if (!visited.has(task.id)) {
        if (findAndBreakCycle(task.id)) {
          cycleBroken = true;
          break;
        }
      }
    }

    if (!cycleBroken) {
      break;
    }
  }

  return tasks;
}

export class GoalPlanner {
  async plan(projectId: string, goal: string): Promise<ExecutionPlan> {
    let enrichedGoal = goal;
    try {
      const prdMem = await prisma.memoryStore.findUnique({
        where: {
          scope_scopeId_key: {
            scope: 'project',
            scopeId: projectId,
            key: 'prd_files',
          },
        },
      });

      if (prdMem) {
        const files: Array<{ name: string; content: string }> = JSON.parse(prdMem.value);
        if (Array.isArray(files) && files.length > 0) {
          const prdContext = files.map((f) => `--- File PRD: ${f.name} ---\n${f.content.slice(0, 1500)}`).join('\n\n');
          enrichedGoal = `${goal}\n\nAttached PRD & Specification Documents:\n${prdContext}`;
        }
      }
    } catch {}

    try {
      // Primary: Use Hierarchical Multi-Agent Sub-Orchestrators
      const hierarchicalPlan = await hierarchicalPlanner.plan(projectId, enrichedGoal);
      if (hierarchicalPlan.tasks && hierarchicalPlan.tasks.length > 0) {
        hierarchicalPlan.tasks = sanitizeAndBreakCycles(hierarchicalPlan.tasks);
        return hierarchicalPlan;
      }
    } catch (err) {
      console.warn('[GoalPlanner] Hierarchical planning failed, falling back to direct prompt:', err);
    }

    const prompt = `Goal: "${goal}"\nGenerate an execution plan for this goal. Output pure JSON matching the schema.`;

    try {
      const response = await modelRouter.routeByTier('tier1_ollama', {
        maxTokens: 1024,
        messages: [
          { role: 'system', content: ORCHESTRATOR_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        agentRole: 'orchestrator',
      });

      const cleanJson = response.content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);

      // Normalize agent roles & sanitize dependencies
      const tasks: DAGTask[] = (parsed.tasks ?? []).map((t: any, idx: number) => ({
        id: t.id || `TASK-${idx + 1}`,
        title: t.title || 'Subtask',
        description: t.description || '',
        agentRole: normalizeRole(t.agentRole),
        dependencies: Array.isArray(t.dependencies) ? t.dependencies : [],
        inputArtifacts: Array.isArray(t.inputArtifacts) ? t.inputArtifacts : [],
        expectedArtifacts: Array.isArray(t.expectedArtifacts) ? t.expectedArtifacts : [],
        estimatedComplexity: t.estimatedComplexity || 'medium',
      }));

      const sanitizedTasks = sanitizeAndBreakCycles(tasks);

      return {
        projectId,
        goal,
        departments: parsed.departments ?? ['product', 'engineering'],
        tasks: sanitizedTasks,
        createdAt: new Date().toISOString(),
      };
    } catch (err) {
      console.warn('[GoalPlanner] LLM generation failed, generating fallback plan:', err instanceof Error ? err.message : err);
      const fallback = this.generateFallbackPlan(projectId, goal);
      fallback.tasks = sanitizeAndBreakCycles(fallback.tasks);
      return fallback;
    }
  }

  private generateFallbackPlan(projectId: string, goal: string): ExecutionPlan {
    const isSoftware = goal.toLowerCase().includes('app') ||
      goal.toLowerCase().includes('saas') ||
      goal.toLowerCase().includes('api') ||
      goal.toLowerCase().includes('web') ||
      goal.toLowerCase().includes('pos');

    if (isSoftware) {
      return {
        projectId,
        goal,
        departments: ['product', 'engineering'],
        createdAt: new Date().toISOString(),
        tasks: [
          {
            id: 'TASK-1',
            title: 'Requirements & Scope Analysis',
            description: `Analyze business requirements, core user journeys, and technical scope for: ${goal}`,
            agentRole: 'business-analyst',
            dependencies: [],
            inputArtifacts: [],
            expectedArtifacts: ['docs/requirements.md'],
            estimatedComplexity: 'medium',
          },
          {
            id: 'TASK-2',
            title: 'PRD & Feature Specification',
            description: 'Define user stories, data models, and acceptance criteria.',
            agentRole: 'product-manager',
            dependencies: ['TASK-1'],
            inputArtifacts: ['docs/requirements.md'],
            expectedArtifacts: ['docs/prd.md'],
            estimatedComplexity: 'medium',
          },
          {
            id: 'TASK-3',
            title: 'Backend API & Database Schema',
            description: 'Implement core REST endpoints, database migrations, and business logic.',
            agentRole: 'backend-engineer',
            dependencies: ['TASK-2'],
            inputArtifacts: ['docs/prd.md'],
            expectedArtifacts: ['src/api/server.ts', 'src/db/schema.prisma'],
            estimatedComplexity: 'high',
          },
          {
            id: 'TASK-4',
            title: 'Frontend UI Dashboard',
            description: 'Implement web interface, views, and state management matching PRD specs.',
            agentRole: 'frontend-engineer',
            dependencies: ['TASK-2'],
            inputArtifacts: ['docs/prd.md'],
            expectedArtifacts: ['src/web/page.tsx'],
            estimatedComplexity: 'high',
          },
          {
            id: 'TASK-5',
            title: 'QA Automated Testing',
            description: 'Run integration tests and verify acceptance criteria across backend and frontend.',
            agentRole: 'qa-engineer',
            dependencies: ['TASK-3', 'TASK-4'],
            inputArtifacts: ['src/api/server.ts', 'src/web/page.tsx'],
            expectedArtifacts: ['tests/report.json'],
            estimatedComplexity: 'medium',
          },
          {
            id: 'TASK-6',
            title: 'Dockerization & Deployment Config',
            description: 'Build production Dockerfile, docker-compose.yml, and environment setup.',
            agentRole: 'devops',
            dependencies: ['TASK-5'],
            inputArtifacts: ['tests/report.json'],
            expectedArtifacts: ['Dockerfile', 'docker-compose.yml'],
            estimatedComplexity: 'low',
          },
        ],
      };
    }

    return {
      projectId,
      goal,
      departments: ['growth', 'sales'],
      createdAt: new Date().toISOString(),
      tasks: [
        {
          id: 'TASK-1',
          title: 'Market & Audience Research',
          description: `Analyze target ICP, market positioning, and competitors for: ${goal}`,
          agentRole: 'digital-marketer',
          dependencies: [],
          inputArtifacts: [],
          expectedArtifacts: ['docs/market_research.md'],
          estimatedComplexity: 'medium',
        },
        {
          id: 'TASK-2',
          title: 'Content & Copywriting Campaign',
          description: 'Draft landing page copy, value proposition, and distribution copy.',
          agentRole: 'content-creator',
          dependencies: ['TASK-1'],
          inputArtifacts: ['docs/market_research.md'],
          expectedArtifacts: ['docs/campaign_copy.md'],
          estimatedComplexity: 'medium',
        },
      ],
    };
  }
}

export const goalPlanner = new GoalPlanner();

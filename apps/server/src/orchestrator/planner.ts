import { modelRouter } from '../models/router.js';
import type { DAGTask, ExecutionPlan } from './types.js';
import type { AgentRole } from '@virtual-office/shared';

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
    },
    {
      "id": "TASK-2",
      "title": "Brief title",
      "description": "Detailed instructions",
      "agentRole": "backend-engineer",
      "dependencies": ["TASK-1"],
      "inputArtifacts": ["docs/prd.md"],
      "expectedArtifacts": ["src/api/index.ts"],
      "estimatedComplexity": "high"
    }
  ]
}`;

export class GoalPlanner {
  async plan(projectId: string, goal: string): Promise<ExecutionPlan> {
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

      // Normalize agent roles: LLM sometimes returns department names instead of specific roles
      const tasks = (parsed.tasks ?? []).map((t: any) => ({
        ...t,
        agentRole: normalizeRole(t.agentRole),
      }));

      return {
        projectId,
        goal,
        departments: parsed.departments ?? ['product', 'engineering'],
        tasks,
        createdAt: new Date().toISOString(),
      };
    } catch (err) {
      console.warn('[GoalPlanner] LLM generation failed, generating fallback plan:', err instanceof Error ? err.message : err);
      return this.generateFallbackPlan(projectId, goal);
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

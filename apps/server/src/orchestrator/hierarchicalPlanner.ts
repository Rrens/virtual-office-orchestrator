import { modelRouter } from '../models/router.js';
import type { AgentRole } from '@virtual-office/shared';
import type { DAGTask, DepartmentMilestone, ExecutionPlan } from './types.js';

export interface DepartmentLeadConfig {
  department: string;
  leadRole: AgentRole;
  leadName: string;
  subOrchestratorTitle: string;
  members: AgentRole[];
}

export const DEPT_CODES: Record<string, string> = {
  product: 'PRD',
  design: 'DES',
  engineering: 'ENG',
  growth: 'GRO',
  sales: 'SLS',
  customer: 'CS',
  data: 'DAT',
  operations: 'OPS',
  executive: 'EXEC',
};

export const DEPARTMENT_LEADS: Record<string, DepartmentLeadConfig> = {
  executive: {
    department: 'executive',
    leadRole: 'orchestrator',
    leadName: 'Rendy',
    subOrchestratorTitle: 'Chief Executive Orchestrator',
    members: ['orchestrator', 'business-strategist'],
  },
  product: {
    department: 'product',
    leadRole: 'product-manager',
    leadName: 'Andi',
    subOrchestratorTitle: 'Product Sub-Orchestrator',
    members: ['product-manager', 'business-analyst', 'ux-researcher', 'product-analyst'],
  },
  design: {
    department: 'design',
    leadRole: 'design-system-designer',
    leadName: 'Rina',
    subOrchestratorTitle: 'Design Sub-Orchestrator',
    members: ['design-system-designer', 'ui-ux-designer', 'brand-designer'],
  },
  engineering: {
    department: 'engineering',
    leadRole: 'backend-engineer',
    leadName: 'Zaki',
    subOrchestratorTitle: 'Engineering Sub-Orchestrator (Tech Lead)',
    members: [
      'backend-engineer', 'frontend-engineer', 'mobile-engineer',
      'qa-engineer', 'devops', 'security-engineer', 'penetration-tester',
      'performance-engineer', 'ai-engineer',
    ],
  },
  growth: {
    department: 'growth',
    leadRole: 'digital-marketer',
    leadName: 'Dian',
    subOrchestratorTitle: 'Growth & Marketing Sub-Orchestrator',
    members: ['digital-marketer', 'seo-specialist', 'content-creator', 'growth-analyst'],
  },
  sales: {
    department: 'sales',
    leadRole: 'sales-representative',
    leadName: 'Hendra',
    subOrchestratorTitle: 'Sales Sub-Orchestrator',
    members: ['sales-representative', 'sales-researcher', 'account-manager'],
  },
  customer: {
    department: 'customer',
    leadRole: 'customer-success',
    leadName: 'Bayu',
    subOrchestratorTitle: 'Customer Success Sub-Orchestrator',
    members: ['customer-success', 'customer-service'],
  },
  data: {
    department: 'data',
    leadRole: 'data-engineer',
    leadName: 'Eko',
    subOrchestratorTitle: 'Data & Analytics Sub-Orchestrator',
    members: ['data-engineer', 'data-analyst'],
  },
  operations: {
    department: 'operations',
    leadRole: 'operations-manager',
    leadName: 'Pak Bowo',
    subOrchestratorTitle: 'Operations Sub-Orchestrator',
    members: ['operations-manager'],
  },
};

export class HierarchicalPlanner {
  /**
   * Plans the project hierarchically:
   * Level 1: Chief Orchestrator decomposes goal into Department Milestones
   * Level 2: Each department Sub-Orchestrator decomposes their milestone into granular tasks
   */
  async plan(projectId: string, goal: string): Promise<ExecutionPlan> {
    try {
      // Level 1: Chief Orchestrator determines milestones
      const milestones = await this.planLevel1Milestones(goal);
      
      // Level 2: Sub-Orchestrators decompose their respective milestones
      const tasks: DAGTask[] = [];
      const departments = Array.from(new Set(milestones.map((m) => m.department)));

      for (const milestone of milestones) {
        const subTasks = await this.planLevel2SubTasks(milestone, goal, tasks);
        tasks.push(...subTasks);
      }

      // Ensure valid dependencies and order
      this.linkCrossDepartmentDependencies(tasks, milestones);

      return {
        projectId,
        goal,
        departments,
        milestones,
        tasks,
        createdAt: new Date().toISOString(),
      };
    } catch (err) {
      console.warn('[HierarchicalPlanner] Planning failed, using fallback:', err);
      return this.generateFallbackHierarchicalPlan(projectId, goal);
    }
  }

  /**
   * Level 1: Chief Orchestrator decomposes company goal into Department Milestones
   */
  private async planLevel1Milestones(goal: string): Promise<DepartmentMilestone[]> {
    const isMarketingOnly = /marketing|campaign|social media|branding|launch event/i.test(goal) &&
      !/app|code|software|api|saas|web|database|dashboard|backend/i.test(goal);

    if (isMarketingOnly) {
      return [
        {
          id: 'MILESTONE-GROWTH',
          department: 'growth',
          leadRole: 'digital-marketer',
          leadName: 'Dian',
          directive: `Develop comprehensive marketing and audience growth strategy for: ${goal}`,
          dependencies: [],
          taskCount: 3,
        },
      ];
    }

    const hasDesign = /design|ui|ux|mobile|web|frontend|landing|saas/i.test(goal);
    const hasGrowth = /launch|marketing|growth|sell|users|go-to-market/i.test(goal);

    const milestones: DepartmentMilestone[] = [
      {
        id: 'MILESTONE-PRODUCT',
        department: 'product',
        leadRole: 'product-manager',
        leadName: 'Andi',
        directive: `Establish product vision, requirements, user journeys, and acceptance criteria for: ${goal}`,
        dependencies: [],
        taskCount: 2,
      },
    ];

    if (hasDesign) {
      milestones.push({
        id: 'MILESTONE-DESIGN',
        department: 'design',
        leadRole: 'design-system-designer',
        leadName: 'Rina',
        directive: `Design cohesive design system, component guidelines, and UI specs.`,
        dependencies: ['MILESTONE-PRODUCT'],
        taskCount: 1,
      });
    }

    milestones.push({
      id: 'MILESTONE-ENGINEERING',
      department: 'engineering',
      leadRole: 'backend-engineer',
      leadName: 'Zaki',
      directive: `Build scalable backend APIs, database schema, responsive frontend UI, automated QA tests, and deployment config.`,
      dependencies: hasDesign ? ['MILESTONE-PRODUCT', 'MILESTONE-DESIGN'] : ['MILESTONE-PRODUCT'],
      taskCount: 4,
    });

    if (hasGrowth) {
      milestones.push({
        id: 'MILESTONE-GROWTH',
        department: 'growth',
        leadRole: 'digital-marketer',
        leadName: 'Dian',
        directive: `Drive go-to-market strategy, launch copy, and acquisition channels.`,
        dependencies: ['MILESTONE-PRODUCT'],
        taskCount: 2,
      });
    }

    return milestones;
  }

  /**
   * Level 2: Sub-Orchestrator generates micro-tasks for their department
   */
  private async planLevel2SubTasks(
    milestone: DepartmentMilestone,
    goal: string,
    existingTasks: DAGTask[]
  ): Promise<DAGTask[]> {
    const lead = DEPARTMENT_LEADS[milestone.department] || DEPARTMENT_LEADS.engineering;
    const prompt = `You are ${lead.leadName}, the ${lead.subOrchestratorTitle} leading the ${milestone.department} team.
Your department directive from the Chief Orchestrator:
"${milestone.directive}"

Project Overall Goal:
"${goal}"

Decompose this directive into 1 to 4 concrete, actionable tasks for your team members.
Available team member roles: ${lead.members.join(', ')}

Output strict JSON:
{
  "tasks": [
    {
      "id": "TASK-1",
      "title": "Clear Actionable Task Title",
      "description": "Comprehensive task description",
      "agentRole": "agent-role",
      "inputArtifacts": [],
      "expectedArtifacts": ["docs/spec.md"],
      "estimatedComplexity": "low" | "medium" | "high"
    }
  ]
}`;

    try {
      const response = await modelRouter.routeByTier('tier1_ollama', {
        maxTokens: 1024,
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.2,
        agentRole: lead.leadRole,
      });

      const cleanJson = response.content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
        const deptCode = DEPT_CODES[milestone.department] || milestone.department.slice(0, 3).toUpperCase();

        // Build mapping from LLM local task ID to unique department-scoped task ID
        const idMap = new Map<string, string>();
        parsed.tasks.forEach((t: any, idx: number) => {
          const uniqueId = `TASK-${deptCode}-${idx + 1}`;
          if (t.id) idMap.set(String(t.id).trim(), uniqueId);
          idMap.set(String(idx + 1), uniqueId);
          idMap.set(`TASK-${idx + 1}`, uniqueId);
        });

        return parsed.tasks.map((t: any, idx: number) => {
          const rawTitle = typeof t.title === 'string' ? t.title.trim() : '';
          const rawDesc = typeof t.description === 'string' ? t.description.trim() : '';
          const fallbackTitle = this.generateTaskTitle(milestone.department, idx, t.agentRole);
          const title = this.sanitizeTaskField(rawTitle) || fallbackTitle;
          const description = this.sanitizeTaskField(rawDesc) || title;
          const uniqueId = `TASK-${deptCode}-${idx + 1}`;

          // Remap internal dependencies
          const mappedDeps = Array.isArray(t.dependencies)
            ? Array.from(
                new Set(
                  t.dependencies
                    .map((d: any) => idMap.get(String(d).trim()))
                    .filter((d: any): d is string => typeof d === 'string' && d !== uniqueId)
                )
              )
            : [];

          const cleanArtifacts = Array.isArray(t.expectedArtifacts)
            ? t.expectedArtifacts
                .filter((a: any) => typeof a === 'string')
                .map((a: string) => a.trim())
                .filter((a: string) => a && a !== '...' && a !== '..' && a !== '.' && a.length > 2)
            : [];
          const expectedArtifacts = cleanArtifacts.length > 0
            ? cleanArtifacts
            : [`docs/${milestone.department}/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`];

          return {
            id: uniqueId,
            title,
            description,
            agentRole: lead.members.includes(t.agentRole) ? t.agentRole : lead.leadRole,
            dependencies: mappedDeps,
            inputArtifacts: Array.isArray(t.inputArtifacts) ? t.inputArtifacts : [],
            expectedArtifacts,
            estimatedComplexity: ['low', 'medium', 'high'].includes(t.estimatedComplexity) ? t.estimatedComplexity : 'medium',
            department: milestone.department,
            subOrchestratorRole: lead.leadRole,
            subOrchestratorName: lead.leadName,
            milestoneId: milestone.id,
            milestoneTitle: milestone.directive,
          };
        });
      }
    } catch {
      // Fall through to deterministic department generator
    }

    return this.generateDepartmentFallbackTasks(milestone, goal);
  }

  private sanitizeTaskField(val?: string): string | null {
    if (!val) return null;
    const trimmed = val.trim();
    if (trimmed === '...' || trimmed === '..' || trimmed === '.' || trimmed.length < 3) {
      return null;
    }
    return trimmed;
  }

  private generateTaskTitle(dept: string, index: number, role?: string): string {
    const roleClean = role ? role.replace(/-/g, ' ') : 'team';
    const deptTitles: Record<string, string[]> = {
      product: ['Analisis Kebutuhan & User Journey', 'Penyusunan Dokumen PRD & Fitur', 'Spesifikasi Acceptance Criteria', 'Validasi Ruang Lingkup Produk'],
      design: ['Riset UX & Wireframing UI', 'Design System & Component Library', 'Desain Prototipe Interaktif', 'Design Review & Export Asset'],
      engineering: ['Arsitektur Backend & Database Schema', 'Implementasi API & Business Logic', 'Frontend UI & Integrasi State', 'Deployment & CI/CD Pipeline'],
      growth: ['Riset Target Market & Audiens', 'Copywriting & Content Strategy', 'Setup Campaign & Funnel Analitik', 'Peluncuran Media Sosial & PR'],
      sales: ['Identifikasi Lead & ICP Pipeline', 'Penyusunan Pitch Deck & Demo Script', 'Proses Outreach & Kualifikasi', 'Review Closing & Sales Playbook'],
      customer: ['Penyusunan FAQ & Dokumentasi Bantuan', 'Setup Helpdesk & Escalation Path', 'SOP Troubleshooting & Onboarding', 'Customer Feedback Loop Setup'],
      data: ['Desain Data Pipeline & Model Schema', 'ETL Analytics & Event Tracking', 'Dashboard Reporting & Insight KPI', 'Optimasi Query & Model Inference'],
      operations: ['Audit Keamanan & Risk Assessment', 'Konfigurasi Monitoring & SLA', 'Dokumentasi SOP Operasional', 'Final Sign-off & Runbook'],
    };

    const list = deptTitles[dept] || ['Implementasi Fitur & Modul', 'Pengujian & Integrasi', 'Dokumentasi & Review'];
    return list[index % list.length] || `Pengerjaan Tugas ${roleClean}`;
  }

  /**
   * Deterministic fallback tasks per department
   */
  private generateDepartmentFallbackTasks(milestone: DepartmentMilestone, goal: string): DAGTask[] {
    const lead = DEPARTMENT_LEADS[milestone.department] || DEPARTMENT_LEADS.engineering;

    switch (milestone.department) {
      case 'product':
        return [
          {
            id: 'TASK-PRD-1',
            title: 'Scope & User Journey Definition',
            description: `Analyze requirements and core user journeys for: ${goal}`,
            agentRole: 'business-analyst',
            dependencies: [],
            inputArtifacts: [],
            expectedArtifacts: ['docs/requirements.md'],
            estimatedComplexity: 'medium',
            department: 'product',
            subOrchestratorRole: lead.leadRole,
            subOrchestratorName: lead.leadName,
            milestoneId: milestone.id,
            milestoneTitle: milestone.directive,
          },
          {
            id: 'TASK-PRD-2',
            title: 'PRD & Feature Specification',
            description: `Draft comprehensive Product Requirements Document (PRD) with feature breakdown and API requirements.`,
            agentRole: 'product-manager',
            dependencies: ['TASK-PRD-1'],
            inputArtifacts: ['docs/requirements.md'],
            expectedArtifacts: ['docs/prd.md'],
            estimatedComplexity: 'medium',
            department: 'product',
            subOrchestratorRole: lead.leadRole,
            subOrchestratorName: lead.leadName,
            milestoneId: milestone.id,
            milestoneTitle: milestone.directive,
          },
        ];

      case 'design':
        return [
          {
            id: 'TASK-DES-1',
            title: 'Design System & UI Components Specification',
            description: `Design UI tokens, color palette, typography, and component specifications aligned with PRD requirements.`,
            agentRole: 'design-system-designer',
            dependencies: [],
            inputArtifacts: ['docs/prd.md'],
            expectedArtifacts: ['docs/design-system.md'],
            estimatedComplexity: 'medium',
            department: 'design',
            subOrchestratorRole: lead.leadRole,
            subOrchestratorName: lead.leadName,
            milestoneId: milestone.id,
            milestoneTitle: milestone.directive,
          },
        ];

      case 'engineering':
        return [
          {
            id: 'TASK-ENG-1',
            title: 'Database Schema & Backend REST APIs',
            description: `Implement database models, migration scripts, and REST API handlers for core domain logic.`,
            agentRole: 'backend-engineer',
            dependencies: [],
            inputArtifacts: ['docs/prd.md', 'docs/design-system.md'],
            expectedArtifacts: ['src/api/server.ts', 'src/db/schema.prisma'],
            estimatedComplexity: 'high',
            department: 'engineering',
            subOrchestratorRole: lead.leadRole,
            subOrchestratorName: lead.leadName,
            milestoneId: milestone.id,
            milestoneTitle: milestone.directive,
          },
          {
            id: 'TASK-ENG-2',
            title: 'Frontend UI Client & State Management',
            description: `Implement responsive web views, API client hooks, and state management.`,
            agentRole: 'frontend-engineer',
            dependencies: [],
            inputArtifacts: ['docs/prd.md', 'docs/design-system.md'],
            expectedArtifacts: ['src/web/page.tsx', 'src/web/components/App.tsx'],
            estimatedComplexity: 'high',
            department: 'engineering',
            subOrchestratorRole: lead.leadRole,
            subOrchestratorName: lead.leadName,
            milestoneId: milestone.id,
            milestoneTitle: milestone.directive,
          },
          {
            id: 'TASK-ENG-3',
            title: 'Automated QA Test Suite & Verification',
            description: `Write and run automated unit & integration test suites verifying all acceptance criteria.`,
            agentRole: 'qa-engineer',
            dependencies: ['TASK-ENG-1', 'TASK-ENG-2'],
            inputArtifacts: ['src/api/server.ts', 'src/web/page.tsx'],
            expectedArtifacts: ['tests/api.spec.ts', 'tests/report.json'],
            estimatedComplexity: 'medium',
            department: 'engineering',
            subOrchestratorRole: lead.leadRole,
            subOrchestratorName: lead.leadName,
            milestoneId: milestone.id,
            milestoneTitle: milestone.directive,
          },
          {
            id: 'TASK-ENG-4',
            title: 'Dockerization & Deployment Config',
            description: `Create production Dockerfile, docker-compose.yml, and environment configuration.`,
            agentRole: 'devops',
            dependencies: ['TASK-ENG-3'],
            inputArtifacts: ['src/api/server.ts', 'tests/report.json'],
            expectedArtifacts: ['Dockerfile', 'docker-compose.yml'],
            estimatedComplexity: 'low',
            department: 'engineering',
            subOrchestratorRole: lead.leadRole,
            subOrchestratorName: lead.leadName,
            milestoneId: milestone.id,
            milestoneTitle: milestone.directive,
          },
        ];

      case 'growth':
        return [
          {
            id: 'TASK-GRO-1',
            title: 'Audience & Go-to-Market Strategy',
            description: `Develop launch roadmap, target persona profiles, and SEO keywords for: ${goal}`,
            agentRole: 'digital-marketer',
            dependencies: [],
            inputArtifacts: ['docs/prd.md'],
            expectedArtifacts: ['docs/gtm-strategy.md'],
            estimatedComplexity: 'medium',
            department: 'growth',
            subOrchestratorRole: lead.leadRole,
            subOrchestratorName: lead.leadName,
            milestoneId: milestone.id,
            milestoneTitle: milestone.directive,
          },
          {
            id: 'TASK-GRO-2',
            title: 'Marketing Copy & Launch Assets',
            description: `Draft landing page copy, value propositions, and email announcement templates.`,
            agentRole: 'content-creator',
            dependencies: ['TASK-GRO-1'],
            inputArtifacts: ['docs/gtm-strategy.md'],
            expectedArtifacts: ['docs/launch-copy.md'],
            estimatedComplexity: 'medium',
            department: 'growth',
            subOrchestratorRole: lead.leadRole,
            subOrchestratorName: lead.leadName,
            milestoneId: milestone.id,
            milestoneTitle: milestone.directive,
          },
        ];

      default:
        return [
          {
            id: `TASK-${milestone.department.toUpperCase()}-1`,
            title: `${milestone.department.toUpperCase()} Execution`,
            description: milestone.directive,
            agentRole: lead.leadRole,
            dependencies: [],
            inputArtifacts: [],
            expectedArtifacts: [`docs/${milestone.department}-plan.md`],
            estimatedComplexity: 'medium',
            department: milestone.department,
            subOrchestratorRole: lead.leadRole,
            subOrchestratorName: lead.leadName,
            milestoneId: milestone.id,
            milestoneTitle: milestone.directive,
          },
        ];
    }
  }

  /**
   * Cross-links dependencies between departments based on milestone dependencies
   */
  private linkCrossDepartmentDependencies(tasks: DAGTask[], milestones: DepartmentMilestone[]): void {
    const taskMap = new Map<string, DAGTask>();
    tasks.forEach((t) => taskMap.set(t.id, t));

    // Find the primary deliverable task for each department
    const departmentOutputTasks: Record<string, string[]> = {};
    for (const task of tasks) {
      if (!task.department) continue;
      if (!departmentOutputTasks[task.department]) {
        departmentOutputTasks[task.department] = [];
      }
      departmentOutputTasks[task.department].push(task.id);
    }

    for (const milestone of milestones) {
      if (!milestone.dependencies || milestone.dependencies.length === 0) continue;

      // Tasks in this milestone that have no internal dependencies should depend on preceding milestone outputs
      const milestoneTasks = tasks.filter((t) => t.milestoneId === milestone.id);
      const rootTasks = milestoneTasks.filter((t) => t.dependencies.length === 0);

      for (const depMilestoneId of milestone.dependencies) {
        const depMilestone = milestones.find((m) => m.id === depMilestoneId);
        if (!depMilestone) continue;

        const parentTasks = departmentOutputTasks[depMilestone.department] || [];
        // Typically depends on the last task of the previous department
        const lastParentTaskId = parentTasks[parentTasks.length - 1];

        if (lastParentTaskId) {
          for (const rootTask of rootTasks) {
            if (!rootTask.dependencies.includes(lastParentTaskId)) {
              rootTask.dependencies.push(lastParentTaskId);
            }
          }
        }
      }
    }
  }

  /**
   * Full fallback plan when everything else fails
   */
  generateFallbackHierarchicalPlan(projectId: string, goal: string): ExecutionPlan {
    const milestones: DepartmentMilestone[] = [
      {
        id: 'MILESTONE-PRODUCT',
        department: 'product',
        leadRole: 'product-manager',
        leadName: 'Andi',
        directive: `Define product requirements for: ${goal}`,
        dependencies: [],
        taskCount: 2,
      },
      {
        id: 'MILESTONE-DESIGN',
        department: 'design',
        leadRole: 'design-system-designer',
        leadName: 'Rina',
        directive: `Design UI components and design system`,
        dependencies: ['MILESTONE-PRODUCT'],
        taskCount: 1,
      },
      {
        id: 'MILESTONE-ENGINEERING',
        department: 'engineering',
        leadRole: 'backend-engineer',
        leadName: 'Zaki',
        directive: `Build backend APIs, web dashboard, and QA tests`,
        dependencies: ['MILESTONE-PRODUCT', 'MILESTONE-DESIGN'],
        taskCount: 4,
      },
    ];

    const tasks: DAGTask[] = [];
    for (const m of milestones) {
      tasks.push(...this.generateDepartmentFallbackTasks(m, goal));
    }

    this.linkCrossDepartmentDependencies(tasks, milestones);

    return {
      projectId,
      goal,
      departments: milestones.map((m) => m.department),
      milestones,
      tasks,
      createdAt: new Date().toISOString(),
    };
  }
}

export const hierarchicalPlanner = new HierarchicalPlanner();

import { prisma } from '../db.js';

const MODEL_COSTS_PER_1K: Record<string, { prompt: number; completion: number }> = {
  'qwen2.5-coder:7b': { prompt: 0, completion: 0 },
  'llama3.1:8b': { prompt: 0, completion: 0 },
  'qwen/qwen-2.5-coder-32b-instruct': { prompt: 0.0001, completion: 0.0002 },
  'meta-llama/llama-3.1-70b-instruct': { prompt: 0.0003, completion: 0.0004 },
  'gpt-4o-mini': { prompt: 0.00015, completion: 0.0006 },
  'gpt-4o': { prompt: 0.0025, completion: 0.01 },
  tier1_ollama: { prompt: 0, completion: 0 },
  tier2_9router: { prompt: 0.0002, completion: 0.0004 },
  tier3_cloud: { prompt: 0.0025, completion: 0.01 },
};

const DAILY_TOKEN_LIMIT = 500_000;
const DEFAULT_TASK_BUDGET_TOKENS = 50_000;
const DEFAULT_AGENT_BUDGET_TOKENS = 200_000;

export class BudgetTracker {
  async recordUsage(
    projectId: string,
    model: string,
    promptTokens: number,
    completionTokens: number,
    taskId?: string,
    agentInstanceId?: string
  ): Promise<number> {
    const rates = MODEL_COSTS_PER_1K[model] ?? { prompt: 0.0001, completion: 0.0002 };
    const cost = (promptTokens / 1000) * rates.prompt + (completionTokens / 1000) * rates.completion;
    const totalTokens = promptTokens + completionTokens;

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { usedTokens: { increment: totalTokens } },
    });

    // Project budget cap
    if (project.budgetTokens && project.usedTokens >= project.budgetTokens) {
      await prisma.project.update({ where: { id: projectId }, data: { status: 'paused' } });
    }

    // Daily budget cap
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyRuns = await prisma.agentRun.aggregate({
      where: { task: { workflowExecution: { projectId } }, createdAt: { gte: today } },
      _sum: { promptTokens: true, completionTokens: true },
    });
    const dailyTokens = (dailyRuns._sum.promptTokens ?? 0) + (dailyRuns._sum.completionTokens ?? 0);
    if (dailyTokens >= DAILY_TOKEN_LIMIT) {
      await prisma.project.update({ where: { id: projectId }, data: { status: 'paused' } });
    }

    // Per-task budget cap (PRD §35)
    if (taskId) {
      const taskBudget = project.taskBudgetTokens ?? DEFAULT_TASK_BUDGET_TOKENS;
      const taskRuns = await prisma.agentRun.aggregate({
        where: { taskId },
        _sum: { promptTokens: true, completionTokens: true },
      });
      const taskTokens = (taskRuns._sum.promptTokens ?? 0) + (taskRuns._sum.completionTokens ?? 0);
      if (taskTokens >= taskBudget) {
        await prisma.task.updateMany({
          where: { id: taskId, status: { notIn: ['COMPLETED', 'APPROVED', 'CANCELLED', 'FAILED'] } },
          data: { status: 'BLOCKED' },
        });
        console.warn(`[BudgetTracker] Task ${taskId} exceeded per-task budget of ${taskBudget} tokens. Blocked.`);
      }
    }

    // Per-agent budget cap (PRD §35)
    if (agentInstanceId) {
      const agentBudget = project.agentBudgetTokens ?? DEFAULT_AGENT_BUDGET_TOKENS;
      const agentRuns = await prisma.agentRun.aggregate({
        where: { agentInstanceId },
        _sum: { promptTokens: true, completionTokens: true },
      });
      const agentTokens = (agentRuns._sum.promptTokens ?? 0) + (agentRuns._sum.completionTokens ?? 0);
      if (agentTokens >= agentBudget) {
        await prisma.agentInstance.update({
          where: { id: agentInstanceId },
          data: { status: 'idle' },
        });
        console.warn(`[BudgetTracker] Agent ${agentInstanceId} exceeded per-agent budget of ${agentBudget} tokens. Reset to idle.`);
      }
    }

    return cost;
  }

  async getProjectCostSummary(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { usedTokens: true, budgetTokens: true, taskBudgetTokens: true, agentBudgetTokens: true, status: true },
    });

    const agentRuns = await prisma.agentRun.findMany({
      where: { task: { workflowExecution: { projectId } } },
      select: { modelUsed: true, promptTokens: true, completionTokens: true, costEstimated: true },
    });

    const totalCost = agentRuns.reduce((sum, r) => sum + r.costEstimated, 0);

    return {
      usedTokens: project?.usedTokens ?? 0,
      budgetTokens: project?.budgetTokens ?? null,
      taskBudgetTokens: project?.taskBudgetTokens ?? DEFAULT_TASK_BUDGET_TOKENS,
      agentBudgetTokens: project?.agentBudgetTokens ?? DEFAULT_AGENT_BUDGET_TOKENS,
      dailyTokenLimit: DAILY_TOKEN_LIMIT,
      totalCostEstimatedUsd: Number(totalCost.toFixed(4)),
      isBudgetExceeded: Boolean(project?.budgetTokens && project.usedTokens >= project.budgetTokens),
      projectStatus: project?.status,
    };
  }
}

export const budgetTracker = new BudgetTracker();


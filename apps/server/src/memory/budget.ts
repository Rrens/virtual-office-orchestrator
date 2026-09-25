import { prisma } from '../db.js';

const MODEL_COSTS_PER_1K: Record<string, { prompt: number; completion: number }> = {
  'qwen2.5-coder:7b': { prompt: 0, completion: 0 },
  'llama3.1:8b': { prompt: 0, completion: 0 },
  'qwen/qwen-2.5-coder-32b-instruct': { prompt: 0.0001, completion: 0.0002 },
  'meta-llama/llama-3.1-70b-instruct': { prompt: 0.0003, completion: 0.0004 },
  'gpt-4o-mini': { prompt: 0.00015, completion: 0.0006 },
  'gpt-4o': { prompt: 0.0025, completion: 0.01 },
};

export class BudgetTracker {
  async recordUsage(
    projectId: string,
    model: string,
    promptTokens: number,
    completionTokens: number
  ): Promise<number> {
    const rates = MODEL_COSTS_PER_1K[model] ?? { prompt: 0.0001, completion: 0.0002 };
    const cost =
      (promptTokens / 1000) * rates.prompt + (completionTokens / 1000) * rates.completion;

    const totalTokens = promptTokens + completionTokens;

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        usedTokens: { increment: totalTokens },
      },
    });

    if (project.budgetTokens && project.usedTokens >= project.budgetTokens) {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'paused' },
      });
    }

    return cost;
  }

  async getProjectCostSummary(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { usedTokens: true, budgetTokens: true, status: true },
    });

    const agentRuns = await prisma.agentRun.findMany({
      where: { task: { workflowExecution: { projectId } } },
      select: { modelUsed: true, promptTokens: true, completionTokens: true, costEstimated: true },
    });

    const totalCost = agentRuns.reduce((sum, r) => sum + r.costEstimated, 0);

    return {
      usedTokens: project?.usedTokens ?? 0,
      budgetTokens: project?.budgetTokens ?? null,
      totalCostEstimatedUsd: Number(totalCost.toFixed(4)),
      isBudgetExceeded: Boolean(
        project?.budgetTokens && project.usedTokens >= project.budgetTokens
      ),
      projectStatus: project?.status,
    };
  }
}

export const budgetTracker = new BudgetTracker();

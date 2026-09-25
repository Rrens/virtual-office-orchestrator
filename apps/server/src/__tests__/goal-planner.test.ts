import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoalPlanner } from '../orchestrator/planner.js';

vi.mock('../models/router.js', () => ({
  modelRouter: {
    routeByTier: vi.fn(),
    selectTier: vi.fn().mockReturnValue('tier1_ollama'),
  },
}));

import { modelRouter } from '../models/router.js';

describe('GoalPlanner', () => {
  let planner: GoalPlanner;

  beforeEach(() => {
    planner = new GoalPlanner();
    vi.clearAllMocks();
  });

  it('returns fallback software plan when LLM fails', async () => {
    vi.mocked(modelRouter.routeByTier).mockRejectedValue(new Error('LLM unavailable'));
    const plan = await planner.plan('proj-1', 'Build a SaaS web app');
    expect(plan.tasks.length).toBeGreaterThanOrEqual(4);
    expect(plan.tasks[0].agentRole).toBe('business-analyst');
    expect(plan.departments).toContain('engineering');
  });

  it('returns fallback marketing plan for non-software goals', async () => {
    vi.mocked(modelRouter.routeByTier).mockRejectedValue(new Error('LLM unavailable'));
    const plan = await planner.plan('proj-2', 'Create a social media campaign');
    expect(plan.tasks[0].agentRole).toBe('digital-marketer');
    expect(plan.departments).toContain('growth');
  });

  it('parses valid LLM JSON response', async () => {
    const mockPlan = {
      departments: ['product', 'engineering'],
      tasks: [
        {
          id: 'TASK-1',
          title: 'Requirements',
          description: 'Gather requirements',
          agentRole: 'product-manager',
          dependencies: [],
          inputArtifacts: [],
          expectedArtifacts: ['docs/prd.md'],
          estimatedComplexity: 'medium',
        },
      ],
    };

    vi.mocked(modelRouter.routeByTier).mockResolvedValue({
      model: 'qwen2.5-coder:7b',
      tier: 'tier1_ollama',
      content: JSON.stringify(mockPlan),
      promptTokens: 100,
      completionTokens: 200,
      durationMs: 500,
    });

    const plan = await planner.plan('proj-3', 'Build API');
    expect(plan.tasks).toHaveLength(1);
    expect(plan.tasks[0].agentRole).toBe('product-manager');
  });

  it('returns fallback plan when LLM returns invalid JSON', async () => {
    vi.mocked(modelRouter.routeByTier).mockResolvedValue({
      model: 'qwen2.5-coder:7b',
      tier: 'tier1_ollama',
      content: 'not valid json {{{',
      promptTokens: 50,
      completionTokens: 10,
      durationMs: 100,
    });

    const plan = await planner.plan('proj-4', 'Build a SaaS POS');
    expect(plan.tasks.length).toBeGreaterThan(0);
  });
});

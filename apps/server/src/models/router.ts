import { OllamaProvider } from './ollama.provider.js';
import { NineRouterProvider } from './ninerouter.provider.js';
import { CloudFallbackProvider } from './cloud.provider.js';
import type { ModelProvider, ModelRequest, ModelResponse } from './types.js';

type Complexity = 'low' | 'medium' | 'high';

const COMPLEXITY_TIER: Record<Complexity, string> = {
  low: 'tier1_ollama',
  medium: 'tier2_9router',
  high: 'tier3_cloud',
};

// Roles requiring strong reasoning, code correctness, or architectural planning
const TECHNICAL_ROLES = new Set([
  'orchestrator',
  'business-strategist',
  'backend-engineer',
  'frontend-engineer',
  'mobile-engineer',
  'devops',
  'qa-engineer',
  'security-engineer',
  'penetration-tester',
  'performance-engineer',
  'ai-engineer',
  'data-engineer',
  'ui-ux-designer',
  'design-system-designer',
]);

export class ModelRouter {
  private providers: Map<string, ModelProvider>;

  constructor() {
    this.providers = new Map();
    this.providers.set('tier1_ollama', new OllamaProvider());
    this.providers.set('tier2_9router', new NineRouterProvider());
    this.providers.set('tier3_cloud', new CloudFallbackProvider());
  }

  /**
   * Routing rules:
   * - Technical / planning / code / security roles  -> 9Router (tier2)
   * - Non-technical roles (marketing, sales, cs, operations, content, general analyst) -> Ollama (tier1)
   * - Cloud (tier3) is reserved for explicit high-stakes tasks when API keys are present
   */
  selectTier(agentRole: string, complexity: Complexity = 'medium'): string {
    const hasNineRouter = Boolean(process.env.NINEROUTER_API_KEY);
    const hasCloud = Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);

    if (complexity === 'high' && hasCloud) return 'tier3_cloud';

    if (TECHNICAL_ROLES.has(agentRole)) {
      if (hasNineRouter) return 'tier2_9router';
      if (hasCloud) return 'tier3_cloud';
      return 'tier1_ollama';
    }

    // Default: prefer Ollama locally for non-technical roles
    return 'tier1_ollama';
  }

  async routeByComplexity(
    agentRole: string,
    complexity: Complexity,
    request: ModelRequest
  ): Promise<ModelResponse> {
    const tier = this.selectTier(agentRole, complexity);
    return this.routeByTier(tier, request);
  }

  async routeByTier(tier: string, request: ModelRequest): Promise<ModelResponse> {
    const provider = this.providers.get(tier);
    if (!provider) {
      throw new Error(`No provider found for tier ${tier}`);
    }

    const available = await provider.isAvailable();
    if (!available) {
      return this.fallback(request, tier);
    }

    try {
      return await provider.complete(request);
    } catch (err) {
      console.warn(`[ModelRouter] Provider ${provider.name} failed:`, err instanceof Error ? err.message : err);
      return this.fallback(request, tier);
    }
  }

  async route(request: ModelRequest): Promise<ModelResponse> {
    return this.routeByTier('tier1_ollama', request);
  }

  private async fallback(request: ModelRequest, failedTier: string): Promise<ModelResponse> {
    const fallbackOrder = ['tier1_ollama', 'tier2_9router', 'tier3_cloud'].filter(
      (t) => t !== failedTier
    );

    for (const tier of fallbackOrder) {
      try {
        return await this.routeByTier(tier, request);
      } catch (err) {
        console.warn(`[ModelRouter] Fallback to ${tier} failed:`, err instanceof Error ? err.message : err);
      }
    }

    throw new Error('All model providers unavailable');
  }
}

export const modelRouter = new ModelRouter();
export * from './types.js';

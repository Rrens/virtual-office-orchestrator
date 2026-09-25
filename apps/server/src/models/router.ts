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

const HIGH_RISK_ROLES = new Set([
  'security-engineer',
  'penetration-tester',
  'devops',
  'orchestrator',
  'business-strategist',
]);

export class ModelRouter {
  private providers: Map<string, ModelProvider>;

  constructor() {
    this.providers = new Map();
    this.providers.set('tier1_ollama', new OllamaProvider());
    this.providers.set('tier2_9router', new NineRouterProvider());
    this.providers.set('tier3_cloud', new CloudFallbackProvider());
  }

  selectTier(agentRole: string, complexity: Complexity = 'medium'): string {
    if (HIGH_RISK_ROLES.has(agentRole)) return 'tier3_cloud';
    return COMPLEXITY_TIER[complexity];
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

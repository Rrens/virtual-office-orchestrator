import type { ModelProvider, ModelRequest, ModelResponse } from './types.js';

export class OllamaProvider implements ModelProvider {
  tier = 'tier1_ollama' as const;
  name = 'Ollama (Proxmox)';
  private baseUrl: string;
  private defaultModel: string;
  private codeModel: string;

  constructor(
    baseUrl = process.env.OLLAMA_BASE_URL || 'http://192.168.0.2:11434',
    defaultModel = process.env.OLLAMA_MODEL_GENERAL || 'qwen3.5:4b',
    codeModel = process.env.OLLAMA_MODEL_CODE || 'qwen2.5-coder:3b'
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.defaultModel = defaultModel;
    this.codeModel = codeModel;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async complete(request: ModelRequest): Promise<ModelResponse> {
    const startTime = Date.now();
    const isPlanner = request.agentRole === 'orchestrator';
    const isCode =
      request.agentRole?.includes('engineer') ||
      request.agentRole?.includes('developer') ||
      request.agentRole?.includes('qa') ||
      request.agentRole?.includes('devops');

    const plannerModel = process.env.OLLAMA_MODEL_PLANNER || 'qwen2.5:0.5b';
    const model = isPlanner ? plannerModel : isCode ? this.codeModel : this.defaultModel;

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: request.messages,
        options: {
          temperature: request.temperature ?? 0.4,
          num_predict: request.maxTokens ?? 2048,
        },
        stream: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ollama error [${res.status}]: ${errText}`);
    }

    const data = (await res.json()) as any;
    const durationMs = Date.now() - startTime;

    return {
      content: data.message?.content ?? '',
      promptTokens: data.prompt_eval_count ?? 0,
      completionTokens: data.eval_count ?? 0,
      model,
      durationMs,
      tier: this.tier,
    };
  }
}

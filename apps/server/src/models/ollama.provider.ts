import type { ModelProvider, ModelRequest, ModelResponse } from './types.js';

export class OllamaProvider implements ModelProvider {
  tier = 'tier1_ollama' as const;
  name = 'Ollama (Local)';
  private baseUrl: string;
  private defaultModel: string;

  constructor(
    baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    defaultModel = process.env.OLLAMA_MODEL_GENERAL || 'llama3.1:8b'
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.defaultModel = defaultModel;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(2000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async complete(request: ModelRequest): Promise<ModelResponse> {
    const startTime = Date.now();
    const model = request.agentRole?.includes('engineer') || request.agentRole?.includes('developer')
      ? (process.env.OLLAMA_MODEL_CODE || 'qwen2.5-coder:7b')
      : this.defaultModel;

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: request.messages,
        options: {
          temperature: request.temperature ?? 0.7,
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

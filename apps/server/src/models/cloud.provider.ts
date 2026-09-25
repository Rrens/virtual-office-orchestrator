import type { ModelProvider, ModelRequest, ModelResponse } from './types.js';

export class CloudFallbackProvider implements ModelProvider {
  tier = 'tier3_cloud' as const;
  name = 'Cloud Fallback (OpenAI/Anthropic)';
  private apiKey: string;

  constructor(apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || '') {
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey);
  }

  async complete(request: ModelRequest): Promise<ModelResponse> {
    const startTime = Date.now();
    const model = 'gpt-4o-mini';

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4096,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Cloud fallback error [${res.status}]: ${errText}`);
    }

    const data = (await res.json()) as any;
    const durationMs = Date.now() - startTime;

    return {
      content: data.choices?.[0]?.message?.content ?? '',
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      model,
      durationMs,
      tier: this.tier,
    };
  }
}

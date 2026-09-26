import type { ModelProvider, ModelRequest, ModelResponse } from './types.js';

export class NineRouterProvider implements ModelProvider {
	tier = 'tier2_9router' as const;
	name = '9Router Combo API';
	private apiKey: string;
	private baseUrl: string;

	constructor(
		apiKey = process.env.NINEROUTER_API_KEY || '',
		baseUrl = process.env.NINEROUTER_BASE_URL || 'https://9router.rrens.my.id/v1',
	) {
		this.apiKey = apiKey;
		this.baseUrl = baseUrl.replace(/\/$/, '');
	}

	async isAvailable(): Promise<boolean> {
		return Boolean(this.apiKey);
	}

	async complete(request: ModelRequest): Promise<ModelResponse> {
		const startTime = Date.now();
		// User requirement:
		// 1. Code / engineer roles -> 9Router-3-Specialized-Code
		// 2. General / non-engineer roles -> 9Router-4-Lightweight-Response
		const model = request.agentRole?.includes('engineer') || request.agentRole?.includes('devops')
			? '9Router-3-Specialized-Code'
			: '9Router-4-Lightweight-Response';

		// Timeout controller (90 seconds) to allow comprehensive code generation
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 90000);

		try {
			const res = await fetch(`${this.baseUrl}/chat/completions`, {
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
					stream: false,
				}),
				signal: controller.signal,
			});

			if (!res.ok) {
				const errText = await res.text();
				throw new Error(`9Router error [${res.status}]: ${errText}`);
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
		} catch (err: any) {
			if (err.name === 'AbortError') {
				throw new Error(`9Router timed out after 90s for model ${model}`);
			}
			throw err;
		} finally {
			clearTimeout(timeoutId);
		}
	}
}

import type { ModelTier } from '@virtual-office/shared';

export interface ModelMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ModelRequest {
  messages: ModelMessage[];
  temperature?: number;
  maxTokens?: number;
  taskId?: string;
  agentRole?: string;
}

export interface ModelResponse {
  content: string;
  promptTokens: number;
  completionTokens: number;
  model: string;
  durationMs: number;
  tier: ModelTier;
}

export interface ModelProvider {
  tier: ModelTier;
  name: string;
  complete(request: ModelRequest): Promise<ModelResponse>;
  isAvailable(): Promise<boolean>;
}

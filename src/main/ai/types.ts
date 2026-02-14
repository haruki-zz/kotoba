import { RenderedPrompt } from '@shared/ai';
import { AiProviderName, AiScenario } from '@shared/types';

export type ProviderGenerateParams = {
  prompt: RenderedPrompt;
  scenario: AiScenario;
  payload: unknown;
  timeoutMs?: number;
};

export type ProviderResult = {
  content: string;
  finishReason?: string;
  raw?: unknown;
};

export interface AiProvider {
  name: AiProviderName;
  generate(params: ProviderGenerateParams): Promise<ProviderResult>;
}

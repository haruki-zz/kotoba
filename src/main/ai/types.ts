export type ProviderName = "openai" | "gemini" | "mock";

export interface WordCardContent {
  term: string;
  kana: string;
  definition_ja: string;
  scene_ja: string;
  example_ja: string;
}

export interface WordCardFields extends Omit<WordCardContent, "term"> {}

interface ProviderBaseOptions {
  timeoutMs?: number;
  fetch?: typeof fetch;
}

export interface OpenAiProviderOptions extends ProviderBaseOptions {
  apiKey: string;
  model?: string;
  maxTokens?: number;
}

export interface GeminiProviderOptions extends ProviderBaseOptions {
  apiKey: string;
  model?: string;
  maxOutputTokens?: number;
}

export interface AiProvider {
  name: ProviderName;
  generateWordCard: (term: string) => Promise<WordCardContent>;
}

export interface ProviderConfig extends ProviderBaseOptions {
  provider?: ProviderName;
  apiKey?: string;
}

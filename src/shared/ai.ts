export type ProviderName = "openai" | "gemini" | "mock";

export interface WordCardContent {
  term: string;
  kana: string;
  definition_ja: string;
  scene_ja: string;
  example_ja: string;
}

export interface ProviderSettings {
  provider?: ProviderName;
  apiKey?: string;
  timeoutMs?: number;
}

export interface ProviderState {
  provider: ProviderName;
  hasApiKey: boolean;
  timeoutMs?: number;
}

import { type AiProvider } from "@kotoba/shared";

import { type NormalizedAiRequest, type ProviderResult } from "../types.js";

export type ProviderGenerateOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

export interface AiProviderClient {
  readonly name: AiProvider;
  isEnabled(): boolean;
  generate(
    input: NormalizedAiRequest,
    options?: ProviderGenerateOptions,
  ): Promise<ProviderResult>;
}

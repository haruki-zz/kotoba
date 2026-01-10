import { createGeminiProvider } from "./gemini";
import { createMockProvider } from "./mock";
import { createOpenAiProvider } from "./openai";
import { AiProvider, ProviderConfig } from "./types";

export const buildAiProvider = (config: ProviderConfig = {}): AiProvider => {
  const provider = config.provider ?? "mock";

  if (provider === "openai") {
    if (!config.apiKey) {
      throw new Error("OpenAI API key 缺失");
    }

    return createOpenAiProvider({
      apiKey: config.apiKey,
      timeoutMs: config.timeoutMs,
      fetch: config.fetch,
    });
  }

  if (provider === "gemini") {
    if (!config.apiKey) {
      throw new Error("Gemini API key 缺失");
    }

    return createGeminiProvider({
      apiKey: config.apiKey,
      timeoutMs: config.timeoutMs,
      fetch: config.fetch,
    });
  }

  return createMockProvider();
};

export { createGeminiProvider } from "./gemini";
export { createMockProvider } from "./mock";
export { createOpenAiProvider } from "./openai";
export * from "./types";

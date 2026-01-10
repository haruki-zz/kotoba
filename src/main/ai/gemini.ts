import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import { buildWordCardPrompt } from "./prompt";
import { parseWordCardFields, runWithTimeout, normalizeTerm, DEFAULT_TIMEOUT_MS } from "./utils";
import { AiProvider, GeminiProviderOptions } from "./types";

const DEFAULT_MODEL = "gemini-2.0-flash-lite-preview-02-05";
const DEFAULT_MAX_OUTPUT_TOKENS = 320;

interface GeminiDependencies {
  model?: Pick<GenerativeModel, "generateContent">;
}

export const createGeminiProvider = (options: GeminiProviderOptions, deps?: GeminiDependencies): AiProvider => {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxOutputTokens = options.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;

  const model =
    deps?.model ??
    new GoogleGenerativeAI(options.apiKey).getGenerativeModel(
      {
        model: options.model ?? DEFAULT_MODEL,
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens,
        },
      },
      { timeout: timeoutMs },
    );

  return {
    name: "gemini",
    async generateWordCard(term: string) {
      const normalizedTerm = normalizeTerm(term);
      const prompt = buildWordCardPrompt(normalizedTerm);

      const result = await runWithTimeout(
        (signal) => model.generateContent(prompt, { signal }),
        timeoutMs,
        "Gemini 请求超时",
      );

      const text = await result.response.text();
      const fields = parseWordCardFields(text);
      return { term: normalizedTerm, ...fields };
    },
  };
};

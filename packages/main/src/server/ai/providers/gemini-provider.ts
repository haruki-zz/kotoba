import { GoogleGenAI } from "@google/genai";

import { buildGenerateWordPrompt } from "../prompt.js";
import { type NormalizedAiRequest } from "../types.js";
import { type AiProviderClient, type ProviderGenerateOptions } from "./base.js";

export type GeminiProviderConfig = {
  apiKey?: string;
  model: string;
};

export class GeminiProvider implements AiProviderClient {
  readonly name = "gemini";
  private readonly client: GoogleGenAI | null;
  private readonly model: string;

  constructor(config: GeminiProviderConfig) {
    this.model = config.model;
    this.client = config.apiKey
      ? new GoogleGenAI({ apiKey: config.apiKey })
      : null;
  }

  isEnabled(): boolean {
    return Boolean(this.client);
  }

  async generate(
    input: NormalizedAiRequest,
    _options?: ProviderGenerateOptions,
  ) {
    if (!this.client) {
      throw new Error("Gemini provider is not configured");
    }
    const prompt = buildGenerateWordPrompt(input);
    const rawResponse = await this.client.models.generateContent({
      model: this.model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const response = rawResponse as {
      response?: {
        text?: () => string | undefined;
        candidates?: Array<{ finishReason?: string }>;
      };
    };

    const text =
      typeof response.response?.text === "function"
        ? (response.response.text() ?? "")
        : "";
    const finishReason =
      response.response?.candidates?.[0]?.finishReason || undefined;

    return {
      responseText: text,
      finishReason,
      model: this.model,
    };
  }
}

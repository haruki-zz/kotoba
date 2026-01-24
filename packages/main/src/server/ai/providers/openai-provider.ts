import OpenAI from "openai";

import { buildGenerateWordPrompt } from "../prompt.js";
import { type NormalizedAiRequest } from "../types.js";
import { type AiProviderClient, type ProviderGenerateOptions } from "./base.js";

export type OpenAiProviderConfig = {
  apiKey?: string;
  model: string;
};

export class OpenAiProvider implements AiProviderClient {
  readonly name = "openai";
  private readonly client: OpenAI | null;
  private readonly model: string;

  constructor(config: OpenAiProviderConfig) {
    this.model = config.model;
    this.client = config.apiKey ? new OpenAI({ apiKey: config.apiKey }) : null;
  }

  isEnabled(): boolean {
    return Boolean(this.client);
  }

  async generate(
    input: NormalizedAiRequest,
    options?: ProviderGenerateOptions,
  ) {
    if (!this.client) {
      throw new Error("OpenAI provider is not configured");
    }

    const prompt = buildGenerateWordPrompt(input);
    const completion = await this.client.chat.completions.create(
      {
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are a Japanese vocabulary assistant. Return only valid JSON with keys reading, contextExpl, sceneDesc, example. Do not include explanations.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 320,
        response_format: { type: "json_object" },
      },
      {
        signal: options?.signal,
        timeout: options?.timeoutMs,
      },
    );

    const choice = completion.choices[0];
    const text = choice?.message?.content ?? "";

    return {
      responseText: text,
      finishReason: choice?.finish_reason || undefined,
      model: this.model,
    };
  }
}

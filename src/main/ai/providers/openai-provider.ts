import OpenAI from 'openai';

import { AiProvider, ProviderGenerateParams, ProviderResult } from '../types';

export class OpenAiProvider implements AiProvider {
  name = 'openai' as const;
  private client?: OpenAI;
  private apiKey?: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey ?? process.env.OPENAI_API_KEY;
    this.model = model ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  }

  async generate(params: ProviderGenerateParams): Promise<ProviderResult> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is missing');
    }

    if (!this.client) {
      this.client = new OpenAI({ apiKey: this.apiKey });
    }

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: params.prompt.system },
        { role: 'user', content: params.prompt.user },
      ],
      temperature: params.prompt.temperature,
      max_tokens: params.prompt.maxOutputTokens,
    });

    const choice = response.choices[0];
    const content = choice?.message?.content ?? '';
    return { content, raw: response, finishReason: choice?.finish_reason ?? undefined };
  }
}

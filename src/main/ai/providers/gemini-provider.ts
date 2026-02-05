import { GoogleGenerativeAI } from '@google/generative-ai';

import { AiProvider, ProviderGenerateParams, ProviderResult } from '../types';

export class GeminiProvider implements AiProvider {
  name = 'gemini' as const;
  private client?: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey ?? process.env.GEMINI_API_KEY;
    this.model = model ?? process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite';
    if (key) {
      this.client = new GoogleGenerativeAI(key);
    }
  }

  async generate(params: ProviderGenerateParams): Promise<ProviderResult> {
    if (!this.client) {
      throw new Error('GEMINI_API_KEY is missing');
    }
    const model = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: params.prompt.system,
    });
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: params.prompt.user }] }],
      generationConfig: {
        temperature: params.prompt.temperature,
        maxOutputTokens: params.prompt.maxOutputTokens,
      },
    });
    const text = response.response.text() ?? '';
    return { content: text, raw: response, finishReason: response.response.candidates?.[0]?.finishReason };
  }
}

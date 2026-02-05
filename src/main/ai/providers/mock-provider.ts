import {
  aiExampleResultSchema,
  aiWordEnrichResultSchema,
  exampleOnlyPayloadSchema,
  wordEnrichPayloadSchema,
} from '@shared/ai';

import { AiProvider, ProviderGenerateParams, ProviderResult } from '../types';

const pickDifficulty = (hint?: string) => {
  if (!hint) return 'medium';
  const text = hint.toLowerCase();
  if (/(beginner|kids|simple|casual)/.test(text)) return 'easy';
  if (/(advanced|technical|formal)/.test(text)) return 'hard';
  return 'medium';
};

export class MockProvider implements AiProvider {
  name = 'mock' as const;

  async generate(params: ProviderGenerateParams): Promise<ProviderResult> {
    if (params.scenario === 'wordEnrich') {
      const payload = wordEnrichPayloadSchema.parse(params.payload);
      const result = aiWordEnrichResultSchema.parse({
        reading: payload.readingHint ?? `${payload.word} kana`,
        contextExpl: payload.contextHint ?? 'Brief context explaining where the word fits.',
        sceneDesc:
          payload.contextHint
            ? `A short scene showing "${payload.word}" in context: ${payload.contextHint}.`
            : `A short scene where "${payload.word}" appears in conversation.`,
        example: `${payload.word} is used naturally in a simple sentence.`,
        difficulty: pickDifficulty(payload.contextHint),
        tips: 'Keep sentences concise and concrete; prefer everyday scenarios.',
      });
      return { content: JSON.stringify(result), raw: result, finishReason: 'stop' };
    }

    const payload = exampleOnlyPayloadSchema.parse(params.payload);
    const result = aiExampleResultSchema.parse({
      example: `${payload.word} shows up in a quick sentence example.`,
      sceneDesc: payload.scene ?? 'Informal chat between friends.',
    });
    return { content: JSON.stringify(result), raw: result, finishReason: 'stop' };
  }
}

import { z } from 'zod';

import { aiProviderEnum, exampleStyleSchema } from './settings';
import { nonEmptyTrimmedString } from './common';

export const aiGenerateWordRequestSchema = z.object({
  word: nonEmptyTrimmedString,
  hint: nonEmptyTrimmedString.optional(),
  locale: nonEmptyTrimmedString.default('ja'),
  provider: aiProviderEnum.default('gemini'),
  exampleStyle: exampleStyleSchema.optional(),
});

export const aiGenerateWordResponseSchema = z.object({
  reading: nonEmptyTrimmedString,
  contextExpl: nonEmptyTrimmedString,
  sceneDesc: nonEmptyTrimmedString,
  example: nonEmptyTrimmedString,
});

export type AiGenerateWordRequest = z.infer<typeof aiGenerateWordRequestSchema>;
export type AiGenerateWordResponse = z.infer<typeof aiGenerateWordResponseSchema>;

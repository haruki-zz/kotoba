import { z } from 'zod';

import {
  aiExampleResultSchema,
  aiProviderEnum,
  aiScenarioEnum,
  aiWordEnrichResultSchema,
  exampleOnlyPayloadSchema,
  wordEnrichPayloadSchema,
} from '../../ai';

const persistOptionsSchema = z.object({
  wordId: z.number().int().positive(),
  mode: z.enum(['fill-empty', 'overwrite']).default('fill-empty'),
});

const baseRequest = z.object({
  provider: aiProviderEnum.optional(),
  persist: persistOptionsSchema.optional(),
});

export const aiGenerateRequestSchema = z.discriminatedUnion('scenario', [
  baseRequest.extend({
    scenario: z.literal('wordEnrich'),
    payload: wordEnrichPayloadSchema,
  }),
  baseRequest.extend({
    scenario: z.literal('exampleOnly'),
    payload: exampleOnlyPayloadSchema,
  }),
]);

const baseResponse = z.object({
  traceId: z.string(),
  scenario: aiScenarioEnum,
  provider: aiProviderEnum,
  prompt: z.object({
    system: z.string(),
    user: z.string(),
  }),
  latencyMs: z.number().int().nonnegative().optional(),
  persistedWordId: z.number().int().positive().optional(),
});

export const aiGenerateResponseSchema = z.discriminatedUnion('scenario', [
  baseResponse.extend({
    scenario: z.literal('wordEnrich'),
    result: aiWordEnrichResultSchema,
  }),
  baseResponse.extend({
    scenario: z.literal('exampleOnly'),
    result: aiExampleResultSchema,
  }),
]);

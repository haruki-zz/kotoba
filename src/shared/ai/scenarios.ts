import { z } from 'zod';

import { difficultyEnum } from '../schemas/word';

export const aiProviderEnum = z.enum(['mock', 'openai', 'gemini']);

export const aiScenarioEnum = z.enum(['wordEnrich', 'exampleOnly']);

export const aiToneEnum = z.enum(['casual', 'concise', 'tutor']);

export const wordEnrichPayloadSchema = z.object({
  word: z.string().trim().min(1),
  readingHint: z.string().trim().optional(),
  contextHint: z.string().trim().optional(),
  exampleFocus: z.string().trim().optional(),
  tone: aiToneEnum.default('casual'),
});

export const exampleOnlyPayloadSchema = z.object({
  word: z.string().trim().min(1),
  scene: z.string().trim().optional(),
  tone: aiToneEnum.default('casual'),
});

export const aiWordEnrichResultSchema = z.object({
  reading: z.string().trim(),
  contextExpl: z.string().trim(),
  sceneDesc: z.string().trim(),
  example: z.string().trim(),
  difficulty: difficultyEnum.optional(),
  tips: z.string().optional(),
});

export const aiExampleResultSchema = z.object({
  example: z.string().trim(),
  sceneDesc: z.string().trim().optional(),
});

export type AiProviderName = z.infer<typeof aiProviderEnum>;
export type AiScenario = z.infer<typeof aiScenarioEnum>;

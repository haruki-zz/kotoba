import { z } from 'zod';

export const difficultyEnum = z.enum(['easy', 'medium', 'hard']);

export const wordSchema = z.object({
  word: z.string().min(1),
  reading: z.string().min(1),
  contextExpl: z.string().min(1),
  sceneDesc: z.string().min(1),
  example: z.string().min(1),
  difficulty: difficultyEnum.default('medium'),
  ef: z.number().default(2.5),
  intervalDays: z.number().int().nonnegative().default(0),
  repetition: z.number().int().nonnegative().default(0),
  lastReviewAt: z.string().datetime().optional(),
  nextDueAt: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type Word = z.infer<typeof wordSchema>;

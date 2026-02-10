import { z } from 'zod';

import {
  DEFAULT_INTERVAL_DAYS,
  DEFAULT_REPETITION,
  SM2_DEFAULT_EF,
  SM2_MIN_EF,
} from '../constants';

const isoDateTime = z.string().datetime({ offset: true });

export const difficultyEnum = z.enum(['easy', 'medium', 'hard']);

export const wordRecordSchema = z.object({
  id: z.number().int().positive(),
  word: z.string().min(1),
  reading: z.string().min(1),
  contextExpl: z.string().min(1),
  sceneDesc: z.string().min(1),
  example: z.string().min(1),
  difficulty: difficultyEnum,
  ef: z.number().min(SM2_MIN_EF),
  intervalDays: z.number().int().min(1),
  repetition: z.number().int().min(0),
  lastReviewAt: isoDateTime,
  nextDueAt: isoDateTime,
  sourceId: z.number().int().positive().nullable(),
  deletedAt: isoDateTime.nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

export const wordCreateSchema = wordRecordSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    lastReviewAt: true,
    nextDueAt: true,
    sourceId: true,
    deletedAt: true,
  })
  .extend({
    ef: z.number().min(SM2_MIN_EF).default(SM2_DEFAULT_EF),
    intervalDays: z.number().int().min(1).default(DEFAULT_INTERVAL_DAYS),
    repetition: z.number().int().min(0).default(DEFAULT_REPETITION),
    lastReviewAt: isoDateTime.optional(),
    nextDueAt: isoDateTime.optional(),
    sourceId: z.number().int().positive().nullable().optional(),
  });

export const wordUpdateSchema = wordCreateSchema.partial().extend({
  difficulty: difficultyEnum.optional(),
  word: z.string().min(1).optional(),
  reading: z.string().min(1).optional(),
  contextExpl: z.string().min(1).optional(),
  sceneDesc: z.string().min(1).optional(),
  example: z.string().min(1).optional(),
  updatedAt: isoDateTime.optional(),
});

export type WordRecord = z.infer<typeof wordRecordSchema>;
export type WordCreateInput = z.infer<typeof wordCreateSchema>;
export type WordUpdateInput = z.infer<typeof wordUpdateSchema>;

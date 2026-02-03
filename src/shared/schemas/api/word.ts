import { z } from 'zod';

import { sourceCreateSchema, sourceRecordSchema } from '../source';
import { tagRecordSchema } from '../tag';
import { difficultyEnum, wordCreateSchema, wordRecordSchema, wordUpdateSchema } from '../word';

import { isoDateTimeSchema, paginationQuerySchema, paginationSchema } from './common';

export const wordViewSchema = wordRecordSchema.extend({
  tags: z.array(tagRecordSchema),
  source: sourceRecordSchema.nullable().optional(),
});

export const wordCreateWithMetaSchema = wordCreateSchema.extend({
  tags: z.array(z.string()).default([]),
  source: sourceCreateSchema.partial().optional(),
});

export const wordUpdateWithMetaSchema = wordUpdateSchema.extend({
  tags: z.array(z.string()).optional(),
  source: z.union([sourceCreateSchema.partial(), z.null()]).optional(),
});

export const wordListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).optional(),
  difficulty: z.union([difficultyEnum, z.array(difficultyEnum)]).optional(),
  tag: z.union([z.string(), z.array(z.string())]).optional(),
  sourceId: z.coerce.number().int().positive().optional(),
  dueBefore: isoDateTimeSchema.optional(),
  orderBy: z.enum(['nextDueAt', 'createdAt', 'updatedAt']).default('nextDueAt'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export const wordListResponseSchema = z.object({
  items: z.array(wordViewSchema),
  page: paginationSchema,
});

export const reviewRequestSchema = z.object({
  difficulty: difficultyEnum,
  reviewedAt: isoDateTimeSchema.optional(),
});

export const bulkImportSchema = z.object({
  items: z.array(wordCreateWithMetaSchema).min(1).max(500),
});

export const reviewQueueQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  asOf: isoDateTimeSchema.optional(),
});

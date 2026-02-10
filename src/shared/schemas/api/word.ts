import { z } from 'zod';

import { sourceCreateSchema, sourceRecordSchema } from '../source';
import { tagRecordSchema } from '../tag';
import { difficultyEnum, wordCreateSchema, wordRecordSchema, wordUpdateSchema } from '../word';

import { isoDateTimeSchema, paginationQuerySchema, paginationSchema } from './common';

const word_filter_query_schema = z.object({
  q: z.string().trim().min(1).optional(),
  difficulty: z.union([difficultyEnum, z.array(difficultyEnum)]).optional(),
  tag: z.union([z.string(), z.array(z.string())]).optional(),
  sourceId: z.coerce.number().int().positive().optional(),
  dueBefore: isoDateTimeSchema.optional(),
  createdAfter: isoDateTimeSchema.optional(),
  createdBefore: isoDateTimeSchema.optional(),
  updatedAfter: isoDateTimeSchema.optional(),
  updatedBefore: isoDateTimeSchema.optional(),
  includeDeleted: z.coerce.boolean().default(false),
  onlyDeleted: z.coerce.boolean().default(false),
  orderBy: z.enum(['nextDueAt', 'createdAt', 'updatedAt']).default('nextDueAt'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

const word_ids_schema = z.array(z.coerce.number().int().positive()).min(1).max(500);
const tag_names_schema = z.array(z.string().trim().min(1)).min(1).max(50);

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

export const wordListQuerySchema = paginationQuerySchema.merge(word_filter_query_schema);

export const wordListResponseSchema = z.object({
  items: z.array(wordViewSchema),
  page: paginationSchema,
});

export const wordDeleteQuerySchema = z.object({
  hard: z.coerce.boolean().default(false),
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

export const wordExportQuerySchema = word_filter_query_schema.extend({
  limit: z.coerce.number().int().min(1).max(5000).default(1000),
  offset: z.coerce.number().int().min(0).default(0),
});

export const wordExportResponseSchema = z.object({
  exportedAt: isoDateTimeSchema,
  count: z.number().int().nonnegative(),
  items: z.array(wordViewSchema),
});

export const importValidationRequestSchema = z.object({
  items: z.array(z.unknown()).min(1).max(1000),
});

export const importValidationIssueSchema = z.object({
  index: z.number().int().min(0),
  message: z.string().min(1),
  field: z.string().optional(),
});

export const importValidationResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  validCount: z.number().int().nonnegative(),
  invalidCount: z.number().int().nonnegative(),
  errors: z.array(importValidationIssueSchema),
});

export const wordBatchRequestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('setDifficulty'),
    wordIds: word_ids_schema,
    difficulty: difficultyEnum,
  }),
  z.object({
    action: z.literal('softDelete'),
    wordIds: word_ids_schema,
  }),
  z.object({
    action: z.literal('restore'),
    wordIds: word_ids_schema,
  }),
  z.object({
    action: z.literal('addTags'),
    wordIds: word_ids_schema,
    tags: tag_names_schema,
  }),
  z.object({
    action: z.literal('removeTags'),
    wordIds: word_ids_schema,
    tags: tag_names_schema,
  }),
]);

export const wordBatchResponseSchema = z.object({
  action: z.enum(['setDifficulty', 'softDelete', 'restore', 'addTags', 'removeTags']),
  affected: z.number().int().nonnegative(),
  missingIds: z.array(z.number().int().positive()),
});

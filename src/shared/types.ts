import { z } from 'zod';

import { DEFAULT_INTERVAL_DAYS, DEFAULT_REPETITION, SM2_DEFAULT_EF, SM2_MIN_EF } from './constants';
import {
  bulkImportSchema,
  difficultyEnum,
  reviewQueueQuerySchema,
  reviewRequestSchema,
  sourceCreateSchema,
  sourceRecordSchema,
  sourceUpdateSchema,
  statsOverviewSchema,
  tagCreateSchema,
  tagRecordSchema,
  tagUpdateSchema,
  wordCreateSchema,
  wordCreateWithMetaSchema,
  wordListQuerySchema,
  wordListResponseSchema,
  wordRecordSchema,
  wordUpdateSchema,
  wordUpdateWithMetaSchema,
  wordViewSchema,
} from './schemas';

export type Difficulty = z.infer<typeof difficultyEnum>;
export type WordRecord = z.infer<typeof wordRecordSchema>;
export type WordCreateInput = z.input<typeof wordCreateSchema>;
export type WordUpdateInput = z.input<typeof wordUpdateSchema>;
export type WordCreateWithMetaInput = z.input<typeof wordCreateWithMetaSchema>;
export type WordUpdateWithMetaInput = z.input<typeof wordUpdateWithMetaSchema>;
export type WordView = z.infer<typeof wordViewSchema>;
export type WordListQuery = z.infer<typeof wordListQuerySchema>;
export type WordListResponse = z.infer<typeof wordListResponseSchema>;
export type ReviewRequestInput = z.input<typeof reviewRequestSchema>;
export type ReviewQueueQuery = z.infer<typeof reviewQueueQuerySchema>;
export type BulkImportInput = z.input<typeof bulkImportSchema>;
export type StatsOverview = z.infer<typeof statsOverviewSchema>;

export type TagRecord = z.infer<typeof tagRecordSchema>;
export type TagCreateInput = z.input<typeof tagCreateSchema>;
export type TagUpdateInput = z.input<typeof tagUpdateSchema>;

export type SourceRecord = z.infer<typeof sourceRecordSchema>;
export type SourceCreateInput = z.input<typeof sourceCreateSchema>;
export type SourceUpdateInput = z.input<typeof sourceUpdateSchema>;

export {
  difficultyEnum,
  sourceCreateSchema,
  sourceRecordSchema,
  sourceUpdateSchema,
  statsOverviewSchema,
  tagCreateSchema,
  tagRecordSchema,
  tagUpdateSchema,
  wordCreateSchema,
  wordCreateWithMetaSchema,
  wordListQuerySchema,
  wordListResponseSchema,
  wordRecordSchema,
  wordUpdateSchema,
  wordUpdateWithMetaSchema,
  wordViewSchema,
  reviewRequestSchema,
  reviewQueueQuerySchema,
  bulkImportSchema,
};

export { SM2_DEFAULT_EF, SM2_MIN_EF, DEFAULT_INTERVAL_DAYS, DEFAULT_REPETITION };

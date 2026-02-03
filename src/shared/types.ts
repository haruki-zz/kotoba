import { z } from 'zod';

import { DEFAULT_INTERVAL_DAYS, DEFAULT_REPETITION, SM2_DEFAULT_EF, SM2_MIN_EF } from './constants';
import {
  difficultyEnum,
  sourceCreateSchema,
  sourceRecordSchema,
  sourceUpdateSchema,
  tagCreateSchema,
  tagRecordSchema,
  tagUpdateSchema,
  wordCreateSchema,
  wordRecordSchema,
  wordUpdateSchema,
} from './schemas';

export type Difficulty = z.infer<typeof difficultyEnum>;
export type WordRecord = z.infer<typeof wordRecordSchema>;
export type WordCreateInput = z.input<typeof wordCreateSchema>;
export type WordUpdateInput = z.input<typeof wordUpdateSchema>;

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
  tagCreateSchema,
  tagRecordSchema,
  tagUpdateSchema,
  wordCreateSchema,
  wordRecordSchema,
  wordUpdateSchema,
};

export { SM2_DEFAULT_EF, SM2_MIN_EF, DEFAULT_INTERVAL_DAYS, DEFAULT_REPETITION };

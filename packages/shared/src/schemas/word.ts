import { z } from "zod";

import {
  EF_DEFAULT,
  EF_MIN,
  INITIAL_INTERVAL_DAYS,
  INITIAL_REPETITION,
} from "../sm2";
import {
  difficultyEnum,
  isoDateTimeString,
  nonEmptyTrimmedString,
  numericId,
  optionalTrimmedString,
} from "./common";

export const wordCoreSchema = z.object({
  word: nonEmptyTrimmedString,
  reading: optionalTrimmedString,
  contextExpl: optionalTrimmedString,
  sceneDesc: optionalTrimmedString,
  example: optionalTrimmedString,
  difficulty: difficultyEnum.default("medium"),
  ef: z.number().min(EF_MIN).default(EF_DEFAULT),
  intervalDays: z.number().int().nonnegative().default(INITIAL_INTERVAL_DAYS),
  repetition: z.number().int().nonnegative().default(INITIAL_REPETITION),
  lastReviewAt: isoDateTimeString.optional(),
  nextDueAt: isoDateTimeString.optional(),
});

export const wordRecordSchema = wordCoreSchema.extend({
  id: numericId,
  createdAt: isoDateTimeString,
  updatedAt: isoDateTimeString,
});

export const wordCreateSchema = wordCoreSchema;
export const wordUpdateSchema = wordCoreSchema.partial();

export const wordQuerySchema = z.object({
  search: nonEmptyTrimmedString.optional(),
  difficulty: difficultyEnum.optional(),
  dueBefore: isoDateTimeString.optional(),
  limit: z.number().int().positive().max(200).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export type WordCore = z.infer<typeof wordCoreSchema>;
export type WordRecord = z.infer<typeof wordRecordSchema>;
export type WordCreateInput = z.infer<typeof wordCreateSchema>;
export type WordUpdateInput = z.infer<typeof wordUpdateSchema>;
export type WordQuery = z.infer<typeof wordQuerySchema>;

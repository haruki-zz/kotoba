import {
  EF_DEFAULT,
  INITIAL_INTERVAL_DAYS,
  INITIAL_REPETITION,
  difficultyEnum,
  nonEmptyTrimmedString,
} from "@kotoba/shared";
import { z } from "zod";

import type { WordCreateInput } from "@kotoba/shared";

const optionalCleanString = z
  .string()
  .trim()
  .transform((value) => (value.length ? value : undefined))
  .optional();

export const wordFormSchema = z.object({
  word: nonEmptyTrimmedString,
  reading: optionalCleanString,
  contextExpl: optionalCleanString,
  sceneDesc: optionalCleanString,
  example: optionalCleanString,
  difficulty: difficultyEnum.default("medium"),
  hint: optionalCleanString,
  locale: z.string().trim().default("ja"),
});

export type WordFormValues = z.infer<typeof wordFormSchema>;

export const toWordCreateInput = ({
  word,
  reading,
  contextExpl,
  sceneDesc,
  example,
  difficulty,
}: WordFormValues): WordCreateInput => ({
  word,
  reading,
  contextExpl,
  sceneDesc,
  example,
  difficulty,
  ef: EF_DEFAULT,
  intervalDays: INITIAL_INTERVAL_DAYS,
  repetition: INITIAL_REPETITION,
});

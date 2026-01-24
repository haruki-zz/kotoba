import { z } from "zod";

import { nonEmptyTrimmedString } from "./common.js";
import { aiProviderEnum, exampleStyleSchema } from "./settings.js";

export const aiGenerateWordRequestSchema = z.object({
  word: nonEmptyTrimmedString,
  hint: nonEmptyTrimmedString.optional(),
  locale: nonEmptyTrimmedString.default("ja"),
  provider: aiProviderEnum.optional(),
  exampleStyle: exampleStyleSchema.optional(),
});

export const aiGenerateWordResponseSchema = z.object({
  reading: nonEmptyTrimmedString,
  contextExpl: nonEmptyTrimmedString,
  sceneDesc: nonEmptyTrimmedString,
  example: nonEmptyTrimmedString,
});

export type AiGenerateWordRequest = z.infer<typeof aiGenerateWordRequestSchema>;
export type AiGenerateWordResponse = z.infer<
  typeof aiGenerateWordResponseSchema
>;

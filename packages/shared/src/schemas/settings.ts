import { z } from "zod";

import {
  DEFAULT_REVIEW_BATCH_SIZE,
  EXAMPLE_SENTENCE_RANGE,
  SCENE_LENGTH_RANGE,
} from "../sm2";
import { nonEmptyTrimmedString } from "./common";

export const aiProviderEnum = z.enum(["openai", "gemini", "mock"]);
export const themePreferenceEnum = z.enum(["light", "dark", "system"]);

const orderedRangeSchema = z
  .tuple([z.number().int().positive(), z.number().int().positive()])
  .refine(([min, max]) => min <= max, {
    message: "range should be ordered",
  });

export const exampleStyleSchema = z.object({
  tone: nonEmptyTrimmedString.default("life-conversational"),
  sentenceLengthRange: orderedRangeSchema.default(
    () => [...EXAMPLE_SENTENCE_RANGE] as [number, number],
  ),
  sceneLengthRange: orderedRangeSchema.default(
    () => [...SCENE_LENGTH_RANGE] as [number, number],
  ),
});

export const defaultExampleStyle = () => ({
  tone: "life-conversational",
  sentenceLengthRange: [...EXAMPLE_SENTENCE_RANGE] as [number, number],
  sceneLengthRange: [...SCENE_LENGTH_RANGE] as [number, number],
});

export const appSettingsSchema = z.object({
  reviewBatchSize: z
    .number()
    .int()
    .positive()
    .max(500)
    .default(DEFAULT_REVIEW_BATCH_SIZE),
  aiProvider: aiProviderEnum.default("openai"),
  exampleStyle: exampleStyleSchema.default(defaultExampleStyle),
  theme: themePreferenceEnum.default("system"),
});

export type AppSettings = z.infer<typeof appSettingsSchema>;

import { z } from "zod";

export const isoDateTimeString = z.string().datetime();
export const nonEmptyTrimmedString = z.string().trim().min(1);
export const optionalTrimmedString = z.string().trim().min(1).optional();
export const numericId = z.number().int().positive();
export const difficultyValues = ["easy", "medium", "hard"] as const;
export const difficultyEnum = z.enum(difficultyValues);

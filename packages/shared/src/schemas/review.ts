import { z } from "zod";

import { EF_MIN, REVIEW_GRADE_TO_QUALITY, ReviewGrade } from "../sm2";
import { isoDateTimeString, numericId } from "./common";

export const reviewGradeEnum = z.enum(["easy", "medium", "hard"]);

export const reviewRequestSchema = z.object({
  wordId: numericId,
  grade: reviewGradeEnum.default("medium"),
  reviewedAt: isoDateTimeString.default(() => new Date().toISOString()),
});

export const reviewResultSchema = z.object({
  wordId: numericId,
  grade: reviewGradeEnum,
  quality: z
    .literal(REVIEW_GRADE_TO_QUALITY.easy)
    .or(z.literal(REVIEW_GRADE_TO_QUALITY.medium))
    .or(z.literal(REVIEW_GRADE_TO_QUALITY.hard)),
  ef: z.number().min(EF_MIN),
  intervalDays: z.number().int().nonnegative(),
  repetition: z.number().int().nonnegative(),
  lastReviewAt: isoDateTimeString,
  nextDueAt: isoDateTimeString,
});

export type ReviewRequest = z.infer<typeof reviewRequestSchema>;
export type ReviewResult = z.infer<typeof reviewResultSchema>;
export type ReviewGradeSchema = ReviewGrade;

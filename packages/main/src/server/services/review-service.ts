import {
  REVIEW_GRADE_TO_QUALITY,
  ReviewRequest,
  reviewRequestSchema,
  reviewResultSchema,
  WordRecord,
} from "@kotoba/shared";

import { WordRepository } from "../../db/word-repository.js";
import { AppError } from "../errors.js";

type ReviewHistoryEntry = {
  before: WordRecord;
  after: WordRecord;
};

export class ReviewService {
  private readonly history: ReviewHistoryEntry[] = [];

  constructor(private readonly words: WordRepository) {}

  getQueue(limit: number, dueBefore?: string): WordRecord[] {
    const cutoff = dueBefore ?? new Date().toISOString();
    return this.words.listDue(limit, cutoff);
  }

  applyReview(input: ReviewRequest) {
    const payload = reviewRequestSchema.parse(input);
    const existing = this.words.getById(payload.wordId);
    if (!existing) {
      throw new AppError("WORD_NOT_FOUND", "Word not found", 404);
    }

    const updated =
      this.words.update(existing.id, {
        lastReviewAt: payload.reviewedAt,
        nextDueAt: payload.reviewedAt,
      }) ?? existing;

    this.history.push({ before: existing, after: updated });

    const result = reviewResultSchema.parse({
      wordId: updated.id,
      grade: payload.grade,
      quality: REVIEW_GRADE_TO_QUALITY[payload.grade],
      ef: updated.ef,
      intervalDays: updated.intervalDays,
      repetition: updated.repetition,
      lastReviewAt: updated.lastReviewAt ?? payload.reviewedAt,
      nextDueAt: updated.nextDueAt ?? payload.reviewedAt,
    });

    return { word: updated, result };
  }

  undoLast() {
    const last = this.history.pop();
    if (!last) {
      throw new AppError("RES_NOT_FOUND", "No review history to undo", 404);
    }

    this.words.update(last.before.id, {
      ef: last.before.ef,
      intervalDays: last.before.intervalDays,
      repetition: last.before.repetition,
      lastReviewAt: last.before.lastReviewAt,
      nextDueAt: last.before.nextDueAt,
      difficulty: last.before.difficulty,
    });

    return last.before;
  }
}

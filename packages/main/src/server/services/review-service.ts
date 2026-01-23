import {
  computeSm2Review,
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
  request: ReviewRequest;
  result: ReturnType<typeof reviewResultSchema.parse>;
  queueIndex: number;
};

type LastApplied = {
  request: ReviewRequest;
  word: WordRecord;
  result: ReturnType<typeof reviewResultSchema.parse>;
};

type QueueState = {
  items: WordRecord[];
  cursor: number;
  limit: number;
  dueBefore: string;
  generatedAt: string;
};

export class ReviewService {
  private readonly history: ReviewHistoryEntry[] = [];
  private readonly lastApplied = new Map<number, LastApplied>();
  private queueState: QueueState | null = null;

  constructor(private readonly words: WordRepository) {}

  getQueue(limit: number, dueBefore?: string): WordRecord[] {
    const cutoff = dueBefore ?? new Date().toISOString();
    const items = this.words.listDue(limit, cutoff);
    this.queueState = {
      items,
      cursor: 0,
      limit,
      dueBefore: cutoff,
      generatedAt: new Date().toISOString(),
    };
    return items;
  }

  private findQueueIndex(wordId: number) {
    if (!this.queueState) {
      return -1;
    }
    return this.queueState.items.findIndex((item) => item.id === wordId);
  }

  private updateQueueAfterApply(word: WordRecord, queueIndex: number) {
    if (!this.queueState || queueIndex < 0) {
      return;
    }
    this.queueState.items[queueIndex] = word;
    this.queueState.cursor = Math.max(
      this.queueState.cursor,
      queueIndex + 1,
    );
  }

  private updateQueueAfterUndo(word: WordRecord, queueIndex: number) {
    if (!this.queueState || queueIndex < 0) {
      return;
    }
    this.queueState.items[queueIndex] = word;
    this.queueState.cursor = Math.min(this.queueState.cursor, queueIndex);
  }

  private restoreLastApplied(wordId: number) {
    for (let idx = this.history.length - 1; idx >= 0; idx -= 1) {
      const entry = this.history[idx];
      if (entry.after.id === wordId) {
        this.lastApplied.set(wordId, {
          request: entry.request,
          word: entry.after,
          result: entry.result,
        });
        return;
      }
    }
    this.lastApplied.delete(wordId);
  }

  applyReview(input: ReviewRequest) {
    const payload = reviewRequestSchema.parse(input);
    const existing = this.words.getById(payload.wordId);
    if (!existing) {
      throw new AppError("WORD_NOT_FOUND", "Word not found", 404);
    }

    const previousResult = this.lastApplied.get(existing.id);
    if (previousResult) {
      const unchangedSinceLastApply =
        previousResult.word.updatedAt === existing.updatedAt;
      const sameRequest =
        previousResult.request.reviewedAt === payload.reviewedAt &&
        previousResult.request.grade === payload.grade;
      if (unchangedSinceLastApply && sameRequest) {
        return previousResult;
      }
    }

    const computation = computeSm2Review(
      {
        ef: existing.ef,
        intervalDays: existing.intervalDays,
        repetition: existing.repetition,
      },
      payload.grade,
      payload.reviewedAt,
    );

    const queueIndex = this.findQueueIndex(existing.id);
    const updated =
      this.words.update(existing.id, {
        ef: computation.ef,
        intervalDays: computation.intervalDays,
        repetition: computation.repetition,
        lastReviewAt: computation.lastReviewAt,
        nextDueAt: computation.nextDueAt,
        difficulty: payload.grade,
      }) ?? existing;

    const result = reviewResultSchema.parse({
      wordId: updated.id,
      grade: payload.grade,
      quality: computation.quality,
      ef: updated.ef,
      intervalDays: updated.intervalDays,
      repetition: updated.repetition,
      lastReviewAt: updated.lastReviewAt ?? computation.lastReviewAt,
      nextDueAt: updated.nextDueAt ?? computation.nextDueAt,
    });

    const entry: ReviewHistoryEntry = {
      before: existing,
      after: updated,
      request: payload,
      result,
      queueIndex,
    };

    this.history.push(entry);
    this.lastApplied.set(updated.id, {
      request: payload,
      word: updated,
      result,
    });
    this.updateQueueAfterApply(updated, queueIndex);

    return { word: updated, result };
  }

  undoLast() {
    const last = this.history.pop();
    if (!last) {
      throw new AppError("RES_NOT_FOUND", "No review history to undo", 404);
    }

    const restored =
      this.words.update(last.before.id, {
      ef: last.before.ef,
      intervalDays: last.before.intervalDays,
      repetition: last.before.repetition,
      lastReviewAt: last.before.lastReviewAt,
      nextDueAt: last.before.nextDueAt,
      difficulty: last.before.difficulty,
    }) ?? last.before;

    this.updateQueueAfterUndo(restored, last.queueIndex);
    this.restoreLastApplied(restored.id);

    return restored;
  }
}

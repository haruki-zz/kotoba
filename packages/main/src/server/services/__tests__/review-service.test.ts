import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { REVIEW_GRADE_TO_QUALITY } from "@kotoba/shared";

import { applyMigrations } from "../../../db/migrator.js";
import { migrations } from "../../../db/migrations/index.js";
import { WordRepository } from "../../../db/word-repository.js";
import { ReviewService } from "../review-service.js";

const REVIEWED_AT = "2024-01-01T00:00:00.000Z";

describe("ReviewService", () => {
  let db: Database.Database;
  let repo: WordRepository;
  let service: ReviewService;

  beforeEach(() => {
    db = new Database(":memory:");
    applyMigrations(db, migrations);
    repo = new WordRepository(db);
    service = new ReviewService(repo);
  });

  afterEach(() => {
    db.close();
  });

  it("builds a due queue and applies SM-2 updates", () => {
    const first = repo.create({
      word: "kasa",
      nextDueAt: "2023-12-31T00:00:00.000Z",
    });
    repo.create({ word: "neko", nextDueAt: "2024-01-10T00:00:00.000Z" });

    const queue = service.getQueue(5, "2024-01-02T00:00:00.000Z");
    expect(queue.map((item) => item.id)).toContain(first.id);

    const { word, result } = service.applyReview({
      wordId: first.id,
      grade: "easy",
      reviewedAt: REVIEWED_AT,
    });

    expect(result.quality).toBe(REVIEW_GRADE_TO_QUALITY.easy);
    expect(word.difficulty).toBe("easy");
    expect(word.repetition).toBe(1);
    expect(word.intervalDays).toBe(1);
    expect(word.nextDueAt).toBe("2024-01-02T00:00:00.000Z");
  });

  it("undos the latest review and restores previous fields", () => {
    const word = repo.create({
      word: "mizu",
      difficulty: "hard",
      ef: 1.4,
      intervalDays: 2,
      repetition: 2,
      nextDueAt: "2023-12-30T00:00:00.000Z",
      lastReviewAt: "2023-12-28T00:00:00.000Z",
    });

    service.getQueue(3, "2024-01-02T00:00:00.000Z");
    service.applyReview({
      wordId: word.id,
      grade: "medium",
      reviewedAt: REVIEWED_AT,
    });

    const restored = service.undoLast();
    const current = repo.getById(word.id)!;

    expect(restored.ef).toBeCloseTo(word.ef);
    expect(current.intervalDays).toBe(word.intervalDays);
    expect(current.repetition).toBe(word.repetition);
    expect(current.nextDueAt).toBe(word.nextDueAt);
    expect(current.difficulty).toBe("hard");
  });

  it("treats repeated submissions with same payload as idempotent", () => {
    const word = repo.create({
      word: "sora",
      nextDueAt: "2023-12-31T00:00:00.000Z",
    });

    const payload = {
      wordId: word.id,
      grade: "medium",
      reviewedAt: REVIEWED_AT,
    } as const;

    service.applyReview(payload);
    const afterFirst = repo.getById(word.id)!;

    service.applyReview(payload);
    const afterSecond = repo.getById(word.id)!;

    expect(afterSecond.updatedAt).toBe(afterFirst.updatedAt);

    const undone = service.undoLast();
    const restored = repo.getById(word.id)!;

    expect(undone.nextDueAt).toBe(word.nextDueAt);
    expect(restored.repetition).toBe(word.repetition);
  });
});

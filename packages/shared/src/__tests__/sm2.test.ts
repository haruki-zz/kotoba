import { describe, expect, it } from "vitest";

import {
  computeSm2Review,
  EF_DEFAULT,
  REVIEW_GRADE_TO_QUALITY,
} from "../sm2.js";

describe("computeSm2Review", () => {
  const reviewedAt = "2024-01-01T00:00:00.000Z";

  it("handles first review with medium grade", () => {
    const result = computeSm2Review(
      { ef: EF_DEFAULT, intervalDays: 0, repetition: 0 },
      "medium",
      reviewedAt,
    );

    expect(result.repetition).toBe(1);
    expect(result.intervalDays).toBe(1);
    expect(result.ef).toBeCloseTo(EF_DEFAULT);
    expect(result.quality).toBe(REVIEW_GRADE_TO_QUALITY.medium);
    expect(result.lastReviewAt).toBe(reviewedAt);
    expect(result.nextDueAt).toBe("2024-01-02T00:00:00.000Z");
  });

  it("applies six-day interval on the second successful review", () => {
    const result = computeSm2Review(
      { ef: EF_DEFAULT, intervalDays: 1, repetition: 1 },
      "easy",
      reviewedAt,
    );

    expect(result.repetition).toBe(2);
    expect(result.intervalDays).toBe(6);
    expect(result.ef).toBeCloseTo(EF_DEFAULT + 0.1);
    expect(result.nextDueAt).toBe("2024-01-07T00:00:00.000Z");
  });

  it("scales later intervals with EF and keeps interval non-zero", () => {
    const result = computeSm2Review(
      { ef: EF_DEFAULT, intervalDays: 6, repetition: 2 },
      "hard",
      reviewedAt,
    );

    expect(result.repetition).toBe(3);
    expect(result.intervalDays).toBe(14);
    expect(result.ef).toBeCloseTo(2.36, 2);
    expect(result.nextDueAt).toBe("2024-01-15T00:00:00.000Z");

    const recoveredFromZero = computeSm2Review(
      { ef: 1.5, intervalDays: 0, repetition: 4 },
      "easy",
      reviewedAt,
    );
    expect(recoveredFromZero.intervalDays).toBe(1);
    expect(recoveredFromZero.nextDueAt).toBe("2024-01-02T00:00:00.000Z");
  });
});

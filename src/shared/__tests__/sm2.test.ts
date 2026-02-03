import { describe, expect, it } from 'vitest';

import { SM2_MIN_EF } from '../constants';
import {
  applyDifficultyReview,
  applySm2Review,
  difficultyQualityMap,
  qualityFromDifficulty,
} from '../sm2';

const addDaysIso = (iso: string, days: number) =>
  new Date(new Date(iso).getTime() + days * 86_400_000).toISOString();

describe('SM-2 scheduling core', () => {
  const baseState = {
    ef: 2.5,
    intervalDays: 1,
    repetition: 0,
  };

  it('resets repetition and interval when quality is below 3', () => {
    const reviewedAt = '2024-01-01T00:00:00.000Z';
    const result = applySm2Review({
      quality: 2,
      state: { ...baseState, ef: 1.4, intervalDays: 3, repetition: 4 },
      reviewedAt,
    });

    expect(result.repetition).toBe(0);
    expect(result.intervalDays).toBe(1);
    expect(result.lastReviewAt).toBe(reviewedAt);
    expect(result.nextDueAt).toBe(addDaysIso(reviewedAt, 1));
    expect(result.ef).toBeGreaterThanOrEqual(SM2_MIN_EF);
  });

  it('uses first and second interval shortcuts for early successes', () => {
    const reviewedAt = '2024-03-10T10:00:00.000Z';
    const first = applySm2Review({
      quality: 5,
      state: { ...baseState, repetition: 0 },
      reviewedAt,
    });
    expect(first.intervalDays).toBe(1);
    expect(first.repetition).toBe(1);
    expect(first.nextDueAt).toBe(addDaysIso(reviewedAt, 1));

    const second = applySm2Review({
      quality: 4,
      state: { ...first },
      reviewedAt: first.nextDueAt,
    });
    expect(second.intervalDays).toBe(6);
    expect(second.repetition).toBe(2);
    expect(second.nextDueAt).toBe(addDaysIso(first.nextDueAt, 6));
  });

  it('computes interval with previous EF then applies EF delta', () => {
    const reviewedAt = '2024-04-01T08:00:00.000Z';
    const priorInterval = 6;
    const priorRepetition = 2;
    const priorEf = 2.5;

    const result = applySm2Review({
      quality: 3,
      state: {
        ef: priorEf,
        intervalDays: priorInterval,
        repetition: priorRepetition,
      },
      reviewedAt,
    });

    const expectedInterval = Math.round(priorInterval * priorEf);
    const expectedEf = Math.max(priorEf + (0.1 - (5 - 3) * (0.08 + (5 - 3) * 0.02)), SM2_MIN_EF);
    expect(result.ef).toBeCloseTo(expectedEf, 5);
    expect(result.repetition).toBe(priorRepetition + 1);
    expect(result.intervalDays).toBe(expectedInterval);
    expect(result.nextDueAt).toBe(addDaysIso(reviewedAt, result.intervalDays));
  });

  it('applies maxIntervalDays when provided', () => {
    const reviewedAt = '2024-02-01T00:00:00.000Z';
    const result = applySm2Review(
      {
        quality: 5,
        state: { ef: 2, intervalDays: 120, repetition: 5 },
        reviewedAt,
      },
      { maxIntervalDays: 60 }
    );

    expect(result.intervalDays).toBeLessThanOrEqual(60);
    expect(result.nextDueAt).toBe(addDaysIso(reviewedAt, 60));
  });

  it('maps difficulty to quality for convenience', () => {
    expect(qualityFromDifficulty('easy')).toBe(5);
    expect(qualityFromDifficulty('medium')).toBe(4);
    expect(qualityFromDifficulty('hard')).toBe(3);
    expect(Object.values(difficultyQualityMap)).toContain(5);

    const reviewedAt = '2024-05-05T00:00:00.000Z';
    const result = applyDifficultyReview('hard', baseState, reviewedAt);
    expect(result.quality).toBe(3);
    expect(result.lastReviewAt).toBe(reviewedAt);
  });
});

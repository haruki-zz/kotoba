import { ReviewRating, Sm2State, Word } from "./types";

export const DAY_IN_MS = 24 * 60 * 60 * 1000;
export const MIN_EASINESS = 1.3;
export const DEFAULT_EASINESS = 2.5;

export const defaultSm2State = (now = Date.now()): Sm2State => ({
  repetition: 0,
  interval: 0,
  easiness: DEFAULT_EASINESS,
  next_review_at: now,
});

const clampGrade = (grade: ReviewRating): ReviewRating => {
  if (grade < 0) return 0;
  if (grade > 5) return 5;
  return grade;
};

const nextEasiness = (current: number, grade: ReviewRating) => {
  const delta = 5 - grade;
  const updated = current + (0.1 - delta * (0.08 + delta * 0.02));
  return Math.max(MIN_EASINESS, Number(updated.toFixed(4)));
};

export const updateSm2 = (state: Sm2State, grade: ReviewRating, now = Date.now()): Sm2State => {
  const normalizedGrade = clampGrade(grade);
  const easiness = nextEasiness(state.easiness, normalizedGrade);

  if (normalizedGrade < 3) {
    return {
      repetition: 0,
      interval: 1,
      easiness,
      next_review_at: now + DAY_IN_MS,
    };
  }

  const repetition = state.repetition + 1;
  let intervalDays: number;

  if (repetition === 1) {
    intervalDays = 1;
  } else if (repetition === 2) {
    intervalDays = 6;
  } else {
    intervalDays = Math.max(1, Math.round(state.interval * easiness));
  }

  return {
    repetition,
    interval: intervalDays,
    easiness,
    next_review_at: now + intervalDays * DAY_IN_MS,
  };
};

export const isDueForReview = (sm2: Sm2State, now = Date.now()) => sm2.next_review_at <= now;

export const sortByNextReview = (words: Word[]) =>
  [...words].sort((a, b) => {
    if (a.sm2.next_review_at === b.sm2.next_review_at) {
      return a.updated_at - b.updated_at;
    }
    return a.sm2.next_review_at - b.sm2.next_review_at;
  });

export const buildReviewQueue = (words: Word[], now = Date.now()) => {
  const dueWords = words.filter((word) => isDueForReview(word.sm2, now));
  return sortByNextReview(dueWords);
};

export const applyReviewResult = (word: Word, grade: ReviewRating, now = Date.now()): Word => {
  const sm2 = updateSm2(word.sm2, grade, now);

  return {
    ...word,
    sm2,
    updated_at: now,
  };
};

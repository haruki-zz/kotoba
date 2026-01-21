export const EF_MIN = 1.3;
export const EF_DEFAULT = 2.5;
export const INITIAL_INTERVAL_DAYS = 0;
export const INITIAL_REPETITION = 0;
export const REVIEW_GRADE_TO_QUALITY = {
  easy: 5,
  medium: 4,
  hard: 3,
} as const;
export type ReviewGrade = keyof typeof REVIEW_GRADE_TO_QUALITY;
export const DEFAULT_REVIEW_BATCH_SIZE = 30;
export const EXAMPLE_SENTENCE_RANGE: [number, number] = [15, 25];
export const SCENE_LENGTH_RANGE: [number, number] = [30, 40];

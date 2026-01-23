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

export type Sm2State = {
  ef: number;
  intervalDays: number;
  repetition: number;
};

export type Sm2ComputationResult = {
  quality: number;
  ef: number;
  intervalDays: number;
  repetition: number;
  lastReviewAt: string;
  nextDueAt: string;
};

const addDaysUtc = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const calculateEaseFactor = (ef: number, quality: number) => {
  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  return Math.max(EF_MIN, ef + delta);
};

export const computeSm2Review = (
  state: Sm2State,
  grade: ReviewGrade,
  reviewedAtInput = new Date().toISOString(),
): Sm2ComputationResult => {
  const quality = REVIEW_GRADE_TO_QUALITY[grade];
  const reviewedAt = new Date(reviewedAtInput);
  const reviewedAtIso = reviewedAt.toISOString();

  const failed = quality < 3;
  const repetition = failed ? 0 : state.repetition + 1;
  const ef = calculateEaseFactor(state.ef, quality);

  let intervalDays: number;
  if (failed || repetition <= 1) {
    intervalDays = 1;
  } else if (repetition === 2) {
    intervalDays = 6;
  } else {
    intervalDays = Math.max(1, Math.round(state.intervalDays * ef));
  }

  const nextDueAt = addDaysUtc(reviewedAt, intervalDays).toISOString();

  return {
    quality,
    ef,
    intervalDays,
    repetition,
    lastReviewAt: reviewedAtIso,
    nextDueAt,
  };
};

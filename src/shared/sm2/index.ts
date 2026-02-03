import { DEFAULT_INTERVAL_DAYS, SM2_DEFAULT_EF, SM2_MIN_EF } from '../constants';
import { Difficulty } from '../types';

export type Sm2Quality = 0 | 1 | 2 | 3 | 4 | 5;

export type Sm2State = {
  ef: number;
  intervalDays: number;
  repetition: number;
  lastReviewAt?: string;
  nextDueAt?: string;
};

export type Sm2Config = {
  minEf: number;
  defaultEf: number;
  failureIntervalDays: number;
  firstIntervalDays: number;
  secondIntervalDays: number;
  maxIntervalDays?: number;
  clock?: () => Date;
};

export type Sm2ReviewRequest = {
  quality: Sm2Quality;
  state: Sm2State;
  reviewedAt?: string | Date;
};

export type Sm2ReviewResult = {
  quality: Sm2Quality;
  ef: number;
  intervalDays: number;
  repetition: number;
  lastReviewAt: string;
  nextDueAt: string;
};

const DAY_MS = 86_400_000;

const defaultConfig: Sm2Config = {
  minEf: SM2_MIN_EF,
  defaultEf: SM2_DEFAULT_EF,
  failureIntervalDays: DEFAULT_INTERVAL_DAYS,
  firstIntervalDays: 1,
  secondIntervalDays: 6,
  maxIntervalDays: undefined,
  clock: () => new Date(),
};

export const difficultyQualityMap: Record<Difficulty, Sm2Quality> = {
  easy: 5,
  medium: 4,
  hard: 3,
};

const clamp = (value: number, min: number, max?: number) => {
  if (max !== undefined) {
    return Math.min(Math.max(value, min), max);
  }
  return Math.max(value, min);
};

const updateEf = (previousEf: number, quality: Sm2Quality, minEf: number) => {
  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  return clamp(previousEf + delta, minEf);
};

const resolveDate = (input: string | Date | undefined, clock: () => Date) => {
  if (input instanceof Date) return input;
  if (input) return new Date(input);
  return clock();
};

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS);

const computeIntervalDays = (
  quality: Sm2Quality,
  repetition: number,
  previousInterval: number,
  ef: number,
  cfg: Sm2Config
) => {
  if (quality < 3) {
    return cfg.failureIntervalDays;
  }

  const nextRepetition = repetition + 1;
  if (nextRepetition === 1) return cfg.firstIntervalDays;
  if (nextRepetition === 2) return cfg.secondIntervalDays;

  return Math.round(previousInterval * ef);
};

export const qualityFromDifficulty = (difficulty: Difficulty): Sm2Quality =>
  difficultyQualityMap[difficulty];

export const applySm2Review = (
  request: Sm2ReviewRequest,
  config?: Partial<Sm2Config>
): Sm2ReviewResult => {
  const cfg: Sm2Config = { ...defaultConfig, ...config };
  const reviewDate = resolveDate(request.reviewedAt, cfg.clock ?? defaultConfig.clock!);

  const previousEf = Number.isFinite(request.state.ef) ? request.state.ef : cfg.defaultEf;
  const previousInterval = request.state.intervalDays || cfg.firstIntervalDays;
  const previousRepetition = request.state.repetition ?? 0;

  let intervalDays = computeIntervalDays(
    request.quality,
    previousRepetition,
    previousInterval,
    previousEf,
    cfg
  );
  intervalDays = clamp(intervalDays, 1, cfg.maxIntervalDays);

  const ef = updateEf(previousEf, request.quality, cfg.minEf);
  const repetition = request.quality < 3 ? 0 : previousRepetition + 1;
  const lastReviewAt = reviewDate.toISOString();
  const nextDueAt = addDays(reviewDate, intervalDays).toISOString();

  return {
    quality: request.quality,
    ef,
    intervalDays,
    repetition,
    lastReviewAt,
    nextDueAt,
  };
};

export const applyDifficultyReview = (
  difficulty: Difficulty,
  state: Sm2State,
  reviewedAt?: string | Date,
  config?: Partial<Sm2Config>
) => applySm2Review({ quality: qualityFromDifficulty(difficulty), state, reviewedAt }, config);

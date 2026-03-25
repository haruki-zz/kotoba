import { type ReviewState } from '../shared/domain_schema'

export type Sm2MemoryLevel = 1 | 2 | 3 | 4 | 5

export interface CalculateSm2ReviewStateInput {
  review_state: ReviewState
  grade: number
  now: Date
}

export const calculate_sm2_review_state = (input: CalculateSm2ReviewStateInput): ReviewState => {
  validate_grade(input.grade)

  const updated_easiness_factor = calculate_easiness_factor(
    input.review_state.easiness_factor,
    input.grade
  )
  const next_repetition = input.grade < 3 ? 0 : input.review_state.repetition + 1
  const next_interval_days = calculate_interval_days({
    previous_interval_days: input.review_state.interval_days,
    repetition: next_repetition,
    updated_easiness_factor,
    grade: input.grade,
  })
  const now_iso = input.now.toISOString()

  return {
    repetition: next_repetition,
    interval_days: next_interval_days,
    easiness_factor: updated_easiness_factor,
    next_review_at: add_days(input.now, next_interval_days).toISOString(),
    last_review_at: now_iso,
    last_grade: input.grade,
  }
}

export const resolve_sm2_memory_level = (review_state: ReviewState): Sm2MemoryLevel => {
  if (review_state.repetition <= 0) {
    return 1
  }

  if (review_state.repetition === 1) {
    return 2
  }

  if (review_state.repetition === 2) {
    return 3
  }

  if (review_state.repetition === 3) {
    return 4
  }

  return 5
}

const calculate_interval_days = (input: {
  previous_interval_days: number
  repetition: number
  updated_easiness_factor: number
  grade: number
}): number => {
  if (input.grade < 3) {
    return 1
  }

  if (input.repetition === 1) {
    return 1
  }

  if (input.repetition === 2) {
    return 6
  }

  return Math.max(1, Math.round(input.previous_interval_days * input.updated_easiness_factor))
}

const calculate_easiness_factor = (current_easiness_factor: number, grade: number): number => {
  const grade_gap = 5 - grade
  const next_easiness_factor =
    current_easiness_factor + (0.1 - grade_gap * (0.08 + grade_gap * 0.02))
  return Math.max(1.3, round_to_3_decimal_places(next_easiness_factor))
}

const add_days = (date: Date, days: number): Date => {
  const next_date = new Date(date.getTime())
  next_date.setDate(next_date.getDate() + days)
  return next_date
}

const round_to_3_decimal_places = (value: number): number => Math.round(value * 1000) / 1000

const validate_grade = (grade: number): void => {
  if (Number.isInteger(grade) === false || grade < 0 || grade > 5) {
    throw new Error(`Review grade must be an integer from 0 to 5. received=${grade}`)
  }
}

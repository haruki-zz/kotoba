import { randomUUID } from 'node:crypto'

import {
  REVIEW_LOG_RETENTION_LIMIT,
  type ReviewLog,
  type ReviewState,
  type Word,
} from '../shared/domain_schema'
import { type LibraryRepository } from './library_repository'
import { calculate_sm2_review_state } from './sm2'

export interface ReviewQueueWordItem {
  id: string
  word: string
  reading_kana: string
  meaning_ja: string
  context_scene_ja: string
  example_sentence_ja: string
  review_state: ReviewState
}

export interface ReviewQueueResult {
  due_words: ReviewQueueWordItem[]
  due_count: number
  completed_today_count: number
}

export interface ReviewGradeInput {
  word_id: string
  grade: number
}

export interface ReviewGradeResult {
  reviewed_word_id: string
  updated_review_state: ReviewState
  due_count: number
  completed_today_count: number
  message_ja: string
}

export class ReviewValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ReviewValidationError'
  }
}

export class ReviewWordNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ReviewWordNotFoundError'
  }
}

interface ReviewServiceDeps {
  library_repository: LibraryRepository
  now?: () => Date
}

export class ReviewService {
  private readonly library_repository: LibraryRepository
  private readonly now: () => Date

  constructor(deps: ReviewServiceDeps) {
    this.library_repository = deps.library_repository
    this.now = deps.now ?? (() => new Date())
  }

  async get_review_queue(): Promise<ReviewQueueResult> {
    const now = this.now()
    const library = await this.library_repository.read_library()
    return create_review_queue_result(library.words, now)
  }

  async grade_review(input: ReviewGradeInput): Promise<ReviewGradeResult> {
    if (typeof input.word_id !== 'string' || input.word_id.trim().length === 0) {
      throw new ReviewValidationError('復習対象の単語IDが不正です。')
    }

    validate_review_grade(input.grade)

    const now = this.now()
    const now_iso = now.toISOString()
    let before_review_state: ReviewState | null = null
    let updated_review_state: ReviewState | null = null

    const updated_library = await this.library_repository.update_library((current_library) => {
      const target_index = current_library.words.findIndex((word) => word.id === input.word_id)
      if (target_index < 0) {
        throw new ReviewWordNotFoundError('指定された復習単語が見つかりません。')
      }

      const target_word = current_library.words[target_index]
      const previous_review_state = { ...target_word.review_state }
      const next_review_state = calculate_sm2_review_state({
        review_state: target_word.review_state,
        grade: input.grade,
        now,
      })
      before_review_state = previous_review_state
      updated_review_state = next_review_state

      const next_words = [...current_library.words]
      next_words[target_index] = {
        ...target_word,
        review_state: next_review_state,
        updated_at: now_iso,
      }
      const review_log = create_review_log({
        word_id: target_word.id,
        grade: input.grade,
        reviewed_at: now_iso,
        before_state: previous_review_state,
        after_state: next_review_state,
      })

      return {
        ...current_library,
        updated_at: now_iso,
        words: next_words,
        review_logs: append_review_log(current_library.review_logs, review_log),
      }
    })

    if (before_review_state === null || updated_review_state === null) {
      throw new Error('Review state was not updated.')
    }

    const review_queue = create_review_queue_result(updated_library.words, now)
    return {
      reviewed_word_id: input.word_id,
      updated_review_state,
      due_count: review_queue.due_count,
      completed_today_count: review_queue.completed_today_count,
      message_ja: '復習結果を保存しました',
    }
  }
}

const create_review_queue_result = (words: Word[], now: Date): ReviewQueueResult => {
  const due_words = words
    .filter((word) => is_due_word(word, now))
    .sort((left, right) => {
      const next_review_compare =
        new Date(left.review_state.next_review_at).getTime() -
        new Date(right.review_state.next_review_at).getTime()

      if (next_review_compare !== 0) {
        return next_review_compare
      }

      return left.updated_at.localeCompare(right.updated_at)
    })
    .map(to_review_queue_word_item)

  return {
    due_words,
    due_count: due_words.length,
    completed_today_count: count_completed_today(words, now),
  }
}

const to_review_queue_word_item = (word: Word): ReviewQueueWordItem => ({
  id: word.id,
  word: word.word,
  reading_kana: word.reading_kana,
  meaning_ja: word.meaning_ja,
  context_scene_ja: word.context_scene_ja,
  example_sentence_ja: word.example_sentence_ja,
  review_state: word.review_state,
})

const is_due_word = (word: Word, now: Date): boolean =>
  new Date(word.review_state.next_review_at).getTime() <= now.getTime()

const count_completed_today = (words: Word[], now: Date): number =>
  words.filter((word) => {
    if (word.review_state.last_review_at === null) {
      return false
    }

    return is_same_local_day(new Date(word.review_state.last_review_at), now)
  }).length

const is_same_local_day = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate()

const validate_review_grade = (grade: number): void => {
  if (Number.isInteger(grade) === false || grade < 0 || grade > 5) {
    throw new ReviewValidationError('復習評価は0から5の整数で入力してください。')
  }
}

const create_review_log = (input: {
  word_id: string
  grade: number
  reviewed_at: string
  before_state: ReviewState
  after_state: ReviewState
}): ReviewLog => ({
  id: randomUUID(),
  word_id: input.word_id,
  grade: input.grade,
  reviewed_at: input.reviewed_at,
  before_state: { ...input.before_state },
  after_state: { ...input.after_state },
})

const append_review_log = (review_logs: ReviewLog[], review_log: ReviewLog): ReviewLog[] => {
  const next_review_logs = [...review_logs, review_log]
  if (next_review_logs.length <= REVIEW_LOG_RETENTION_LIMIT) {
    return next_review_logs
  }

  return next_review_logs.slice(-REVIEW_LOG_RETENTION_LIMIT)
}

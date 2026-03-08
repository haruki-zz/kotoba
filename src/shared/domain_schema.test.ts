import { describe, expect, it } from 'vitest'

import {
  AI_FIELD_LIMITS,
  DEFAULT_SETTINGS,
  library_root_schema,
  settings_schema,
} from './domain_schema'

const VALID_TIMESTAMP = '2026-03-07T09:00:00.000Z'

const create_valid_review_state = () => ({
  repetition: 1,
  interval_days: 6,
  easiness_factor: 2.5,
  next_review_at: VALID_TIMESTAMP,
  last_review_at: VALID_TIMESTAMP,
  last_grade: 4,
})

const create_valid_word = () => ({
  id: '11111111-1111-4111-8111-111111111111',
  word: '食べる',
  reading_kana: 'たべる',
  meaning_ja: '食物を口にして栄養を取ることです。',
  context_scene_ja: '朝食や昼食など、食事をする日常の場面です。',
  example_sentence_ja: '毎朝、パンを食べます。',
  source_provider: 'gemini' as const,
  review_state: create_valid_review_state(),
  created_at: VALID_TIMESTAMP,
  updated_at: VALID_TIMESTAMP,
})

const create_valid_review_log = () => ({
  id: '22222222-2222-4222-8222-222222222222',
  word_id: '11111111-1111-4111-8111-111111111111',
  grade: 4,
  reviewed_at: VALID_TIMESTAMP,
  before_state: create_valid_review_state(),
  after_state: {
    ...create_valid_review_state(),
    repetition: 2,
  },
})

const create_valid_library_root = () => ({
  schema_version: 1,
  updated_at: VALID_TIMESTAMP,
  words: [create_valid_word()],
  review_logs: [create_valid_review_log()],
})

describe('library_root_schema', () => {
  it('accepts valid library data', () => {
    const parsed = library_root_schema.parse(create_valid_library_root())
    expect(parsed.schema_version).toBe(1)
    expect(parsed.words).toHaveLength(1)
  })

  it('rejects missing required field', () => {
    const sample = create_valid_library_root()
    const word_without_reading_kana: Partial<(typeof sample.words)[number]> = {
      ...sample.words[0],
    }
    delete word_without_reading_kana.reading_kana
    const invalid_sample = {
      ...sample,
      words: [word_without_reading_kana],
    }

    const result = library_root_schema.safeParse(invalid_sample)
    expect(result.success).toBe(false)

    if (result.success) {
      return
    }

    const has_reading_kana_issue = result.error.issues.some(
      (issue) => issue.path.join('.') === 'words.0.reading_kana'
    )
    expect(has_reading_kana_issue).toBe(true)
  })

  it('rejects AI output longer than limits', () => {
    const sample = create_valid_library_root()
    sample.words[0].reading_kana = 'あ'.repeat(AI_FIELD_LIMITS.reading_kana.max + 1)

    const result = library_root_schema.safeParse(sample)
    expect(result.success).toBe(false)
  })

  it('rejects invalid field type', () => {
    const sample = create_valid_library_root()
    sample.words[0].review_state.repetition = '1' as unknown as number

    const result = library_root_schema.safeParse(sample)
    expect(result.success).toBe(false)
  })

  it('reports missing schema_version with locatable path', () => {
    const sample = create_valid_library_root() as Partial<
      ReturnType<typeof create_valid_library_root>
    >
    delete sample.schema_version

    const result = library_root_schema.safeParse(sample)
    expect(result.success).toBe(false)

    if (result.success) {
      return
    }

    const schema_version_issue = result.error.issues.find(
      (issue) => issue.path.join('.') === 'schema_version'
    )
    expect(schema_version_issue).toBeDefined()
  })

  it('rejects wrong schema_version value with explicit message', () => {
    const sample = create_valid_library_root()
    sample.schema_version = 2

    const result = library_root_schema.safeParse(sample)
    expect(result.success).toBe(false)

    if (result.success) {
      return
    }

    const schema_version_issue = result.error.issues.find(
      (issue) => issue.path.join('.') === 'schema_version'
    )
    expect(schema_version_issue?.message).toContain('schema_version must be 1')
  })
})

describe('settings_schema', () => {
  it('accepts default settings', () => {
    const parsed = settings_schema.parse(DEFAULT_SETTINGS)
    expect(parsed.model).toBe('gemini-2.5-flash')
    expect(parsed.timeout_seconds).toBe(15)
    expect(parsed.retries).toBe(2)
  })

  it('rejects invalid retries type', () => {
    const result = settings_schema.safeParse({
      ...DEFAULT_SETTINGS,
      retries: '2',
    })
    expect(result.success).toBe(false)
  })
})

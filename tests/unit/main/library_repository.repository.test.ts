import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { LibraryRepository } from '../../../src/main/library_repository'

const TEST_TIME = new Date('2026-03-08T09:00:00+09:00')

const create_word_uuid = (index: number): string =>
  `00000000-0000-4000-8000-${index.toString().padStart(12, '0')}`

const create_review_log_uuid = (index: number): string =>
  `10000000-0000-4000-8000-${index.toString().padStart(12, '0')}`

const create_word = (index: number, iso_timestamp: string) => ({
  id: create_word_uuid(index),
  word: `単語${index}`,
  reading_kana: `たんご${index}`,
  meaning_ja: `これは${index}番目の単語の説明です。`,
  context_scene_ja: `学習中に${index}番目の単語を思い出す場面です。`,
  example_sentence_ja: `私は${index}番目の単語を復習します。`,
  source_provider: 'gemini' as const,
  review_state: {
    repetition: 0,
    interval_days: 0,
    easiness_factor: 2.5,
    next_review_at: iso_timestamp,
    last_review_at: null,
    last_grade: null,
  },
  created_at: iso_timestamp,
  updated_at: iso_timestamp,
})

const create_review_log = (index: number, word_id: string, iso_timestamp: string) => ({
  id: create_review_log_uuid(index),
  word_id,
  grade: 4,
  reviewed_at: iso_timestamp,
  before_state: {
    repetition: 0,
    interval_days: 0,
    easiness_factor: 2.5,
    next_review_at: iso_timestamp,
    last_review_at: null,
    last_grade: null,
  },
  after_state: {
    repetition: 1,
    interval_days: 1,
    easiness_factor: 2.5,
    next_review_at: iso_timestamp,
    last_review_at: iso_timestamp,
    last_grade: 4,
  },
})

const temp_dirs: string[] = []

afterEach(async () => {
  await Promise.all(
    temp_dirs.splice(0).map((dir_path) => rm(dir_path, { recursive: true, force: true }))
  )
})

describe('library_repository concurrent writes', () => {
  it('serializes concurrent updates and keeps final JSON parseable without data loss', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'kotoba-repository-'))
    temp_dirs.push(workspace)

    const library_file_path = join(workspace, 'kotoba-library.json')
    const backup_dir_path = join(workspace, 'backups')
    const repository = new LibraryRepository({
      library_file_path,
      backup_dir_path,
      now: () => TEST_TIME,
    })

    await repository.initialize_on_startup()

    const update_count = 24
    await Promise.all(
      Array.from({ length: update_count }, async (_, idx) => {
        const index = idx + 1
        const updated_at = new Date(TEST_TIME.getTime() + index * 1000).toISOString()
        await repository.update_library((current_library) => {
          const word = create_word(index, updated_at)
          const review_log = create_review_log(index, word.id, updated_at)
          return {
            ...current_library,
            updated_at,
            words: [...current_library.words, word],
            review_logs: [...current_library.review_logs, review_log],
          }
        })
      })
    )

    const raw_library_text = await readFile(library_file_path, 'utf8')
    expect(() => JSON.parse(raw_library_text)).not.toThrow()

    const final_library = await repository.read_library()
    expect(final_library.words).toHaveLength(update_count)
    expect(final_library.review_logs).toHaveLength(update_count)
    expect(new Set(final_library.words.map((word) => word.word)).size).toBe(update_count)
  })
})

import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import {
  LIBRARY_SCHEMA_VERSION,
  REVIEW_LOG_RETENTION_LIMIT,
  type ReviewState,
} from '../shared/domain_schema'
import { LibraryRepository } from './library_repository'
import { ReviewService } from './review_service'

const temp_dirs: string[] = []

afterEach(async () => {
  await Promise.all(
    temp_dirs.splice(0).map((dir_path) => rm(dir_path, { recursive: true, force: true }))
  )
})

describe('log-retention', () => {
  it('evicts the oldest review logs when the retention limit is exceeded', async () => {
    const now = new Date('2026-03-16T09:00:00.000Z')
    const word = create_word({
      index: 1,
      word: '保持上限',
      next_review_at: '2026-03-16T09:00:00.000Z',
    })
    const existing_review_logs = Array.from({ length: REVIEW_LOG_RETENTION_LIMIT }, (_, index) =>
      create_review_log(index + 1, word.id)
    )
    const review_service = await create_review_service({
      now,
      words: [word],
      review_logs: existing_review_logs,
    })

    await review_service.service.grade_review({
      word_id: word.id,
      grade: 3,
    })

    const library = await review_service.repository.read_library()
    expect(library.review_logs).toHaveLength(REVIEW_LOG_RETENTION_LIMIT)
    expect(
      library.review_logs.some((review_log) => review_log.id === create_review_log_id(1))
    ).toBe(false)
    expect(library.review_logs[0]?.id).toBe(create_review_log_id(2))

    const latest_review_log = library.review_logs.at(-1)
    expect(latest_review_log).toMatchObject({
      word_id: word.id,
      grade: 3,
      reviewed_at: now.toISOString(),
    })
  })
})

const create_review_service = async (input: {
  now: Date
  words: Array<ReturnType<typeof create_word>>
  review_logs: Array<ReturnType<typeof create_review_log>>
}): Promise<{
  repository: LibraryRepository
  service: ReviewService
}> => {
  const workspace = await mkdtemp(join(tmpdir(), 'kotoba-log-retention-'))
  temp_dirs.push(workspace)

  const repository = new LibraryRepository({
    library_file_path: join(workspace, 'kotoba-library.json'),
    backup_dir_path: join(workspace, 'backups'),
    now: () => input.now,
  })
  await repository.initialize_on_startup()
  await repository.write_library({
    schema_version: LIBRARY_SCHEMA_VERSION,
    updated_at: input.now.toISOString(),
    words: input.words,
    review_logs: input.review_logs,
  })

  return {
    repository,
    service: new ReviewService({
      library_repository: repository,
      now: () => input.now,
    }),
  }
}

const create_review_log_id = (index: number): string =>
  `10000000-0000-4000-8000-${index.toString().padStart(12, '0')}`

const create_word = (input: { index: number; word: string; next_review_at: string }) => {
  const created_at = '2026-03-10T00:00:00.000Z'
  const review_state: ReviewState = {
    repetition: 0,
    interval_days: 0,
    easiness_factor: 2.5,
    next_review_at: input.next_review_at,
    last_review_at: null,
    last_grade: null,
  }

  return {
    id: `00000000-0000-4000-8000-${input.index.toString().padStart(12, '0')}`,
    word: input.word,
    reading_kana: `たんご${input.index}`,
    meaning_ja: `これは${input.index}番目の意味説明です。`,
    context_scene_ja: `これは${input.index}番目の単語を使う学習文脈の説明です。`,
    example_sentence_ja: `これは${input.index}番目の単語を使う例文です。`,
    source_provider: 'gemini' as const,
    review_state,
    created_at,
    updated_at: created_at,
  }
}

const create_review_log = (index: number, word_id: string) => {
  const reviewed_at = `2026-03-${((index % 28) + 1).toString().padStart(2, '0')}T00:00:00.000Z`
  return {
    id: create_review_log_id(index),
    word_id,
    grade: 4,
    reviewed_at,
    before_state: {
      repetition: 0,
      interval_days: 0,
      easiness_factor: 2.5,
      next_review_at: reviewed_at,
      last_review_at: null,
      last_grade: null,
    },
    after_state: {
      repetition: 1,
      interval_days: 1,
      easiness_factor: 2.5,
      next_review_at: reviewed_at,
      last_review_at: reviewed_at,
      last_grade: 4,
    },
  }
}

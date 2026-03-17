import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { LIBRARY_SCHEMA_VERSION, type ReviewState } from '../shared/domain_schema'
import { LibraryRepository } from './library_repository'
import { ReviewService } from './review_service'

const temp_dirs: string[] = []

afterEach(async () => {
  await Promise.all(
    temp_dirs.splice(0).map((dir_path) => rm(dir_path, { recursive: true, force: true }))
  )
})

describe('review-logs', () => {
  it('writes before_state and after_state for every graded review', async () => {
    const now = new Date('2026-03-16T09:00:00.000Z')
    const word = create_word({
      index: 1,
      word: '復習記録',
      next_review_at: '2026-03-16T09:00:00.000Z',
    })
    const review_service = await create_review_service({
      now,
      words: [word],
    })

    const result = await review_service.service.grade_review({
      word_id: word.id,
      grade: 5,
    })

    const library = await review_service.repository.read_library()
    expect(library.review_logs).toHaveLength(1)

    const review_log = library.review_logs[0]
    expect(review_log?.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
    expect(review_log).toMatchObject({
      word_id: word.id,
      grade: 5,
      reviewed_at: now.toISOString(),
      before_state: word.review_state,
      after_state: result.updated_review_state,
    })
  })
})

const create_review_service = async (input: {
  now: Date
  words: Array<ReturnType<typeof create_word>>
}): Promise<{
  repository: LibraryRepository
  service: ReviewService
}> => {
  const workspace = await mkdtemp(join(tmpdir(), 'kotoba-review-logs-'))
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
    review_logs: [],
  })

  return {
    repository,
    service: new ReviewService({
      library_repository: repository,
      now: () => input.now,
    }),
  }
}

const create_word = (input: {
  index: number
  word: string
  next_review_at: string
  last_review_at?: string | null
  last_grade?: number | null
}) => {
  const created_at = '2026-03-10T00:00:00.000Z'
  const review_state: ReviewState = {
    repetition: 0,
    interval_days: 0,
    easiness_factor: 2.5,
    next_review_at: input.next_review_at,
    last_review_at: input.last_review_at ?? null,
    last_grade: input.last_grade ?? null,
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

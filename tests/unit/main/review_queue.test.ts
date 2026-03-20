import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { LIBRARY_SCHEMA_VERSION, type ReviewState } from '../../../src/shared/domain_schema'
import { LibraryRepository } from '../../../src/main/library_repository'
import { ReviewService } from '../../../src/main/review_service'

const temp_dirs: string[] = []

afterEach(async () => {
  await Promise.all(
    temp_dirs.splice(0).map((dir_path) => rm(dir_path, { recursive: true, force: true }))
  )
})

describe('review-queue', () => {
  it('returns all due and overdue words where next_review_at is before or equal to now', async () => {
    const now = new Date('2026-03-15T12:00:00.000Z')
    const review_service = await create_review_service({
      now,
      words: [
        create_word({
          index: 1,
          word: '昨日の単語',
          next_review_at: '2026-03-14T12:00:00.000Z',
        }),
        create_word({
          index: 2,
          word: '今の単語',
          next_review_at: '2026-03-15T12:00:00.000Z',
        }),
        create_word({
          index: 3,
          word: '未来の単語',
          next_review_at: '2026-03-16T12:00:00.000Z',
        }),
      ],
    })

    const queue = await review_service.get_review_queue()
    expect(queue.due_count).toBe(2)
    expect(queue.due_words.map((word) => word.word)).toEqual(['昨日の単語', '今の単語'])
  })

  it('counts completed reviews by local calendar day', async () => {
    const now = new Date(2026, 2, 15, 10, 0, 0, 0)
    const today_reviewed_at = new Date(2026, 2, 15, 8, 30, 0, 0).toISOString()
    const yesterday_reviewed_at = new Date(2026, 2, 14, 23, 30, 0, 0).toISOString()
    const review_service = await create_review_service({
      now,
      words: [
        create_word({
          index: 1,
          word: '今日の復習語',
          next_review_at: new Date(2026, 2, 14, 8, 0, 0, 0).toISOString(),
          last_review_at: today_reviewed_at,
          last_grade: 4,
        }),
        create_word({
          index: 2,
          word: '昨日の復習語',
          next_review_at: new Date(2026, 2, 14, 8, 0, 0, 0).toISOString(),
          last_review_at: yesterday_reviewed_at,
          last_grade: 5,
        }),
      ],
    })

    const queue = await review_service.get_review_queue()
    expect(queue.completed_today_count).toBe(1)
  })

  it('updates review_state immediately and removes the word from the due queue', async () => {
    const now = new Date('2026-03-15T12:00:00.000Z')
    const review_service = await create_review_service({
      now,
      words: [
        create_word({
          index: 1,
          word: '復習対象',
          next_review_at: '2026-03-15T12:00:00.000Z',
        }),
      ],
    })

    const queue_before = await review_service.get_review_queue()
    expect(queue_before.due_count).toBe(1)

    const result = await review_service.grade_review({
      word_id: queue_before.due_words[0]!.id,
      grade: 4,
    })

    expect(result.message_ja).toBe('復習結果を保存しました')
    expect(result.updated_review_state.repetition).toBe(1)
    expect(result.updated_review_state.interval_days).toBe(1)
    expect(result.updated_review_state.last_grade).toBe(4)
    expect(result.updated_review_state.last_review_at).toBe('2026-03-15T12:00:00.000Z')
    expect(result.due_count).toBe(0)
    expect(result.completed_today_count).toBe(1)

    const queue_after = await review_service.get_review_queue()
    expect(queue_after.due_count).toBe(0)
  })
})

const create_review_service = async (input: {
  now: Date
  words: Array<ReturnType<typeof create_word>>
}): Promise<ReviewService> => {
  const workspace = await mkdtemp(join(tmpdir(), 'kotoba-review-queue-'))
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

  return new ReviewService({
    library_repository: repository,
    now: () => input.now,
  })
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

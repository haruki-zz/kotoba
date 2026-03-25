import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { ActivityService } from '../../../src/main/activity_service'
import { LibraryRepository } from '../../../src/main/library_repository'
import { LIBRARY_SCHEMA_VERSION, type ReviewState } from '../../../src/shared/domain_schema'

const temp_dirs: string[] = []

afterEach(async () => {
  await Promise.all(
    temp_dirs.splice(0).map((dir_path) => rm(dir_path, { recursive: true, force: true }))
  )
})

describe('activity-service', () => {
  it('aggregates created words and review logs by local calendar day', async () => {
    const now = new Date(2026, 2, 24, 12, 0, 0, 0)
    const workspace = await mkdtemp(join(tmpdir(), 'kotoba-activity-heatmap-'))
    temp_dirs.push(workspace)

    const repository = new LibraryRepository({
      library_file_path: join(workspace, 'kotoba-library.json'),
      backup_dir_path: join(workspace, 'backups'),
      now: () => now,
    })
    await repository.initialize_on_startup()
    await repository.write_library({
      schema_version: LIBRARY_SCHEMA_VERSION,
      updated_at: now.toISOString(),
      words: [
        create_word({
          index: 1,
          word: '追加一日目',
          created_at: new Date(2026, 2, 22, 9, 0, 0, 0).toISOString(),
          repetition: 0,
        }),
        create_word({
          index: 2,
          word: '追加三日目',
          created_at: new Date(2026, 2, 24, 8, 0, 0, 0).toISOString(),
          repetition: 1,
        }),
        create_word({
          index: 3,
          word: '範囲外',
          created_at: new Date(2025, 11, 1, 8, 0, 0, 0).toISOString(),
          repetition: 4,
        }),
      ],
      review_logs: [
        create_review_log({
          index: 1,
          word_id: '00000000-0000-4000-8000-000000000001',
          reviewed_at: new Date(2026, 2, 23, 10, 0, 0, 0).toISOString(),
        }),
        create_review_log({
          index: 2,
          word_id: '00000000-0000-4000-8000-000000000002',
          reviewed_at: new Date(2026, 2, 24, 20, 0, 0, 0).toISOString(),
        }),
        create_review_log({
          index: 3,
          word_id: '00000000-0000-4000-8000-000000000002',
          reviewed_at: new Date(2026, 2, 24, 21, 0, 0, 0).toISOString(),
        }),
        create_review_log({
          index: 4,
          word_id: '00000000-0000-4000-8000-000000000003',
          reviewed_at: new Date(2025, 11, 1, 9, 0, 0, 0).toISOString(),
        }),
      ],
    })

    const activity_service = new ActivityService({
      library_repository: repository,
      now: () => now,
    })

    const heatmap = await activity_service.get_heatmap()
    expect(heatmap.range_end).toBe('2026-03-24')
    expect(heatmap.range_start).toBe('2025-06-22')
    expect(heatmap.total_activity_count).toBe(7)
    expect(heatmap.total_added_word_count).toBe(3)
    expect(heatmap.total_review_count).toBe(4)
    expect(heatmap.total_word_count).toBe(3)
    expect(heatmap.active_day_count).toBe(4)
    expect(heatmap.current_streak_days).toBe(3)
    expect(heatmap.longest_streak_days).toBe(3)
    expect(heatmap.max_activity_count).toBe(3)
    expect(heatmap.memory_level_stats).toEqual([
      { level: 1, word_count: 1, percentage: 33.3 },
      { level: 2, word_count: 1, percentage: 33.3 },
      { level: 3, word_count: 0, percentage: 0 },
      { level: 4, word_count: 0, percentage: 0 },
      { level: 5, word_count: 1, percentage: 33.3 },
    ])

    const last_day = heatmap.cells.at(-1)
    expect(last_day).toMatchObject({
      date: '2026-03-24',
      activity_count: 3,
      added_word_count: 1,
      review_count: 2,
      level: 3,
      is_today: true,
    })

    const middle_day = heatmap.cells.find((cell) => cell.date === '2026-03-23')
    expect(middle_day).toMatchObject({
      activity_count: 1,
      added_word_count: 0,
      review_count: 1,
      level: 1,
    })

    const older_day = heatmap.cells.find((cell) => cell.date === '2025-12-01')
    expect(older_day).toMatchObject({
      activity_count: 2,
      added_word_count: 1,
      review_count: 1,
      level: 2,
    })
  })
})

const create_word = (input: {
  index: number
  word: string
  created_at: string
  repetition?: number
}) => {
  const review_state: ReviewState = {
    repetition: input.repetition ?? 0,
    interval_days: 0,
    easiness_factor: 2.5,
    next_review_at: input.created_at,
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
    created_at: input.created_at,
    updated_at: input.created_at,
  }
}

const create_review_log = (input: { index: number; word_id: string; reviewed_at: string }) => ({
  id: `10000000-0000-4000-8000-${input.index.toString().padStart(12, '0')}`,
  word_id: input.word_id,
  grade: 4,
  reviewed_at: input.reviewed_at,
  before_state: create_review_state(input.reviewed_at),
  after_state: create_review_state(input.reviewed_at),
})

const create_review_state = (timestamp: string): ReviewState => ({
  repetition: 1,
  interval_days: 1,
  easiness_factor: 2.5,
  next_review_at: timestamp,
  last_review_at: timestamp,
  last_grade: 4,
})

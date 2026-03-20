import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { LIBRARY_SCHEMA_VERSION } from '../../../src/shared/domain_schema'
import { LibraryRepository } from '../../../src/main/library_repository'
import {
  LibraryService,
  LibraryWordNotFoundError,
  normalize_search_text,
} from '../../../src/main/library_service'

const TEST_TIME = new Date('2026-03-12T12:00:00.000Z')
const temp_dirs: string[] = []

afterEach(async () => {
  await Promise.all(
    temp_dirs.splice(0).map((dir_path) => rm(dir_path, { recursive: true, force: true }))
  )
})

describe('library_service', () => {
  it('normalizes search text with trim + NFKC + latin lowercase + kana-insensitive', () => {
    expect(normalize_search_text(' ｶﾀｶﾅAI ')).toBe('かたかなai')
  })

  it('searches by normalized word/reading/meaning', async () => {
    const service = await create_service_with_seed_words()

    const by_kana = await service.list_words({ query: ' ｶﾀｶﾅ ' })
    expect(by_kana.matched_count).toBe(1)
    expect(by_kana.words[0]?.word).toBe('かたかな')

    const by_latin_case = await service.list_words({ query: 'ai' })
    expect(by_latin_case.matched_count).toBe(1)
    expect(by_latin_case.words[0]?.word).toBe('AI')

    const by_meaning = await service.list_words({ query: '技術分野' })
    expect(by_meaning.matched_count).toBe(1)
    expect(by_meaning.words[0]?.word).toBe('AI')
  })

  it('updates and deletes a word', async () => {
    const service = await create_service_with_seed_words()
    const listed = await service.list_words()
    const ai_word = listed.words.find((word) => word.word === 'AI')
    if (!ai_word) {
      throw new Error('Seeded AI word not found')
    }

    const update_result = await service.update_word({
      word_id: ai_word.id,
      word: 'AI',
      reading_kana: 'えーあい',
      meaning_ja: '更新後の意味です。人工知能の応用を幅広く指す言葉です。',
      context_scene_ja: '研究開発や日常利用の幅広い文脈で語られる場面です。',
      example_sentence_ja: '人工知能を活用して作業を効率化します。',
    })
    expect(update_result.message_ja).toBe('単語を更新しました')

    const updated = await service.list_words({ query: '更新後の意味' })
    expect(updated.matched_count).toBe(1)
    expect(updated.words[0]?.id).toBe(ai_word.id)

    const delete_result = await service.delete_word({ word_id: ai_word.id })
    expect(delete_result.message_ja).toBe('単語を削除しました')

    const after_delete = await service.list_words()
    expect(after_delete.total_count).toBe(1)
    expect(after_delete.words[0]?.word).toBe('かたかな')

    await expect(service.delete_word({ word_id: ai_word.id })).rejects.toBeInstanceOf(
      LibraryWordNotFoundError
    )
  })
})

const create_service_with_seed_words = async (): Promise<LibraryService> => {
  const workspace = await mkdtemp(join(tmpdir(), 'kotoba-library-service-'))
  temp_dirs.push(workspace)

  const repository = new LibraryRepository({
    library_file_path: join(workspace, 'kotoba-library.json'),
    backup_dir_path: join(workspace, 'backups'),
    now: () => TEST_TIME,
  })
  await repository.initialize_on_startup()

  const now_iso = TEST_TIME.toISOString()
  await repository.write_library({
    schema_version: LIBRARY_SCHEMA_VERSION,
    updated_at: now_iso,
    review_logs: [],
    words: [
      create_word({
        index: 1,
        word: 'かたかな',
        reading_kana: 'カタカナ',
        meaning_ja: '文字体系を説明するための単語です。',
      }),
      create_word({
        index: 2,
        word: 'AI',
        reading_kana: 'えーあい',
        meaning_ja: '人工知能の技術分野を指す単語です。',
      }),
    ],
  })

  return new LibraryService({
    library_repository: repository,
    now: () => TEST_TIME,
  })
}

interface CreateWordInput {
  index: number
  word: string
  reading_kana: string
  meaning_ja: string
}

const create_word = (input: CreateWordInput) => {
  const iso = TEST_TIME.toISOString()
  return {
    id: `00000000-0000-4000-8000-${input.index.toString().padStart(12, '0')}`,
    word: input.word,
    reading_kana: input.reading_kana,
    meaning_ja: input.meaning_ja,
    context_scene_ja: `この単語を利用する典型的な文脈を示す説明${input.index}です。`,
    example_sentence_ja: `この単語${input.index}を例文で使います。`,
    source_provider: 'gemini' as const,
    review_state: {
      repetition: 0,
      interval_days: 0,
      easiness_factor: 2.5,
      next_review_at: iso,
      last_review_at: null,
      last_grade: null,
    },
    created_at: iso,
    updated_at: iso,
  }
}

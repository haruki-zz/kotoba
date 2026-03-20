import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { LibraryRepository } from '../../../src/main/library_repository'

const temp_dirs: string[] = []

afterEach(async () => {
  await Promise.all(
    temp_dirs.splice(0).map((dir_path) => rm(dir_path, { recursive: true, force: true }))
  )
})

describe('library_repository startup recovery', () => {
  it('recovers corrupted library from the latest valid backup on startup', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'kotoba-recovery-'))
    temp_dirs.push(workspace)

    let now = new Date('2026-03-08T09:00:00+09:00')
    const library_file_path = join(workspace, 'kotoba-library.json')
    const backup_dir_path = join(workspace, 'backups')

    const repository = new LibraryRepository({
      library_file_path,
      backup_dir_path,
      now: () => now,
    })

    await repository.initialize_on_startup()

    await repository.update_library((current_library) => ({
      ...current_library,
      updated_at: now.toISOString(),
      words: [
        ...current_library.words,
        {
          id: '00000000-0000-4000-8000-000000000001',
          word: '復習',
          reading_kana: 'ふくしゅう',
          meaning_ja: '学んだ内容をもう一度確認することです。',
          context_scene_ja: '授業後に覚えた語彙を繰り返して確認する場面です。',
          example_sentence_ja: '毎晩、授業の内容を復習します。',
          source_provider: 'gemini' as const,
          review_state: {
            repetition: 0,
            interval_days: 0,
            easiness_factor: 2.5,
            next_review_at: now.toISOString(),
            last_review_at: null,
            last_grade: null,
          },
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
      ],
    }))

    now = new Date('2026-03-09T09:00:00+09:00')
    await repository.update_library((current_library) => ({
      ...current_library,
      updated_at: now.toISOString(),
    }))

    await writeFile(library_file_path, '{ invalid json', 'utf8')

    const startup_result = await repository.initialize_on_startup()
    expect(startup_result.status).toBe('recovered')
    expect(startup_result.message).toContain('Recovered library from backup')

    const recovered_library = await repository.read_library()
    expect(recovered_library.words).toHaveLength(1)
    expect(recovered_library.words[0].word).toBe('復習')
  })

  it('throws a clear error when library is corrupted and no valid backup exists', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'kotoba-recovery-fail-'))
    temp_dirs.push(workspace)

    const library_file_path = join(workspace, 'kotoba-library.json')
    const backup_dir_path = join(workspace, 'backups')
    const repository = new LibraryRepository({
      library_file_path,
      backup_dir_path,
      now: () => new Date('2026-03-08T09:00:00+09:00'),
    })

    await writeFile(library_file_path, '{ broken', 'utf8')

    await expect(repository.initialize_on_startup()).rejects.toThrow(
      'Library file is corrupted and no valid backup was found'
    )
  })
})

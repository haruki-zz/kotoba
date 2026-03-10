import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { LibraryRepository, type LibraryMigration } from './library_repository'

const temp_dirs: string[] = []

afterEach(async () => {
  await Promise.all(
    temp_dirs.splice(0).map((dir_path) => rm(dir_path, { recursive: true, force: true }))
  )
})

const create_schema_v0_library = (updated_at: string) => ({
  schema_version: 0,
  updated_at,
  words: [
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
        next_review_at: updated_at,
        last_review_at: null,
        last_grade: null,
      },
      created_at: updated_at,
      updated_at,
    },
  ],
})

describe('library_repository rollback', () => {
  it('rolls back to original file when migration throws and keeps the file migratable', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'kotoba-rollback-'))
    temp_dirs.push(workspace)

    const legacy_updated_at = '2026-03-01T00:00:00.000Z'
    const migration_now = new Date('2026-03-10T09:00:00+09:00')
    const library_file_path = join(workspace, 'kotoba-library.json')
    const backup_dir_path = join(workspace, 'backups')
    const original_text = `${JSON.stringify(
      create_schema_v0_library(legacy_updated_at),
      null,
      2
    )}\n`

    await writeFile(library_file_path, original_text, 'utf8')

    const failing_migration: LibraryMigration = {
      from_version: 0,
      to_version: 1,
      migrate: () => {
        throw new Error('forced migration failure for rollback test')
      },
    }

    const repository_with_failure = new LibraryRepository({
      library_file_path,
      backup_dir_path,
      now: () => migration_now,
      migrations: [failing_migration],
    })

    await expect(repository_with_failure.initialize_on_startup()).rejects.toThrow(
      'Library migration failed and was rolled back from backup'
    )

    const file_after_failed_migration = await readFile(library_file_path, 'utf8')
    expect(file_after_failed_migration).toBe(original_text)

    const repository_after_rollback = new LibraryRepository({
      library_file_path,
      backup_dir_path,
      now: () => new Date('2026-03-11T09:00:00+09:00'),
    })

    const startup_result = await repository_after_rollback.initialize_on_startup()
    expect(startup_result.status).toBe('migrated')

    const final_library = await repository_after_rollback.read_library()
    expect(final_library.schema_version).toBe(1)
    expect(final_library.words).toHaveLength(1)
  })
})

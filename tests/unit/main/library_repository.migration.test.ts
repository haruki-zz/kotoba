import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
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

describe('library_repository migration', () => {
  it('migrates schema v0 file to v1 and updates updated_at with forced backup', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'kotoba-migration-'))
    temp_dirs.push(workspace)

    const legacy_updated_at = '2026-03-01T00:00:00.000Z'
    const migration_now = new Date('2026-03-10T09:00:00+09:00')
    const library_file_path = join(workspace, 'kotoba-library.json')
    const backup_dir_path = join(workspace, 'backups')

    await writeFile(
      library_file_path,
      `${JSON.stringify(create_schema_v0_library(legacy_updated_at), null, 2)}\n`,
      'utf8'
    )

    const repository = new LibraryRepository({
      library_file_path,
      backup_dir_path,
      now: () => migration_now,
    })

    const startup_result = await repository.initialize_on_startup()
    expect(startup_result.status).toBe('migrated')
    expect(startup_result.migrated_from_version).toBe(0)

    const migrated_library = await repository.read_library()
    expect(migrated_library.schema_version).toBe(1)
    expect(migrated_library.updated_at).toBe(migration_now.toISOString())
    expect(migrated_library.words).toHaveLength(1)
    expect(migrated_library.review_logs).toHaveLength(0)

    const backup_files = (await readdir(backup_dir_path)).filter((entry) => entry.endsWith('.json'))
    expect(backup_files).toHaveLength(1)
    expect(backup_files[0]).toContain('-migration-')

    const backup_content = await readFile(join(backup_dir_path, backup_files[0]), 'utf8')
    const backup_json = JSON.parse(backup_content) as {
      schema_version: number
      review_logs?: unknown
    }
    expect(backup_json.schema_version).toBe(0)
    expect(backup_json.review_logs).toBeUndefined()
  })
})

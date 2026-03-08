import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { LibraryRepository } from './library_repository'

const temp_dirs: string[] = []

afterEach(async () => {
  await Promise.all(
    temp_dirs.splice(0).map((dir_path) => rm(dir_path, { recursive: true, force: true }))
  )
})

describe('library_repository daily backup', () => {
  it('creates backup only once for the first write of each local day', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'kotoba-backup-'))
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
    }))

    let backups = (await readdir(backup_dir_path)).filter((entry) => entry.endsWith('.json'))
    expect(backups).toHaveLength(1)

    await repository.update_library((current_library) => ({
      ...current_library,
      updated_at: new Date(now.getTime() + 60_000).toISOString(),
    }))

    backups = (await readdir(backup_dir_path)).filter((entry) => entry.endsWith('.json'))
    expect(backups).toHaveLength(1)

    now = new Date('2026-03-09T09:00:00+09:00')
    await repository.update_library((current_library) => ({
      ...current_library,
      updated_at: now.toISOString(),
    }))

    backups = (await readdir(backup_dir_path)).filter((entry) => entry.endsWith('.json'))
    expect(backups).toHaveLength(2)
  })
})

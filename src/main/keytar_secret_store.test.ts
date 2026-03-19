import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { LibraryRepository } from './library_repository'
import {
  create_file_secret_store,
  create_keytar_secret_store,
  type KeytarClient,
} from './keytar_secret_store'
import { SettingsRepository } from './settings_repository'

const temp_dirs: string[] = []

afterEach(async () => {
  await Promise.all(
    temp_dirs.splice(0).map((dir_path) => rm(dir_path, { recursive: true, force: true }))
  )
})

const create_memory_keytar_client = (): KeytarClient => {
  const secret_map = new Map<string, string>()
  const to_key = (service: string, account: string): string => `${service}::${account}`

  return {
    async getPassword(service: string, account: string): Promise<string | null> {
      return secret_map.get(to_key(service, account)) ?? null
    },
    async setPassword(service: string, account: string, password: string): Promise<void> {
      secret_map.set(to_key(service, account), password)
    },
    async deletePassword(service: string, account: string): Promise<boolean> {
      return secret_map.delete(to_key(service, account))
    },
  }
}

describe('keytar_secret_store', () => {
  it('stores, reads and deletes api key through keytar adapter', async () => {
    const keytar_client = create_memory_keytar_client()
    const secret_store = create_keytar_secret_store(keytar_client)

    expect(await secret_store.get_api_key()).toBeNull()

    await secret_store.set_api_key('  sample-api-key  ')
    expect(await secret_store.get_api_key()).toBe('sample-api-key')

    await secret_store.delete_api_key()
    expect(await secret_store.get_api_key()).toBeNull()
  })

  it('stores api key in a test file store when requested', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'kotoba-keytar-file-store-'))
    temp_dirs.push(workspace)

    const secret_file_path = join(workspace, 'secret.txt')
    const secret_store = create_file_secret_store(secret_file_path)

    expect(await secret_store.get_api_key()).toBeNull()

    await secret_store.set_api_key('  file-store-key  ')
    expect(await secret_store.get_api_key()).toBe('file-store-key')

    const secret_raw = await readFile(secret_file_path, 'utf8')
    expect(secret_raw).toContain('file-store-key')

    await secret_store.delete_api_key()
    expect(await secret_store.get_api_key()).toBeNull()
  })

  it('keeps api key out of settings and library json files', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'kotoba-keytar-files-'))
    temp_dirs.push(workspace)

    const api_key = 'secret-key-from-keytar'
    const settings_file_path = join(workspace, 'kotoba-settings.json')
    const library_file_path = join(workspace, 'kotoba-library.json')
    const backup_dir_path = join(workspace, 'backups')

    const settings_repository = new SettingsRepository({ settings_file_path })
    await settings_repository.read_settings()

    const library_repository = new LibraryRepository({
      library_file_path,
      backup_dir_path,
      now: () => new Date('2026-03-10T09:00:00+09:00'),
    })
    await library_repository.initialize_on_startup()
    await library_repository.update_library((current_library) => ({
      ...current_library,
      updated_at: new Date('2026-03-10T10:00:00+09:00').toISOString(),
    }))

    const keytar_client = create_memory_keytar_client()
    const secret_store = create_keytar_secret_store(keytar_client)
    await secret_store.set_api_key(api_key)

    const settings_raw = await readFile(settings_file_path, 'utf8')
    const library_raw = await readFile(library_file_path, 'utf8')

    expect(settings_raw).not.toContain(api_key)
    expect(library_raw).not.toContain(api_key)
  })
})

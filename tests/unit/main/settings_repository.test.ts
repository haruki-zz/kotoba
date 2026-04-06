import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { DEFAULT_SETTINGS } from '../../../src/shared/domain_schema'
import {
  create_keytar_secret_store,
  type KeytarClient,
} from '../../../src/main/keytar_secret_store'
import {
  delete_api_key,
  read_settings_overview,
  save_settings,
  SETTINGS_API_KEY_MISSING_CODE,
  SettingsApiKeyMissingError,
  SettingsValidationError,
  load_ai_runtime_settings,
} from '../../../src/main/settings_service'
import { SettingsRepository } from '../../../src/main/settings_repository'

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

describe('settings_repository', () => {
  it('applies default settings on first startup and persists them to file', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'kotoba-settings-default-'))
    temp_dirs.push(workspace)

    const settings_file_path = join(workspace, 'kotoba-settings.json')
    const repository = new SettingsRepository({ settings_file_path })

    const settings = await repository.read_settings()
    expect(settings).toEqual(DEFAULT_SETTINGS)

    const settings_raw = await readFile(settings_file_path, 'utf8')
    expect(settings_raw).toContain('"model": "gemini-2.5-flash"')
    expect(settings_raw).toContain('"timeout_seconds": 15')
    expect(settings_raw).toContain('"retries": 2')
  })

  it('updates and persists configured provider settings', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'kotoba-settings-update-'))
    temp_dirs.push(workspace)

    const settings_file_path = join(workspace, 'kotoba-settings.json')
    const repository = new SettingsRepository({ settings_file_path })

    const updated = await repository.update_settings((current_settings) => ({
      ...current_settings,
      model: 'gemini-2.5-pro',
      timeout_seconds: 30,
      retries: 4,
    }))

    expect(updated.provider).toBe('gemini')
    expect(updated.model).toBe('gemini-2.5-pro')
    expect(updated.timeout_seconds).toBe(30)
    expect(updated.retries).toBe(4)

    const reloaded = await repository.read_settings()
    expect(reloaded).toEqual(updated)
  })
})

describe('settings_service', () => {
  it('throws guidance error when api key is missing and succeeds after api key is set', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'kotoba-settings-service-'))
    temp_dirs.push(workspace)

    const settings_file_path = join(workspace, 'kotoba-settings.json')
    const settings_repository = new SettingsRepository({ settings_file_path })
    const keytar_client = create_memory_keytar_client()
    const api_key_secret_store = create_keytar_secret_store(keytar_client)

    const missing_api_key_error = await load_ai_runtime_settings({
      settings_repository,
      api_key_secret_store,
    }).catch((error: unknown) => error)

    expect(missing_api_key_error).toBeInstanceOf(SettingsApiKeyMissingError)
    expect((missing_api_key_error as SettingsApiKeyMissingError).code).toBe(
      SETTINGS_API_KEY_MISSING_CODE
    )
    expect((missing_api_key_error as SettingsApiKeyMissingError).message).toContain('設定ページ')

    await api_key_secret_store.set_api_key('gemini', '  test-gemini-key  ')

    const runtime_settings = await load_ai_runtime_settings({
      settings_repository,
      api_key_secret_store,
    })

    expect(runtime_settings.model).toBe(DEFAULT_SETTINGS.model)
    expect(runtime_settings.timeout_seconds).toBe(DEFAULT_SETTINGS.timeout_seconds)
    expect(runtime_settings.retries).toBe(DEFAULT_SETTINGS.retries)
    expect(runtime_settings.api_key).toBe('test-gemini-key')
  })

  it('reads settings overview and saves settings without exposing the existing api key', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'kotoba-settings-overview-'))
    temp_dirs.push(workspace)

    const settings_file_path = join(workspace, 'kotoba-settings.json')
    const settings_repository = new SettingsRepository({ settings_file_path })
    const keytar_client = create_memory_keytar_client()
    const api_key_secret_store = create_keytar_secret_store(keytar_client)

    const initial_overview = await read_settings_overview({
      settings_repository,
      api_key_secret_store,
    })
    expect(initial_overview.api_key_status_by_provider.gemini).toBe(false)
    expect(initial_overview.api_key_status_by_provider.openai).toBe(false)
    expect(initial_overview.model).toBe(DEFAULT_SETTINGS.model)

    const saved = await save_settings(
      {
        settings_repository,
        api_key_secret_store,
      },
      {
        provider: 'openai',
        model: 'gpt-4.1-mini',
        timeout_seconds: 20,
        retries: 3,
        api_key: '  new-secret-key  ',
      }
    )

    expect(saved.provider).toBe('openai')
    expect(saved.model).toBe('gpt-4.1-mini')
    expect(saved.timeout_seconds).toBe(20)
    expect(saved.retries).toBe(3)
    expect(saved.api_key_status_by_provider.openai).toBe(true)
    expect(saved.api_key_status_by_provider.gemini).toBe(false)
    expect(saved.message_ja).toContain('API キーを更新')
    expect(await api_key_secret_store.get_api_key('openai')).toBe('new-secret-key')

    const saved_again = await save_settings(
      {
        settings_repository,
        api_key_secret_store,
      },
      {
        provider: 'openai',
        model: 'gpt-4o-mini',
        timeout_seconds: 15,
        retries: 2,
        api_key: '   ',
      }
    )

    expect(saved_again.model).toBe('gpt-4o-mini')
    expect(saved_again.api_key_status_by_provider.openai).toBe(true)
    expect(saved_again.message_ja).toBe('設定を保存しました。')
    expect(await api_key_secret_store.get_api_key('openai')).toBe('new-secret-key')
  })

  it('deletes api key and rejects invalid settings input', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'kotoba-settings-delete-'))
    temp_dirs.push(workspace)

    const settings_file_path = join(workspace, 'kotoba-settings.json')
    const settings_repository = new SettingsRepository({ settings_file_path })
    const keytar_client = create_memory_keytar_client()
    const api_key_secret_store = create_keytar_secret_store(keytar_client)

    await api_key_secret_store.set_api_key('gemini', 'delete-me')

    const deleted = await delete_api_key({
      settings_repository,
      api_key_secret_store,
    })
    expect(deleted.api_key_status_by_provider.gemini).toBe(false)
    expect(deleted.message_ja).toBe('API キーを削除しました。')
    expect(await api_key_secret_store.get_api_key('gemini')).toBeNull()

    const invalid_error = await save_settings(
      {
        settings_repository,
        api_key_secret_store,
      },
      {
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        timeout_seconds: 0,
        retries: 2,
      }
    ).catch((error: unknown) => error)

    expect(invalid_error).toBeInstanceOf(SettingsValidationError)
    expect((invalid_error as SettingsValidationError).message).toContain('タイムアウト')
  })

  it('rejects models that do not belong to the selected provider', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'kotoba-settings-model-validation-'))
    temp_dirs.push(workspace)

    const settings_file_path = join(workspace, 'kotoba-settings.json')
    const settings_repository = new SettingsRepository({ settings_file_path })
    const keytar_client = create_memory_keytar_client()
    const api_key_secret_store = create_keytar_secret_store(keytar_client)

    const invalid_error = await save_settings(
      {
        settings_repository,
        api_key_secret_store,
      },
      {
        provider: 'anthropic',
        model: 'gemini-2.5-flash',
        timeout_seconds: 15,
        retries: 2,
      }
    ).catch((error: unknown) => error)

    expect(invalid_error).toBeInstanceOf(SettingsValidationError)
    expect((invalid_error as SettingsValidationError).message).toContain('使えるモデル')
  })
})

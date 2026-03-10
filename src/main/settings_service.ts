import type { Settings } from '../shared/domain_schema'
import type { ApiKeySecretStore } from './keytar_secret_store'
import type { SettingsRepository } from './settings_repository'

export const SETTINGS_API_KEY_MISSING_CODE = 'SETTINGS_API_KEY_MISSING' as const

export class SettingsApiKeyMissingError extends Error {
  readonly code = SETTINGS_API_KEY_MISSING_CODE

  constructor() {
    super('API Key is not configured. 設定ページで API Key を設定してください。')
    this.name = 'SettingsApiKeyMissingError'
  }
}

export interface AiRuntimeSettings extends Settings {
  api_key: string
}

export interface SettingsServiceDeps {
  settings_repository: SettingsRepository
  api_key_secret_store: ApiKeySecretStore
}

export const load_ai_runtime_settings = async (
  deps: SettingsServiceDeps
): Promise<AiRuntimeSettings> => {
  const settings = await deps.settings_repository.read_settings()
  const api_key = await deps.api_key_secret_store.get_api_key()

  if (api_key === null) {
    throw new SettingsApiKeyMissingError()
  }

  return {
    ...settings,
    api_key,
  }
}

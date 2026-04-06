import {
  AI_PROVIDERS,
  is_supported_model_for_provider,
  type AiProviderName,
} from '../shared/ai_catalog'
import { settings_schema, type Settings } from '../shared/domain_schema'
import type { ApiKeySecretStore } from './keytar_secret_store'
import type { SettingsRepository } from './settings_repository'

export const SETTINGS_API_KEY_MISSING_CODE = 'SETTINGS_API_KEY_MISSING' as const

export class SettingsApiKeyMissingError extends Error {
  readonly code = SETTINGS_API_KEY_MISSING_CODE

  constructor() {
    super(
      'API キーが設定されていません。設定ページで API キーを設定してから、もう一度お試しください。'
    )
    this.name = 'SettingsApiKeyMissingError'
  }
}

export interface AiRuntimeSettings extends Settings {
  api_key: string
}

export interface SettingsOverview extends Settings {
  api_key_status_by_provider: Record<AiProviderName, boolean>
}

export interface SettingsServiceDeps {
  settings_repository: SettingsRepository
  api_key_secret_store: ApiKeySecretStore
}

export interface SaveSettingsInput {
  provider: AiProviderName
  model: string
  timeout_seconds: number
  retries: number
  api_key?: string
}

export interface SaveSettingsResult extends SettingsOverview {
  message_ja: string
}

export interface DeleteApiKeyResult extends SettingsOverview {
  message_ja: string
}

export class SettingsValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SettingsValidationError'
  }
}

export const load_ai_runtime_settings = async (
  deps: SettingsServiceDeps
): Promise<AiRuntimeSettings> => {
  const settings = await deps.settings_repository.read_settings()
  const api_key = await deps.api_key_secret_store.get_api_key(settings.provider)

  if (api_key === null) {
    throw new SettingsApiKeyMissingError()
  }

  return {
    ...settings,
    api_key,
  }
}

export const read_settings_overview = async (
  deps: SettingsServiceDeps
): Promise<SettingsOverview> => {
  const settings = await deps.settings_repository.read_settings()
  return to_settings_overview(deps, settings)
}

export const save_settings = async (
  deps: SettingsServiceDeps,
  input: SaveSettingsInput
): Promise<SaveSettingsResult> => {
  const next_settings = validate_settings_input(input)
  const saved_settings = await deps.settings_repository.write_settings(next_settings)

  const normalized_api_key = normalize_api_key(input.api_key)
  let api_key_updated = false
  if (normalized_api_key !== null) {
    await deps.api_key_secret_store.set_api_key(saved_settings.provider, normalized_api_key)
    api_key_updated = true
  }

  const overview = await to_settings_overview(deps, saved_settings)
  return {
    ...overview,
    message_ja: api_key_updated ? '設定を保存し、API キーを更新しました。' : '設定を保存しました。',
  }
}

export const delete_api_key = async (deps: SettingsServiceDeps): Promise<DeleteApiKeyResult> => {
  const settings = await deps.settings_repository.read_settings()
  await deps.api_key_secret_store.delete_api_key(settings.provider)
  const api_key_status_by_provider = await load_api_key_status_by_provider(deps)
  return {
    ...settings,
    api_key_status_by_provider,
    message_ja: 'API キーを削除しました。',
  }
}

const to_settings_overview = async (
  deps: SettingsServiceDeps,
  settings: Settings
): Promise<SettingsOverview> => ({
  ...settings,
  api_key_status_by_provider: await load_api_key_status_by_provider(deps),
})

const validate_settings_input = (input: SaveSettingsInput): Settings => {
  if (AI_PROVIDERS.includes(input.provider) === false) {
    throw new SettingsValidationError('プロバイダーの選択が不正です。')
  }

  const model = input.model.trim()
  if (model.length === 0) {
    throw new SettingsValidationError('モデルを選択してください。')
  }

  if (model.length > 128) {
    throw new SettingsValidationError('モデル名は 128 文字以内で入力してください。')
  }

  if (is_supported_model_for_provider(input.provider, model) === false) {
    throw new SettingsValidationError('選択したプロバイダーで使えるモデルを選択してください。')
  }

  if (Number.isInteger(input.timeout_seconds) === false) {
    throw new SettingsValidationError('タイムアウトは整数で入力してください。')
  }

  if (input.timeout_seconds < 1 || input.timeout_seconds > 120) {
    throw new SettingsValidationError('タイムアウトは 1〜120 秒で入力してください。')
  }

  if (Number.isInteger(input.retries) === false) {
    throw new SettingsValidationError('リトライ回数は整数で入力してください。')
  }

  if (input.retries < 0 || input.retries > 8) {
    throw new SettingsValidationError('リトライ回数は 0〜8 回で入力してください。')
  }

  const parsed = settings_schema.safeParse({
    provider: input.provider,
    model,
    timeout_seconds: input.timeout_seconds,
    retries: input.retries,
  })

  if (parsed.success === false) {
    throw new SettingsValidationError('設定内容が不正です。値を見直してください。')
  }

  return parsed.data
}

const normalize_api_key = (api_key: string | undefined): string | null => {
  if (typeof api_key !== 'string') {
    return null
  }

  const normalized = api_key.trim()
  return normalized.length > 0 ? normalized : null
}

const load_api_key_status_by_provider = async (
  deps: SettingsServiceDeps
): Promise<Record<AiProviderName, boolean>> => {
  const entries = await Promise.all(
    AI_PROVIDERS.map(
      async (provider) =>
        [provider, (await deps.api_key_secret_store.get_api_key(provider)) !== null] as const
    )
  )

  return Object.fromEntries(entries) as Record<AiProviderName, boolean>
}

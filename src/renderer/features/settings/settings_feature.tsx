import { useCallback, useEffect, useMemo, useState } from 'react'

import { DEFAULT_MODEL_BY_PROVIDER, type AiProviderName } from '@/shared/ai_catalog'
import { SettingsPage } from '@/renderer/features/settings/settings_page'
import {
  IPC_CHANNELS,
  type IpcResponse,
  type SettingsDeleteApiKeyResult,
  type SettingsGetResult,
  type SettingsSaveResult,
} from '@/shared/ipc'

type SettingsForm = {
  provider: AiProviderName
  model: string
  timeout_seconds: string
  retries: string
  api_key: string
}

const EMPTY_SETTINGS_FORM: SettingsForm = {
  provider: 'gemini',
  model: DEFAULT_MODEL_BY_PROVIDER.gemini,
  timeout_seconds: '',
  retries: '',
  api_key: '',
}

const EMPTY_API_KEY_STATUS_BY_PROVIDER: Record<AiProviderName, boolean> = {
  gemini: false,
  openai: false,
  anthropic: false,
}

const to_settings_form = (settings: SettingsGetResult): SettingsForm => ({
  provider: settings.provider,
  model: settings.model,
  timeout_seconds: String(settings.timeout_seconds),
  retries: String(settings.retries),
  api_key: '',
})

const parse_non_negative_integer = (value: string): number | null => {
  const normalized = value.trim()
  if (/^\d+$/.test(normalized) === false) {
    return null
  }

  return Number.parseInt(normalized, 10)
}

export const SettingsFeature = () => {
  const [form, set_form] = useState<SettingsForm>(EMPTY_SETTINGS_FORM)
  const [api_key_status_by_provider, set_api_key_status_by_provider] = useState<
    Record<AiProviderName, boolean>
  >(EMPTY_API_KEY_STATUS_BY_PROVIDER)
  const [status_message, set_status_message] = useState<string>('')
  const [error_message, set_error_message] = useState<string>('')
  const [is_loading, set_is_loading] = useState<boolean>(false)
  const [is_saving, set_is_saving] = useState<boolean>(false)
  const [is_deleting_api_key, set_is_deleting_api_key] = useState<boolean>(false)

  const load_settings_page = useCallback(async (): Promise<void> => {
    set_is_loading(true)

    const response = (await window.kotoba.invoke(
      IPC_CHANNELS.SETTINGS_GET
    )) as IpcResponse<SettingsGetResult>

    set_is_loading(false)
    if (response.ok === false) {
      set_error_message(response.error.message)
      return
    }

    set_form(to_settings_form(response.data))
    set_api_key_status_by_provider(response.data.api_key_status_by_provider)
    set_error_message('')
  }, [])

  useEffect(() => {
    set_status_message('')
    set_error_message('')
    void load_settings_page()
  }, [load_settings_page])

  const handle_settings_field = (field: keyof SettingsForm, value: string): void => {
    if (field === 'provider') {
      const next_provider = value as AiProviderName
      set_form((current) => ({
        ...current,
        provider: next_provider,
        model: DEFAULT_MODEL_BY_PROVIDER[next_provider],
        api_key: '',
      }))
      return
    }

    set_form((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handle_settings_save = async (): Promise<void> => {
    const model = form.model.trim()
    if (model.length === 0) {
      set_error_message('モデルを選択してください。')
      set_status_message('')
      return
    }

    const timeout_seconds = parse_non_negative_integer(form.timeout_seconds)
    if (timeout_seconds === null) {
      set_error_message('タイムアウトは整数で入力してください。')
      set_status_message('')
      return
    }

    const retries = parse_non_negative_integer(form.retries)
    if (retries === null) {
      set_error_message('リトライ回数は整数で入力してください。')
      set_status_message('')
      return
    }

    set_is_saving(true)
    set_status_message('')
    set_error_message('')

    const response = (await window.kotoba.invoke(IPC_CHANNELS.SETTINGS_SAVE, {
      provider: form.provider,
      model,
      timeout_seconds,
      retries,
      api_key: form.api_key,
    })) as IpcResponse<SettingsSaveResult>

    set_is_saving(false)
    if (response.ok === false) {
      set_error_message(response.error.message)
      return
    }

    set_form(to_settings_form(response.data))
    set_api_key_status_by_provider(response.data.api_key_status_by_provider)
    set_status_message(response.data.message_ja)
  }

  const handle_delete_api_key = async (): Promise<void> => {
    set_is_deleting_api_key(true)
    set_status_message('')
    set_error_message('')

    const response = (await window.kotoba.invoke(
      IPC_CHANNELS.SETTINGS_DELETE_API_KEY
    )) as IpcResponse<SettingsDeleteApiKeyResult>

    set_is_deleting_api_key(false)
    if (response.ok === false) {
      set_error_message(response.error.message)
      return
    }

    set_form(to_settings_form(response.data))
    set_api_key_status_by_provider(response.data.api_key_status_by_provider)
    set_status_message(response.data.message_ja)
  }

  const save_disabled = useMemo(
    () =>
      is_loading ||
      is_saving ||
      form.model.trim().length === 0 ||
      form.timeout_seconds.trim().length === 0 ||
      form.retries.trim().length === 0,
    [form, is_loading, is_saving]
  )

  const delete_disabled = useMemo(
    () =>
      is_loading ||
      is_saving ||
      is_deleting_api_key ||
      api_key_status_by_provider[form.provider] === false,
    [api_key_status_by_provider, form.provider, is_deleting_api_key, is_loading, is_saving]
  )

  return (
    <SettingsPage
      api_key_status_by_provider={api_key_status_by_provider}
      delete_disabled={delete_disabled}
      error_message={error_message}
      form={form}
      is_deleting_api_key={is_deleting_api_key}
      is_loading={is_loading}
      is_saving={is_saving}
      on_delete_api_key={handle_delete_api_key}
      on_field_change={handle_settings_field}
      on_save={handle_settings_save}
      save_disabled={save_disabled}
      status_message={status_message}
    />
  )
}

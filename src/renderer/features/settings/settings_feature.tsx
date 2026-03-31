import { useCallback, useEffect, useMemo, useState } from 'react'

import { SettingsPage } from '@/renderer/features/settings/settings_page'
import {
  IPC_CHANNELS,
  type IpcResponse,
  type SettingsDeleteApiKeyResult,
  type SettingsGetResult,
  type SettingsSaveResult,
} from '@/shared/ipc'

type SettingsForm = {
  model: string
  timeout_seconds: string
  retries: string
  api_key: string
}

const EMPTY_SETTINGS_FORM: SettingsForm = {
  model: '',
  timeout_seconds: '',
  retries: '',
  api_key: '',
}

const to_settings_form = (settings: SettingsGetResult): SettingsForm => ({
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
  const [has_api_key, set_has_api_key] = useState<boolean>(false)
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
    set_has_api_key(response.data.has_api_key)
    set_error_message('')
  }, [])

  useEffect(() => {
    set_status_message('')
    set_error_message('')
    void load_settings_page()
  }, [load_settings_page])

  const handle_settings_field = (field: keyof SettingsForm, value: string): void => {
    set_form((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handle_settings_save = async (): Promise<void> => {
    const model = form.model.trim()
    if (model.length === 0) {
      set_error_message('モデル名を入力してください。')
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
    set_has_api_key(response.data.has_api_key)
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

    set_form((current) => ({
      ...current,
      api_key: '',
      model: response.data.model,
      timeout_seconds: String(response.data.timeout_seconds),
      retries: String(response.data.retries),
    }))
    set_has_api_key(response.data.has_api_key)
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
    () => is_loading || is_saving || is_deleting_api_key || has_api_key === false,
    [has_api_key, is_deleting_api_key, is_loading, is_saving]
  )

  return (
    <SettingsPage
      delete_disabled={delete_disabled}
      error_message={error_message}
      form={form}
      has_api_key={has_api_key}
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

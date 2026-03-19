export const IPC_BRIDGE_CHANNEL = 'kotoba:invoke' as const

export const IPC_CHANNELS = {
  APP_PING: 'app:ping',
  APP_STARTUP_STATUS: 'app:startup-status',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SAVE: 'settings:save',
  SETTINGS_DELETE_API_KEY: 'settings:delete-api-key',
  WORD_ADD_GENERATE: 'word-add:generate',
  WORD_ADD_SAVE: 'word-add:save',
  WORD_ADD_DRAFT_LOAD: 'word-add:draft:load',
  WORD_ADD_DRAFT_SAVE: 'word-add:draft:save',
  WORD_ADD_DRAFT_CLEAR: 'word-add:draft:clear',
  LIBRARY_LIST: 'library:list',
  LIBRARY_UPDATE: 'library:update',
  LIBRARY_DELETE: 'library:delete',
  REVIEW_QUEUE: 'review:queue',
  REVIEW_GRADE: 'review:grade',
} as const

export type IpcAllowedChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]

export type IpcErrorCode =
  | 'IPC_ENVELOPE_INVALID'
  | 'IPC_CHANNEL_NOT_ALLOWED'
  | 'IPC_PAYLOAD_INVALID'
  | 'IPC_INTERNAL_ERROR'
  | 'APP_API_KEY_MISSING'
  | 'APP_VALIDATION_ERROR'
  | 'APP_GENERATION_FAILED'
  | 'APP_STORAGE_ERROR'
  | 'APP_NOT_FOUND'

export interface IpcEnvelope {
  channel: string
  payload?: unknown
}

export interface PingPayload {
  message: string
}

export interface PingResult {
  echoed_message: string
  received_at: string
}

export interface AppStartupStatusResult {
  notice_ja: string | null
  notice_kind: 'info' | 'warning' | null
}

export interface SettingsGetResult {
  provider: 'gemini'
  model: string
  timeout_seconds: number
  retries: number
  has_api_key: boolean
}

export interface SettingsSavePayload {
  model: string
  timeout_seconds: number
  retries: number
  api_key?: string
}

export interface SettingsSaveResult extends SettingsGetResult {
  message_ja: string
}

export interface SettingsDeleteApiKeyResult extends SettingsGetResult {
  message_ja: string
}

export interface WordAddGeneratePayload {
  word: string
}

export interface WordAddGenerateResult {
  reading_kana: string
  meaning_ja: string
  context_scene_ja: string
  example_sentence_ja: string
}

export interface WordAddSavePayload {
  word: string
  reading_kana: string
  meaning_ja: string
  context_scene_ja: string
  example_sentence_ja: string
}

export interface WordAddSaveResult {
  saved_word_id: string
  updated_existing: boolean
  message_ja: string
}

export interface WordAddDraftPayload {
  word: string
  reading_kana: string
  meaning_ja: string
  context_scene_ja: string
  example_sentence_ja: string
}

export interface WordAddDraftLoadResult {
  draft: WordAddDraftPayload | null
}

export interface LibraryListPayload {
  query?: string
}

export interface LibraryWordItem {
  id: string
  word: string
  reading_kana: string
  meaning_ja: string
  context_scene_ja: string
  example_sentence_ja: string
  created_at: string
  updated_at: string
}

export interface LibraryListResult {
  query: string
  total_count: number
  matched_count: number
  words: LibraryWordItem[]
}

export interface LibraryUpdatePayload {
  word_id: string
  word: string
  reading_kana: string
  meaning_ja: string
  context_scene_ja: string
  example_sentence_ja: string
}

export interface LibraryUpdateResult {
  updated_word_id: string
  message_ja: string
}

export interface LibraryDeletePayload {
  word_id: string
}

export interface LibraryDeleteResult {
  deleted_word_id: string
  message_ja: string
}

export interface ReviewQueueWordItem {
  id: string
  word: string
  reading_kana: string
  meaning_ja: string
  context_scene_ja: string
  example_sentence_ja: string
  review_state: {
    repetition: number
    interval_days: number
    easiness_factor: number
    next_review_at: string
    last_review_at: string | null
    last_grade: number | null
  }
}

export interface ReviewQueueResult {
  due_words: ReviewQueueWordItem[]
  due_count: number
  completed_today_count: number
}

export interface ReviewGradePayload {
  word_id: string
  grade: number
}

export interface ReviewGradeResult {
  reviewed_word_id: string
  updated_review_state: {
    repetition: number
    interval_days: number
    easiness_factor: number
    next_review_at: string
    last_review_at: string | null
    last_grade: number | null
  }
  due_count: number
  completed_today_count: number
  message_ja: string
}

export interface IpcSuccess<T = unknown> {
  ok: true
  data: T
}

export interface IpcFailure {
  ok: false
  error: {
    code: IpcErrorCode
    message: string
  }
}

export type IpcResponse<T = unknown> = IpcSuccess<T> | IpcFailure

export const ALLOWED_CHANNEL_SET = new Set<string>(Object.values(IPC_CHANNELS))

export const create_success_response = <T>(data: T): IpcSuccess<T> => ({
  ok: true,
  data,
})

export const create_failure_response = (code: IpcErrorCode, message: string): IpcFailure => ({
  ok: false,
  error: {
    code,
    message,
  },
})

export const is_ipc_envelope = (value: unknown): value is IpcEnvelope => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const maybe_envelope = value as Partial<IpcEnvelope>
  return typeof maybe_envelope.channel === 'string'
}

export const is_ping_payload = (value: unknown): value is PingPayload => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const maybe_payload = value as Partial<PingPayload>
  return typeof maybe_payload.message === 'string' && maybe_payload.message.trim().length > 0
}

export const is_settings_save_payload = (value: unknown): value is SettingsSavePayload => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const maybe_payload = value as Partial<SettingsSavePayload>
  return (
    typeof maybe_payload.model === 'string' &&
    typeof maybe_payload.timeout_seconds === 'number' &&
    Number.isInteger(maybe_payload.timeout_seconds) &&
    typeof maybe_payload.retries === 'number' &&
    Number.isInteger(maybe_payload.retries) &&
    (maybe_payload.api_key === undefined || typeof maybe_payload.api_key === 'string')
  )
}

export const is_word_add_generate_payload = (value: unknown): value is WordAddGeneratePayload => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const maybe_payload = value as Partial<WordAddGeneratePayload>
  return typeof maybe_payload.word === 'string' && maybe_payload.word.trim().length > 0
}

export const is_word_add_save_payload = (value: unknown): value is WordAddSavePayload => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const maybe_payload = value as Partial<WordAddSavePayload>
  return (
    typeof maybe_payload.word === 'string' &&
    maybe_payload.word.trim().length > 0 &&
    typeof maybe_payload.reading_kana === 'string' &&
    maybe_payload.reading_kana.trim().length > 0 &&
    typeof maybe_payload.meaning_ja === 'string' &&
    maybe_payload.meaning_ja.trim().length > 0 &&
    typeof maybe_payload.context_scene_ja === 'string' &&
    maybe_payload.context_scene_ja.trim().length > 0 &&
    typeof maybe_payload.example_sentence_ja === 'string' &&
    maybe_payload.example_sentence_ja.trim().length > 0
  )
}

export const is_word_add_draft_payload = (value: unknown): value is WordAddDraftPayload => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const maybe_payload = value as Partial<WordAddDraftPayload>
  return (
    typeof maybe_payload.word === 'string' &&
    typeof maybe_payload.reading_kana === 'string' &&
    typeof maybe_payload.meaning_ja === 'string' &&
    typeof maybe_payload.context_scene_ja === 'string' &&
    typeof maybe_payload.example_sentence_ja === 'string'
  )
}

export const is_library_list_payload = (value: unknown): value is LibraryListPayload => {
  if (value === undefined) {
    return true
  }

  if (typeof value !== 'object' || value === null) {
    return false
  }

  const maybe_payload = value as Partial<LibraryListPayload>
  return maybe_payload.query === undefined || typeof maybe_payload.query === 'string'
}

export const is_library_update_payload = (value: unknown): value is LibraryUpdatePayload => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const maybe_payload = value as Partial<LibraryUpdatePayload>
  return (
    typeof maybe_payload.word_id === 'string' &&
    maybe_payload.word_id.trim().length > 0 &&
    typeof maybe_payload.word === 'string' &&
    maybe_payload.word.trim().length > 0 &&
    typeof maybe_payload.reading_kana === 'string' &&
    maybe_payload.reading_kana.trim().length > 0 &&
    typeof maybe_payload.meaning_ja === 'string' &&
    maybe_payload.meaning_ja.trim().length > 0 &&
    typeof maybe_payload.context_scene_ja === 'string' &&
    maybe_payload.context_scene_ja.trim().length > 0 &&
    typeof maybe_payload.example_sentence_ja === 'string' &&
    maybe_payload.example_sentence_ja.trim().length > 0
  )
}

export const is_library_delete_payload = (value: unknown): value is LibraryDeletePayload => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const maybe_payload = value as Partial<LibraryDeletePayload>
  return typeof maybe_payload.word_id === 'string' && maybe_payload.word_id.trim().length > 0
}

export const is_review_grade_payload = (value: unknown): value is ReviewGradePayload => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const maybe_payload = value as Partial<ReviewGradePayload>
  return (
    typeof maybe_payload.word_id === 'string' &&
    maybe_payload.word_id.trim().length > 0 &&
    typeof maybe_payload.grade === 'number' &&
    Number.isInteger(maybe_payload.grade) &&
    maybe_payload.grade >= 0 &&
    maybe_payload.grade <= 5
  )
}

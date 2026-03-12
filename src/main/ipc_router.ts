import { ipcMain } from 'electron'
import {
  ALLOWED_CHANNEL_SET,
  IPC_BRIDGE_CHANNEL,
  IPC_CHANNELS,
  create_failure_response,
  create_success_response,
  is_ipc_envelope,
  is_ping_payload,
  is_word_add_draft_payload,
  is_word_add_generate_payload,
  is_word_add_save_payload,
  type IpcAllowedChannel,
  type IpcResponse,
  type PingResult,
  type WordAddDraftLoadResult,
  type WordAddGenerateResult,
  type WordAddSaveResult,
} from '../shared/ipc'
import { type WordAddDraftRepository } from './word_add_draft_repository'
import {
  SettingsApiKeyMissingError,
  WordEntryValidationError,
  type WordEntryService,
} from './word_entry_service'
import { AiProviderError } from './ai_provider'

type ChannelHandler = (payload: unknown) => IpcResponse | Promise<IpcResponse>

interface IpcRouterDeps {
  word_entry_service: WordEntryService
  word_add_draft_repository: WordAddDraftRepository
}

const app_ping_handler: ChannelHandler = (payload: unknown) => {
  if (!is_ping_payload(payload)) {
    console.warn('[IPC_REJECTED] code=IPC_PAYLOAD_INVALID channel=app:ping')
    return create_failure_response('IPC_PAYLOAD_INVALID', 'Payload for app:ping is invalid.')
  }

  const result: PingResult = {
    echoed_message: payload.message,
    received_at: new Date().toISOString(),
  }

  return create_success_response(result)
}

const create_word_add_generate_handler =
  (deps: IpcRouterDeps): ChannelHandler =>
  async (payload: unknown) => {
    if (!is_word_add_generate_payload(payload)) {
      return create_failure_response('IPC_PAYLOAD_INVALID', '単語追加の生成入力が不正です。')
    }

    try {
      const generated = await deps.word_entry_service.generate_word_card(payload.word)
      const result: WordAddGenerateResult = {
        reading_kana: generated.reading_kana,
        meaning_ja: generated.meaning_ja,
        context_scene_ja: generated.context_scene_ja,
        example_sentence_ja: generated.example_sentence_ja,
      }
      return create_success_response(result)
    } catch (error) {
      if (error instanceof SettingsApiKeyMissingError) {
        return create_failure_response('APP_API_KEY_MISSING', error.message)
      }
      if (error instanceof WordEntryValidationError) {
        return create_failure_response('APP_VALIDATION_ERROR', error.message)
      }
      if (error instanceof AiProviderError) {
        return create_failure_response('APP_GENERATION_FAILED', error.message)
      }
      throw error
    }
  }

const create_word_add_save_handler =
  (deps: IpcRouterDeps): ChannelHandler =>
  async (payload: unknown) => {
    if (!is_word_add_save_payload(payload)) {
      return create_failure_response('IPC_PAYLOAD_INVALID', '単語保存の入力が不正です。')
    }

    try {
      const saved = await deps.word_entry_service.save_word_entry(payload)
      const result: WordAddSaveResult = {
        saved_word_id: saved.saved_word_id,
        updated_existing: saved.updated_existing,
        message_ja: saved.message_ja,
      }

      await deps.word_add_draft_repository.clear_draft()
      return create_success_response(result)
    } catch (error) {
      if (error instanceof WordEntryValidationError) {
        return create_failure_response('APP_VALIDATION_ERROR', error.message)
      }
      return create_failure_response('APP_STORAGE_ERROR', '単語保存に失敗しました。')
    }
  }

const create_word_add_draft_load_handler =
  (deps: IpcRouterDeps): ChannelHandler =>
  async () => {
    try {
      const draft = await deps.word_add_draft_repository.load_draft()
      const result: WordAddDraftLoadResult = { draft }
      return create_success_response(result)
    } catch {
      return create_failure_response('APP_STORAGE_ERROR', '草稿の読み込みに失敗しました。')
    }
  }

const create_word_add_draft_save_handler =
  (deps: IpcRouterDeps): ChannelHandler =>
  async (payload: unknown) => {
    if (!is_word_add_draft_payload(payload)) {
      return create_failure_response('IPC_PAYLOAD_INVALID', '草稿保存の入力が不正です。')
    }

    try {
      await deps.word_add_draft_repository.save_draft(payload)
      return create_success_response({ saved: true })
    } catch {
      return create_failure_response('APP_STORAGE_ERROR', '草稿の保存に失敗しました。')
    }
  }

const create_word_add_draft_clear_handler =
  (deps: IpcRouterDeps): ChannelHandler =>
  async () => {
    try {
      await deps.word_add_draft_repository.clear_draft()
      return create_success_response({ cleared: true })
    } catch {
      return create_failure_response('APP_STORAGE_ERROR', '草稿の削除に失敗しました。')
    }
  }

export const register_ipc_router = (deps: IpcRouterDeps): void => {
  const channel_handler_map: Record<IpcAllowedChannel, ChannelHandler> = {
    [IPC_CHANNELS.APP_PING]: app_ping_handler,
    [IPC_CHANNELS.WORD_ADD_GENERATE]: create_word_add_generate_handler(deps),
    [IPC_CHANNELS.WORD_ADD_SAVE]: create_word_add_save_handler(deps),
    [IPC_CHANNELS.WORD_ADD_DRAFT_LOAD]: create_word_add_draft_load_handler(deps),
    [IPC_CHANNELS.WORD_ADD_DRAFT_SAVE]: create_word_add_draft_save_handler(deps),
    [IPC_CHANNELS.WORD_ADD_DRAFT_CLEAR]: create_word_add_draft_clear_handler(deps),
  }

  ipcMain.handle(IPC_BRIDGE_CHANNEL, async (_event, envelope: unknown): Promise<IpcResponse> => {
    if (!is_ipc_envelope(envelope)) {
      console.warn('[IPC_REJECTED] code=IPC_ENVELOPE_INVALID reason=malformed_envelope')
      return create_failure_response('IPC_ENVELOPE_INVALID', 'IPC envelope is invalid.')
    }

    if (!ALLOWED_CHANNEL_SET.has(envelope.channel)) {
      console.warn(`[IPC_REJECTED] code=IPC_CHANNEL_NOT_ALLOWED channel=${envelope.channel}`)
      return create_failure_response(
        'IPC_CHANNEL_NOT_ALLOWED',
        `Channel "${envelope.channel}" is not allowed.`
      )
    }

    const handler = channel_handler_map[envelope.channel as IpcAllowedChannel]

    try {
      return await handler(envelope.payload)
    } catch (error) {
      console.error(`[IPC_REJECTED] code=IPC_INTERNAL_ERROR channel=${envelope.channel}`, error)
      return create_failure_response('IPC_INTERNAL_ERROR', 'Internal IPC error.')
    }
  })
}

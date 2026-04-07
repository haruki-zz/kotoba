import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { WordAddPage } from '@/renderer/features/word_add/word_add_page'
import {
  IPC_CHANNELS,
  type IpcResponse,
  type WordAddDraftLoadResult,
  type WordAddDraftPayload,
  type WordAddGenerateResult,
  type WordAddSaveResult,
} from '@/shared/ipc'

const EMPTY_DRAFT: WordAddDraftPayload = {
  word: '',
  reading_kana: '',
  meaning_ja: '',
  context_scene_ja: '',
  example_sentence_ja: '',
}

const is_empty_draft = (draft: WordAddDraftPayload): boolean =>
  draft.word.trim().length === 0 &&
  draft.reading_kana.trim().length === 0 &&
  draft.meaning_ja.trim().length === 0 &&
  draft.context_scene_ja.trim().length === 0 &&
  draft.example_sentence_ja.trim().length === 0

export const WordAddFeature = () => {
  const [draft, set_draft] = useState<WordAddDraftPayload>(EMPTY_DRAFT)
  const [draft_ready, set_draft_ready] = useState<boolean>(false)
  const [status_message, set_status_message] = useState<string>('')
  const [error_message, set_error_message] = useState<string>('')
  const [is_generating, set_is_generating] = useState<boolean>(false)
  const [is_saving, set_is_saving] = useState<boolean>(false)
  const save_draft_now_ref = useRef<() => Promise<void>>(async () => undefined)

  const set_field = useCallback((field: keyof WordAddDraftPayload, value: string): void => {
    set_draft((current) => ({
      ...current,
      [field]: value,
    }))
  }, [])

  const save_draft_now = useCallback(async (): Promise<void> => {
    if (draft_ready === false || is_empty_draft(draft)) {
      return
    }

    await window.kotoba.invoke(IPC_CHANNELS.WORD_ADD_DRAFT_SAVE, draft)
  }, [draft, draft_ready])

  useEffect(() => {
    save_draft_now_ref.current = save_draft_now
  }, [save_draft_now])

  useEffect(() => {
    let mounted = true

    const load_initial_draft = async (): Promise<void> => {
      const response = (await window.kotoba.invoke(
        IPC_CHANNELS.WORD_ADD_DRAFT_LOAD
      )) as IpcResponse<WordAddDraftLoadResult>

      if (mounted === false) {
        return
      }

      if (response.ok && response.data.draft !== null) {
        set_draft(response.data.draft)
      }

      set_draft_ready(true)
    }

    void load_initial_draft()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (draft_ready === false || is_empty_draft(draft)) {
      return
    }

    const timer_id = window.setTimeout(() => {
      void save_draft_now()
    }, 800)

    return () => {
      window.clearTimeout(timer_id)
    }
  }, [draft, draft_ready, save_draft_now])

  useEffect(() => {
    return () => {
      void save_draft_now_ref.current()
    }
  }, [])

  useEffect(() => {
    const handle_before_unload = (): void => {
      void save_draft_now()
    }

    window.addEventListener('beforeunload', handle_before_unload)
    return () => {
      window.removeEventListener('beforeunload', handle_before_unload)
    }
  }, [save_draft_now])

  const handle_generate_click = async (): Promise<void> => {
    if (draft.word.trim().length === 0) {
      set_error_message('単語を入力してください。')
      set_status_message('')
      return
    }

    set_is_generating(true)
    set_error_message('')
    set_status_message('')

    const response = (await window.kotoba.invoke(IPC_CHANNELS.WORD_ADD_GENERATE, {
      word: draft.word,
    })) as IpcResponse<WordAddGenerateResult>

    set_is_generating(false)
    if (response.ok === false) {
      set_error_message(response.error.message)
      return
    }

    set_draft((current) => ({
      ...current,
      reading_kana: response.data.reading_kana,
      meaning_ja: response.data.meaning_ja,
      context_scene_ja: response.data.context_scene_ja,
      example_sentence_ja: response.data.example_sentence_ja,
    }))
    set_status_message('生成しました。')
  }

  const handle_save_click = async (): Promise<void> => {
    set_is_saving(true)
    set_error_message('')
    set_status_message('')

    const response = (await window.kotoba.invoke(
      IPC_CHANNELS.WORD_ADD_SAVE,
      draft
    )) as IpcResponse<WordAddSaveResult>

    set_is_saving(false)
    if (response.ok === false) {
      set_error_message(response.error.message)
      return
    }

    set_status_message(response.data.message_ja)
    set_draft(EMPTY_DRAFT)
    await window.kotoba.invoke(IPC_CHANNELS.WORD_ADD_DRAFT_CLEAR)
  }

  const save_disabled = useMemo(
    () =>
      is_saving ||
      draft.word.trim().length === 0 ||
      draft.reading_kana.trim().length === 0 ||
      draft.meaning_ja.trim().length === 0 ||
      draft.context_scene_ja.trim().length === 0 ||
      draft.example_sentence_ja.trim().length === 0,
    [draft, is_saving]
  )

  return (
    <WordAddPage
      draft={draft}
      error_message={error_message}
      is_generating={is_generating}
      is_saving={is_saving}
      on_field_change={set_field}
      on_generate={handle_generate_click}
      on_save={handle_save_click}
      save_disabled={save_disabled}
      status_message={status_message}
    />
  )
}

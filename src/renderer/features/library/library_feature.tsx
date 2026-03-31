import { useCallback, useEffect, useMemo, useState } from 'react'

import { LibraryPage } from '@/renderer/features/library/library_page'
import {
  IPC_CHANNELS,
  type IpcResponse,
  type LibraryDeleteResult,
  type LibraryListResult,
  type LibraryUpdateResult,
  type LibraryWordItem,
} from '@/shared/ipc'

type LibraryEditForm = {
  word: string
  reading_kana: string
  meaning_ja: string
  context_scene_ja: string
  example_sentence_ja: string
}

const EMPTY_LIBRARY_EDIT_FORM: LibraryEditForm = {
  word: '',
  reading_kana: '',
  meaning_ja: '',
  context_scene_ja: '',
  example_sentence_ja: '',
}

const to_library_edit_form = (word: LibraryWordItem): LibraryEditForm => ({
  word: word.word,
  reading_kana: word.reading_kana,
  meaning_ja: word.meaning_ja,
  context_scene_ja: word.context_scene_ja,
  example_sentence_ja: word.example_sentence_ja,
})

export const LibraryFeature = () => {
  const [query, set_query] = useState<string>('')
  const [words, set_words] = useState<LibraryWordItem[]>([])
  const [total_count, set_total_count] = useState<number>(0)
  const [matched_count, set_matched_count] = useState<number>(0)
  const [status_message, set_status_message] = useState<string>('')
  const [error_message, set_error_message] = useState<string>('')
  const [is_loading, set_is_loading] = useState<boolean>(false)
  const [editing_word_id, set_editing_word_id] = useState<string | null>(null)
  const [edit_form, set_edit_form] = useState<LibraryEditForm>(EMPTY_LIBRARY_EDIT_FORM)
  const [is_updating, set_is_updating] = useState<boolean>(false)
  const [deleting_word_id, set_deleting_word_id] = useState<string | null>(null)
  const [delete_target, set_delete_target] = useState<LibraryWordItem | null>(null)

  const load_library_words = useCallback(async (next_query: string): Promise<void> => {
    set_is_loading(true)

    const response = (await window.kotoba.invoke(IPC_CHANNELS.LIBRARY_LIST, {
      query: next_query,
    })) as IpcResponse<LibraryListResult>

    set_is_loading(false)
    if (response.ok === false) {
      set_error_message(response.error.message)
      return
    }

    set_words(response.data.words)
    set_total_count(response.data.total_count)
    set_matched_count(response.data.matched_count)
    set_error_message('')
  }, [])

  useEffect(() => {
    set_status_message('')
    set_error_message('')
  }, [])

  useEffect(() => {
    const timer_id = window.setTimeout(() => {
      void load_library_words(query)
    }, 200)

    return () => {
      window.clearTimeout(timer_id)
    }
  }, [load_library_words, query])

  const handle_start_library_edit = (word: LibraryWordItem): void => {
    set_editing_word_id(word.id)
    set_edit_form(to_library_edit_form(word))
    set_status_message('')
    set_error_message('')
  }

  const handle_cancel_library_edit = (): void => {
    set_editing_word_id(null)
    set_edit_form(EMPTY_LIBRARY_EDIT_FORM)
  }

  const handle_library_edit_field = (field: keyof LibraryEditForm, value: string): void => {
    set_edit_form((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handle_library_update = async (): Promise<void> => {
    if (editing_word_id === null) {
      return
    }

    set_is_updating(true)
    set_status_message('')
    set_error_message('')

    const response = (await window.kotoba.invoke(IPC_CHANNELS.LIBRARY_UPDATE, {
      word_id: editing_word_id,
      word: edit_form.word,
      reading_kana: edit_form.reading_kana,
      meaning_ja: edit_form.meaning_ja,
      context_scene_ja: edit_form.context_scene_ja,
      example_sentence_ja: edit_form.example_sentence_ja,
    })) as IpcResponse<LibraryUpdateResult>

    set_is_updating(false)
    if (response.ok === false) {
      set_error_message(response.error.message)
      return
    }

    set_status_message(response.data.message_ja)
    set_editing_word_id(null)
    set_edit_form(EMPTY_LIBRARY_EDIT_FORM)
    await load_library_words(query)
  }

  const handle_request_library_delete = (word: LibraryWordItem): void => {
    set_delete_target(word)
    set_status_message('')
    set_error_message('')
  }

  const handle_cancel_library_delete = (): void => {
    if (deleting_word_id !== null) {
      return
    }

    set_delete_target(null)
  }

  const handle_confirm_library_delete = async (): Promise<void> => {
    const target_word = delete_target
    if (target_word === null) {
      return
    }

    set_deleting_word_id(target_word.id)
    set_status_message('')
    set_error_message('')

    const response = (await window.kotoba.invoke(IPC_CHANNELS.LIBRARY_DELETE, {
      word_id: target_word.id,
    })) as IpcResponse<LibraryDeleteResult>

    set_deleting_word_id(null)
    if (response.ok === false) {
      set_error_message(response.error.message)
      set_delete_target(null)
      return
    }

    if (editing_word_id === target_word.id) {
      set_editing_word_id(null)
      set_edit_form(EMPTY_LIBRARY_EDIT_FORM)
    }

    set_status_message(response.data.message_ja)
    set_delete_target(null)
    await load_library_words(query)
  }

  const update_disabled = useMemo(
    () =>
      is_updating ||
      editing_word_id === null ||
      edit_form.word.trim().length === 0 ||
      edit_form.reading_kana.trim().length === 0 ||
      edit_form.meaning_ja.trim().length === 0 ||
      edit_form.context_scene_ja.trim().length === 0 ||
      edit_form.example_sentence_ja.trim().length === 0,
    [edit_form, editing_word_id, is_updating]
  )

  return (
    <LibraryPage
      delete_target={delete_target}
      deleting_word_id={deleting_word_id}
      edit_form={edit_form}
      editing_word_id={editing_word_id}
      error_message={error_message}
      is_loading={is_loading}
      is_updating={is_updating}
      matched_count={matched_count}
      on_cancel_delete={handle_cancel_library_delete}
      on_cancel_edit={handle_cancel_library_edit}
      on_confirm_delete={handle_confirm_library_delete}
      on_edit_field={handle_library_edit_field}
      on_query_change={set_query}
      on_request_delete={handle_request_library_delete}
      on_start_edit={handle_start_library_edit}
      on_update={handle_library_update}
      query={query}
      status_message={status_message}
      total_count={total_count}
      update_disabled={update_disabled}
      words={words}
    />
  )
}

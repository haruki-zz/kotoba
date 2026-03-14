import { useCallback, useEffect, useMemo, useState } from 'react'
import './style.css'
import {
  IPC_CHANNELS,
  type IpcFailure,
  type IpcResponse,
  type LibraryDeleteResult,
  type LibraryListResult,
  type LibraryUpdateResult,
  type LibraryWordItem,
  type WordAddDraftLoadResult,
  type WordAddDraftPayload,
  type WordAddGenerateResult,
  type WordAddSaveResult,
} from '../shared/ipc'

type AppPage = 'word-add' | 'library'

type LibraryEditForm = {
  word: string
  reading_kana: string
  meaning_ja: string
  context_scene_ja: string
  example_sentence_ja: string
}

const EMPTY_DRAFT: WordAddDraftPayload = {
  word: '',
  reading_kana: '',
  meaning_ja: '',
  context_scene_ja: '',
  example_sentence_ja: '',
}

const EMPTY_LIBRARY_EDIT_FORM: LibraryEditForm = {
  word: '',
  reading_kana: '',
  meaning_ja: '',
  context_scene_ja: '',
  example_sentence_ja: '',
}

const is_failure = (response: IpcResponse): response is IpcFailure => response.ok === false

const is_empty_draft = (draft: WordAddDraftPayload): boolean =>
  draft.word.trim().length === 0 &&
  draft.reading_kana.trim().length === 0 &&
  draft.meaning_ja.trim().length === 0 &&
  draft.context_scene_ja.trim().length === 0 &&
  draft.example_sentence_ja.trim().length === 0

const to_library_edit_form = (word: LibraryWordItem): LibraryEditForm => ({
  word: word.word,
  reading_kana: word.reading_kana,
  meaning_ja: word.meaning_ja,
  context_scene_ja: word.context_scene_ja,
  example_sentence_ja: word.example_sentence_ja,
})

export const App = () => {
  const [active_page, set_active_page] = useState<AppPage>('word-add')
  const [draft, set_draft] = useState<WordAddDraftPayload>(EMPTY_DRAFT)
  const [draft_ready, set_draft_ready] = useState<boolean>(false)
  const [status_message, set_status_message] = useState<string>('')
  const [error_message, set_error_message] = useState<string>('')
  const [is_generating, set_is_generating] = useState<boolean>(false)
  const [is_saving, set_is_saving] = useState<boolean>(false)

  const [library_query, set_library_query] = useState<string>('')
  const [library_words, set_library_words] = useState<LibraryWordItem[]>([])
  const [library_total_count, set_library_total_count] = useState<number>(0)
  const [library_matched_count, set_library_matched_count] = useState<number>(0)
  const [library_status_message, set_library_status_message] = useState<string>('')
  const [library_error_message, set_library_error_message] = useState<string>('')
  const [library_loading, set_library_loading] = useState<boolean>(false)
  const [library_editing_word_id, set_library_editing_word_id] = useState<string | null>(null)
  const [library_edit_form, set_library_edit_form] =
    useState<LibraryEditForm>(EMPTY_LIBRARY_EDIT_FORM)
  const [library_updating, set_library_updating] = useState<boolean>(false)
  const [library_deleting_word_id, set_library_deleting_word_id] = useState<string | null>(null)

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

  const load_library_words = useCallback(
    async (query: string): Promise<void> => {
      set_library_loading(true)

      const response = (await window.kotoba.invoke(IPC_CHANNELS.LIBRARY_LIST, {
        query,
      })) as IpcResponse<LibraryListResult>

      set_library_loading(false)
      if (is_failure(response)) {
        set_library_error_message(response.error.message)
        return
      }

      set_library_words(response.data.words)
      set_library_total_count(response.data.total_count)
      set_library_matched_count(response.data.matched_count)
      set_library_error_message('')
    },
    [set_library_words]
  )

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
    if (active_page !== 'word-add' || draft_ready === false || is_empty_draft(draft)) {
      return
    }

    const timer_id = window.setTimeout(() => {
      void save_draft_now()
    }, 800)

    return () => {
      window.clearTimeout(timer_id)
    }
  }, [active_page, draft, draft_ready, save_draft_now])

  useEffect(() => {
    const handle_before_unload = (): void => {
      void save_draft_now()
    }

    window.addEventListener('beforeunload', handle_before_unload)
    return () => {
      window.removeEventListener('beforeunload', handle_before_unload)
    }
  }, [save_draft_now])

  useEffect(() => {
    if (active_page !== 'library') {
      return
    }

    const timer_id = window.setTimeout(() => {
      void load_library_words(library_query)
    }, 200)

    return () => {
      window.clearTimeout(timer_id)
    }
  }, [active_page, library_query, load_library_words])

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
    if (is_failure(response)) {
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
    set_status_message('生成結果を取得しました。必要なら編集して保存してください。')
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
    if (is_failure(response)) {
      set_error_message(response.error.message)
      return
    }

    set_status_message(response.data.message_ja)
    set_draft(EMPTY_DRAFT)
    await window.kotoba.invoke(IPC_CHANNELS.WORD_ADD_DRAFT_CLEAR)
  }

  const handle_page_change = (next_page: AppPage): void => {
    if (active_page === 'word-add' && next_page !== 'word-add') {
      void save_draft_now()
    }

    if (next_page === 'library') {
      set_library_status_message('')
      set_library_error_message('')
    }

    set_active_page(next_page)
  }

  const handle_start_library_edit = (word: LibraryWordItem): void => {
    set_library_editing_word_id(word.id)
    set_library_edit_form(to_library_edit_form(word))
    set_library_status_message('')
    set_library_error_message('')
  }

  const handle_cancel_library_edit = (): void => {
    set_library_editing_word_id(null)
    set_library_edit_form(EMPTY_LIBRARY_EDIT_FORM)
  }

  const handle_library_edit_field = (field: keyof LibraryEditForm, value: string): void => {
    set_library_edit_form((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handle_library_update = async (): Promise<void> => {
    if (library_editing_word_id === null) {
      return
    }

    set_library_updating(true)
    set_library_status_message('')
    set_library_error_message('')

    const response = (await window.kotoba.invoke(IPC_CHANNELS.LIBRARY_UPDATE, {
      word_id: library_editing_word_id,
      word: library_edit_form.word,
      reading_kana: library_edit_form.reading_kana,
      meaning_ja: library_edit_form.meaning_ja,
      context_scene_ja: library_edit_form.context_scene_ja,
      example_sentence_ja: library_edit_form.example_sentence_ja,
    })) as IpcResponse<LibraryUpdateResult>

    set_library_updating(false)
    if (is_failure(response)) {
      set_library_error_message(response.error.message)
      return
    }

    set_library_status_message(response.data.message_ja)
    set_library_editing_word_id(null)
    set_library_edit_form(EMPTY_LIBRARY_EDIT_FORM)
    await load_library_words(library_query)
  }

  const handle_library_delete = async (word: LibraryWordItem): Promise<void> => {
    const confirmed = window.confirm(`「${word.word}」を削除しますか？`)
    if (confirmed === false) {
      return
    }

    set_library_deleting_word_id(word.id)
    set_library_status_message('')
    set_library_error_message('')

    const response = (await window.kotoba.invoke(IPC_CHANNELS.LIBRARY_DELETE, {
      word_id: word.id,
    })) as IpcResponse<LibraryDeleteResult>

    set_library_deleting_word_id(null)
    if (is_failure(response)) {
      set_library_error_message(response.error.message)
      return
    }

    if (library_editing_word_id === word.id) {
      set_library_editing_word_id(null)
      set_library_edit_form(EMPTY_LIBRARY_EDIT_FORM)
    }

    set_library_status_message(response.data.message_ja)
    await load_library_words(library_query)
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

  const library_update_disabled = useMemo(
    () =>
      library_updating ||
      library_editing_word_id === null ||
      library_edit_form.word.trim().length === 0 ||
      library_edit_form.reading_kana.trim().length === 0 ||
      library_edit_form.meaning_ja.trim().length === 0 ||
      library_edit_form.context_scene_ja.trim().length === 0 ||
      library_edit_form.example_sentence_ja.trim().length === 0,
    [library_edit_form, library_editing_word_id, library_updating]
  )

  return (
    <main className="container">
      <header className="header">
        <h1>Kotoba</h1>
        <p>日本語の単語を生成・編集して保存できます。</p>
      </header>

      <nav className="nav_tabs" aria-label="メインページ">
        <button
          type="button"
          className={active_page === 'word-add' ? 'tab active' : 'tab'}
          onClick={() => handle_page_change('word-add')}
        >
          単語追加
        </button>
        <button
          type="button"
          className={active_page === 'library' ? 'tab active' : 'tab'}
          onClick={() => handle_page_change('library')}
        >
          単語帳
        </button>
      </nav>

      {active_page === 'word-add' ? (
        <section className="panel">
          <label className="field">
            <span>単語</span>
            <input
              aria-label="単語"
              value={draft.word}
              onChange={(event) => set_field('word', event.target.value)}
              placeholder="例: 食べる"
            />
          </label>

          <div className="button_row">
            <button type="button" onClick={handle_generate_click} disabled={is_generating}>
              {is_generating ? '生成中...' : '生成'}
            </button>
            <button type="button" onClick={handle_save_click} disabled={save_disabled}>
              {is_saving ? '保存中...' : '保存'}
            </button>
          </div>

          <label className="field">
            <span>読み仮名</span>
            <input
              aria-label="読み仮名"
              value={draft.reading_kana}
              onChange={(event) => set_field('reading_kana', event.target.value)}
            />
          </label>

          <label className="field">
            <span>意味（日本語）</span>
            <textarea
              aria-label="意味"
              rows={3}
              value={draft.meaning_ja}
              onChange={(event) => set_field('meaning_ja', event.target.value)}
            />
          </label>

          <label className="field">
            <span>文脈</span>
            <textarea
              aria-label="文脈"
              rows={3}
              value={draft.context_scene_ja}
              onChange={(event) => set_field('context_scene_ja', event.target.value)}
            />
          </label>

          <label className="field">
            <span>例文</span>
            <textarea
              aria-label="例文"
              rows={2}
              value={draft.example_sentence_ja}
              onChange={(event) => set_field('example_sentence_ja', event.target.value)}
            />
          </label>

          {status_message.length > 0 ? (
            <p role="status" className="status_message">
              {status_message}
            </p>
          ) : null}
          {error_message.length > 0 ? (
            <p role="alert" className="error_message">
              {error_message}
            </p>
          ) : null}
        </section>
      ) : (
        <section className="panel">
          <h2>単語帳</h2>
          <label className="field">
            <span>検索</span>
            <input
              aria-label="単語帳検索"
              value={library_query}
              onChange={(event) => set_library_query(event.target.value)}
              placeholder="単語・読み仮名・意味で検索"
            />
          </label>

          <p className="library_count">
            {library_matched_count} 件 / 全 {library_total_count} 件
          </p>

          {library_loading ? <p className="library_hint">読み込み中...</p> : null}

          {library_words.length === 0 && library_loading === false ? (
            <p className="library_hint">該当する単語がありません。</p>
          ) : null}

          <ul className="library_list">
            {library_words.map((word) => {
              const is_editing = library_editing_word_id === word.id
              const is_deleting = library_deleting_word_id === word.id

              if (is_editing) {
                return (
                  <li key={word.id} className="library_item">
                    <label className="field">
                      <span>単語</span>
                      <input
                        aria-label="編集単語"
                        value={library_edit_form.word}
                        onChange={(event) => handle_library_edit_field('word', event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>読み仮名</span>
                      <input
                        aria-label="編集読み仮名"
                        value={library_edit_form.reading_kana}
                        onChange={(event) =>
                          handle_library_edit_field('reading_kana', event.target.value)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>意味（日本語）</span>
                      <textarea
                        aria-label="編集意味"
                        rows={3}
                        value={library_edit_form.meaning_ja}
                        onChange={(event) =>
                          handle_library_edit_field('meaning_ja', event.target.value)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>文脈</span>
                      <textarea
                        aria-label="編集文脈"
                        rows={3}
                        value={library_edit_form.context_scene_ja}
                        onChange={(event) =>
                          handle_library_edit_field('context_scene_ja', event.target.value)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>例文</span>
                      <textarea
                        aria-label="編集例文"
                        rows={2}
                        value={library_edit_form.example_sentence_ja}
                        onChange={(event) =>
                          handle_library_edit_field('example_sentence_ja', event.target.value)
                        }
                      />
                    </label>
                    <div className="button_row">
                      <button
                        type="button"
                        onClick={handle_library_update}
                        disabled={library_update_disabled}
                      >
                        {library_updating ? '更新中...' : '更新'}
                      </button>
                      <button
                        type="button"
                        className="button_secondary"
                        onClick={handle_cancel_library_edit}
                      >
                        キャンセル
                      </button>
                    </div>
                  </li>
                )
              }

              return (
                <li key={word.id} className="library_item">
                  <p className="library_word">{word.word}</p>
                  <p className="library_reading">{word.reading_kana}</p>
                  <p className="library_meaning">{word.meaning_ja}</p>
                  <div className="button_row">
                    <button type="button" onClick={() => handle_start_library_edit(word)}>
                      編集
                    </button>
                    <button
                      type="button"
                      className="button_danger"
                      onClick={() => {
                        void handle_library_delete(word)
                      }}
                      disabled={is_deleting}
                    >
                      {is_deleting ? '削除中...' : '削除'}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>

          {library_status_message.length > 0 ? (
            <p role="status" className="status_message">
              {library_status_message}
            </p>
          ) : null}
          {library_error_message.length > 0 ? (
            <p role="alert" className="error_message">
              {library_error_message}
            </p>
          ) : null}
        </section>
      )}
    </main>
  )
}

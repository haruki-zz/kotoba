import { useCallback, useEffect, useMemo, useState } from 'react'
import './style.css'
import {
  IPC_CHANNELS,
  type IpcFailure,
  type IpcResponse,
  type WordAddDraftLoadResult,
  type WordAddDraftPayload,
  type WordAddGenerateResult,
  type WordAddSaveResult,
} from '../shared/ipc'

type AppPage = 'word-add' | 'library'

const EMPTY_DRAFT: WordAddDraftPayload = {
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

export const App = () => {
  const [active_page, set_active_page] = useState<AppPage>('word-add')
  const [draft, set_draft] = useState<WordAddDraftPayload>(EMPTY_DRAFT)
  const [draft_ready, set_draft_ready] = useState<boolean>(false)
  const [status_message, set_status_message] = useState<string>('')
  const [error_message, set_error_message] = useState<string>('')
  const [is_generating, set_is_generating] = useState<boolean>(false)
  const [is_saving, set_is_saving] = useState<boolean>(false)

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
    set_active_page(next_page)
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
          <p>次のステップで一覧・検索・編集を実装します。</p>
        </section>
      )}
    </main>
  )
}

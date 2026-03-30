import { useCallback, useEffect, useMemo, useState } from 'react'
import './style.css'
import { AppNavigation, type AppNavigationItem } from '@/renderer/components/layout/app_navigation'
import { AppShell } from '@/renderer/components/layout/app_shell'
import { PageHeader } from '@/renderer/components/layout/page_header'
import { StatusMessage } from '@/renderer/components/shared/status_message'
import { ActivityPage } from '@/renderer/features/activity/activity_page'
import { LibraryPage } from '@/renderer/features/library/library_page'
import { ReviewPage } from '@/renderer/features/review/review_page'
import { SettingsPage } from '@/renderer/features/settings/settings_page'
import { WordAddPage } from '@/renderer/features/word_add/word_add_page'
import { Separator } from '@/renderer/components/ui/separator'
import {
  type ActivityHeatmapResult,
  type AppStartupStatusResult,
  IPC_CHANNELS,
  type IpcFailure,
  type IpcResponse,
  type LibraryDeleteResult,
  type LibraryListResult,
  type LibraryUpdateResult,
  type LibraryWordItem,
  type ReviewGradeResult,
  type ReviewQueueResult,
  type ReviewQueueWordItem,
  type SettingsDeleteApiKeyResult,
  type SettingsGetResult,
  type SettingsSaveResult,
  type WordAddDraftLoadResult,
  type WordAddDraftPayload,
  type WordAddGenerateResult,
  type WordAddSaveResult,
} from '../shared/ipc'

type AppPage = 'word-add' | 'library' | 'review' | 'activity' | 'settings'

type LibraryEditForm = {
  word: string
  reading_kana: string
  meaning_ja: string
  context_scene_ja: string
  example_sentence_ja: string
}

type SettingsForm = {
  model: string
  timeout_seconds: string
  retries: string
  api_key: string
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

const EMPTY_SETTINGS_FORM: SettingsForm = {
  model: '',
  timeout_seconds: '',
  retries: '',
  api_key: '',
}

const APP_NAME = 'Kotoba'

const APP_NAVIGATION_ITEMS: AppNavigationItem<AppPage>[] = [
  { value: 'activity', label: '活動' },
  { value: 'library', label: '単語帳' },
  { value: 'review', label: '復習' },
  { value: 'word-add', label: '単語追加' },
  { value: 'settings', label: '設定' },
]

const APP_PAGE_META: Record<AppPage, { label: string; title: string; description: string }> = {
  activity: {
    label: '活動',
    title: '学習活動の全体像',
    description: '直近 40 週間の学習量と現在の記憶レベル構成を確認できます。',
  },
  library: {
    label: '単語帳',
    title: '保存済み単語の管理',
    description: '保存した単語を検索し、その場で編集や削除ができます。',
  },
  review: {
    label: '復習',
    title: '今日の復習キュー',
    description: '到期した単語を評価し、SM-2 に沿って次回の復習予定を更新します。',
  },
  'word-add': {
    label: '単語追加',
    title: '新しい単語を追加',
    description: '単語を入力して AI 生成結果を編集し、個人の単語帳へ保存します。',
  },
  settings: {
    label: '設定',
    title: 'Gemini 設定の管理',
    description: 'API キーとモデル設定を更新し、生成時の既定値を調整できます。',
  },
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

export const App = () => {
  const [app_notice_message, set_app_notice_message] = useState<string>('')
  const [app_notice_kind, set_app_notice_kind] = useState<'info' | 'warning' | null>(null)
  const [active_page, set_active_page] = useState<AppPage>('activity')
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
  const [library_delete_target, set_library_delete_target] = useState<LibraryWordItem | null>(null)

  const [review_due_words, set_review_due_words] = useState<ReviewQueueWordItem[]>([])
  const [review_due_count, set_review_due_count] = useState<number>(0)
  const [review_completed_today_count, set_review_completed_today_count] = useState<number>(0)
  const [review_status_message, set_review_status_message] = useState<string>('')
  const [review_error_message, set_review_error_message] = useState<string>('')
  const [review_loading, set_review_loading] = useState<boolean>(false)
  const [review_grading_word_id, set_review_grading_word_id] = useState<string | null>(null)

  const [activity_heatmap, set_activity_heatmap] = useState<ActivityHeatmapResult | null>(null)
  const [activity_error_message, set_activity_error_message] = useState<string>('')
  const [activity_loading, set_activity_loading] = useState<boolean>(false)

  const [settings_form, set_settings_form] = useState<SettingsForm>(EMPTY_SETTINGS_FORM)
  const [settings_has_api_key, set_settings_has_api_key] = useState<boolean>(false)
  const [settings_status_message, set_settings_status_message] = useState<string>('')
  const [settings_error_message, set_settings_error_message] = useState<string>('')
  const [settings_loading, set_settings_loading] = useState<boolean>(false)
  const [settings_saving, set_settings_saving] = useState<boolean>(false)
  const [settings_deleting_api_key, set_settings_deleting_api_key] = useState<boolean>(false)

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

  const load_library_words = useCallback(async (query: string): Promise<void> => {
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
  }, [])

  const load_review_queue = useCallback(async (): Promise<void> => {
    set_review_loading(true)

    const response = (await window.kotoba.invoke(
      IPC_CHANNELS.REVIEW_QUEUE
    )) as IpcResponse<ReviewQueueResult>

    set_review_loading(false)
    if (is_failure(response)) {
      set_review_error_message(response.error.message)
      return
    }

    set_review_due_words(response.data.due_words)
    set_review_due_count(response.data.due_count)
    set_review_completed_today_count(response.data.completed_today_count)
    set_review_error_message('')
  }, [])

  const load_activity_heatmap = useCallback(async (): Promise<void> => {
    set_activity_loading(true)

    const response = (await window.kotoba.invoke(
      IPC_CHANNELS.ACTIVITY_HEATMAP
    )) as IpcResponse<ActivityHeatmapResult>

    set_activity_loading(false)
    if (is_failure(response)) {
      set_activity_error_message(response.error.message)
      return
    }

    set_activity_heatmap(response.data)
    set_activity_error_message('')
  }, [])

  const load_settings_page = useCallback(async (): Promise<void> => {
    set_settings_loading(true)

    const response = (await window.kotoba.invoke(
      IPC_CHANNELS.SETTINGS_GET
    )) as IpcResponse<SettingsGetResult>

    set_settings_loading(false)
    if (is_failure(response)) {
      set_settings_error_message(response.error.message)
      return
    }

    set_settings_form(to_settings_form(response.data))
    set_settings_has_api_key(response.data.has_api_key)
    set_settings_error_message('')
  }, [])

  useEffect(() => {
    let mounted = true

    const load_initial_draft = async (): Promise<void> => {
      const startup_status_response = (await window.kotoba.invoke(
        IPC_CHANNELS.APP_STARTUP_STATUS
      )) as IpcResponse<AppStartupStatusResult>
      if (
        mounted &&
        startup_status_response.ok &&
        startup_status_response.data.notice_ja !== null &&
        startup_status_response.data.notice_kind !== null
      ) {
        set_app_notice_message(startup_status_response.data.notice_ja)
        set_app_notice_kind(startup_status_response.data.notice_kind)
      }

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

  useEffect(() => {
    if (active_page !== 'review') {
      return
    }

    void load_review_queue()
  }, [active_page, load_review_queue])

  useEffect(() => {
    if (active_page !== 'activity') {
      return
    }

    void load_activity_heatmap()
  }, [active_page, load_activity_heatmap])

  useEffect(() => {
    if (active_page !== 'settings') {
      return
    }

    void load_settings_page()
  }, [active_page, load_settings_page])

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

    if (next_page === 'review') {
      set_review_status_message('')
      set_review_error_message('')
    }

    if (next_page === 'activity') {
      set_activity_error_message('')
    }

    if (next_page === 'settings') {
      set_settings_status_message('')
      set_settings_error_message('')
    }

    if (next_page !== 'library') {
      set_library_delete_target(null)
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

  const handle_request_library_delete = (word: LibraryWordItem): void => {
    set_library_delete_target(word)
    set_library_status_message('')
    set_library_error_message('')
  }

  const handle_cancel_library_delete = (): void => {
    if (library_deleting_word_id !== null) {
      return
    }

    set_library_delete_target(null)
  }

  const handle_confirm_library_delete = async (): Promise<void> => {
    const target_word = library_delete_target
    if (target_word === null) {
      return
    }

    set_library_deleting_word_id(target_word.id)
    set_library_status_message('')
    set_library_error_message('')

    const response = (await window.kotoba.invoke(IPC_CHANNELS.LIBRARY_DELETE, {
      word_id: target_word.id,
    })) as IpcResponse<LibraryDeleteResult>

    set_library_deleting_word_id(null)
    if (is_failure(response)) {
      set_library_error_message(response.error.message)
      set_library_delete_target(null)
      return
    }

    if (library_editing_word_id === target_word.id) {
      set_library_editing_word_id(null)
      set_library_edit_form(EMPTY_LIBRARY_EDIT_FORM)
    }

    set_library_status_message(response.data.message_ja)
    set_library_delete_target(null)
    await load_library_words(library_query)
  }

  const handle_review_grade = async (grade: number): Promise<void> => {
    const current_review_word = review_due_words[0]
    if (!current_review_word) {
      return
    }

    set_review_grading_word_id(current_review_word.id)
    set_review_status_message('')
    set_review_error_message('')

    const response = (await window.kotoba.invoke(IPC_CHANNELS.REVIEW_GRADE, {
      word_id: current_review_word.id,
      grade,
    })) as IpcResponse<ReviewGradeResult>

    set_review_grading_word_id(null)
    if (is_failure(response)) {
      set_review_error_message(response.error.message)
      return
    }

    set_review_status_message(response.data.message_ja)
    await load_review_queue()
  }

  const handle_settings_field = (field: keyof SettingsForm, value: string): void => {
    set_settings_form((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handle_settings_save = async (): Promise<void> => {
    const model = settings_form.model.trim()
    if (model.length === 0) {
      set_settings_error_message('モデル名を入力してください。')
      set_settings_status_message('')
      return
    }

    const timeout_seconds = parse_non_negative_integer(settings_form.timeout_seconds)
    if (timeout_seconds === null) {
      set_settings_error_message('タイムアウトは整数で入力してください。')
      set_settings_status_message('')
      return
    }

    const retries = parse_non_negative_integer(settings_form.retries)
    if (retries === null) {
      set_settings_error_message('リトライ回数は整数で入力してください。')
      set_settings_status_message('')
      return
    }

    set_settings_saving(true)
    set_settings_status_message('')
    set_settings_error_message('')

    const response = (await window.kotoba.invoke(IPC_CHANNELS.SETTINGS_SAVE, {
      model,
      timeout_seconds,
      retries,
      api_key: settings_form.api_key,
    })) as IpcResponse<SettingsSaveResult>

    set_settings_saving(false)
    if (is_failure(response)) {
      set_settings_error_message(response.error.message)
      return
    }

    set_settings_form(to_settings_form(response.data))
    set_settings_has_api_key(response.data.has_api_key)
    set_settings_status_message(response.data.message_ja)
  }

  const handle_delete_api_key = async (): Promise<void> => {
    set_settings_deleting_api_key(true)
    set_settings_status_message('')
    set_settings_error_message('')

    const response = (await window.kotoba.invoke(
      IPC_CHANNELS.SETTINGS_DELETE_API_KEY
    )) as IpcResponse<SettingsDeleteApiKeyResult>

    set_settings_deleting_api_key(false)
    if (is_failure(response)) {
      set_settings_error_message(response.error.message)
      return
    }

    set_settings_form((current) => ({
      ...current,
      api_key: '',
      model: response.data.model,
      timeout_seconds: String(response.data.timeout_seconds),
      retries: String(response.data.retries),
    }))
    set_settings_has_api_key(response.data.has_api_key)
    set_settings_status_message(response.data.message_ja)
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

  const settings_save_disabled = useMemo(
    () =>
      settings_loading ||
      settings_saving ||
      settings_form.model.trim().length === 0 ||
      settings_form.timeout_seconds.trim().length === 0 ||
      settings_form.retries.trim().length === 0,
    [settings_form, settings_loading, settings_saving]
  )

  const settings_delete_disabled = useMemo(
    () =>
      settings_loading ||
      settings_saving ||
      settings_deleting_api_key ||
      settings_has_api_key === false,
    [settings_deleting_api_key, settings_has_api_key, settings_loading, settings_saving]
  )

  const current_review_word = review_due_words[0] ?? null
  const current_page_meta = APP_PAGE_META[active_page]

  return (
    <AppShell
      header={
        <PageHeader
          app_name={APP_NAME}
          page_label={current_page_meta.label}
          title={current_page_meta.title}
          description={current_page_meta.description}
        />
      }
      notice={
        app_notice_message.length > 0 ? (
          <StatusMessage
            message={app_notice_message}
            kind={app_notice_kind === 'warning' ? 'warning' : 'info'}
            role={app_notice_kind === 'warning' ? 'alert' : 'status'}
          />
        ) : null
      }
      navigation={
        <div className="space-y-4">
          <AppNavigation
            aria_label="メインページ"
            items={APP_NAVIGATION_ITEMS}
            value={active_page}
            on_value_change={handle_page_change}
          />
          <Separator />
        </div>
      }
    >
      {active_page === 'word-add' ? (
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
      ) : null}

      {active_page === 'library' ? (
        <LibraryPage
          delete_target={library_delete_target}
          deleting_word_id={library_deleting_word_id}
          edit_form={library_edit_form}
          editing_word_id={library_editing_word_id}
          error_message={library_error_message}
          is_loading={library_loading}
          is_updating={library_updating}
          matched_count={library_matched_count}
          on_cancel_delete={handle_cancel_library_delete}
          on_cancel_edit={handle_cancel_library_edit}
          on_confirm_delete={handle_confirm_library_delete}
          on_edit_field={handle_library_edit_field}
          on_query_change={set_library_query}
          on_request_delete={handle_request_library_delete}
          on_start_edit={handle_start_library_edit}
          on_update={handle_library_update}
          query={library_query}
          status_message={library_status_message}
          total_count={library_total_count}
          update_disabled={library_update_disabled}
          words={library_words}
        />
      ) : null}

      {active_page === 'review' ? (
        <ReviewPage
          completed_today_count={review_completed_today_count}
          current_review_word={current_review_word}
          due_count={review_due_count}
          error_message={review_error_message}
          grading_word_id={review_grading_word_id}
          is_loading={review_loading}
          on_grade={handle_review_grade}
          status_message={review_status_message}
        />
      ) : null}

      {active_page === 'activity' ? (
        <ActivityPage
          error_message={activity_error_message}
          heatmap={activity_heatmap}
          is_loading={activity_loading}
        />
      ) : null}

      {active_page === 'settings' ? (
        <SettingsPage
          delete_disabled={settings_delete_disabled}
          error_message={settings_error_message}
          form={settings_form}
          has_api_key={settings_has_api_key}
          is_deleting_api_key={settings_deleting_api_key}
          is_loading={settings_loading}
          is_saving={settings_saving}
          on_delete_api_key={handle_delete_api_key}
          on_field_change={handle_settings_field}
          on_save={handle_settings_save}
          save_disabled={settings_save_disabled}
          status_message={settings_status_message}
        />
      ) : null}
    </AppShell>
  )
}

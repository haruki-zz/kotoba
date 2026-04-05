import { useEffect, useState } from 'react'
import './style.css'
import { AppNavigation, type AppNavigationItem } from '@/renderer/components/layout/app_navigation'
import { AppShell } from '@/renderer/components/layout/app_shell'
import { PageHeader } from '@/renderer/components/layout/page_header'
import { StatusMessage } from '@/renderer/components/shared/status_message'
import { ActivityFeature } from '@/renderer/features/activity/activity_feature'
import { LibraryFeature } from '@/renderer/features/library/library_feature'
import { ReviewFeature } from '@/renderer/features/review/review_feature'
import { SettingsFeature } from '@/renderer/features/settings/settings_feature'
import { WordAddFeature } from '@/renderer/features/word_add/word_add_feature'
import { type AppStartupStatusResult, IPC_CHANNELS, type IpcResponse } from '../shared/ipc'

type AppPage = 'word-add' | 'library' | 'review' | 'activity' | 'settings'

const APP_NAME = 'Kotoba'

const APP_NAVIGATION_ITEMS: AppNavigationItem<AppPage>[] = [
  { value: 'activity', label: '活動', icon: 'dashboard' },
  { value: 'library', label: '単語帳', icon: 'menu_book' },
  { value: 'review', label: '復習', icon: 'psychology' },
  { value: 'word-add', label: '単語追加', icon: 'auto_awesome' },
  { value: 'settings', label: '設定', icon: 'settings' },
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

export const App = () => {
  const [app_notice_message, set_app_notice_message] = useState<string>('')
  const [app_notice_kind, set_app_notice_kind] = useState<'info' | 'warning' | null>(null)
  const [active_page, set_active_page] = useState<AppPage>('activity')

  useEffect(() => {
    let mounted = true

    const load_startup_status = async (): Promise<void> => {
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
    }

    void load_startup_status()
    return () => {
      mounted = false
    }
  }, [])

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
        <AppNavigation
          aria_label="メインページ"
          items={APP_NAVIGATION_ITEMS}
          value={active_page}
          on_value_change={set_active_page}
        />
      }
    >
      {active_page === 'word-add' ? <WordAddFeature /> : null}
      {active_page === 'library' ? <LibraryFeature /> : null}
      {active_page === 'review' ? <ReviewFeature /> : null}
      {active_page === 'activity' ? <ActivityFeature /> : null}
      {active_page === 'settings' ? <SettingsFeature /> : null}
    </AppShell>
  )
}

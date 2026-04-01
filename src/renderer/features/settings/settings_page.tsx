import type { InputHTMLAttributes } from 'react'

import { LoadingState } from '@/renderer/components/shared/loading_state'
import { StatusMessage } from '@/renderer/components/shared/status_message'
import { Badge } from '@/renderer/components/ui/badge'
import { Button } from '@/renderer/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/renderer/components/ui/card'
import { Input } from '@/renderer/components/ui/input'

type SettingsPageForm = {
  model: string
  timeout_seconds: string
  retries: string
  api_key: string
}

type SettingsPageProps = {
  form: SettingsPageForm
  has_api_key: boolean
  status_message: string
  error_message: string
  is_loading: boolean
  is_saving: boolean
  is_deleting_api_key: boolean
  save_disabled: boolean
  delete_disabled: boolean
  on_field_change: (field: keyof SettingsPageForm, value: string) => void
  on_save: () => Promise<void>
  on_delete_api_key: () => Promise<void>
}

const settings_field = (props: {
  label: string
  aria_label: string
  value: string
  on_change?: (value: string) => void
  placeholder?: string
  read_only?: boolean
  type?: 'text' | 'password'
  input_mode?: InputHTMLAttributes<HTMLInputElement>['inputMode']
}) => {
  const handle_change = props.on_change

  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-foreground">{props.label}</span>
      <Input
        aria-label={props.aria_label}
        className={props.read_only ? 'bg-muted/60 text-muted-foreground' : undefined}
        inputMode={props.input_mode}
        onChange={
          handle_change
            ? (event) => {
                handle_change(event.target.value)
              }
            : undefined
        }
        placeholder={props.placeholder}
        readOnly={props.read_only}
        type={props.type}
        value={props.value}
      />
    </label>
  )
}

export const SettingsPage = ({
  form,
  has_api_key,
  status_message,
  error_message,
  is_loading,
  is_saving,
  is_deleting_api_key,
  save_disabled,
  delete_disabled,
  on_field_change,
  on_save,
  on_delete_api_key,
}: SettingsPageProps) => (
  <Card className="border-border/80 bg-card/95">
    <CardHeader className="space-y-4 p-5 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <CardTitle>接続設定</CardTitle>
          <CardDescription>
            Gemini の接続情報と生成時の既定値をまとめて管理できます。
          </CardDescription>
        </div>
        <Badge className="w-fit px-3 py-1" variant={has_api_key ? 'default' : 'outline'}>
          {has_api_key ? 'API キー登録済み' : 'API キー未設定'}
        </Badge>
      </div>

      <div className="rounded-xl border border-border/80 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <p className="m-0 font-medium text-foreground">
          API キーの状態: {has_api_key ? '登録済み' : '未設定'}
        </p>
        <p className="m-0 mt-1">
          API キー欄を空欄のまま保存すると、現在のキーをそのまま維持します。
        </p>
      </div>

      {is_loading ? <LoadingState message="設定を読み込み中..." /> : null}
    </CardHeader>

    <CardContent className="space-y-4 p-5 pt-0 sm:p-6 sm:pt-0">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="border-border/70 bg-background/90 shadow-none">
          <CardHeader className="p-5 pb-4">
            <CardTitle className="text-base">生成の既定値</CardTitle>
            <CardDescription>
              プロバイダー、モデル、タイムアウト、リトライ回数を更新します。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0">
            {settings_field({
              label: 'プロバイダー',
              aria_label: 'プロバイダー',
              value: 'gemini',
              read_only: true,
            })}
            {settings_field({
              label: 'モデル名',
              aria_label: 'モデル名',
              value: form.model,
              placeholder: '例: gemini-2.5-flash',
              on_change: (value) => {
                on_field_change('model', value)
              },
            })}
            <div className="grid gap-4 sm:grid-cols-2">
              {settings_field({
                label: 'タイムアウト（秒）',
                aria_label: 'タイムアウト秒',
                value: form.timeout_seconds,
                input_mode: 'numeric',
                on_change: (value) => {
                  on_field_change('timeout_seconds', value)
                },
              })}
              {settings_field({
                label: 'リトライ回数',
                aria_label: 'リトライ回数',
                value: form.retries,
                input_mode: 'numeric',
                on_change: (value) => {
                  on_field_change('retries', value)
                },
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-background/90 shadow-none">
          <CardHeader className="p-5 pb-4">
            <CardTitle className="text-base">API キー管理</CardTitle>
            <CardDescription>新しいキーを登録するか、不要なキーを削除できます。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0">
            <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              <p className="m-0">
                現在の状態:{' '}
                <span className="font-medium text-foreground">
                  {has_api_key ? '登録済み' : '未設定'}
                </span>
              </p>
              <p className="m-0 mt-1">
                {has_api_key
                  ? '新しいキーを入力すると既存のキーを上書きします。'
                  : '生成を使うには API キーの登録が必要です。'}
              </p>
            </div>

            {settings_field({
              label: 'API キー',
              aria_label: 'API キー',
              value: form.api_key,
              type: 'password',
              placeholder: has_api_key ? '新しいキーを入力すると上書きされます' : 'API キーを入力',
              on_change: (value) => {
                on_field_change('api_key', value)
              },
            })}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          disabled={save_disabled}
          onClick={() => {
            void on_save()
          }}
          type="button"
        >
          {is_saving ? '保存中...' : '設定を保存'}
        </Button>
        <Button
          disabled={delete_disabled}
          onClick={() => {
            void on_delete_api_key()
          }}
          type="button"
          variant="destructive"
        >
          {is_deleting_api_key ? '削除中...' : 'API キーを削除'}
        </Button>
      </div>

      <div className="space-y-3">
        {status_message.length > 0 ? (
          <StatusMessage message={status_message} kind="success" role="status" />
        ) : null}
        {error_message.length > 0 ? (
          <StatusMessage message={error_message} kind="error" role="alert" />
        ) : null}
      </div>
    </CardContent>
  </Card>
)

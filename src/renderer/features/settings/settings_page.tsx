import type { InputHTMLAttributes } from 'react'

import { LoadingState } from '@/renderer/components/shared/loading_state'
import { StatusMessage } from '@/renderer/components/shared/status_message'
import { Badge } from '@/renderer/components/ui/badge'
import { Button } from '@/renderer/components/ui/button'
import { Card, CardContent } from '@/renderer/components/ui/card'
import { Input } from '@/renderer/components/ui/input'
import { cn } from '@/renderer/lib/utils'

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
      <span className="text-sm font-semibold text-foreground">{props.label}</span>
      <Input
        aria-label={props.aria_label}
        className={cn(props.read_only ? 'bg-white/55 text-muted-foreground' : null)}
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

const settings_summary_card = (props: { label: string; value: string; tone?: string }) => (
  <Card className={cn('border-white/20 bg-white/60', props.tone)}>
    <CardContent className="space-y-2 p-5 pt-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary/70">
        {props.label}
      </p>
      <p className="font-headline text-2xl font-extrabold tracking-tight text-foreground">
        {props.value}
      </p>
    </CardContent>
  </Card>
)

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
  <div className="space-y-6">
    <section className="grid gap-6 xl:grid-cols-[1.2fr_0.95fr]">
      <Card className="overflow-hidden border-white/18 bg-linear-to-br from-white/78 via-white/62 to-[#f4ffe8]/88">
        <CardContent className="relative space-y-5 p-6 pt-6 sm:p-8 sm:pt-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#7efc00]/20 blur-3xl" />
          <div className="relative space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={has_api_key ? 'default' : 'outline'}>
                {has_api_key ? 'API キー登録済み' : 'API キー未設定'}
              </Badge>
              <Badge variant="outline">Gemini</Badge>
            </div>
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-primary/70">
                接続設定
              </p>
              <h2 className="max-w-2xl font-headline text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                接続条件と生成既定値を
                <br />
                ひとつに集約
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                API キー、モデル名、タイムアウト、リトライ回数を管理します。API
                キー欄を空欄で保存すると現在のキーを維持します。
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full bg-primary/92 px-5 py-2 text-sm font-bold text-primary-foreground shadow-[0_20px_44px_-28px_rgba(48,104,0,0.9)]">
              {has_api_key ? 'API キー登録済み' : 'API キー未設定'}
            </div>
            <div className="rounded-full bg-white/70 px-5 py-2 text-sm text-muted-foreground">
              保存先はローカル環境です
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
        {settings_summary_card({
          label: 'プロバイダー',
          value: 'gemini',
          tone: 'bg-[#f7fff0]',
        })}
        {settings_summary_card({
          label: 'モデル',
          value: form.model.trim().length > 0 ? form.model : '未設定',
          tone: 'bg-[#effff9]',
        })}
        {settings_summary_card({
          label: '状態',
          value: has_api_key ? '利用可能' : 'キー待ち',
          tone: 'bg-[#fffdf3]',
        })}
      </div>
    </section>

    {is_loading ? <LoadingState message="設定を読み込み中..." /> : null}

    <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="border-white/20 bg-white/64">
        <CardContent className="space-y-6 p-6 pt-6 sm:p-8 sm:pt-8">
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary/70">
              生成の既定値
            </p>
            <h3 className="font-headline text-2xl font-extrabold tracking-tight text-foreground">
              モデルとリクエスト条件
            </h3>
            <p className="text-sm leading-7 text-muted-foreground">
              生成時に使うモデル名、タイムアウト、リトライ回数を更新します。
            </p>
          </div>

          <div className="grid gap-4">
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
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/20 bg-white/60">
        <CardContent className="space-y-6 p-6 pt-6 sm:p-8 sm:pt-8">
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary/70">
              API キー管理
            </p>
            <h3 className="font-headline text-2xl font-extrabold tracking-tight text-foreground">
              認証情報の更新
            </h3>
            <p className="text-sm leading-7 text-muted-foreground">
              新しいキーを登録するか、不要なキーを削除できます。
            </p>
          </div>

          <div className="rounded-[1.75rem] bg-[#f7fff0] px-5 py-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary/70">
              現在の状態
            </p>
            <p className="mt-3 text-sm leading-7 text-foreground">
              {has_api_key
                ? 'API キーは登録済みです。新しいキーを入力すると上書きします。'
                : 'API キーが未設定です。生成機能を使うには登録が必要です。'}
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
        </CardContent>
      </Card>
    </section>

    <div className="space-y-3">
      {status_message.length > 0 ? (
        <StatusMessage message={status_message} kind="success" role="status" />
      ) : null}
      {error_message.length > 0 ? (
        <StatusMessage message={error_message} kind="error" role="alert" />
      ) : null}
    </div>
  </div>
)

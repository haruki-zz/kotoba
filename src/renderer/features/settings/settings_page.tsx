import type { InputHTMLAttributes } from 'react'

import {
  AI_PROVIDER_OPTIONS,
  get_models_for_provider,
  get_provider_label,
  type AiProviderName,
} from '@/shared/ai_catalog'
import { LoadingState } from '@/renderer/components/shared/loading_state'
import { StatusMessage } from '@/renderer/components/shared/status_message'
import { Badge } from '@/renderer/components/ui/badge'
import { Button } from '@/renderer/components/ui/button'
import { Card, CardContent } from '@/renderer/components/ui/card'
import { Input } from '@/renderer/components/ui/input'
import { Select } from '@/renderer/components/ui/select'
import { cn } from '@/renderer/lib/utils'

type SettingsPageForm = {
  provider: AiProviderName
  model: string
  timeout_seconds: string
  retries: string
  api_key: string
}

type SettingsPageProps = {
  form: SettingsPageForm
  api_key_status_by_provider: Record<AiProviderName, boolean>
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

const settings_select_field = (props: {
  label: string
  aria_label: string
  value: string
  options: Array<{ value: string; label: string }>
  on_change: (value: string) => void
}) => (
  <label className="space-y-2">
    <span className="text-sm font-semibold text-foreground">{props.label}</span>
    <div className="relative">
      <Select
        aria-label={props.aria_label}
        onChange={(event) => {
          props.on_change(event.target.value)
        }}
        value={props.value}
      >
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
        ▼
      </span>
    </div>
  </label>
)

const settings_summary_card = (props: { label: string; value: string; tone?: string }) => (
  <Card className={cn('border-border bg-white/94', props.tone)}>
    <CardContent className="space-y-2 p-5 pt-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
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
  api_key_status_by_provider,
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
}: SettingsPageProps) => {
  const selected_provider_label = get_provider_label(form.provider)
  const selected_provider_has_api_key = api_key_status_by_provider[form.provider]
  const selected_model_options = get_models_for_provider(form.provider)

  return (
    <div className="space-y-6">
      <section className="grid gap-6 2xl:grid-cols-[1.2fr_0.95fr]">
        <Card className="overflow-hidden border-border bg-linear-to-br from-white via-[#fcfcfb] to-[#f4f4f1]">
          <CardContent className="relative space-y-5 p-6 pt-6 sm:p-8 sm:pt-8">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-stone-100 blur-3xl" />
            <div className="relative space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={selected_provider_has_api_key ? 'default' : 'outline'}>
                  {selected_provider_has_api_key ? 'API キー登録済み' : 'API キー未設定'}
                </Badge>
                <Badge variant="outline">{selected_provider_label}</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-muted-foreground">
                  設定
                </p>
                <h2 className="max-w-2xl font-headline text-[clamp(2rem,5vw,3rem)] font-extrabold tracking-tight text-foreground">
                  AI 設定
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full bg-white px-5 py-2 text-sm font-medium text-foreground shadow-[inset_0_0_0_1px_rgba(31,42,31,0.08)]">
                API キーの状態: {selected_provider_has_api_key ? '登録済み' : '未設定'}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-4 2xl:grid-cols-1">
          {settings_summary_card({
            label: 'プロバイダー',
            value: selected_provider_label,
            tone: 'bg-[#fbfbf8]',
          })}
          {settings_summary_card({
            label: 'モデル',
            value:
              selected_model_options.find((option) => option.value === form.model)?.label ??
              '未設定',
            tone: 'bg-[#f7f7f4]',
          })}
          {settings_summary_card({
            label: '状態',
            value: selected_provider_has_api_key ? '利用可能' : 'キー待ち',
            tone: 'bg-[#f3f3ef]',
          })}
        </div>
      </section>

      {is_loading ? <LoadingState message="読み込み中..." /> : null}

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-border bg-white/96">
          <CardContent className="space-y-6 p-6 pt-6 sm:p-8 sm:pt-8">
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                生成
              </p>
              <h3 className="font-headline text-2xl font-extrabold tracking-tight text-foreground">
                基本設定
              </h3>
            </div>

            <div className="grid gap-4">
              {settings_select_field({
                label: 'プロバイダー',
                aria_label: 'プロバイダー',
                value: form.provider,
                options: AI_PROVIDER_OPTIONS,
                on_change: (value) => {
                  on_field_change('provider', value)
                },
              })}
              {settings_select_field({
                label: 'モデル',
                aria_label: 'モデル',
                value: form.model,
                options: selected_model_options,
                on_change: (value) => {
                  on_field_change('model', value)
                },
              })}
              <div className="grid gap-4 lg:grid-cols-2">
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

        <Card className="border-border bg-white/94">
          <CardContent className="space-y-6 p-6 pt-6 sm:p-8 sm:pt-8">
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                API キー
              </p>
              <h3 className="font-headline text-2xl font-extrabold tracking-tight text-foreground">
                認証
              </h3>
            </div>

            <div className="rounded-[1.75rem] bg-[#fbfbf8] px-5 py-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                状態
              </p>
              <p className="mt-3 text-sm text-foreground">
                {selected_provider_has_api_key
                  ? `${selected_provider_label}: 登録済み`
                  : `${selected_provider_label}: 未設定`}
              </p>
            </div>

            {settings_field({
              label: 'API キー',
              aria_label: 'API キー',
              value: form.api_key,
              type: 'password',
              placeholder: selected_provider_has_api_key ? '新しいキー' : 'API キー',
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
}

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
import { Textarea } from '@/renderer/components/ui/textarea'
import type { WordAddDraftPayload } from '@/shared/ipc'

type WordAddPageProps = {
  draft: WordAddDraftPayload
  status_message: string
  error_message: string
  is_generating: boolean
  is_saving: boolean
  save_disabled: boolean
  on_field_change: (field: keyof WordAddDraftPayload, value: string) => void
  on_generate: () => Promise<void>
  on_save: () => Promise<void>
}

const form_field = (props: {
  label: string
  aria_label: string
  value: string
  placeholder?: string
  rows?: number
  multiline?: boolean
  on_change: (value: string) => void
}) => (
  <label className="space-y-2">
    <span className="text-sm font-medium text-foreground">{props.label}</span>
    {props.multiline ? (
      <Textarea
        aria-label={props.aria_label}
        rows={props.rows}
        value={props.value}
        onChange={(event) => props.on_change(event.target.value)}
        placeholder={props.placeholder}
      />
    ) : (
      <Input
        aria-label={props.aria_label}
        value={props.value}
        onChange={(event) => props.on_change(event.target.value)}
        placeholder={props.placeholder}
      />
    )}
  </label>
)

export const WordAddPage = ({
  draft,
  status_message,
  error_message,
  is_generating,
  is_saving,
  save_disabled,
  on_field_change,
  on_generate,
  on_save,
}: WordAddPageProps) => (
  <Card className="border-border/80 bg-card/95">
    <CardHeader className="space-y-4 p-5 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <CardTitle>追加フロー</CardTitle>
          <CardDescription>
            単語を入力し、AI の生成結果を確認してから単語帳へ保存します。
          </CardDescription>
        </div>
        <Badge className="w-fit px-3 py-1" variant="outline">
          草稿は自動保存されます
        </Badge>
      </div>
    </CardHeader>

    <CardContent className="space-y-4 p-5 pt-0 sm:p-6 sm:pt-0">
      <Card className="border-border/70 bg-background/80 shadow-none">
        <CardContent className="flex flex-col gap-4 p-5 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="m-0 text-sm font-medium text-foreground">操作</p>
            <p className="m-0 text-sm text-muted-foreground">
              生成後も内容は編集できます。保存すると対応する草稿は削除されます。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={is_generating}
              onClick={() => {
                void on_generate()
              }}
              type="button"
            >
              {is_generating ? '生成中...' : '生成'}
            </Button>
            <Button
              disabled={save_disabled}
              onClick={() => {
                void on_save()
              }}
              type="button"
            >
              {is_saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {is_generating ? <LoadingState message="生成結果を読み込み中..." /> : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card className="border-border/70 bg-background/90 shadow-none">
          <CardHeader className="p-5 pb-4">
            <CardTitle className="text-base">入力</CardTitle>
            <CardDescription>AI に渡す単語を入力します。</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {form_field({
              label: '単語',
              aria_label: '単語',
              value: draft.word,
              placeholder: '例: 食べる',
              on_change: (value) => on_field_change('word', value),
            })}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-background/90 shadow-none">
          <CardHeader className="p-5 pb-4">
            <CardTitle className="text-base">生成結果</CardTitle>
            <CardDescription>
              読み、意味、文脈、例文を確認し、必要に応じて編集します。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0">
            {form_field({
              label: '読み仮名',
              aria_label: '読み仮名',
              value: draft.reading_kana,
              on_change: (value) => on_field_change('reading_kana', value),
            })}
            {form_field({
              label: '意味（日本語）',
              aria_label: '意味',
              value: draft.meaning_ja,
              rows: 3,
              multiline: true,
              on_change: (value) => on_field_change('meaning_ja', value),
            })}
            {form_field({
              label: '文脈',
              aria_label: '文脈',
              value: draft.context_scene_ja,
              rows: 3,
              multiline: true,
              on_change: (value) => on_field_change('context_scene_ja', value),
            })}
            {form_field({
              label: '例文',
              aria_label: '例文',
              value: draft.example_sentence_ja,
              rows: 2,
              multiline: true,
              on_change: (value) => on_field_change('example_sentence_ja', value),
            })}
          </CardContent>
        </Card>
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

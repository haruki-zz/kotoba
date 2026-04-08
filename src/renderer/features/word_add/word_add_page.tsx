import { LoadingState } from '@/renderer/components/shared/loading_state'
import { StatusMessage } from '@/renderer/components/shared/status_message'
import { Button } from '@/renderer/components/ui/button'
import { Card, CardContent } from '@/renderer/components/ui/card'
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
    <span className="text-sm font-semibold text-foreground">{props.label}</span>
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
  <div className="space-y-6">
    <section>
      <Card className="overflow-hidden border-border bg-linear-to-br from-white via-[#fcfcfb] to-[#f4f4f1]">
        <CardContent className="relative space-y-6 p-6 pt-6 sm:p-8 sm:pt-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-stone-100 blur-3xl" />
          <div className="relative space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-muted-foreground">
              単語追加
            </p>
            <h2 className="max-w-2xl font-headline text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              単語を追加
            </h2>
          </div>

          <div className="relative rounded-[2rem] bg-white p-5 shadow-[inset_0_0_0_1px_rgba(31,42,31,0.05)]">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">単語</span>
              <Input
                aria-label="単語"
                className="h-[3.25rem]"
                placeholder="例: 食べる"
                value={draft.word}
                onChange={(event) => on_field_change('word', event.target.value)}
              />
            </label>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                disabled={is_generating}
                onClick={() => {
                  void on_generate()
                }}
                type="button"
              >
                {is_generating ? '生成中...' : '生成する'}
              </Button>
              <Button
                disabled={save_disabled}
                onClick={() => {
                  void on_save()
                }}
                type="button"
                variant="secondary"
              >
                {is_saving ? '保存中...' : '単語帳へ保存'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>

    {is_generating ? <LoadingState message="生成中..." /> : null}

    <section>
      <Card className="border-border bg-white/94">
        <CardContent className="space-y-6 p-6 pt-6 sm:p-8 sm:pt-8">
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
              結果
            </p>
            <h3 className="font-headline text-2xl font-extrabold tracking-tight text-foreground">
              編集
            </h3>
          </div>

          <div className="grid gap-4">
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
              rows: 4,
              multiline: true,
              on_change: (value) => on_field_change('meaning_ja', value),
            })}
            {form_field({
              label: '文脈',
              aria_label: '文脈',
              value: draft.context_scene_ja,
              rows: 4,
              multiline: true,
              on_change: (value) => on_field_change('context_scene_ja', value),
            })}
            {form_field({
              label: '例文',
              aria_label: '例文',
              value: draft.example_sentence_ja,
              rows: 3,
              multiline: true,
              on_change: (value) => on_field_change('example_sentence_ja', value),
            })}
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

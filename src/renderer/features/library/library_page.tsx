import { ConfirmDialog } from '@/renderer/components/shared/confirm_dialog'
import { EmptyState } from '@/renderer/components/shared/empty_state'
import { LoadingState } from '@/renderer/components/shared/loading_state'
import { StatusMessage } from '@/renderer/components/shared/status_message'
import { Badge } from '@/renderer/components/ui/badge'
import { Button } from '@/renderer/components/ui/button'
import { Card, CardContent } from '@/renderer/components/ui/card'
import { Input } from '@/renderer/components/ui/input'
import { Textarea } from '@/renderer/components/ui/textarea'
import { cn } from '@/renderer/lib/utils'
import type { LibraryWordItem } from '@/shared/ipc'

type LibraryEditForm = {
  word: string
  reading_kana: string
  meaning_ja: string
  context_scene_ja: string
  example_sentence_ja: string
}

type LibraryPageProps = {
  query: string
  words: LibraryWordItem[]
  total_count: number
  matched_count: number
  status_message: string
  error_message: string
  is_loading: boolean
  editing_word_id: string | null
  edit_form: LibraryEditForm
  is_updating: boolean
  deleting_word_id: string | null
  update_disabled: boolean
  delete_target: LibraryWordItem | null
  on_query_change: (value: string) => void
  on_start_edit: (word: LibraryWordItem) => void
  on_cancel_edit: () => void
  on_edit_field: (field: keyof LibraryEditForm, value: string) => void
  on_update: () => Promise<void>
  on_request_delete: (word: LibraryWordItem) => void
  on_cancel_delete: () => void
  on_confirm_delete: () => Promise<void>
}

const field_block = (props: {
  label: string
  aria_label: string
  value: string
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
      />
    ) : (
      <Input
        aria-label={props.aria_label}
        value={props.value}
        onChange={(event) => props.on_change(event.target.value)}
      />
    )}
  </label>
)

const library_summary_card = (props: { label: string; value: string; tone?: string }) => (
  <Card className={cn('border-border bg-white/94', props.tone)}>
    <CardContent className="space-y-2 p-5 pt-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {props.label}
      </p>
      <p className="font-headline text-3xl font-extrabold tracking-tight text-foreground">
        {props.value}
      </p>
    </CardContent>
  </Card>
)

export const LibraryPage = ({
  query,
  words,
  total_count,
  matched_count,
  status_message,
  error_message,
  is_loading,
  editing_word_id,
  edit_form,
  is_updating,
  deleting_word_id,
  update_disabled,
  delete_target,
  on_query_change,
  on_start_edit,
  on_cancel_edit,
  on_edit_field,
  on_update,
  on_request_delete,
  on_cancel_delete,
  on_confirm_delete,
}: LibraryPageProps) => (
  <>
    <div className="space-y-6">
      <section className="grid gap-6 2xl:grid-cols-[1.25fr_0.95fr]">
        <Card className="overflow-hidden border-border bg-linear-to-br from-white via-[#fcfcfb] to-[#f4f4f1]">
          <CardContent className="relative space-y-5 p-6 pt-6 sm:p-8 sm:pt-8">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-stone-100 blur-3xl" />
            <div className="relative space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-muted-foreground">
                単語帳
              </p>
              <h2 className="max-w-2xl font-headline text-[clamp(2rem,5vw,3rem)] font-extrabold tracking-tight text-foreground">
                単語を管理
              </h2>
            </div>

            <label className="relative block">
              <span className="sr-only">単語帳検索</span>
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                search
              </span>
              <Input
                aria-label="単語帳検索"
                className="h-[3.25rem] pl-12"
                placeholder="単語・読み仮名・意味で検索"
                value={query}
                onChange={(event) => on_query_change(event.target.value)}
              />
            </label>
          </CardContent>
        </Card>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-4 2xl:grid-cols-1">
          {library_summary_card({
            label: '表示件数',
            value: `${matched_count} 件`,
            tone: 'bg-[#fbfbf8]',
          })}
          {library_summary_card({
            label: '全件数',
            value: `${total_count} 件`,
            tone: 'bg-[#f7f7f4]',
          })}
          {library_summary_card({
            label: '検索状態',
            value: query.trim().length > 0 ? '絞り込み中' : '全件表示',
            tone: 'bg-[#f3f3ef]',
          })}
        </div>
      </section>

      {is_loading ? <LoadingState message="読み込み中..." /> : null}

      {words.length === 0 && is_loading === false ? (
        <EmptyState title="単語がありません。" />
      ) : null}

      <ul className="m-0 grid list-none gap-5 p-0">
        {words.map((word) => {
          const is_editing = editing_word_id === word.id
          const is_deleting = deleting_word_id === word.id

          if (is_editing) {
            return (
              <li key={word.id}>
                <Card className="border-border bg-white">
                  <CardContent className="space-y-6 p-6 pt-6 sm:p-8 sm:pt-8">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div className="space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                          編集
                        </p>
                        <h3 className="font-headline text-2xl font-extrabold tracking-tight text-foreground">
                          「{word.word}」を更新
                        </h3>
                      </div>
                    </div>

                    <div className="grid gap-4 2xl:grid-cols-2">
                      {field_block({
                        label: '単語',
                        aria_label: '編集単語',
                        value: edit_form.word,
                        on_change: (value) => on_edit_field('word', value),
                      })}
                      {field_block({
                        label: '読み仮名',
                        aria_label: '編集読み仮名',
                        value: edit_form.reading_kana,
                        on_change: (value) => on_edit_field('reading_kana', value),
                      })}
                      {field_block({
                        label: '意味（日本語）',
                        aria_label: '編集意味',
                        value: edit_form.meaning_ja,
                        rows: 4,
                        multiline: true,
                        on_change: (value) => on_edit_field('meaning_ja', value),
                      })}
                      {field_block({
                        label: '文脈',
                        aria_label: '編集文脈',
                        value: edit_form.context_scene_ja,
                        rows: 4,
                        multiline: true,
                        on_change: (value) => on_edit_field('context_scene_ja', value),
                      })}
                    </div>

                    {field_block({
                      label: '例文',
                      aria_label: '編集例文',
                      value: edit_form.example_sentence_ja,
                      rows: 3,
                      multiline: true,
                      on_change: (value) => on_edit_field('example_sentence_ja', value),
                    })}

                    <div className="flex flex-wrap gap-3">
                      <Button
                        disabled={update_disabled}
                        onClick={() => {
                          void on_update()
                        }}
                        type="button"
                      >
                        {is_updating ? '更新中...' : '更新する'}
                      </Button>
                      <Button onClick={on_cancel_edit} type="button" variant="secondary">
                        編集をやめる
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            )
          }

          return (
            <li key={word.id}>
              <Card className="border-border bg-white/94">
                <CardContent className="space-y-6 p-6 pt-6 sm:p-8 sm:pt-8">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-headline text-3xl font-extrabold tracking-tight text-foreground">
                          {word.word}
                        </h3>
                        <Badge variant="outline">保存済み</Badge>
                      </div>
                      <p className="text-base font-semibold tracking-[0.03em] text-primary">
                        {word.reading_kana}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button onClick={() => on_start_edit(word)} type="button">
                        編集
                      </Button>
                      <Button
                        disabled={is_deleting}
                        onClick={() => on_request_delete(word)}
                        type="button"
                        variant="destructive"
                      >
                        {is_deleting ? '削除中...' : '削除'}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="rounded-[1.75rem] bg-[#fbfbf8] px-5 py-5 shadow-[inset_0_0_0_1px_rgba(31,42,31,0.05)]">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                        意味
                      </p>
                      <p className="mt-3 text-sm leading-7 text-foreground">{word.meaning_ja}</p>
                    </div>
                    <div className="rounded-[1.75rem] bg-[#f7f7f4] px-5 py-5 shadow-[inset_0_0_0_1px_rgba(31,42,31,0.05)]">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                        文脈
                      </p>
                      <p className="mt-3 text-sm leading-7 text-foreground">
                        {word.context_scene_ja}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] bg-white px-5 py-5 shadow-[inset_0_0_0_1px_rgba(31,42,31,0.05)]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                      例文
                    </p>
                    <p className="mt-3 text-sm leading-7 text-foreground">
                      {word.example_sentence_ja}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ul>

      <div className="space-y-3">
        {status_message.length > 0 ? (
          <StatusMessage message={status_message} kind="success" role="status" />
        ) : null}
        {error_message.length > 0 ? (
          <StatusMessage message={error_message} kind="error" role="alert" />
        ) : null}
      </div>
    </div>

    <ConfirmDialog
      cancel_label="削除しない"
      confirm_disabled={deleting_word_id !== null}
      confirm_label={deleting_word_id !== null ? '削除中...' : '削除する'}
      description={delete_target ? `「${delete_target.word}」を削除します。` : ''}
      on_cancel={on_cancel_delete}
      on_confirm={on_confirm_delete}
      open={delete_target !== null}
      title="単語を削除しますか？"
    />
  </>
)

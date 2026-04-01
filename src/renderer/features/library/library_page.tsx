import { ConfirmDialog } from '@/renderer/components/shared/confirm_dialog'
import { EmptyState } from '@/renderer/components/shared/empty_state'
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
    <span className="text-sm font-medium text-foreground">{props.label}</span>
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

const library_summary_card = (props: { label: string; value: string }) => (
  <Card className="border-border/70 bg-background/90 shadow-none">
    <CardContent className="space-y-2 p-4 pt-4">
      <p className="m-0 text-xs font-medium tracking-wide text-muted-foreground">{props.label}</p>
      <p className="m-0 text-2xl font-semibold text-foreground">{props.value}</p>
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
    <Card className="border-border/80 bg-card/95">
      <CardHeader className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle>検索と管理</CardTitle>
            <CardDescription>
              単語、読み仮名、意味で検索し、その場で編集や削除ができます。
            </CardDescription>
          </div>
          <Badge className="w-fit px-3 py-1" variant="outline">
            検索はかな表記ゆれに対応
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-5 pt-0 sm:p-6 sm:pt-0">
        <Card className="border-border/70 bg-background/90 shadow-none">
          <CardContent className="space-y-4 p-5 pt-5">
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">検索</span>
              <Input
                aria-label="単語帳検索"
                value={query}
                onChange={(event) => on_query_change(event.target.value)}
                placeholder="単語・読み仮名・意味で検索"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-3">
              {library_summary_card({
                label: '表示件数',
                value: `${matched_count} 件`,
              })}
              {library_summary_card({
                label: '全件数',
                value: `${total_count} 件`,
              })}
              {library_summary_card({
                label: '検索状態',
                value: query.trim().length > 0 ? '絞り込み中' : '全件表示',
              })}
            </div>
          </CardContent>
        </Card>

        {is_loading ? <LoadingState message="単語帳を読み込み中..." /> : null}

        {words.length === 0 && is_loading === false ? (
          <EmptyState
            title="該当する単語がありません。"
            description="検索条件を変更してもう一度確認してください。"
          />
        ) : null}

        <ul className="m-0 grid list-none gap-4 p-0">
          {words.map((word) => {
            const is_editing = editing_word_id === word.id
            const is_deleting = deleting_word_id === word.id

            if (is_editing) {
              return (
                <li key={word.id} className="library_item">
                  <Card className="border-border/70 bg-background/90 shadow-none">
                    <CardHeader className="p-5 pb-4">
                      <CardTitle className="text-base">単語を編集</CardTitle>
                      <CardDescription>
                        内容を更新すると既存の復習状態はそのまま保持されます。
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-5 pt-0">
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
                        rows: 3,
                        multiline: true,
                        on_change: (value) => on_edit_field('meaning_ja', value),
                      })}
                      {field_block({
                        label: '文脈',
                        aria_label: '編集文脈',
                        value: edit_form.context_scene_ja,
                        rows: 3,
                        multiline: true,
                        on_change: (value) => on_edit_field('context_scene_ja', value),
                      })}
                      {field_block({
                        label: '例文',
                        aria_label: '編集例文',
                        value: edit_form.example_sentence_ja,
                        rows: 2,
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
                          {is_updating ? '更新中...' : '更新'}
                        </Button>
                        <Button onClick={on_cancel_edit} type="button" variant="secondary">
                          キャンセル
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              )
            }

            return (
              <li key={word.id} className="library_item">
                <Card className="border-border/70 bg-background/90 shadow-none">
                  <CardContent className="space-y-4 p-5 pt-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <p className="m-0 text-2xl font-semibold text-foreground">{word.word}</p>
                        <p className="m-0 text-sm font-medium text-primary">{word.reading_kana}</p>
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

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2 rounded-lg border border-border/80 bg-muted/20 p-4">
                        <p className="m-0 text-xs font-medium tracking-wide text-muted-foreground">
                          意味
                        </p>
                        <p className="m-0 text-sm leading-6 text-foreground">{word.meaning_ja}</p>
                      </div>
                      <div className="space-y-2 rounded-lg border border-border/80 bg-muted/20 p-4">
                        <p className="m-0 text-xs font-medium tracking-wide text-muted-foreground">
                          文脈
                        </p>
                        <p className="m-0 text-sm leading-6 text-foreground">
                          {word.context_scene_ja}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border/80 bg-muted/20 p-4">
                      <p className="m-0 text-xs font-medium tracking-wide text-muted-foreground">
                        例文
                      </p>
                      <p className="m-0 mt-2 text-sm leading-6 text-foreground">
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
      </CardContent>
    </Card>

    <ConfirmDialog
      cancel_label="削除しない"
      confirm_disabled={deleting_word_id !== null}
      confirm_label={deleting_word_id !== null ? '削除中...' : '削除する'}
      description={
        delete_target ? `「${delete_target.word}」を削除します。この操作は取り消せません。` : ''
      }
      on_cancel={on_cancel_delete}
      on_confirm={on_confirm_delete}
      open={delete_target !== null}
      title="単語を削除しますか？"
    />
  </>
)

import { EmptyState } from '@/renderer/components/shared/empty_state'
import { LoadingState } from '@/renderer/components/shared/loading_state'
import { StatusMessage } from '@/renderer/components/shared/status_message'
import { Card, CardContent } from '@/renderer/components/ui/card'
import { cn } from '@/renderer/lib/utils'
import type { ReviewQueueWordItem } from '@/shared/ipc'

const REVIEW_GRADES = [
  { grade: 0, label: '忘れた', icon: 'close', tone: 'text-destructive bg-[#fff0eb]' },
  { grade: 1, label: 'かなり難しい', icon: 'warning', tone: 'text-destructive bg-[#fff7f2]' },
  { grade: 2, label: 'ぎりぎり', icon: 'history', tone: 'text-[#8b5c00] bg-[#fff6d9]' },
  { grade: 3, label: '普通', icon: 'done', tone: 'text-[#296f1f] bg-[#f5ffe7]' },
  { grade: 4, label: '良い', icon: 'check_circle', tone: 'text-primary bg-[#efffe0]' },
  { grade: 5, label: '完璧', icon: 'stars', tone: 'text-primary bg-primary-container/72' },
] as const

type ReviewPageProps = {
  due_count: number
  completed_today_count: number
  current_review_word: ReviewQueueWordItem | null
  status_message: string
  error_message: string
  is_loading: boolean
  grading_word_id: string | null
  on_grade: (grade: number) => Promise<void>
}

const review_stat_card = (props: { label: string; value: string; tone?: string }) => (
  <Card className={cn('border-white/20 bg-white/60', props.tone)}>
    <CardContent className="space-y-2 p-5 pt-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary/70">
        {props.label}
      </p>
      <p className="font-headline text-3xl font-extrabold tracking-tight text-foreground">
        {props.value}
      </p>
    </CardContent>
  </Card>
)

export const ReviewPage = ({
  due_count,
  completed_today_count,
  current_review_word,
  status_message,
  error_message,
  is_loading,
  grading_word_id,
  on_grade,
}: ReviewPageProps) => (
  <div className="space-y-6">
    <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        {review_stat_card({
          label: '残り件数',
          value: `${due_count} 件`,
          tone: 'bg-[#f7fff0]',
        })}
        {review_stat_card({
          label: '今日完了',
          value: `${completed_today_count} 件`,
          tone: 'bg-[#effff9]',
        })}
      </div>

      <Card className="overflow-hidden border-white/18 bg-linear-to-br from-white/78 via-white/62 to-[#f4ffe8]/88">
        <CardContent className="relative space-y-5 p-6 pt-6 sm:p-8 sm:pt-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#7efc00]/20 blur-3xl" />
          <div className="relative space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-primary/70">
              今日の復習セッション
            </p>
            <h2 className="max-w-2xl font-headline text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              今の集中で、
              <br />
              定着率を一段上げる
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              到期した単語を 1 件ずつ評価し、SM-2 に沿って次回の復習予定を更新します。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full bg-primary/92 px-5 py-2 text-sm font-bold text-primary-foreground shadow-[0_20px_44px_-28px_rgba(48,104,0,0.9)]">
              復習対象 {due_count} 件
            </div>
            <div className="rounded-full bg-white/70 px-5 py-2 text-sm text-muted-foreground">
              今日の完了 {completed_today_count} 件
            </div>
          </div>
        </CardContent>
      </Card>
    </section>

    {is_loading ? <LoadingState message="復習キューを読み込み中..." /> : null}

    {current_review_word ? (
      <Card className="overflow-hidden border-white/18 bg-white/66">
        <CardContent className="space-y-8 p-6 pt-6 sm:p-8 sm:pt-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary/70">
                フラッシュカード
              </p>
              <p className="text-sm leading-7 text-muted-foreground">
                意味と文脈を確認したら、思い出しやすさに近い評価を選んでください。
              </p>
            </div>
            <div className="rounded-full bg-white/72 px-5 py-2 text-sm text-muted-foreground">
              評価すると次回日時を更新します
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-4xl">
            <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[2rem] bg-primary-container/18" />
            <div className="absolute inset-0 -translate-x-2 translate-y-2 rounded-[2rem] bg-white/70" />
            <div className="relative rounded-[2.5rem] bg-white/88 px-6 py-8 shadow-[0_40px_90px_-52px_rgba(48,104,0,0.5)] sm:px-10 sm:py-12">
              <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary/70">
                    単語
                  </p>
                  <p className="mt-2 text-base font-semibold tracking-[0.03em] text-primary">
                    {current_review_word.reading_kana}
                  </p>
                </div>
                <span className="rounded-full bg-[#f4ffe8] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                  復習中
                </span>
              </div>

              <div className="space-y-8 text-center">
                <h3 className="font-headline text-6xl font-extrabold tracking-tight text-foreground sm:text-[5.5rem]">
                  {current_review_word.word}
                </h3>
                <div className="grid gap-4 text-left lg:grid-cols-3">
                  <div className="rounded-[1.75rem] bg-[#f7fff0] px-5 py-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary/70">
                      意味
                    </p>
                    <p className="mt-3 text-sm leading-7 text-foreground">
                      {current_review_word.meaning_ja}
                    </p>
                  </div>
                  <div className="rounded-[1.75rem] bg-[#effff9] px-5 py-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary/70">
                      文脈
                    </p>
                    <p className="mt-3 text-sm leading-7 text-foreground">
                      {current_review_word.context_scene_ja}
                    </p>
                  </div>
                  <div className="rounded-[1.75rem] bg-white/72 px-5 py-5 shadow-[inset_0_0_0_1px_rgba(48,104,0,0.06)]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary/70">
                      例文
                    </p>
                    <p className="mt-3 text-sm leading-7 text-foreground">
                      {current_review_word.example_sentence_ja}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div aria-label="復習評価" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {REVIEW_GRADES.map((item) => {
              const is_submitting = grading_word_id === current_review_word.id

              return (
                <button
                  key={item.grade}
                  className={cn(
                    'group rounded-[2rem] px-4 py-5 text-center shadow-[0_20px_44px_-34px_rgba(14,54,27,0.4)] transition-all duration-200 hover:-translate-y-1 disabled:translate-y-0 disabled:opacity-60',
                    item.tone,
                    item.grade === 5 ? 'scale-[1.03]' : 'bg-white/70'
                  )}
                  disabled={is_submitting}
                  onClick={() => {
                    void on_grade(item.grade)
                  }}
                  type="button"
                >
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/72 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.26)]">
                    <span className="material-symbols-outlined text-[30px]">{item.icon}</span>
                  </span>
                  <p className="mt-4 font-headline text-2xl font-extrabold tracking-tight">
                    {is_submitting ? '...' : item.grade}
                  </p>
                  <p className="mt-1 text-xs font-bold tracking-[0.18em] text-foreground/75">
                    {is_submitting ? '送信中' : item.label}
                  </p>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    ) : null}

    {current_review_word === null && is_loading === false ? (
      <EmptyState
        title="今日の復習は完了しました。"
        description="新しく到期した単語がある場合は、このページに自動で表示されます。"
      />
    ) : null}

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

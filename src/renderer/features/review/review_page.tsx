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
    <section className="grid gap-6 2xl:grid-cols-[0.9fr_1.1fr]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-4 2xl:grid-cols-1">
        {review_stat_card({
          label: '残り件数',
          value: `${due_count} 件`,
          tone: 'bg-[#fbfbf8]',
        })}
        {review_stat_card({
          label: '今日完了',
          value: `${completed_today_count} 件`,
          tone: 'bg-[#f7f7f4]',
        })}
      </div>

      <Card className="overflow-hidden border-border bg-linear-to-br from-white via-[#fcfcfb] to-[#f4f4f1]">
        <CardContent className="relative space-y-5 p-6 pt-6 sm:p-8 sm:pt-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-stone-100 blur-3xl" />
          <div className="relative space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-muted-foreground">
              復習
            </p>
            <h2 className="max-w-2xl font-headline text-[clamp(2rem,5vw,3rem)] font-extrabold tracking-tight text-foreground">
              今日のキュー
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full bg-white px-5 py-2 text-sm font-medium text-foreground shadow-[inset_0_0_0_1px_rgba(31,42,31,0.08)]">
              復習対象 {due_count} 件
            </div>
          </div>
        </CardContent>
      </Card>
    </section>

    {is_loading ? <LoadingState message="読み込み中..." /> : null}

    {current_review_word ? (
      <Card className="overflow-hidden border-border bg-white/96">
        <CardContent className="space-y-8 p-6 pt-6 sm:p-8 sm:pt-8">
          <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                カード
              </p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-4xl">
            <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-[2rem] bg-neutral-100 sm:translate-x-4 sm:translate-y-4" />
            <div className="absolute inset-0 -translate-x-1 translate-y-1 rounded-[2rem] bg-stone-50 sm:-translate-x-2 sm:translate-y-2" />
            <div className="relative rounded-[2rem] bg-white px-5 py-6 shadow-[0_40px_90px_-52px_rgba(31,42,31,0.16)] sm:rounded-[2.5rem] sm:px-8 sm:py-9 lg:px-10 lg:py-12">
              <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                    単語
                  </p>
                  <p className="mt-2 text-base font-semibold tracking-[0.03em] text-primary">
                    {current_review_word.reading_kana}
                  </p>
                </div>
                <span className="rounded-full bg-[#f7f7f4] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  復習中
                </span>
              </div>

              <div className="space-y-8 text-center">
                <h3 className="font-headline text-[clamp(2.75rem,10vw,5.5rem)] font-extrabold tracking-tight text-foreground">
                  {current_review_word.word}
                </h3>
                <div className="grid gap-4 text-left xl:grid-cols-3">
                  <div className="rounded-[1.75rem] bg-[#fbfbf8] px-5 py-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                      意味
                    </p>
                    <p className="mt-3 text-sm leading-7 text-foreground">
                      {current_review_word.meaning_ja}
                    </p>
                  </div>
                  <div className="rounded-[1.75rem] bg-[#f7f7f4] px-5 py-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                      文脈
                    </p>
                    <p className="mt-3 text-sm leading-7 text-foreground">
                      {current_review_word.context_scene_ja}
                    </p>
                  </div>
                  <div className="rounded-[1.75rem] bg-white px-5 py-5 shadow-[inset_0_0_0_1px_rgba(31,42,31,0.05)]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
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

          <div
            aria-label="復習評価"
            className="grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-4"
          >
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
      <EmptyState title="今日の復習は完了しました。" />
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

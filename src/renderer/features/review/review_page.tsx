import { EmptyState } from '@/renderer/components/shared/empty_state'
import { LoadingState } from '@/renderer/components/shared/loading_state'
import { StatusMessage } from '@/renderer/components/shared/status_message'
import { Button } from '@/renderer/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/renderer/components/ui/card'
import { cn } from '@/renderer/lib/utils'
import type { ReviewQueueWordItem } from '@/shared/ipc'

const REVIEW_GRADES = [0, 1, 2, 3, 4, 5] as const

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

const review_stat_card = (props: { label: string; value: string; class_name: string }) => (
  <Card className={`${props.class_name} border-border/70 bg-background/90 shadow-none`}>
    <CardContent className="space-y-2 p-4 pt-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground">{props.label}</p>
      <p className="text-2xl font-semibold text-foreground">{props.value}</p>
    </CardContent>
  </Card>
)

const review_grade_class_name = (grade: number): string => {
  if (grade <= 1) {
    return 'border-destructive/40 text-destructive hover:bg-destructive/10'
  }

  if (grade === 2) {
    return 'border-chart-5/40 text-foreground hover:bg-chart-5/10'
  }

  if (grade === 3) {
    return 'border-chart-4/40 text-foreground hover:bg-chart-4/10'
  }

  if (grade === 4) {
    return 'border-primary/35 text-foreground hover:bg-primary/10'
  }

  return 'border-primary/45 bg-primary/6 text-foreground hover:bg-primary/12'
}

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
  <Card className="border-border/80 bg-card/95">
    <CardHeader className="space-y-4 p-5 sm:p-6">
      <div className="space-y-1">
        <CardTitle>今日の復習</CardTitle>
        <CardDescription>
          いま復習すべき単語を 1 件ずつ確認し、評価に応じて次回予定を更新します。
        </CardDescription>
      </div>
    </CardHeader>

    <CardContent className="space-y-4 p-5 pt-0 sm:p-6 sm:pt-0">
      <div className="review_stats grid gap-3 sm:grid-cols-2">
        {review_stat_card({
          class_name: 'review_due_stat',
          label: '残り件数',
          value: `${due_count} 件`,
        })}
        {review_stat_card({
          class_name: 'review_completed_stat',
          label: '今日完了',
          value: `${completed_today_count} 件`,
        })}
      </div>

      {is_loading ? <LoadingState message="復習キューを読み込み中..." /> : null}

      {current_review_word ? (
        <Card className="review_card border-border/70 bg-background/90 shadow-none">
          <CardHeader className="p-5 pb-4">
            <div className="space-y-2">
              <p className="review_word text-3xl font-semibold tracking-tight text-foreground">
                {current_review_word.word}
              </p>
              <p className="review_reading text-sm font-medium text-primary">
                {current_review_word.reading_kana}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0">
            <dl className="review_details grid gap-4">
              <div className="rounded-lg border border-border/80 bg-muted/20 p-4">
                <dt className="text-xs font-medium tracking-wide text-muted-foreground">意味</dt>
                <dd className="mt-2 text-sm leading-6 text-foreground">
                  {current_review_word.meaning_ja}
                </dd>
              </div>
              <div className="rounded-lg border border-border/80 bg-muted/20 p-4">
                <dt className="text-xs font-medium tracking-wide text-muted-foreground">文脈</dt>
                <dd className="mt-2 text-sm leading-6 text-foreground">
                  {current_review_word.context_scene_ja}
                </dd>
              </div>
              <div className="rounded-lg border border-border/80 bg-muted/20 p-4">
                <dt className="text-xs font-medium tracking-wide text-muted-foreground">例文</dt>
                <dd className="mt-2 text-sm leading-6 text-foreground">
                  {current_review_word.example_sentence_ja}
                </dd>
              </div>
            </dl>

            <div className="rounded-xl border border-border/80 bg-muted/20 px-4 py-3">
              <p className="review_hint text-sm text-muted-foreground">
                評価を選ぶと次回の復習日時が更新されます。
              </p>
            </div>

            <div className="review_grade_row flex flex-wrap gap-2" aria-label="復習評価">
              {REVIEW_GRADES.map((grade) => (
                <Button
                  key={grade}
                  className={cn('review_grade_button min-w-16', review_grade_class_name(grade))}
                  disabled={grading_word_id === current_review_word.id}
                  onClick={() => {
                    void on_grade(grade)
                  }}
                  type="button"
                  variant="outline"
                >
                  {grading_word_id === current_review_word.id ? '送信中...' : grade}
                </Button>
              ))}
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
    </CardContent>
  </Card>
)

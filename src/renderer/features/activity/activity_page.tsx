import { EmptyState } from '@/renderer/components/shared/empty_state'
import { LoadingState } from '@/renderer/components/shared/loading_state'
import { StatusMessage } from '@/renderer/components/shared/status_message'
import { Card, CardContent } from '@/renderer/components/ui/card'
import { cn } from '@/renderer/lib/utils'
import type {
  ActivityHeatmapCell,
  ActivityHeatmapResult,
  ActivityMemoryLevelStat,
} from '@/shared/ipc'

type ActivityPageProps = {
  heatmap: ActivityHeatmapResult | null
  error_message: string
  is_loading: boolean
}

const ACTIVITY_WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const
const ACTIVITY_LEVELS = [0, 1, 2, 3, 4] as const

const build_activity_weeks = (
  cells: ActivityHeatmapCell[]
): Array<Array<ActivityHeatmapCell | null>> => {
  const weeks: Array<Array<ActivityHeatmapCell | null>> = []
  let current_week: Array<ActivityHeatmapCell | null> = Array.from({ length: 7 }, () => null)

  for (const cell of cells) {
    if (cell.weekday === 0 && current_week.some((value) => value !== null)) {
      weeks.push(current_week)
      current_week = Array.from({ length: 7 }, () => null)
    }

    current_week[cell.weekday] = cell
  }

  if (current_week.some((value) => value !== null)) {
    weeks.push(current_week)
  }

  return weeks
}

const format_activity_cell_label = (cell: ActivityHeatmapCell): string =>
  `${cell.date}: 活動 ${cell.activity_count} 件（追加 ${cell.added_word_count} 件、復習 ${cell.review_count} 件）`

const format_activity_memory_level_percentage = (percentage: number): string =>
  `${percentage.toFixed(1)}%`

const format_activity_memory_level_label = (
  stat: ActivityMemoryLevelStat,
  total_word_count: number
): string =>
  `レベル ${stat.level}: ${stat.word_count} 語 / 全 ${total_word_count} 語（${format_activity_memory_level_percentage(stat.percentage)}）`

const activity_level_class_name = (level: ActivityHeatmapCell['level']): string => {
  if (level === 0) {
    return 'bg-neutral-100'
  }

  if (level === 1) {
    return 'bg-neutral-200'
  }

  if (level === 2) {
    return 'bg-neutral-300'
  }

  if (level === 3) {
    return 'bg-neutral-500'
  }

  return 'bg-neutral-700'
}

const activity_summary_card = (props: { label: string; value: string; tone?: string }) => (
  <Card className={cn('border-border bg-white/92', props.tone)}>
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

const activity_memory_level_row = (stat: ActivityMemoryLevelStat, total_word_count: number) => (
  <div
    key={stat.level}
    aria-label={format_activity_memory_level_label(stat, total_word_count)}
    className="rounded-[1.75rem] bg-white px-5 py-4 shadow-[inset_0_0_0_1px_rgba(31,42,31,0.05)]"
    role="listitem"
  >
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          記憶レベル {stat.level}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {stat.word_count} 語 / 全 {total_word_count} 語
        </p>
      </div>
      <p className="font-headline text-2xl font-extrabold tracking-tight text-foreground">
        {format_activity_memory_level_percentage(stat.percentage)}
      </p>
    </div>
    <div className="mt-4 h-2 rounded-full bg-neutral-200">
      <div
        className="h-full rounded-full bg-neutral-700"
        style={{ width: `${Math.max(stat.percentage, stat.word_count > 0 ? 6 : 0)}%` }}
      />
    </div>
  </div>
)

export const ActivityPage = ({ heatmap, error_message, is_loading }: ActivityPageProps) => {
  const activity_weeks = build_activity_weeks(heatmap?.cells ?? [])

  return (
    <div className="space-y-6">
      {heatmap ? (
        <>
          <section className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
            <Card className="overflow-hidden border-border bg-linear-to-br from-white via-[#fcfcfb] to-[#f4f4f1]">
              <CardContent className="relative space-y-6 p-6 pt-6 sm:p-8 sm:pt-8">
                <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-stone-100 blur-3xl" />
                <div className="relative space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                    活動
                  </p>
                  <div className="space-y-2">
                    <h2 className="max-w-2xl font-headline text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                      40 週間
                    </h2>
                  </div>
                </div>

                <div className="relative grid gap-4 md:grid-cols-3">
                  {activity_summary_card({
                    label: '総活動',
                    value: `${heatmap.total_activity_count} 件`,
                    tone: 'bg-[#fbfbf8]',
                  })}
                  {activity_summary_card({
                    label: '現在連続',
                    value: `${heatmap.current_streak_days} 日`,
                    tone: 'bg-[#f7f7f4]',
                  })}
                  {activity_summary_card({
                    label: '最長連続',
                    value: `${heatmap.longest_streak_days} 日`,
                    tone: 'bg-[#f3f3ef]',
                  })}
                </div>

                <div className="relative flex flex-wrap items-center gap-3">
                  <div className="rounded-full bg-white px-5 py-2 text-sm font-medium text-foreground shadow-[inset_0_0_0_1px_rgba(31,42,31,0.08)]">
                    期間: {heatmap.range_start} - {heatmap.range_end}
                  </div>
                  <div className="rounded-full bg-[#f7f7f4] px-5 py-2 text-sm text-muted-foreground">
                    追加 {heatmap.total_added_word_count} 件 / 復習 {heatmap.total_review_count} 件
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              {activity_summary_card({
                label: '活動日',
                value: `${heatmap.active_day_count} 日`,
              })}
              {activity_summary_card({
                label: '単語追加',
                value: `${heatmap.total_added_word_count} 件`,
              })}
              {activity_summary_card({
                label: '復習回数',
                value: `${heatmap.total_review_count} 件`,
              })}
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
            <Card className="border-border bg-white/94">
              <CardContent className="space-y-6 p-6 pt-6 sm:p-8 sm:pt-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                      ヒートマップ
                    </p>
                    <h3 className="font-headline text-2xl font-extrabold tracking-tight text-foreground">
                      活動
                    </h3>
                  </div>

                  <div
                    aria-hidden="true"
                    className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    <span>少ない</span>
                    {ACTIVITY_LEVELS.map((level) => (
                      <span
                        key={level}
                        className={cn(
                          'h-4 w-4 rounded-[0.45rem] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]',
                          activity_level_class_name(level)
                        )}
                      />
                    ))}
                    <span>多い</span>
                  </div>
                </div>

                <div className="overflow-x-auto pb-2">
                  <div className="flex min-w-fit items-start gap-3">
                    <div
                      aria-hidden="true"
                      className="grid grid-rows-[repeat(7,_16px)] gap-2 pt-0.5 text-[12px] text-muted-foreground"
                    >
                      {ACTIVITY_WEEKDAY_LABELS.map((weekday) => (
                        <span key={weekday}>{weekday}</span>
                      ))}
                    </div>
                    <div className="flex gap-2" role="grid" aria-label="学習活動ヒートマップ">
                      {activity_weeks.map((week, week_index) => (
                        <div
                          key={`${week[0]?.date ?? 'week'}-${week_index}`}
                          className="grid grid-rows-[repeat(7,_16px)] gap-2"
                        >
                          {week.map((cell, day_index) =>
                            cell ? (
                              <div
                                key={cell.date}
                                aria-label={format_activity_cell_label(cell)}
                                className={cn(
                                  'h-4 w-4 rounded-[0.45rem] border border-transparent shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]',
                                  activity_level_class_name(cell.level),
                                  cell.is_today ? 'border-foreground shadow-none' : null
                                )}
                                data-activity-count={cell.activity_count}
                                data-activity-date={cell.date}
                                role="gridcell"
                              />
                            ) : (
                              <div
                                key={`empty-${week_index}-${day_index}`}
                                aria-hidden="true"
                                className="h-4 w-4 rounded-[0.45rem] bg-transparent"
                              />
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-white/94">
              <CardContent className="space-y-6 p-6 pt-6 sm:p-8 sm:pt-8">
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                    記憶レベル構成
                  </p>
                  <h3 className="font-headline text-2xl font-extrabold tracking-tight text-foreground">
                    レベル
                  </h3>
                </div>

                {heatmap.total_word_count > 0 ? (
                  <div aria-label="記憶レベル構成" className="grid gap-4" role="list">
                    {heatmap.memory_level_stats.map((stat) =>
                      activity_memory_level_row(stat, heatmap.total_word_count)
                    )}
                  </div>
                ) : (
                  <EmptyState title="単語がありません。" />
                )}
              </CardContent>
            </Card>
          </section>

          {heatmap.total_activity_count === 0 ? <EmptyState title="活動がありません。" /> : null}
        </>
      ) : null}

      {is_loading ? <LoadingState message="読み込み中..." /> : null}

      {error_message.length > 0 ? (
        <StatusMessage message={error_message} kind="error" role="alert" />
      ) : null}
    </div>
  )
}

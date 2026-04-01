import { EmptyState } from '@/renderer/components/shared/empty_state'
import { LoadingState } from '@/renderer/components/shared/loading_state'
import { StatusMessage } from '@/renderer/components/shared/status_message'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/renderer/components/ui/card'
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
    return 'bg-slate-200 dark:bg-slate-700/80'
  }

  if (level === 1) {
    return 'bg-sky-200 dark:bg-sky-900/80'
  }

  if (level === 2) {
    return 'bg-sky-300 dark:bg-sky-700/80'
  }

  if (level === 3) {
    return 'bg-sky-400 dark:bg-sky-600/85'
  }

  return 'bg-sky-600 dark:bg-sky-500'
}

const activity_summary_card = (props: { label: string; value: string }) => (
  <Card className="activity_summary_card border-border/70 bg-linear-to-b from-background to-accent/30 shadow-none">
    <CardContent className="space-y-2 p-4 pt-4">
      <p className="m-0 text-xs font-medium tracking-wide text-muted-foreground">{props.label}</p>
      <p className="m-0 text-2xl font-semibold text-foreground">{props.value}</p>
    </CardContent>
  </Card>
)

export const ActivityPage = ({ heatmap, error_message, is_loading }: ActivityPageProps) => {
  const activity_weeks = build_activity_weeks(heatmap?.cells ?? [])

  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader className="space-y-4 p-5 sm:p-6">
        <div className="space-y-1">
          <CardTitle>学習サマリー</CardTitle>
          <CardDescription>
            活動量は単語追加と復習の合計件数です。直近 40 週間の学習量を表示します。
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-5 pt-0 sm:p-6 sm:pt-0">
        {heatmap ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {activity_summary_card({
                label: '総活動',
                value: `${heatmap.total_activity_count} 件`,
              })}
              {activity_summary_card({
                label: '追加',
                value: `${heatmap.total_added_word_count} 件`,
              })}
              {activity_summary_card({
                label: '復習',
                value: `${heatmap.total_review_count} 件`,
              })}
              {activity_summary_card({
                label: '活動日',
                value: `${heatmap.active_day_count} 日`,
              })}
              {activity_summary_card({
                label: '現在連続',
                value: `${heatmap.current_streak_days} 日`,
              })}
              {activity_summary_card({
                label: '最長連続',
                value: `${heatmap.longest_streak_days} 日`,
              })}
            </div>

            <div className="rounded-xl border border-border/80 bg-background/80 px-4 py-3">
              <p className="m-0 text-sm text-muted-foreground">
                期間: {heatmap.range_start} - {heatmap.range_end}
              </p>
            </div>

            <Card className="border-border/70 bg-linear-to-b from-background to-accent/10 shadow-none">
              <CardHeader className="space-y-1 p-5 pb-4">
                <CardTitle className="text-base">記憶レベル構成</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  現在の SM-2 状態を 5 段階にまとめ、各レベルの割合を表示しています。
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                {heatmap.total_word_count > 0 ? (
                  <div
                    className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
                    role="list"
                    aria-label="記憶レベル構成"
                  >
                    {heatmap.memory_level_stats.map((stat) => (
                      <Card
                        key={stat.level}
                        className="activity_memory_level_card border-border/70 bg-background/80 shadow-none"
                        role="listitem"
                        aria-label={format_activity_memory_level_label(
                          stat,
                          heatmap.total_word_count
                        )}
                      >
                        <CardContent className="space-y-2 p-4 pt-4">
                          <p className="m-0 text-xs font-medium tracking-wide text-muted-foreground">
                            レベル {stat.level}
                          </p>
                          <p className="m-0 text-2xl font-semibold text-foreground">
                            {format_activity_memory_level_percentage(stat.percentage)}
                          </p>
                          <p className="m-0 text-sm text-muted-foreground">
                            {stat.word_count} 語 / 全 {heatmap.total_word_count} 語
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="まだ単語がありません。"
                    description="単語を保存すると記憶レベル構成がここに表示されます。"
                  />
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-background/90 shadow-none">
              <CardHeader className="p-5 pb-4">
                <CardTitle className="text-base">ヒートマップ</CardTitle>
                <CardDescription>
                  日ごとの活動量を強度別に表示します。今日のセルは外枠で強調しています。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-5 pt-0">
                <div className="overflow-x-auto pb-2">
                  <div className="flex min-w-fit items-start gap-2.5">
                    <div
                      className="grid grid-rows-[repeat(7,_14px)] gap-1.5 pt-[2px] text-[12px] text-muted-foreground"
                      aria-hidden="true"
                    >
                      {ACTIVITY_WEEKDAY_LABELS.map((weekday) => (
                        <span key={weekday}>{weekday}</span>
                      ))}
                    </div>
                    <div className="flex gap-1.5" role="grid" aria-label="学習活動ヒートマップ">
                      {activity_weeks.map((week, week_index) => (
                        <div
                          key={`${week[0]?.date ?? 'week'}-${week_index}`}
                          className="grid grid-rows-[repeat(7,_14px)] gap-1.5"
                        >
                          {week.map((cell, day_index) =>
                            cell ? (
                              <div
                                key={cell.date}
                                role="gridcell"
                                aria-label={format_activity_cell_label(cell)}
                                className={cn(
                                  'h-3.5 w-3.5 rounded-[4px] border border-transparent',
                                  activity_level_class_name(cell.level),
                                  cell.is_today ? 'border-foreground' : null
                                )}
                                data-activity-count={cell.activity_count}
                                data-activity-date={cell.date}
                              />
                            ) : (
                              <div
                                key={`empty-${week_index}-${day_index}`}
                                aria-hidden="true"
                                className="h-3.5 w-3.5 rounded-[4px] border border-transparent bg-transparent"
                              />
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  className="flex items-center gap-2 text-[12px] text-muted-foreground"
                  aria-hidden="true"
                >
                  <span>少ない</span>
                  {ACTIVITY_LEVELS.map((level) => (
                    <span
                      key={level}
                      className={cn(
                        'h-3.5 w-3.5 rounded-[4px] border border-transparent',
                        activity_level_class_name(level)
                      )}
                    />
                  ))}
                  <span>多い</span>
                </div>
              </CardContent>
            </Card>

            {heatmap.total_activity_count === 0 ? (
              <EmptyState
                title="まだ活動記録がありません。"
                description="単語追加や復習をするとヒートマップに表示されます。"
              />
            ) : null}
          </>
        ) : null}

        {is_loading ? <LoadingState message="活動データを読み込み中..." /> : null}

        {error_message.length > 0 ? (
          <StatusMessage message={error_message} kind="error" role="alert" />
        ) : null}
      </CardContent>
    </Card>
  )
}

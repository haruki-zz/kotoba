import { type ReviewLog, type Word } from '../shared/domain_schema'
import { type ActivityHeatmapCell, type ActivityHeatmapResult } from '../shared/ipc'
import { type LibraryRepository } from './library_repository'

const ACTIVITY_HEATMAP_WEEKS = 40 as const
const DAYS_PER_WEEK = 7 as const

interface ActivityServiceDeps {
  library_repository: LibraryRepository
  now?: () => Date
}

export class ActivityService {
  private readonly library_repository: LibraryRepository
  private readonly now: () => Date

  constructor(deps: ActivityServiceDeps) {
    this.library_repository = deps.library_repository
    this.now = deps.now ?? (() => new Date())
  }

  async get_heatmap(): Promise<ActivityHeatmapResult> {
    const now = this.now()
    const library = await this.library_repository.read_library()
    return create_activity_heatmap_result({
      words: library.words,
      review_logs: library.review_logs,
      now,
    })
  }
}

const create_activity_heatmap_result = (input: {
  words: Word[]
  review_logs: ReviewLog[]
  now: Date
}): ActivityHeatmapResult => {
  const range_end = start_of_local_day(input.now)
  const range_start = start_of_local_week(
    add_local_days(range_end, -((ACTIVITY_HEATMAP_WEEKS - 1) * DAYS_PER_WEEK))
  )
  const cells = create_empty_cells(range_start, range_end)
  const cell_map = new Map(cells.map((cell) => [cell.date, cell]))

  for (const word of input.words) {
    const day_key = format_local_day_key(new Date(word.created_at))
    const cell = cell_map.get(day_key)
    if (!cell) {
      continue
    }

    cell.added_word_count += 1
    cell.activity_count += 1
  }

  for (const review_log of input.review_logs) {
    const day_key = format_local_day_key(new Date(review_log.reviewed_at))
    const cell = cell_map.get(day_key)
    if (!cell) {
      continue
    }

    cell.review_count += 1
    cell.activity_count += 1
  }

  const max_activity_count = cells.reduce(
    (max_value, cell) => Math.max(max_value, cell.activity_count),
    0
  )
  for (const cell of cells) {
    cell.level = resolve_activity_level(cell.activity_count, max_activity_count)
  }

  return {
    range_start: format_local_day_key(range_start),
    range_end: format_local_day_key(range_end),
    total_activity_count: cells.reduce((total, cell) => total + cell.activity_count, 0),
    total_review_count: cells.reduce((total, cell) => total + cell.review_count, 0),
    total_added_word_count: cells.reduce((total, cell) => total + cell.added_word_count, 0),
    active_day_count: cells.filter((cell) => cell.activity_count > 0).length,
    current_streak_days: count_current_streak_days(cells),
    longest_streak_days: count_longest_streak_days(cells),
    max_activity_count,
    cells,
  }
}

const create_empty_cells = (range_start: Date, range_end: Date): ActivityHeatmapCell[] => {
  const cells: ActivityHeatmapCell[] = []
  let current_day = new Date(range_start)

  while (current_day.getTime() <= range_end.getTime()) {
    cells.push({
      date: format_local_day_key(current_day),
      weekday: current_day.getDay(),
      activity_count: 0,
      review_count: 0,
      added_word_count: 0,
      level: 0,
      is_today: is_same_local_day(current_day, range_end),
    })

    current_day = add_local_days(current_day, 1)
  }

  return cells
}

const resolve_activity_level = (
  activity_count: number,
  max_activity_count: number
): ActivityHeatmapCell['level'] => {
  if (activity_count === 0) {
    return 0
  }

  if (max_activity_count <= 4) {
    return Math.min(activity_count, 4) as ActivityHeatmapCell['level']
  }

  const intensity = activity_count / max_activity_count
  if (intensity >= 0.75) {
    return 4
  }

  if (intensity >= 0.5) {
    return 3
  }

  if (intensity >= 0.25) {
    return 2
  }

  return 1
}

const count_current_streak_days = (cells: ActivityHeatmapCell[]): number => {
  let streak = 0
  for (let index = cells.length - 1; index >= 0; index -= 1) {
    if (cells[index]?.activity_count === 0) {
      break
    }

    streak += 1
  }

  return streak
}

const count_longest_streak_days = (cells: ActivityHeatmapCell[]): number => {
  let longest_streak = 0
  let current_streak = 0

  for (const cell of cells) {
    if (cell.activity_count === 0) {
      current_streak = 0
      continue
    }

    current_streak += 1
    longest_streak = Math.max(longest_streak, current_streak)
  }

  return longest_streak
}

const start_of_local_day = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)

const start_of_local_week = (date: Date): Date => {
  const week_start = start_of_local_day(date)
  week_start.setDate(week_start.getDate() - week_start.getDay())
  return week_start
}

const add_local_days = (date: Date, days: number): Date => {
  const next_date = new Date(date)
  next_date.setDate(next_date.getDate() + days)
  return next_date
}

const is_same_local_day = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate()

const format_local_day_key = (date: Date): string => {
  const year = date.getFullYear().toString().padStart(4, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

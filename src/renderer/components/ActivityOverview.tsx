import { useEffect, useMemo, useState } from "react";
import { DAY_IN_MS } from "../../shared/sm2";
import { ActivitySummaryDay } from "../../shared/types";
import ActivityHeatmap, { colorForValue } from "./ActivityHeatmap";
import DifficultyChart from "./DifficultyChart";
import { createAppStore, useAppStore } from "../store";

type StoreHook = ReturnType<typeof createAppStore>;

interface ActivityOverviewProps {
  store?: StoreHook;
  onNavigateToReview?: () => void;
  onNavigateToLibrary?: () => void;
}

const DAYS_TO_RENDER = 42;

const formatDateKey = (timestamp: number) => new Date(timestamp).toISOString().slice(0, 10);

const buildRecentDays = (history: ActivitySummaryDay[], days = DAYS_TO_RENDER, anchorDate?: string) => {
  const anchor = anchorDate ? Date.parse(`${anchorDate}T00:00:00Z`) : Date.now();
  const byDate = new Map(history.map((day) => [day.date, day]));
  const recent: ActivitySummaryDay[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const timestamp = anchor - offset * DAY_IN_MS;
    const key = formatDateKey(timestamp);
    const existing = byDate.get(key);

    recent.push(
      existing ?? {
        date: key,
        added_count: 0,
        review_count: 0,
        total: 0,
      },
    );
  }

  return recent;
};

const ActivityOverview = ({
  store = useAppStore,
  onNavigateToReview,
  onNavigateToLibrary,
}: ActivityOverviewProps) => {
  const activity = store((state) => state.activity);
  const words = store((state) => state.words);
  const refreshActivity = store((state) => state.refreshActivity);
  const refreshWords = store((state) => state.refreshWords);
  const session = store((state) => state.session);
  const [activityError, setActivityError] = useState<string | undefined>();
  const [wordsError, setWordsError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        await refreshActivity();
        if (!cancelled) {
          setActivityError(undefined);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "加载活跃度失败";
          setActivityError(message);
        }
      }

      try {
        await refreshWords();
        if (!cancelled) {
          setWordsError(undefined);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "加载词库失败";
          setWordsError(message);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshActivity, refreshWords]);

  const anchorDate = activity?.today.date;
  const recentDays = useMemo(
    () => buildRecentDays(activity?.history ?? [], DAYS_TO_RENDER, anchorDate),
    [activity?.history, anchorDate],
  );

  const maxTotal = useMemo(
    () => recentDays.reduce((max, day) => Math.max(max, day.total), 0),
    [recentDays],
  );

  const today =
    activity?.today ??
    ({
      date: formatDateKey(Date.now()),
      added_count: 0,
      review_count: 0,
      total: 0,
    } satisfies ActivitySummaryDay);

  return (
    <section className="panel mx-auto max-w-5xl space-y-6 p-6" id="stats-summary">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 space-y-2">
          <p className="eyebrow">活跃度</p>
          <h2 className="text-3xl font-semibold text-ink">每日坚持与词库健康度</h2>
          <p className="text-muted">
            今日新增/复习、连续活跃天数以及近六周热力格一屏可见，可随时跳转去复习。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onNavigateToReview}
            aria-label="跳转到复习"
          >
            去复习
          </button>
          {onNavigateToLibrary && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onNavigateToLibrary}
              aria-label="跳转到词库"
            >
              管理词库
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <p className="eyebrow text-xs">连续活跃</p>
          <p className="text-3xl font-semibold text-primary">
            {activity?.streak ?? 0}
            <span className="ml-1 text-lg text-muted">天</span>
          </p>
          <p className="mt-1 text-sm text-muted">保持节奏，任何一次复习或新增都算活跃</p>
        </div>

        <div className="stat-card">
          <p className="eyebrow text-xs">今日新增</p>
          <p className="text-3xl font-semibold text-ink">{today.added_count}</p>
          <p className="mt-1 text-sm text-muted">已写入词库的单词数量</p>
        </div>

        <div className="stat-card">
          <p className="eyebrow text-xs">今日复习</p>
          <p className="text-3xl font-semibold text-ink">{today.review_count}</p>
          <p className="mt-1 text-sm text-muted">完成 SM-2 评分的次数</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-ink">近 6 周活跃度</p>
            <p className="text-sm text-muted">方块颜色越深，表示当日新增+复习次数越多</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="rounded-full border border-border bg-white/90 px-2 py-1">0</span>
            <div className="flex items-center gap-1">
              {[0.2, 0.5, 0.8].map((ratio) => (
                <span
                  key={ratio}
                  className={`h-4 w-6 rounded ${colorForValue(Math.ceil((maxTotal || 1) * ratio), maxTotal || 1)}`}
                />
              ))}
            </div>
            <span className="rounded-full border border-border bg-white/90 px-2 py-1">多</span>
          </div>
        </div>

        <ActivityHeatmap days={recentDays} maxTotal={maxTotal} onSelectDay={onNavigateToReview} />

        {session.loading && !activity && <p className="text-sm text-muted">正在加载活跃度数据…</p>}
      </div>

      <DifficultyChart
        words={words}
        onNavigateToLibrary={onNavigateToLibrary}
        onNavigateToReview={onNavigateToReview}
      />

      {(activityError || wordsError || session.error) && (
        <div className="callout callout-error text-sm">
          {activityError ?? wordsError ?? session.error}
        </div>
      )}
    </section>
  );
};

export default ActivityOverview;

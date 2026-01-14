import { useMemo } from "react";
import { Word } from "../../shared/types";

type DifficultyKey = "easy" | "medium" | "hard";

const classifyDifficulty = (word: Word): DifficultyKey => {
  const easiness = word.sm2.easiness;
  if (easiness >= 2.6) return "easy";
  if (easiness >= 2.3) return "medium";
  return "hard";
};

const buildDistribution = (words: Word[]) =>
  words.reduce(
    (result, word) => {
      const bucket = classifyDifficulty(word);
      result[bucket] += 1;
      result.total += 1;
      return result;
    },
    {
      easy: 0,
      medium: 0,
      hard: 0,
      total: 0,
    },
  );

interface DifficultyChartProps {
  words: Word[];
  onNavigateToLibrary?: () => void;
  onNavigateToReview?: () => void;
}

const DifficultyChart = ({ words, onNavigateToLibrary, onNavigateToReview }: DifficultyChartProps) => {
  const distribution = useMemo(() => buildDistribution(words), [words]);
  const total = distribution.total || 0;
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const percent = (count: number) => Math.round((count / Math.max(total, 1)) * 100);

  const segments: Array<{
    key: DifficultyKey;
    label: string;
    count: number;
    percent: number;
    color: string;
    hint: string;
  }> = [
    {
      key: "easy",
      label: "容易",
      count: distribution.easy,
      percent: percent(distribution.easy),
      color: "text-success",
      hint: "易记系数 ≥ 2.6，节奏可放缓",
    },
    {
      key: "medium",
      label: "一般",
      count: distribution.medium,
      percent: percent(distribution.medium),
      color: "text-accent",
      hint: "易记系数 2.3–2.59，需要常规复习",
    },
    {
      key: "hard",
      label: "困难",
      count: distribution.hard,
      percent: percent(distribution.hard),
      color: "text-danger",
      hint: "易记系数 < 2.3，优先练习",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-ink">词库难度占比</p>
          <p className="text-sm text-muted">按 SM-2 易记系数粗分，优先关注困难单词。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onNavigateToLibrary && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onNavigateToLibrary}
              aria-label="前往词库管理"
            >
              管理词库
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={onNavigateToReview}
            disabled={!onNavigateToReview || total === 0}
            aria-label="根据难度开始复习"
          >
            去复习
          </button>
        </div>
      </div>

      {total === 0 ? (
        <div className="callout callout-warning text-sm">
          暂未统计到词条，先新增或导入数据后再查看占比。
        </div>
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row">
          <button
            type="button"
            className={`relative mx-auto h-56 w-56 rounded-full bg-surface-muted/60 p-4 shadow-inner transition ${onNavigateToReview ? "hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" : "cursor-default"}`}
            onClick={onNavigateToReview}
            aria-label="根据难度开始复习"
            disabled={!onNavigateToReview}
          >
            <svg viewBox="0 0 120 120" className="h-full w-full">
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="currentColor"
                strokeWidth="12"
                className="text-border"
                fill="transparent"
              />
              {segments.map((segment) => {
                const length = (segment.count / total) * circumference;
                const dashOffset = offset;
                offset -= length;

                return (
                  <circle
                    key={segment.key}
                    cx="60"
                    cy="60"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray={`${length} ${circumference - length}`}
                    strokeDashoffset={dashOffset}
                    className={segment.color}
                    fill="transparent"
                    transform="rotate(-90 60 60)"
                    title={`${segment.label} ${segment.count} 个（${segment.percent}%）`}
                    data-testid={`difficulty-segment-${segment.key}`}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
              <p className="text-xs uppercase tracking-wide text-muted">总词条</p>
              <p className="text-3xl font-semibold text-ink">{total}</p>
              <p className="text-xs text-muted">点击圆环开始复习</p>
            </div>
          </button>

          <div className="grid flex-1 gap-3 sm:grid-cols-3">
            {segments.map((segment) => (
              <button
                key={segment.key}
                type="button"
                className="stat-card text-left transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                onClick={onNavigateToLibrary ?? onNavigateToReview}
                aria-label={`${segment.label} ${segment.count} 个，占比 ${segment.percent}%`}
                title={segment.hint}
              >
                <p className="text-sm font-medium text-ink">{segment.label}</p>
                <p className={`text-2xl font-semibold ${segment.color}`}>
                  {segment.count}
                  <span className="ml-1 text-base text-muted">个</span>
                </p>
                <p className="text-sm text-muted">{segment.percent}% · {segment.hint}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DifficultyChart;

import React from 'react';

import { Difficulty, StatsOverview } from '@shared/types';

type StatTilesProps = {
  stats?: StatsOverview;
  loading?: boolean;
  error?: string | null;
};

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export function StatTiles({ stats, loading, error }: StatTilesProps) {
  if (error) {
    return <p className="muted">无法加载统计：{error}</p>;
  }

  return (
    <div className="stat-grid">
      <div className="tile">
        <p className="eyebrow">待复习</p>
        <h2>{loading ? '…' : stats?.dueCount ?? '–'}</h2>
        <p className="muted">队列根据 next_due_at 排序</p>
      </div>
      <div className="tile">
        <p className="eyebrow">词库总量</p>
        <h2>{loading ? '…' : stats?.totalWords ?? '–'}</h2>
        <p className="muted">全部词条（含未 due）</p>
      </div>
      <div className="tile">
        <p className="eyebrow">今日新增</p>
        <h2>{loading ? '…' : stats?.todayNewCount ?? '–'}</h2>
        <p className="muted">当天 0 点起统计</p>
      </div>
      <div className="tile tile-vertical">
        <p className="eyebrow">掌握度分布</p>
        <div className="bars">
          {(Object.keys(difficultyLabels) as Difficulty[]).map((key) => {
            const value = stats?.difficultyCounts?.[key] ?? 0;
            const total =
              (stats?.difficultyCounts?.easy ?? 0) +
              (stats?.difficultyCounts?.medium ?? 0) +
              (stats?.difficultyCounts?.hard ?? 0);
            const width = total === 0 ? 0 : Math.round((value / total) * 100);
            return (
              <div key={key} className="bar-row">
                <span className="bar-label">{difficultyLabels[key]}</span>
                <div className="bar-track">
                  <div className={`bar-fill bar-${key}`} style={{ width: `${width}%` }} />
                </div>
                <span className="bar-value">{value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

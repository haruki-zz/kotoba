import React from 'react';

import { TagRecord } from '@shared/types';

type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';
type TimeFilter = 'all' | 'last24h' | 'last7d' | 'last30d';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  difficulty: DifficultyFilter;
  onDifficultyChange: (value: DifficultyFilter) => void;
  selectedTag: string;
  onTagChange: (value: string) => void;
  timeFilter: TimeFilter;
  onTimeFilterChange: (value: TimeFilter) => void;
  includeDeleted: boolean;
  onIncludeDeletedChange: (value: boolean) => void;
  tags: TagRecord[];
  isFetching: boolean;
};

export function LibraryFilters({
  search,
  onSearchChange,
  onSearchSubmit,
  difficulty,
  onDifficultyChange,
  selectedTag,
  onTagChange,
  timeFilter,
  onTimeFilterChange,
  includeDeleted,
  onIncludeDeletedChange,
  tags,
  isFetching,
}: Props) {
  return (
    <form
      className="filters"
      onSubmit={(event) => {
        event.preventDefault();
        onSearchSubmit();
      }}
    >
      <label className="label">关键词与筛选</label>
      <div className="library-filters-row">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="搜索词、读音、解释、例句"
        />
        <select value={difficulty} onChange={(event) => onDifficultyChange(event.target.value as DifficultyFilter)}>
          <option value="all">全部难度</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select value={selectedTag} onChange={(event) => onTagChange(event.target.value)}>
          <option value="">全部标签</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.name}>
              {tag.name}
            </option>
          ))}
        </select>
        <select value={timeFilter} onChange={(event) => onTimeFilterChange(event.target.value as TimeFilter)}>
          <option value="all">全部时间</option>
          <option value="last24h">最近 24 小时</option>
          <option value="last7d">最近 7 天</option>
          <option value="last30d">最近 30 天</option>
        </select>
        <button type="submit" className="btn primary" disabled={isFetching}>
          {isFetching ? '查询中…' : '应用筛选'}
        </button>
      </div>
      <label className="checkbox-inline">
        <input
          type="checkbox"
          checked={includeDeleted}
          onChange={(event) => onIncludeDeletedChange(event.target.checked)}
        />
        <span>包含已删除词条</span>
      </label>
    </form>
  );
}

export type { DifficultyFilter, TimeFilter };

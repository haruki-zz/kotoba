import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';

import { fetchWords } from '../api/words';
import { Skeleton } from '../components/Skeleton';
import { WordListItem } from '../components/WordListItem';

const PAGE_SIZE = 12;

function TodayPage() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [page, setPage] = useState(0);

  const query = useQuery({
    queryKey: ['words', { search, difficulty, page }],
    queryFn: () =>
      fetchWords({
        q: search.trim() || undefined,
        difficulty: difficulty === 'all' ? undefined : difficulty,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        orderBy: 'updatedAt',
        order: 'desc',
      }),
    keepPreviousData: true,
  });

  const { data, isLoading, isError, refetch, isFetching } = query;

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(0);
    refetch();
  };

  return (
    <div className="page-grid">
      <section className="card hero">
        <div>
          <p className="eyebrow">Today</p>
          <h1>查看今日列表</h1>
          <p className="lede">
            按关键词或掌握度筛选词条，分页浏览最新更新的内容。队列以 next_due_at 与更新时间排序。
          </p>
        </div>
        <div className="hero-note">
          <p className="muted">列表默认每页 {PAGE_SIZE} 条，可随时刷新</p>
          <button type="button" className="link-btn" onClick={() => refetch()}>
            刷新
          </button>
        </div>
      </section>

      <section className="card">
        <form className="filters" onSubmit={handleSearchSubmit}>
          <label className="label">关键词</label>
          <div className="filters-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索词或假名"
            />
            <select
              value={difficulty}
              onChange={(e) => {
                setPage(0);
                setDifficulty(e.target.value as typeof difficulty);
              }}
            >
              <option value="all">全部难度</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <button type="submit" className="btn primary" disabled={isFetching}>
              {isFetching ? '查询中…' : '搜索'}
            </button>
          </div>
        </form>

        {isError ? <p className="muted">加载失败，请重试</p> : null}
        {isLoading ? <Skeleton lines={4} /> : null}
        {!isLoading && data?.items.length === 0 ? <p className="muted">暂无数据</p> : null}

        <div className="list">
          {data?.items.map((item) => (
            <WordListItem key={item.id} word={item} />
          ))}
        </div>

        <div className="pagination">
          <button
            type="button"
            className="btn ghost"
            disabled={page === 0 || isFetching}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            上一页
          </button>
          <span className="muted">
            Page {page + 1}
            {isFetching ? ' · 更新中…' : ''}
          </span>
          <button
            type="button"
            className="btn ghost"
            disabled={!data?.page.hasMore || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </button>
        </div>
      </section>
    </div>
  );
}

export default TodayPage;

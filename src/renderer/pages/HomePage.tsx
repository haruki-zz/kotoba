import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import AiPlayground from '../components/AiPlayground';
import { StatTiles } from '../components/StatTiles';
import { WordListItem } from '../components/WordListItem';
import { fetchReviewQueue } from '../api/review';
import { fetchStatsOverview } from '../api/stats';

function HomePage() {
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErrorObj,
  } = useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: fetchStatsOverview,
  });

  const {
    data: preview,
    isLoading: previewLoading,
    isError: previewError,
    refetch: refetchQueue,
  } = useQuery({
    queryKey: ['review', 'preview'],
    queryFn: () => fetchReviewQueue(5),
  });

  return (
    <div className="page-grid">
      <section className="card hero">
        <div>
          <p className="eyebrow">Home</p>
          <h1>每日复习，从这里开始</h1>
          <p className="lede">
            查看今日待复习数量、掌握度分布，并一键进入复习或查看今日列表。
          </p>
          <div className="cta-row">
            <Link to="/review" className="btn primary">
              进入复习
            </Link>
            <Link to="/today" className="btn ghost">
              查看 Today 列表
            </Link>
          </div>
        </div>
        <div className="hero-note">
          <p className="muted">快捷键：1/2/3 打分 · 空格展开 · ⌘Z 回退</p>
          <button type="button" className="link-btn" onClick={() => refetchQueue()}>
            刷新队列预览
          </button>
        </div>
      </section>

      <StatTiles
        stats={stats}
        loading={statsLoading}
        error={statsError ? statsErrorObj?.message : null}
      />

      <section className="card">
        <div className="section-head">
          <div>
            <p className="eyebrow">队列预览</p>
            <h2>最近 5 个待复习</h2>
          </div>
          <Link to="/review" className="link-btn">
            去复习
          </Link>
        </div>
        {previewError ? <p className="muted">加载失败，请重试</p> : null}
        {previewLoading ? <p className="muted">加载中...</p> : null}
        {!previewLoading && preview?.items.length === 0 ? (
          <p className="muted">当前没有 due 的卡片，休息一下！</p>
        ) : null}
        <div className="list">
          {preview?.items.map((item) => (
            <WordListItem key={item.id} word={item} />
          ))}
        </div>
      </section>

      <AiPlayground />
    </div>
  );
}

export default HomePage;

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchReviewQueue, submitReview, undoReviewToSnapshot } from '../api/review';
import { StatTiles } from '../components/StatTiles';
import { ReviewCard } from '../components/ReviewCard';
import { Skeleton } from '../components/Skeleton';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useReviewStore } from '../stores/review-store';
import { StatsOverview } from '@shared/types';

function ReviewPage() {
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { queue, initialCount, setQueue, completeCurrent, lastHistory, dropLastHistory, pushFront, reset } =
    useReviewStore();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['review', 'queue'],
    queryFn: () => fetchReviewQueue(),
    refetchOnWindowFocus: false,
    onSuccess: (payload) => {
      setQueue(payload.items);
      setError(null);
    },
  });

  useEffect(() => {
    return () => reset();
  }, [reset]);

  const current = queue[0];

  const reviewMutation = useMutation({
    mutationFn: (variables: { word: typeof current; difficulty: 'easy' | 'medium' | 'hard' }) =>
      submitReview(variables.word.id, variables.difficulty, new Date().toISOString()),
    onSuccess: (updated, variables) => {
      completeCurrent({ before: variables.word, after: updated, difficulty: variables.difficulty });
      setShowDetails(false);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['stats', 'overview'] });
    },
    onError: (err: unknown) => {
      setError((err as Error).message);
    },
  });

  const undoMutation = useMutation({
    mutationFn: undoReviewToSnapshot,
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['stats', 'overview'] });
    },
    onError: (err: unknown) => setError((err as Error).message),
  });

  const remaining = queue.length;
  const total = initialCount || data?.items.length || 0;
  const progress = total === 0 ? 0 : Math.round(((total - remaining) / total) * 100);

  const handleScore = (difficulty: 'easy' | 'medium' | 'hard') => {
    if (!current || reviewMutation.isPending) return;
    reviewMutation.mutate({ word: current, difficulty });
  };

  const handleSkip = () => handleScore('easy');

  const handleUndo = () => {
    const last = lastHistory();
    if (!last) return;
    undoMutation.mutate(last.before, {
      onSuccess: () => {
        dropLastHistory();
        pushFront(last.before);
        setError(null);
      },
    });
  };

  useKeyboardShortcuts({
    onHard: () => handleScore('hard'),
    onMedium: () => handleScore('medium'),
    onEasy: () => handleScore('easy'),
    onSkip: handleSkip,
    onToggleDetail: () => setShowDetails((v) => !v),
    onUndo: handleUndo,
    enabled: Boolean(current),
  });

  const helperText = useMemo(() => {
    if (!current) return '当前无待复习卡片';
    if (reviewMutation.isPending) return '提交中...';
    if (undoMutation.isPending) return '回退中...';
    return '按 1/2/3 打分；空格展开释义；⌘Z 回退上一条';
  }, [current, reviewMutation.isPending, undoMutation.isPending]);

  const cachedStats = queryClient.getQueryData<StatsOverview>(['stats', 'overview']);

  return (
    <div className="page-grid">
      <section className="card hero">
        <div>
          <p className="eyebrow">Review</p>
          <h1>SM-2 队列复习</h1>
          <p className="lede">{helperText}</p>
        </div>
        <div className="hero-note">
          <p className="muted">剩余 {remaining} / {total}</p>
          <div className="hero-actions">
            <button type="button" className="link-btn" onClick={() => refetch()}>
              刷新队列
            </button>
            <button type="button" className="link-btn" onClick={() => setShowDetails((v) => !v)}>
              {showDetails ? '隐藏释义' : '展开释义'}
            </button>
            <button type="button" className="link-btn" onClick={handleUndo} disabled={undoMutation.isPending}>
              回退上一条
            </button>
          </div>
        </div>
      </section>

      {isError ? <p className="muted">加载队列失败，请重试</p> : null}
      {isLoading ? <Skeleton lines={5} /> : null}
      {error ? <p className="error-box">{error}</p> : null}

      {current ? (
        <section className="card review-card-wrapper">
          <ReviewCard word={current} showDetails={showDetails} progress={progress} />
          <div className="actions-row">
            <button type="button" className="btn ghost" onClick={handleSkip} disabled={reviewMutation.isPending}>
              跳过=Easy
            </button>
            <div className="btn-group">
              <button
                type="button"
                className="btn ghost"
                onClick={() => handleScore('hard')}
                disabled={reviewMutation.isPending}
              >
                Hard · 1
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => handleScore('medium')}
                disabled={reviewMutation.isPending}
              >
                Medium · 2
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => handleScore('easy')}
                disabled={reviewMutation.isPending}
              >
                Easy · 3
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {!isLoading && !current ? (
        <section className="card">
          <p className="eyebrow">队列完成</p>
          <h2>今日复习已结束 🎉</h2>
          <p className="lede">
            可以去 Today 列表回顾新增词，或者休息一下。
          </p>
        </section>
      ) : null}

      <section className="card">
        <div className="section-head">
          <div>
            <p className="eyebrow">今日概览</p>
            <h2>实时统计</h2>
          </div>
        </div>
        <StatTiles stats={cachedStats ?? undefined} loading={false} />
      </section>
    </div>
  );
}

export default ReviewPage;

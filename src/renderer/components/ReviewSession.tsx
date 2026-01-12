import { useEffect, useMemo, useState } from "react";
import { ReviewRating, Word } from "../../shared/types";
import { createAppStore, useAppStore } from "../store";

type StoreHook = ReturnType<typeof createAppStore>;

const ratingOptions: Array<{ label: string; hint: string; grade: ReviewRating }> = [
  { label: "困难", hint: "几乎想不起来", grade: 2 },
  { label: "一般", hint: "需要再巩固", grade: 3 },
  { label: "容易", hint: "记得很牢", grade: 5 },
];

interface ReviewSessionProps {
  store?: StoreHook;
}

const ReviewSession = ({ store = useAppStore }: ReviewSessionProps) => {
  const reviewQueue = store((state) => state.reviewQueue);
  const words = store((state) => state.words);
  const refreshReviewQueue = store((state) => state.refreshReviewQueue);
  const refreshWords = store((state) => state.refreshWords);
  const submitReview = store((state) => state.submitReview);
  const refreshActivity = store((state) => state.refreshActivity);
  const session = store((state) => state.session);

  const [mode, setMode] = useState<"scheduled" | "custom">("scheduled");
  const [customQueue, setCustomQueue] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const activeQueue = mode === "scheduled" ? reviewQueue : customQueue;
  const activeWord = activeQueue[currentIndex];

  useEffect(() => {
    const loadQueue = async () => {
      try {
        await refreshReviewQueue();
      } catch (err) {
        const reason = err instanceof Error ? err.message : "加载复习队列失败";
        setError(reason);
      }
    };

    void loadQueue();
  }, [refreshReviewQueue]);

  useEffect(() => {
    setCurrentIndex(0);
    setFlipped(false);
  }, [mode]);

  useEffect(() => {
    if (currentIndex >= activeQueue.length) {
      setCurrentIndex(activeQueue.length ? activeQueue.length - 1 : 0);
      setFlipped(false);
    }
  }, [activeQueue.length, currentIndex]);

  const progress = useMemo(() => {
    if (!activeQueue.length) return 0;
    return Math.round(((currentIndex + 1) / activeQueue.length) * 100);
  }, [activeQueue.length, currentIndex]);

  const startCustomReview = async () => {
    setError(undefined);
    setMessage(undefined);

    try {
      if (!words.length) {
        await refreshWords();
      }

      const available = store.getState().words;
      if (!available.length) {
        setError("词库为空，先新增词条再试试");
        return;
      }

      setCustomQueue(available);
      setMode("custom");
      setMessage("已载入全部词条，自选复习开始");
      setCurrentIndex(0);
      setFlipped(false);
    } catch (err) {
      const reason = err instanceof Error ? err.message : "加载词库失败";
      setError(reason);
    }
  };

  const handleRefreshQueue = async () => {
    setMode("scheduled");
    setCustomQueue([]);
    setMessage(undefined);
    setError(undefined);

    try {
      await refreshReviewQueue();
      setCurrentIndex(0);
      setFlipped(false);
      setMessage("已同步今日复习队列");
    } catch (err) {
      const reason = err instanceof Error ? err.message : "刷新复习队列失败";
      setError(reason);
    }
  };

  const handleFlip = () => setFlipped((value) => !value);

  const handleReview = async (grade: ReviewRating) => {
    if (!activeWord) return;

    setError(undefined);
    setMessage(undefined);
    setFlipped(false);

    try {
      await submitReview(activeWord.id, grade);
      await refreshActivity();

      if (mode === "custom") {
        setCustomQueue((queue) => queue.filter((word) => word.id !== activeWord.id));
      }

      setMessage("记忆计划已更新，下一张来了");
    } catch (err) {
      const reason = err instanceof Error ? err.message : "提交评分失败";
      setError(reason);
    }
  };

  const renderCard = () => {
    if (!activeWord) return null;

    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>{mode === "custom" ? "自选复习" : "今日计划"} · {activeQueue.length} 张</span>
            <span>剩余 {Math.max(activeQueue.length - currentIndex - 1, 0)} 张</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          className="panel w-full cursor-pointer space-y-3 bg-white/90 p-6 text-left transition hover:-translate-y-0.5"
          onClick={handleFlip}
          onKeyDown={(event) => {
            if (event.key === " " || event.key === "Enter") {
              event.preventDefault();
              handleFlip();
            }
          }}
          aria-label="翻转卡片"
        >
          <div className="flex items-baseline gap-3">
            <p className="text-4xl font-semibold text-slate-900">{activeWord.term}</p>
            <p className="text-xl text-slate-600">{activeWord.kana}</p>
          </div>

          {flipped ? (
            <div className="space-y-2 text-slate-700">
              <p className="text-lg font-medium text-slate-900">{activeWord.definition_ja}</p>
              <p className="text-slate-700">{activeWord.scene_ja}</p>
              <p className="text-slate-700">{activeWord.example_ja}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-600">点击或按空格翻面，再选择评分</p>
          )}
        </button>

        <div className="grid gap-3 sm:grid-cols-3">
          {ratingOptions.map((option) => (
            <button
              key={option.label}
              type="button"
              className="flex flex-col rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => handleReview(option.grade)}
              disabled={session.loading}
              data-testid={`rate-${option.label}`}
            >
              <span className="text-lg font-semibold text-slate-900">{option.label}</span>
              <span className="text-sm text-slate-600">{option.hint}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderEmpty = () => (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-slate-700">
      <p className="text-lg font-semibold text-slate-900">今日无计划复习</p>
      <p className="mt-1 text-sm text-slate-600">可以刷新队列或进入自选复习随便练习几张。</p>
      <div className="mt-4 flex justify-center gap-3">
        <button
          type="button"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
          onClick={handleRefreshQueue}
          disabled={session.loading}
        >
          刷新复习队列
        </button>
        <button
          type="button"
          className="cta min-w-[140px]"
          onClick={startCustomReview}
          disabled={session.loading}
        >
          自选复习
        </button>
      </div>
    </div>
  );

  return (
    <section className="panel mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.08em] text-slate-500">复习</p>
          <h2 className="text-3xl font-semibold text-slate-900">复习队列与评分</h2>
          <p className="text-slate-600">
            先看正面尝试回忆，翻面后按记忆程度选择「容易/一般/困难」，系统将更新 SM-2 计划与今日活跃度。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
            onClick={handleRefreshQueue}
            disabled={session.loading}
          >
            刷新队列
          </button>
          <button
            type="button"
            className="cta min-w-[140px]"
            onClick={startCustomReview}
            disabled={session.loading}
          >
            自选复习
          </button>
        </div>
      </div>

      {activeQueue.length ? renderCard() : renderEmpty()}

      {(error || message) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {error ?? message}
        </div>
      )}
    </section>
  );
};

export default ReviewSession;

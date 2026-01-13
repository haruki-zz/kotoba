import { useCallback, useEffect, useMemo, useState } from "react";
import { ReviewRating, Word } from "../../shared/types";
import { createAppStore, useAppStore } from "../store";

type StoreHook = ReturnType<typeof createAppStore>;

type RatingOption = {
  label: string;
  hint: string;
  grade: ReviewRating;
  shortcut: string;
  hotkeys: string[];
};

const ratingOptions: RatingOption[] = [
  { label: "容易", hint: "记得很牢", grade: 5, shortcut: "1", hotkeys: ["Digit1", "Numpad1"] },
  { label: "一般", hint: "需要再巩固", grade: 3, shortcut: "2", hotkeys: ["Digit2", "Numpad2"] },
  { label: "困难", hint: "再看看卡片", grade: 2, shortcut: "3", hotkeys: ["Digit3", "Numpad3"] },
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
  const remaining = Math.max(activeQueue.length - currentIndex - 1, 0);

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

  const goToPrevious = useCallback(() => {
    if (!activeQueue.length) return;
    setCurrentIndex((index) => Math.max(index - 1, 0));
    setFlipped(false);
  }, [activeQueue.length]);

  const goToNext = useCallback(() => {
    if (!activeQueue.length) return;
    setCurrentIndex((index) => Math.min(index + 1, Math.max(activeQueue.length - 1, 0)));
    setFlipped(false);
  }, [activeQueue.length]);

  const handleFlip = useCallback(() => {
    if (!activeQueue.length) return;
    setFlipped((value) => !value);
  }, [activeQueue.length]);

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

  const handleReview = useCallback(
    async (grade: ReviewRating) => {
      if (!activeWord || session.loading) return;

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
    },
    [activeWord, mode, refreshActivity, session.loading, submitReview]
  );

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      if (tagName && ["INPUT", "TEXTAREA", "SELECT", "OPTION"].includes(tagName)) {
        return;
      }

      if (!activeWord || session.loading) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrevious();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNext();
        return;
      }

      if (event.key === " " || event.code === "Space") {
        if (tagName === "BUTTON" && !(target as HTMLElement)?.classList.contains("review-card")) {
          return;
        }
        event.preventDefault();
        handleFlip();
        return;
      }

      const matched = ratingOptions.find((option) => option.hotkeys.includes(event.code));
      if (matched) {
        event.preventDefault();
        void handleReview(matched.grade);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [activeWord, goToNext, goToPrevious, handleFlip, handleReview, session.loading]);

  const renderCard = () => {
    if (!activeWord) return null;

    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
            <span>{mode === "custom" ? "自选复习" : "今日计划"} · {activeQueue.length} 张</span>
            <span className="pill">剩余 {remaining} 张</span>
            <span className="text-xs text-muted">
              进度 {Math.min(currentIndex + 1, activeQueue.length)}/{activeQueue.length}
            </span>
          </div>
          <p className="text-xs text-muted">快捷键：空格翻面 · ←/→ 切换 · 1/2/3 评分</p>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex w-full items-center justify-between gap-3">
            <button
              type="button"
              className="btn btn-ghost text-sm"
              onClick={goToPrevious}
              disabled={session.loading || currentIndex === 0}
            >
              ← 上一张
            </button>

            <div className="review-card-shell">
              <button
                type="button"
                className={`review-card ${flipped ? "is-flipped" : ""}`}
                onClick={handleFlip}
                aria-label="翻转卡片"
              >
                <div className="review-card__face" aria-hidden={flipped}>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span className="pill">正面</span>
                    <span>空格翻面</span>
                  </div>
                  <div className="space-y-3">
                    <p className="review-term" style={{ fontSize: "clamp(1.85rem, 3.4vw, 2.8rem)" }}>
                      {activeWord.term}
                    </p>
                    <p className="text-xl text-muted">{activeWord.kana}</p>
                  </div>
                  <p className="text-sm text-muted">点击或按空格翻面</p>
                </div>

                <div className="review-card__face review-card__face--back" aria-hidden={!flipped}>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span className="pill">背面</span>
                    <span>阅读完后再评分</span>
                  </div>
                  <div className="space-y-3 text-ink">
                    <p className="text-lg font-semibold leading-tight">{activeWord.definition_ja}</p>
                    <p className="text-sm leading-relaxed sm:text-base">{activeWord.scene_ja}</p>
                    <p className="text-sm leading-relaxed sm:text-base">{activeWord.example_ja}</p>
                  </div>
                </div>
              </button>
            </div>

            <button
              type="button"
              className="btn btn-ghost text-sm"
              onClick={goToNext}
              disabled={session.loading || currentIndex >= activeQueue.length - 1}
            >
              下一张 →
            </button>
          </div>
          <p className="text-sm text-muted">翻面后可用 1/2/3 直接评分，支持左右键切换</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {ratingOptions.map((option) => (
            <button
              key={option.label}
              type="button"
              className="choice-card"
              onClick={() => handleReview(option.grade)}
              disabled={session.loading}
              data-testid={`rate-${option.label}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-semibold text-ink">{option.label}</span>
                <span className="pill">快捷键 {option.shortcut}</span>
              </div>
              <span className="text-sm text-muted">{option.hint}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderEmpty = () => (
    <div className="rounded-xl border border-dashed border-border bg-surface-muted px-4 py-6 text-center text-ink">
      <p className="text-lg font-semibold text-ink">今日无计划复习</p>
      <p className="mt-1 text-sm text-muted">可以刷新队列或进入自选复习随便练习几张。</p>
      <div className="mt-4 flex justify-center gap-3">
        <button
          type="button"
          className="btn btn-outline text-sm"
          onClick={handleRefreshQueue}
          disabled={session.loading}
        >
          刷新复习队列
        </button>
        <button
          type="button"
          className="btn btn-primary min-w-[140px]"
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
          <p className="eyebrow">复习</p>
          <h2 className="text-3xl font-semibold text-ink">复习卡片与评分</h2>
          <p className="text-muted">
            中央单卡布局突出当前卡片，翻面后按「容易/一般/困难」评分，进度条与剩余文案实时更新。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-outline text-sm"
            onClick={handleRefreshQueue}
            disabled={session.loading}
          >
            刷新队列
          </button>
          <button
            type="button"
            className="btn btn-primary min-w-[140px]"
            onClick={startCustomReview}
            disabled={session.loading}
          >
            自选复习
          </button>
        </div>
      </div>

      {activeQueue.length ? renderCard() : renderEmpty()}

      {(error || message) && (
        <div className={`callout ${error ? "callout-error" : "callout-success"}`}>
          {error ?? message}
        </div>
      )}
    </section>
  );
};

export default ReviewSession;

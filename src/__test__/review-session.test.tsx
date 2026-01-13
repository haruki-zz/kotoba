import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ReviewSession from "../renderer/components/ReviewSession";
import { createAppStore } from "../renderer/store";
import { RendererApi } from "../shared/ipc";
import { ActivitySummary, Word } from "../shared/types";

const buildWord = (id: string): Word => ({
  id,
  term: `term-${id}`,
  kana: "かな",
  definition_ja: "定義",
  scene_ja: "場面",
  example_ja: "例文",
  created_at: Date.now(),
  updated_at: Date.now(),
  sm2: { repetition: 0, interval: 0, easiness: 2.5, next_review_at: Date.now() },
});

const activity: ActivitySummary = {
  today: { date: "2024-01-01", added_count: 0, review_count: 0, total: 0 },
  streak: 0,
  history: [{ date: "2024-01-01", added_count: 0, review_count: 0, total: 0 }],
};

const createMockApi = (overrides?: Partial<RendererApi>): RendererApi => ({
  generateWordCard: vi.fn(),
  setProvider: vi.fn(),
  getProvider: vi.fn(),
  loadWords: vi.fn().mockResolvedValue([]),
  addWord: vi.fn(),
  updateWord: vi.fn(),
  deleteWord: vi.fn(),
  loadReviewQueue: vi.fn().mockResolvedValue([]),
  submitReview: vi.fn(),
  loadActivitySummary: vi.fn().mockResolvedValue(activity),
  exportData: vi.fn(),
  importData: vi.fn(),
  ...overrides,
});

describe("ReviewSession", () => {
  it("在队列为空时启动自选复习并展示卡片", async () => {
    const word = buildWord("custom");
    const api = createMockApi({
      loadWords: vi.fn().mockResolvedValue([word]),
    });
    const store = createAppStore(api);
    const user = userEvent.setup();

    render(<ReviewSession store={store} />);

    await screen.findByText("今日无计划复习");
    const [customButton] = screen.getAllByRole("button", { name: "自选复习" });
    await user.click(customButton);

    expect(api.loadWords).toHaveBeenCalled();
    expect(await screen.findByText(word.term)).toBeInTheDocument();
    expect(await screen.findByText(/进度 1\/1/)).toBeInTheDocument();
  });

  it("flips card and submits rating to update queue", async () => {
    const word = buildWord("plan");
    const reviewed: Word = { ...word, sm2: { ...word.sm2, repetition: 1 } };
    const api = createMockApi({
      loadReviewQueue: vi.fn().mockResolvedValue([word]),
      submitReview: vi.fn().mockResolvedValue(reviewed),
    });
    const store = createAppStore(api);
    const user = userEvent.setup();

    render(<ReviewSession store={store} />);

    expect(await screen.findByText(word.term)).toBeInTheDocument();
    expect(screen.queryByText(word.definition_ja)).not.toBeInTheDocument();

    await user.keyboard("{Space}");
    expect(await screen.findByText(word.definition_ja)).toBeInTheDocument();

    await user.keyboard("1");

    await waitFor(() => expect(api.submitReview).toHaveBeenCalledWith({ id: word.id, grade: 5 }));
    await waitFor(() => expect(api.loadActivitySummary).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText("今日无计划复习")).toBeInTheDocument());
  });

  it("shows progress and navigation state when switching cards", async () => {
    const first = buildWord("first");
    const second = buildWord("second");
    const api = createMockApi({
      loadReviewQueue: vi.fn().mockResolvedValue([first, second]),
    });
    const store = createAppStore(api);
    const user = userEvent.setup();

    render(<ReviewSession store={store} />);

    expect(await screen.findByText(first.term)).toBeInTheDocument();
    expect(screen.getByText(/进度 1\/2/)).toBeInTheDocument();

    const prevButton = screen.getByRole("button", { name: "← 上一张" });
    const nextButton = screen.getByRole("button", { name: "下一张 →" });

    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeEnabled();

    await user.click(nextButton);
    await waitFor(() => expect(screen.getByText(/进度 2\/2/)).toBeInTheDocument());
    expect(screen.getByText(second.term)).toBeInTheDocument();
    expect(nextButton).toBeDisabled();
    expect(prevButton).toBeEnabled();

    await user.keyboard("{ArrowLeft}");
    await waitFor(() => expect(screen.getByText(/进度 1\/2/)).toBeInTheDocument());
    await waitFor(() => expect(prevButton).toBeDisabled());
  });
});

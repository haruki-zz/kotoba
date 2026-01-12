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
  today: { added_count: 0, review_count: 0, total: 0 },
  streak: 0,
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

    await user.click(screen.getByLabelText("翻转卡片"));
    expect(screen.getByText(word.definition_ja)).toBeInTheDocument();

    await user.click(screen.getByTestId("rate-容易"));

    await waitFor(() => expect(api.submitReview).toHaveBeenCalledWith({ id: word.id, grade: 5 }));
    await waitFor(() => expect(api.loadActivitySummary).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText("今日无计划复习")).toBeInTheDocument());
  });
});

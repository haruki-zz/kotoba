import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ActivityOverview from "../renderer/components/ActivityOverview";
import { createAppStore } from "../renderer/store";
import { RendererApi } from "../shared/ipc";
import { ActivitySummary, Word } from "../shared/types";

const formatLabel = (date: string, added: number, review: number, total: number) =>
  `${new Date(`${date}T00:00:00Z`).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })} · 新增 ${added} · 复习 ${review} · 总计 ${total}`;

const summary: ActivitySummary = {
  today: { date: "2024-02-10", added_count: 2, review_count: 3, total: 5 },
  streak: 4,
  history: [
    { date: "2024-02-10", added_count: 2, review_count: 3, total: 5 },
    { date: "2024-02-08", added_count: 1, review_count: 1, total: 2 },
    { date: "2024-02-03", added_count: 0, review_count: 1, total: 1 },
  ],
};

const buildWord = (id: string, easiness: number): Word => ({
  id,
  term: `词${id}`,
  kana: `かな${id}`,
  definition_ja: "定义",
  scene_ja: "场景",
  example_ja: "例句",
  created_at: 1710000000000,
  updated_at: 1710000000000,
  sm2: {
    easiness,
    interval: 1,
    repetition: 1,
    next_review_at: 1710000000000,
  },
});

const words: Word[] = [buildWord("1", 2.7), buildWord("2", 2.35), buildWord("3", 2.1)];

const createMockApi = (overrides?: Partial<RendererApi>): RendererApi => ({
  generateWordCard: vi.fn(),
  setProvider: vi.fn(),
  getProvider: vi.fn(),
  loadWords: vi.fn().mockResolvedValue(words),
  addWord: vi.fn(),
  updateWord: vi.fn(),
  deleteWord: vi.fn(),
  loadReviewQueue: vi.fn(),
  submitReview: vi.fn(),
  loadActivitySummary: vi.fn().mockResolvedValue(summary),
  exportData: vi.fn(),
  importData: vi.fn(),
  ...overrides,
});

describe("ActivityOverview", () => {
  it("加载统计卡片并支持跳转复习/词库", async () => {
    const api = createMockApi();
    const store = createAppStore(api);
    const onReview = vi.fn();
    const onLibrary = vi.fn();

    render(
      <ActivityOverview
        store={store}
        onNavigateToReview={onReview}
        onNavigateToLibrary={onLibrary}
      />,
    );

    await waitFor(() => expect(api.loadActivitySummary).toHaveBeenCalled());
    await waitFor(() => expect(api.loadWords).toHaveBeenCalled());

    expect(screen.getByText(/4.*天/)).toBeInTheDocument();
    expect(screen.getByText("今日新增").parentElement?.textContent).toContain("2");
    expect(screen.getByText("今日复习").parentElement?.textContent).toContain("3");
    expect(screen.getAllByRole("gridcell")).toHaveLength(42);

    fireEvent.click(screen.getAllByRole("button", { name: "去复习" })[0]);
    expect(onReview).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "跳转到词库" }));
    expect(onLibrary).toHaveBeenCalled();
  });

  it("渲染热力格颜色与点击跳转", async () => {
    const api = createMockApi();
    const store = createAppStore(api);
    const onReview = vi.fn();

    render(<ActivityOverview store={store} onNavigateToReview={onReview} />);

    const maxLabel = await screen.findByLabelText(formatLabel("2024-02-10", 2, 3, 5));
    const midLabel = screen.getByLabelText(formatLabel("2024-02-08", 1, 1, 2));
    const lowLabel = screen.getByLabelText(formatLabel("2024-02-03", 0, 1, 1));
    const zeroLabel = screen.getByLabelText(formatLabel("2024-02-09", 0, 0, 0));

    expect(maxLabel.className).toContain("bg-primary");
    expect(midLabel.className).toContain("bg-primary/50");
    expect(lowLabel.className).toContain("bg-primary/30");
    expect(zeroLabel.className).toContain("bg-surface-muted");

    fireEvent.click(maxLabel);
    expect(onReview).toHaveBeenCalled();
  });

  it("展示词库难度扇形图并提供 tooltip 与跳转", async () => {
    const api = createMockApi();
    const store = createAppStore(api);
    const onReview = vi.fn();
    const onLibrary = vi.fn();

    render(
      <ActivityOverview
        store={store}
        onNavigateToReview={onReview}
        onNavigateToLibrary={onLibrary}
      />,
    );

    const easySegment = await screen.findByTestId("difficulty-segment-easy");
    const mediumSegment = screen.getByTestId("difficulty-segment-medium");
    const hardSegment = screen.getByTestId("difficulty-segment-hard");

    expect(easySegment.getAttribute("title")).toContain("容易 1 个（33%");
    expect(mediumSegment.getAttribute("title")).toContain("一般 1 个（33%");
    expect(hardSegment.getAttribute("title")).toContain("困难 1 个（33%");

    fireEvent.click(screen.getByLabelText("根据难度开始复习"));
    expect(onReview).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /困难 1 个，占比 33%/ }));
    expect(onLibrary).toHaveBeenCalled();
  });
});

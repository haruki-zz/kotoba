import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ActivityOverview from "../renderer/components/ActivityOverview";
import { createAppStore } from "../renderer/store";
import { RendererApi } from "../shared/ipc";
import { ActivitySummary } from "../shared/types";

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

const createMockApi = (overrides?: Partial<RendererApi>): RendererApi => ({
  generateWordCard: vi.fn(),
  setProvider: vi.fn(),
  getProvider: vi.fn(),
  loadWords: vi.fn(),
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
  it("loads activity summary and展示 streak/今日计数", async () => {
    const api = createMockApi();
    const store = createAppStore(api);

    render(<ActivityOverview store={store} />);

    await waitFor(() => expect(api.loadActivitySummary).toHaveBeenCalled());
    expect(screen.getByText(/4.*天/)).toBeInTheDocument();
    expect(screen.getByText("今日新增").parentElement?.textContent).toContain("2");
    expect(screen.getByText("今日复习").parentElement?.textContent).toContain("3");
    expect(screen.getAllByRole("gridcell")).toHaveLength(42);
  });

  it("renders heatmap颜色随活跃度变化", async () => {
    const api = createMockApi();
    const store = createAppStore(api);

    render(<ActivityOverview store={store} />);

    const maxLabel = await screen.findByLabelText(formatLabel("2024-02-10", 2, 3, 5));
    const midLabel = screen.getByLabelText(formatLabel("2024-02-08", 1, 1, 2));
    const lowLabel = screen.getByLabelText(formatLabel("2024-02-03", 0, 1, 1));
    const zeroLabel = screen.getByLabelText(formatLabel("2024-02-09", 0, 0, 0));

    expect(maxLabel.className).toContain("bg-primary");
    expect(midLabel.className).toContain("bg-primary/50");
    expect(lowLabel.className).toContain("bg-primary/30");
    expect(zeroLabel.className).toContain("bg-slate-200");
  });
});

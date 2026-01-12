import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DataTransferPanel from "../renderer/components/DataTransferPanel";
import { createAppStore } from "../renderer/store";
import { RendererApi } from "../shared/ipc";
import { ActivitySummary } from "../shared/types";

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
  exportData: vi.fn().mockResolvedValue({ wordsCount: 2, activityDaysCount: 1, csvCount: 2 }),
  importData: vi.fn().mockResolvedValue({
    importedWords: 2,
    replacedWords: 1,
    skippedWords: 0,
    activityDaysImported: 1,
    errors: [],
  }),
  ...overrides,
});

const buildFile = (name: string, path: string) => {
  const file = new File(["{}"], name, { type: "application/json" });
  Object.defineProperty(file, "path", { value: path });
  return file;
};

describe("DataTransferPanel", () => {
  it("导出词库与活跃度并展示成功文案", async () => {
    const api = createMockApi();
    const store = createAppStore(api);

    render(<DataTransferPanel store={store} />);

    fireEvent.change(screen.getByLabelText("词库 JSON 导出路径"), {
      target: { value: "/tmp/words.json" },
    });
    fireEvent.change(screen.getByLabelText("活跃度 JSON 导出路径"), {
      target: { value: "/tmp/activity.json" },
    });
    fireEvent.change(screen.getByLabelText("词库 CSV 导出路径"), {
      target: { value: "/tmp/words.csv" },
    });

    fireEvent.click(screen.getByRole("button", { name: "导出文件" }));

    await waitFor(() =>
      expect(api.exportData).toHaveBeenCalledWith({
        wordsPath: "/tmp/words.json",
        activityPath: "/tmp/activity.json",
        csvPath: "/tmp/words.csv",
      }),
    );
    expect(await screen.findByText(/导出完成/)).toBeInTheDocument();
  });

  it("导入文件后刷新数据并展示跳过记录", async () => {
    const api = createMockApi({
      importData: vi.fn().mockResolvedValue({
        importedWords: 1,
        replacedWords: 1,
        skippedWords: 1,
        activityDaysImported: 2,
        errors: ["无效记录 1"],
      }),
    });
    const store = createAppStore(api);

    render(<DataTransferPanel store={store} />);

    fireEvent.change(screen.getByTestId("import-words-input"), {
      target: { files: [buildFile("words.json", "/tmp/words.json")] },
    });
    fireEvent.change(screen.getByTestId("import-activity-input"), {
      target: { files: [buildFile("activity.json", "/tmp/activity.json")] },
    });

    fireEvent.click(screen.getByRole("button", { name: "导入文件" }));

    await waitFor(() =>
      expect(api.importData).toHaveBeenCalledWith({
        wordsPath: "/tmp/words.json",
        activityPath: "/tmp/activity.json",
      }),
    );
    await waitFor(() => expect(api.loadWords).toHaveBeenCalled());
    await waitFor(() => expect(api.loadReviewQueue).toHaveBeenCalled());
    await waitFor(() => expect(api.loadActivitySummary).toHaveBeenCalled());

    expect(await screen.findByText(/导入完成/)).toBeInTheDocument();
    expect(screen.getByText("无效记录 1")).toBeInTheDocument();
  });

  it("缺少路径时给出错误提示", async () => {
    const api = createMockApi();
    const store = createAppStore(api);

    render(<DataTransferPanel store={store} />);

    fireEvent.click(screen.getByRole("button", { name: "导出文件" }));
    expect(await screen.findByText("请至少填写一个导出路径")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "导入文件" }));
    expect(await screen.findByText("请选择要导入的 JSON 文件")).toBeInTheDocument();
  });
});

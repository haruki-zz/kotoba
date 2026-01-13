import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SettingsPanel from "../renderer/components/SettingsPanel";
import { createAppStore } from "../renderer/store";
import { RendererApi } from "../shared/ipc";

const createMockApi = (overrides?: Partial<RendererApi>): RendererApi => ({
  generateWordCard: vi.fn(),
  setProvider: vi.fn().mockResolvedValue({ provider: "openai", hasApiKey: true, timeoutMs: 12_000 }),
  getProvider: vi.fn().mockResolvedValue({ provider: "mock", hasApiKey: false, timeoutMs: 12_000 }),
  loadWords: vi.fn().mockResolvedValue([]),
  addWord: vi.fn().mockResolvedValue(undefined),
  updateWord: vi.fn().mockResolvedValue(undefined),
  deleteWord: vi.fn().mockResolvedValue(undefined),
  loadReviewQueue: vi.fn().mockResolvedValue([]),
  submitReview: vi.fn().mockResolvedValue(undefined),
  loadActivitySummary: vi.fn().mockResolvedValue(undefined),
  exportData: vi.fn().mockResolvedValue({ wordsCount: 0, activityDaysCount: 0 }),
  importData: vi.fn().mockResolvedValue({
    importedWords: 0,
    replacedWords: 0,
    skippedWords: 0,
    activityDaysImported: 0,
    errors: [],
  }),
  ...overrides,
});

describe("SettingsPanel", () => {
  it("requires API 密钥 when provider needs one", async () => {
    const api = createMockApi({
      getProvider: vi.fn().mockResolvedValue({ provider: "openai", hasApiKey: false, timeoutMs: 12_000 }),
    });
    const store = createAppStore(api);

    render(<SettingsPanel store={store} />);

    await waitFor(() =>
      expect((screen.getByLabelText("LLM 提供商") as HTMLSelectElement).value).toBe("openai"),
    );

    fireEvent.click(screen.getByRole("button", { name: "保存设置" }));

    expect(await screen.findByText("请填写对应的 API 密钥")).toBeInTheDocument();
    expect(api.setProvider).not.toHaveBeenCalled();
  });

  it("saves provider and trims API 密钥", async () => {
    const api = createMockApi({
      setProvider: vi.fn().mockResolvedValue({ provider: "openai", hasApiKey: true, timeoutMs: 15_000 }),
    });
    const store = createAppStore(api);

    render(<SettingsPanel store={store} />);

    fireEvent.change(screen.getByLabelText("LLM 提供商"), { target: { value: "openai" } });
    fireEvent.change(screen.getByLabelText("API 密钥"), { target: { value: "  sk-123  " } });
    fireEvent.click(screen.getByRole("button", { name: "保存设置" }));

    await waitFor(() =>
      expect(api.setProvider).toHaveBeenCalledWith({ provider: "openai", apiKey: "sk-123" }),
    );
    expect(await screen.findByText(/设置已保存/)).toBeInTheDocument();
    expect((screen.getByLabelText("API 密钥") as HTMLInputElement).value).toBe("");
  });

  it("displays stored key hint when已有密钥", async () => {
    const api = createMockApi({
      getProvider: vi.fn().mockResolvedValue({ provider: "gemini", hasApiKey: true, timeoutMs: 10_000 }),
    });
    const store = createAppStore(api);

    render(<SettingsPanel store={store} />);

    await waitFor(() =>
      expect(screen.getByText("当前 provider 的密钥已安全保存，不会在此处展示。")).toBeInTheDocument(),
    );
  });
});

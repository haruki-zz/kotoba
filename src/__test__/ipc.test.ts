import { describe, expect, it, vi, beforeEach } from "vitest";
import { registerIpcHandlers } from "../main/ipc";
import { createIpcHandlers } from "../main/ipc/handlers";
import { createProviderManager, ProviderManager } from "../main/ipc/provider";
import { IPC_CHANNELS } from "../shared/ipc";
import { ActivitySummary, Word, WordDraft } from "../shared/types";

const NOW = 1_700_000_000_000;

const buildWord = (id: string, nextReviewAt: number): Word => ({
  id,
  term: `term-${id}`,
  kana: "kana",
  definition_ja: "definition",
  scene_ja: "scene",
  example_ja: "example",
  created_at: NOW,
  updated_at: NOW,
  sm2: {
    repetition: 0,
    interval: 0,
    easiness: 2.5,
    next_review_at: nextReviewAt,
  },
});

const summary: ActivitySummary = { today: { added_count: 0, review_count: 0, total: 0 }, streak: 0 };

describe("IPC handlers", () => {
  let providerManager: ProviderManager;
  let dataStore: {
    loadWords: ReturnType<typeof vi.fn>;
    loadActivitySummary: ReturnType<typeof vi.fn>;
    addWord: ReturnType<typeof vi.fn>;
    updateWord: ReturnType<typeof vi.fn>;
    deleteWord: ReturnType<typeof vi.fn>;
    applyReview: ReturnType<typeof vi.fn>;
    exportData: ReturnType<typeof vi.fn>;
    importData: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    const provider = { name: "mock" as const, generateWordCard: vi.fn(async (term: string) => ({ term })) };
    providerManager = {
      getProvider: () => provider,
      getState: () => ({ provider: "mock", hasApiKey: true, timeoutMs: 12_000 }),
      setConfig: vi.fn((payload) => ({ provider: payload?.provider ?? "mock", hasApiKey: true, timeoutMs: 12_000 })),
    };

    dataStore = {
      loadWords: vi.fn(async () => [buildWord("due", NOW - 1), buildWord("future", NOW + 1)]),
      loadActivitySummary: vi.fn(async () => summary),
      addWord: vi.fn(async (draft: WordDraft) => buildWord(draft.id ?? "new", NOW)),
      updateWord: vi.fn(async (id: string) => buildWord(id, NOW)),
      deleteWord: vi.fn(async () => {}),
      applyReview: vi.fn(async (id: string) => buildWord(id, NOW + 1)),
      exportData: vi.fn(async () => ({ wordsCount: 0, activityDaysCount: 0 })),
      importData: vi.fn(async () => ({ importedWords: 0, replacedWords: 0, skippedWords: 0, activityDaysImported: 0, errors: [] })),
    };
  });

  it("routes generateWordCard to provider with term validation", async () => {
    const handlers = createIpcHandlers({ dataStore, providerManager, now: () => NOW });
    await expect(handlers[IPC_CHANNELS.generateWordCard]({ term: "" })).rejects.toThrow("term 不能为空");

    const result = await handlers[IPC_CHANNELS.generateWordCard]({ term: "勉強" });
    expect(result.term).toBe("勉強");
    expect(providerManager.getProvider().generateWordCard).toHaveBeenCalledWith("勉強");
  });

  it("builds review queue using SM-2 due filter", async () => {
    const handlers = createIpcHandlers({ dataStore, providerManager, now: () => NOW });
    const queue = await handlers[IPC_CHANNELS.loadReviewQueue]();

    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe("due");
    expect(dataStore.loadWords).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid review grade before touching storage", async () => {
    const handlers = createIpcHandlers({ dataStore, providerManager, now: () => NOW });

    await expect(
      handlers[IPC_CHANNELS.submitReview]({ id: "w1", grade: 10 } as { id: string; grade: unknown }),
    ).rejects.toThrow("评分需在 0-5 范围内");
    expect(dataStore.applyReview).not.toHaveBeenCalled();
  });

  it("guards addWord payload shape", async () => {
    const handlers = createIpcHandlers({ dataStore, providerManager, now: () => NOW });
    await expect(handlers[IPC_CHANNELS.addWord](null as unknown as WordDraft)).rejects.toThrow("词条数据需为对象");
    expect(dataStore.addWord).not.toHaveBeenCalled();
  });
});

describe("Provider manager", () => {
  it("requires API key when switching to non-mock provider", () => {
    const manager = createProviderManager({}, () => ({
      name: "mock",
      generateWordCard: async () => ({ term: "t", kana: "k", definition_ja: "d", scene_ja: "s", example_ja: "e" }),
    }));

    expect(() => manager.setConfig({ provider: "openai" })).toThrow("需要有效的 API 密钥");
  });

  it("builds provider with merged timeout", () => {
    const factory = vi.fn(() => ({
      name: "mock",
      generateWordCard: async () => ({ term: "t", kana: "k", definition_ja: "d", scene_ja: "s", example_ja: "e" }),
    }));
    const manager = createProviderManager({ timeoutMs: 5000 }, factory);
    manager.getProvider();

    expect(factory).toHaveBeenCalledWith(expect.objectContaining({ timeoutMs: 5000, provider: "mock" }));
  });
});

describe("IPC registration", () => {
  it("registers handlers only for known channels", () => {
    const ipc = { handle: vi.fn(), removeHandler: vi.fn() };
    const provider = { name: "mock" as const, generateWordCard: vi.fn(async () => ({ term: "t" })) };
    const context = {
      providerManager: {
        getProvider: () => provider,
        getState: () => ({ provider: "mock", hasApiKey: true, timeoutMs: 12_000 }),
        setConfig: vi.fn(() => ({ provider: "mock", hasApiKey: true, timeoutMs: 12_000 })),
      },
      dataStore: {
        loadWords: vi.fn(async () => []),
        loadActivitySummary: vi.fn(async () => summary),
        addWord: vi.fn(async () => buildWord("x", NOW)),
        updateWord: vi.fn(async () => buildWord("x", NOW)),
        deleteWord: vi.fn(async () => {}),
        applyReview: vi.fn(async () => buildWord("x", NOW)),
        exportData: vi.fn(async () => ({ wordsCount: 0, activityDaysCount: 0 })),
        importData: vi.fn(async () => ({ importedWords: 0, replacedWords: 0, skippedWords: 0, activityDaysImported: 0, errors: [] })),
      },
      now: () => NOW,
    };

    registerIpcHandlers(context as any, ipc as any);

    const channels = ipc.handle.mock.calls.map(([channel]) => channel);
    expect(new Set(channels)).toEqual(new Set(Object.values(IPC_CHANNELS)));
    expect(ipc.removeHandler).toHaveBeenCalledTimes(Object.values(IPC_CHANNELS).length);
  });
});

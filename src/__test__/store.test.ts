import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "../renderer/store";
import { ProviderState } from "../shared/ai";
import { RendererApi } from "../shared/ipc";
import { ActivitySummary, ReviewRating, Word } from "../shared/types";

const buildWord = (id: string): Word => ({
  id,
  term: `term-${id}`,
  kana: "kana",
  definition_ja: "definition",
  scene_ja: "scene",
  example_ja: "example",
  created_at: 1,
  updated_at: 1,
  sm2: { repetition: 0, interval: 0, easiness: 2.5, next_review_at: 1 },
});

const activity: ActivitySummary = { today: { added_count: 1, review_count: 2, total: 3 }, streak: 5 };

const providerState: ProviderState = { provider: "mock", hasApiKey: true, timeoutMs: 12_000 };

const createMockApi = () => ({
  generateWordCard: vi.fn() as RendererApi["generateWordCard"],
  setProvider: vi.fn() as RendererApi["setProvider"],
  getProvider: vi.fn() as RendererApi["getProvider"],
  loadWords: vi.fn() as RendererApi["loadWords"],
  addWord: vi.fn() as RendererApi["addWord"],
  updateWord: vi.fn() as RendererApi["updateWord"],
  deleteWord: vi.fn() as RendererApi["deleteWord"],
  loadReviewQueue: vi.fn() as RendererApi["loadReviewQueue"],
  submitReview: vi.fn() as RendererApi["submitReview"],
  loadActivitySummary: vi.fn() as RendererApi["loadActivitySummary"],
  exportData: vi.fn() as RendererApi["exportData"],
  importData: vi.fn() as RendererApi["importData"],
});

describe("renderer store", () => {
  let api: ReturnType<typeof createMockApi>;

  beforeEach(() => {
    api = createMockApi();
  });

  it("refreshes words and clears loading flag", async () => {
    const word = buildWord("w1");
    api.loadWords.mockResolvedValue([word]);
    const store = createAppStore(api);

    await store.getState().refreshWords();
    const state = store.getState();

    expect(state.words).toEqual([word]);
    expect(state.session.loading).toBe(false);
    expect(state.session.error).toBeUndefined();
  });

  it("captures errors when loading words", async () => {
    api.loadWords.mockRejectedValue(new Error("load failed"));
    const store = createAppStore(api);

    await expect(store.getState().refreshWords()).rejects.toThrow("load failed");
    expect(store.getState().session.error).toBe("load failed");
  });

  it("adds, updates, and deletes words locally", async () => {
    const word = buildWord("w2");
    api.addWord.mockResolvedValue(word);
    api.updateWord.mockResolvedValue({ ...word, term: "updated" });
    api.deleteWord.mockResolvedValue(undefined);
    const store = createAppStore(api);

    await store.getState().addWord({
      term: word.term,
      kana: word.kana,
      definition_ja: word.definition_ja,
      scene_ja: word.scene_ja,
      example_ja: word.example_ja,
    });
    await store.getState().updateWord(word.id, { term: "updated" });
    await store.getState().deleteWord(word.id);

    const state = store.getState();
    expect(state.words).toHaveLength(0);
  });

  it("updates review queue and words when submitting review", async () => {
    const word = buildWord("w3");
    const reviewed: Word = { ...word, sm2: { ...word.sm2, repetition: 1 } };
    api.submitReview.mockResolvedValue(reviewed);
    const store = createAppStore(api);

    store.setState({ words: [word], reviewQueue: [word] });
    await store.getState().submitReview(word.id, 5 as ReviewRating);

    const state = store.getState();
    expect(state.words[0].sm2.repetition).toBe(1);
    expect(state.reviewQueue).toHaveLength(0);
  });

  it("refreshes provider and activity data", async () => {
    api.getProvider.mockResolvedValue(providerState);
    api.loadActivitySummary.mockResolvedValue(activity);
    const store = createAppStore(api);

    await store.getState().refreshProvider();
    await store.getState().refreshActivity();

    const state = store.getState();
    expect(state.provider?.provider).toBe("mock");
    expect(state.activity).toEqual(activity);
  });

  it("loads review queue separately from words", async () => {
    const queueWord = buildWord("queue");
    api.loadReviewQueue.mockResolvedValue([queueWord]);
    const store = createAppStore(api);

    await store.getState().refreshReviewQueue();
    expect(store.getState().reviewQueue[0].id).toBe("queue");
  });
});

import { create } from "zustand";
import { ProviderSettings, ProviderState } from "../shared/ai";
import { RendererApi } from "../shared/ipc";
import { ExportRequest, ExportResult, ImportRequest, ImportResult } from "../shared/data-transfer";
import { ActivitySummary, ReviewRating, Word, WordDraft, WordUpdate } from "../shared/types";

type SessionState = {
  loading: boolean;
  error?: string;
};

export type AppState = {
  words: Word[];
  reviewQueue: Word[];
  activity: ActivitySummary | null;
  provider: ProviderState | null;
  session: SessionState;
  refreshWords: () => Promise<void>;
  refreshReviewQueue: () => Promise<void>;
  refreshActivity: () => Promise<void>;
  refreshProvider: () => Promise<void>;
  addWord: (draft: WordDraft) => Promise<Word>;
  updateWord: (id: string, update: WordUpdate) => Promise<Word>;
  deleteWord: (id: string) => Promise<void>;
  submitReview: (id: string, grade: ReviewRating) => Promise<Word>;
  setProvider: (settings: ProviderSettings) => Promise<ProviderState>;
  exportData: (request: ExportRequest) => Promise<ExportResult>;
  importData: (request: ImportRequest) => Promise<ImportResult>;
};

const resolveApi = (api?: RendererApi): RendererApi => {
  if (api) {
    return api;
  }

  if (typeof window !== "undefined" && window.electronAPI) {
    return window.electronAPI;
  }

  throw new Error("electronAPI 未初始化");
};

const mergeWord = (words: Word[], next: Word) =>
  words.some((word) => word.id === next.id)
    ? words.map((word) => (word.id === next.id ? next : word))
    : [...words, next];

export const createAppStore = (api?: RendererApi) =>
  create<AppState>((set, get) => {
    const client = resolveApi(api);

    const setSession = (loading: boolean, error?: string) =>
      set((state) => ({ session: { ...state.session, loading, error } }));

    const handleError = (error: unknown): never => {
      const message = error instanceof Error ? error.message : "未知错误";
      setSession(false, message);
      throw error;
    };

    const withLoading = async <T>(task: () => Promise<T>): Promise<T> => {
      setSession(true);
      try {
        const result = await task();
        setSession(false, undefined);
        return result;
      } catch (error) {
        return handleError(error);
      }
    };

    const updateWords = (updated: Word) =>
      set((state) => ({
        words: mergeWord(state.words, updated),
      }));

    const dropWord = (id: string) =>
      set((state) => ({
        words: state.words.filter((word) => word.id !== id),
        reviewQueue: state.reviewQueue.filter((word) => word.id !== id),
      }));

    const removeFromQueue = (id: string) =>
      set((state) => ({
        reviewQueue: state.reviewQueue.filter((word) => word.id !== id),
      }));

    return {
      words: [],
      reviewQueue: [],
      activity: null,
      provider: null,
      session: { loading: false },
      refreshWords: async () => {
        const words = await withLoading(() => client.loadWords());
        set({ words });
      },
      refreshReviewQueue: async () => {
        const queue = await withLoading(() => client.loadReviewQueue());
        set({ reviewQueue: queue });
      },
      refreshActivity: async () => {
        const activity = await withLoading(() => client.loadActivitySummary());
        set({ activity });
      },
      refreshProvider: async () => {
        const provider = await withLoading(() => client.getProvider());
        set({ provider });
      },
      addWord: async (draft) => {
        const word = await withLoading(() => client.addWord(draft));
        updateWords(word);
        return word;
      },
      updateWord: async (id, update) => {
        const word = await withLoading(() => client.updateWord({ id, update }));
        updateWords(word);
        return word;
      },
      deleteWord: async (id) => {
        await withLoading(() => client.deleteWord({ id }));
        dropWord(id);
      },
      submitReview: async (id, grade) => {
        const word = await withLoading(() => client.submitReview({ id, grade }));
        updateWords(word);
        removeFromQueue(id);
        return word;
      },
      setProvider: async (settings) => {
        const provider = await withLoading(() => client.setProvider(settings));
        set({ provider });
        return provider;
      },
      exportData: (request) => withLoading(() => client.exportData(request)),
      importData: (request) => withLoading(() => client.importData(request)),
    };
  });

export const useAppStore = createAppStore();

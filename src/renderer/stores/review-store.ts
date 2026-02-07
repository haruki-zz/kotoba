import { create } from 'zustand';

import { Difficulty, WordView } from '@shared/types';

type ReviewHistoryEntry = {
  before: WordView;
  after: WordView;
  difficulty: Difficulty;
};

type ReviewStore = {
  queue: WordView[];
  initialCount: number;
  history: ReviewHistoryEntry[];
  setQueue: (items: WordView[]) => void;
  completeCurrent: (entry: ReviewHistoryEntry) => void;
  lastHistory: () => ReviewHistoryEntry | null;
  dropLastHistory: () => void;
  pushFront: (word: WordView) => void;
  reset: () => void;
};

export const useReviewStore = create<ReviewStore>((set, get) => ({
  queue: [],
  initialCount: 0,
  history: [],
  setQueue: (items) =>
    set({
      queue: items,
      initialCount: items.length,
      history: [],
    }),
  completeCurrent: (entry) =>
    set((state) => ({
      queue: state.queue.slice(1),
      history: [...state.history, entry],
    })),
  lastHistory: () => {
    const { history } = get();
    if (history.length === 0) return null;
    return history[history.length - 1];
  },
  dropLastHistory: () => {
    const { history } = get();
    if (history.length === 0) return;
    set({ history: history.slice(0, history.length - 1) });
  },
  pushFront: (word) => set((state) => ({ queue: [word, ...state.queue] })),
  reset: () => set({ queue: [], initialCount: 0, history: [] }),
}));

export type { ReviewHistoryEntry };

import { create } from "zustand";

import type { WordRecord } from "@kotoba/shared";

const sortByCreatedDesc = (items: WordRecord[]) =>
  [...items].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
      b.id - a.id,
  );

const mergeUnique = (items: WordRecord[]) => {
  const map = new Map<number, WordRecord>();
  items.forEach((item) => {
    const existing = map.get(item.id);
    if (!existing || new Date(item.updatedAt) > new Date(existing.updatedAt)) {
      map.set(item.id, item);
    }
  });
  return sortByCreatedDesc([...map.values()]);
};

type TodayState = {
  isSheetOpen: boolean;
  items: WordRecord[];
  isLoadingList: boolean;
  selectedId?: number;
  setItems: (items: WordRecord[]) => void;
  addItem: (item: WordRecord) => void;
  setSheetOpen: (open: boolean) => void;
  setLoadingList: (loading: boolean) => void;
  setSelectedId: (id?: number) => void;
};

export const useTodayStore = create<TodayState>((set) => ({
  isSheetOpen: false,
  items: [],
  isLoadingList: false,
  setItems: (items) => set({ items: mergeUnique(items) }),
  addItem: (item) =>
    set((state) => ({ items: mergeUnique([item, ...state.items]) })),
  setSheetOpen: (open) => set({ isSheetOpen: open }),
  setLoadingList: (loading) => set({ isLoadingList: loading }),
  setSelectedId: (id) => set({ selectedId: id }),
}));

import { describe, expect, it, beforeEach } from "vitest";

import type { WordRecord } from "@kotoba/shared";
import { useTodayStore } from "./store.js";
import { filterWordsForToday } from "./utils.js";

const buildRecord = (overrides: Partial<WordRecord> = {}): WordRecord => ({
  id: overrides.id ?? 1,
  word: overrides.word ?? "習う",
  reading: overrides.reading,
  contextExpl: overrides.contextExpl,
  sceneDesc: overrides.sceneDesc,
  example: overrides.example,
  difficulty: overrides.difficulty ?? "medium",
  ef: overrides.ef ?? 2.5,
  intervalDays: overrides.intervalDays ?? 0,
  repetition: overrides.repetition ?? 0,
  lastReviewAt: overrides.lastReviewAt,
  nextDueAt: overrides.nextDueAt,
  createdAt:
    overrides.createdAt ?? new Date("2026-01-29T02:00:00Z").toISOString(),
  updatedAt:
    overrides.updatedAt ?? new Date("2026-01-29T02:00:00Z").toISOString(),
});

describe("today store", () => {
  beforeEach(() => {
    useTodayStore.setState({
      isSheetOpen: false,
      items: [],
      isLoadingList: false,
      selectedId: undefined,
    });
  });

  it("sorts items by createdAt desc when setting list", () => {
    const older = buildRecord({
      id: 1,
      createdAt: new Date("2026-01-28T10:00:00Z").toISOString(),
      updatedAt: new Date("2026-01-28T10:00:00Z").toISOString(),
    });
    const newer = buildRecord({
      id: 2,
      createdAt: new Date("2026-01-29T10:00:00Z").toISOString(),
      updatedAt: new Date("2026-01-29T10:00:00Z").toISOString(),
    });

    useTodayStore.getState().setItems([older, newer]);
    const items = useTodayStore.getState().items;

    expect(items[0].id).toBe(newer.id);
    expect(items[1].id).toBe(older.id);
  });

  it("keeps the latest version when upserting existing item", () => {
    const initial = buildRecord({
      id: 1,
      contextExpl: "old",
      updatedAt: new Date("2026-01-29T09:00:00Z").toISOString(),
    });
    const newer = buildRecord({
      id: 1,
      contextExpl: "new",
      updatedAt: new Date("2026-01-29T12:00:00Z").toISOString(),
    });

    useTodayStore.getState().setItems([initial]);
    useTodayStore.getState().addItem(newer);

    const items = useTodayStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].contextExpl).toBe("new");
  });
});

describe("today utils", () => {
  it("filters words created on the same local day", () => {
    const baseDay = new Date("2026-01-29T12:00:00Z");
    const todayWord = buildRecord({
      id: 1,
      createdAt: new Date("2026-01-29T04:00:00Z").toISOString(),
      updatedAt: new Date("2026-01-29T04:00:00Z").toISOString(),
    });
    const otherDayWord = buildRecord({
      id: 2,
      createdAt: new Date("2026-01-27T12:00:00Z").toISOString(),
      updatedAt: new Date("2026-01-27T12:00:00Z").toISOString(),
    });

    const result = filterWordsForToday([todayWord, otherDayWord], baseDay);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(todayWord.id);
  });
});

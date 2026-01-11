import { describe, expect, it, vi } from "vitest";
import os from "node:os";
import path from "node:path";
import * as fs from "node:fs/promises";
import { createDataStore } from "../main/storage";
import { DAY_IN_MS, defaultSm2State } from "../shared/sm2";

const buildStore = async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "kotoba-storage-"));
  return {
    store: createDataStore(dir),
    wordsPath: path.join(dir, "words.json"),
    activityPath: path.join(dir, "activity.json"),
  };
};

const createDraft = () => ({
  term: "term",
  kana: "kana",
  definition_ja: "definition",
  scene_ja: "scene",
  example_ja: "example",
});

describe("DataStore", () => {
  it("新增词条会补全 sm2 与时间并写入文件", async () => {
    const now = Date.UTC(2024, 0, 1);
    const { store, wordsPath } = await buildStore();

    const saved = await store.addWord(createDraft(), now);
    const savedFile = JSON.parse(await fs.readFile(wordsPath, "utf-8"));

    expect(saved.created_at).toBe(now);
    expect(saved.sm2).toEqual(defaultSm2State(now));
    expect(savedFile.words).toHaveLength(1);
    expect(savedFile.words[0].term).toBe("term");
  });

  it("更新与删除词条保持写入补全", async () => {
    const now = Date.UTC(2024, 0, 2);
    const { store } = await buildStore();
    const created = await store.addWord(createDraft(), now);

    const updated = await store.updateWord(created.id, { term: "updated", sm2: { interval: 3 } }, now + 1000);
    expect(updated.term).toBe("updated");
    expect(updated.sm2.interval).toBe(3);
    expect(updated.updated_at).toBe(now + 1000);

    await store.deleteWord(created.id, now + 2000);
    const words = await store.loadWords(now + 2000);
    expect(words).toHaveLength(0);
  });

  it("评分更新时使用 SM-2 并累积 review_count", async () => {
    const now = Date.UTC(2024, 0, 3);
    const { store } = await buildStore();
    const created = await store.addWord(createDraft(), now);

    const reviewed = await store.applyReview(created.id, 5, now + DAY_IN_MS);
    const summary = await store.loadActivitySummary(now + DAY_IN_MS);

    expect(reviewed.sm2.repetition).toBe(1);
    expect(summary.today.review_count).toBe(1);
    expect(summary.today.added_count).toBe(0);
  });

  it("streak 以最近活跃日开始连续统计", async () => {
    const base = Date.UTC(2024, 0, 10);
    const { store } = await buildStore();
    const word = await store.addWord(createDraft(), base);

    await store.applyReview(word.id, 4, base + DAY_IN_MS);
    await store.addWord(createDraft(), base + 3 * DAY_IN_MS);

    const summary = await store.loadActivitySummary(base + 3 * DAY_IN_MS);
    expect(summary.streak).toBe(1);
  });

  it("原子写入失败时保持原文件不变", async () => {
    const now = Date.UTC(2024, 0, 5);
    const { store, wordsPath } = await buildStore();
    await store.addWord(createDraft(), now);

    const before = await fs.readFile(wordsPath, "utf-8");
    const renameSpy = vi.spyOn(fs, "rename").mockRejectedValueOnce(new Error("rename failed"));

    await expect(store.addWord(createDraft(), now + 1)).rejects.toThrow("rename failed");
    const after = await fs.readFile(wordsPath, "utf-8");

    expect(after).toBe(before);
    renameSpy.mockRestore();
  });

  it("导出 words 与 activity JSON 以及 CSV", async () => {
    const now = Date.UTC(2024, 0, 6);
    const { store } = await buildStore();
    const exportDir = await fs.mkdtemp(path.join(os.tmpdir(), "kotoba-export-"));
    const exportedWordsPath = path.join(exportDir, "words.json");
    const exportedActivityPath = path.join(exportDir, "activity.json");
    const exportedCsvPath = path.join(exportDir, "words.csv");

    await store.addWord(createDraft(), now);
    const summary = await store.exportData(
      { wordsPath: exportedWordsPath, activityPath: exportedActivityPath, csvPath: exportedCsvPath },
      now,
    );

    const exportedWords = JSON.parse(await fs.readFile(exportedWordsPath, "utf-8"));
    const exportedActivity = JSON.parse(await fs.readFile(exportedActivityPath, "utf-8"));
    const csv = await fs.readFile(exportedCsvPath, "utf-8");

    expect(summary.wordsCount).toBe(1);
    expect(summary.activityDaysCount).toBe(1);
    expect(summary.csvCount).toBe(1);
    expect(exportedWords.words).toHaveLength(1);
    expect(Object.keys(exportedActivity.days)).toHaveLength(1);
    expect(csv.split("\n")[0]).toContain("term,kana,definition_ja");
  });

  it("导入时按 term 去重并跳过非法记录", async () => {
    const now = Date.UTC(2024, 0, 7);
    const { store, wordsPath } = await buildStore();
    const importedPath = path.join(path.dirname(wordsPath), "imported-words.json");
    const original = await store.addWord(createDraft(), now);
    const incoming = [
      {
        ...createDraft(),
        id: "incoming-1",
        term: original.term,
        sm2: { repetition: 2, interval: 3, easiness: 2.7, next_review_at: now + DAY_IN_MS },
      },
      {
        ...createDraft(),
        id: "incoming-2",
        term: "new-term",
      },
      { term: "", kana: "", definition_ja: "", scene_ja: "", example_ja: "" },
    ];

    await fs.writeFile(importedPath, JSON.stringify({ words: incoming }), "utf-8");
    const result = await store.importData({ wordsPath: importedPath }, now + 1);
    const merged = await store.loadWords(now + 1);

    expect(result.importedWords).toBe(2);
    expect(result.replacedWords).toBe(1);
    expect(result.skippedWords).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(merged).toHaveLength(2);
    expect(merged.find((word) => word.term === original.term)?.sm2.repetition).toBe(2);
  });

  it("导入 activity 时合并日期并跳过非法条目", async () => {
    const base = Date.UTC(2024, 0, 8);
    const { store, activityPath } = await buildStore();
    const importPath = path.join(path.dirname(activityPath), "import-activity.json");
    await store.addWord(createDraft(), base);

    await fs.writeFile(
      importPath,
      JSON.stringify({
        days: {
          "2024-01-09": { added_count: 2, review_count: 1 },
          invalid: "bad",
        },
      }),
      "utf-8",
    );

    const result = await store.importData({ activityPath: importPath }, base + DAY_IN_MS);
    const merged = JSON.parse(await fs.readFile(activityPath, "utf-8"));

    expect(result.activityDaysImported).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(Object.keys(merged.days)).toContain("2024-01-09");
  });
});

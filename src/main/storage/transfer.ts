import * as fs from "node:fs/promises";
import path from "node:path";
import { normalizeActivityData, normalizeWord } from "../../shared/validation";
import { ActivityData, ActivityDay, Word } from "../../shared/types";
import { ensureDir } from "./json";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readJsonStrict = async (filePath: string) => {
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content);
};

const extractWordsArray = (payload: unknown) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (isRecord(payload) && Array.isArray(payload.words)) {
    return payload.words;
  }

  throw new Error("words 文件需为数组或 { words: [] }");
};

export const loadWordsFromFile = async (filePath: string, now: number) => {
  const payload = await readJsonStrict(filePath);
  const entries = extractWordsArray(payload);
  const words: Word[] = [];
  const errors: string[] = [];

  entries.forEach((entry, index) => {
    try {
      words.push(normalizeWord(entry, now));
    } catch (error) {
      errors.push(`words[${index}]: ${(error as Error).message}`);
    }
  });

  return { words, errors };
};

const normalizeActivityEntry = (date: string, value: unknown): ActivityDay => {
  const normalized = normalizeActivityData({ days: { [date]: value } });
  const day = normalized.days[date];

  if (!day) {
    throw new Error("activity 天级数据格式非法");
  }

  return day;
};

export const loadActivityFromFile = async (filePath: string) => {
  const payload = await readJsonStrict(filePath);

  if (!isRecord(payload)) {
    throw new Error("activity 数据格式非法，应为 { days: {} }");
  }

  const rawDays = payload.days ?? {};

  if (!isRecord(rawDays)) {
    throw new Error("activity.days 需为对象映射");
  }

  const days: Record<string, ActivityDay> = {};
  const errors: string[] = [];

  for (const [date, value] of Object.entries(rawDays)) {
    try {
      days[date] = normalizeActivityEntry(date, value);
    } catch (error) {
      errors.push(`activity.${date}: ${(error as Error).message}`);
    }
  }

  return { activity: { days }, errors };
};

export const mergeWordsByTerm = (existing: Word[], incoming: Word[]) => {
  const map = new Map<string, Word>();
  let replaced = 0;
  let added = 0;

  existing.forEach((word) => {
    map.set(word.term.trim(), word);
  });

  incoming.forEach((word) => {
    const key = word.term.trim();

    if (map.has(key)) {
      replaced += 1;
      map.delete(key);
    } else {
      added += 1;
    }

    map.set(key, word);
  });

  return { words: Array.from(map.values()), replaced, added };
};

export const mergeActivity = (existing: ActivityData, incoming: ActivityData): ActivityData => ({
  days: { ...existing.days, ...incoming.days },
});

const escapeCsvField = (value: string | number) => {
  const raw = typeof value === "number" ? String(value) : value;
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
};

export const buildWordsCsv = (words: Word[]) => {
  const header = [
    "id",
    "term",
    "kana",
    "definition_ja",
    "scene_ja",
    "example_ja",
    "created_at",
    "updated_at",
    "repetition",
    "interval",
    "easiness",
    "next_review_at",
  ];

  const rows = words.map((word) =>
    [
      word.id,
      word.term,
      word.kana,
      word.definition_ja,
      word.scene_ja,
      word.example_ja,
      word.created_at,
      word.updated_at,
      word.sm2.repetition,
      word.sm2.interval,
      word.sm2.easiness,
      word.sm2.next_review_at,
    ]
      .map(escapeCsvField)
      .join(","),
  );

  return [header.join(","), ...rows].join("\n") + "\n";
};

export const writeWordsCsv = async (filePath: string, words: Word[]) => {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  const content = buildWordsCsv(words);
  await fs.writeFile(filePath, content, "utf-8");
};

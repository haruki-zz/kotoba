import type { WordRecord } from "@kotoba/shared";

const toLocalDateKey = (input: string | Date) => {
  const date = typeof input === "string" ? new Date(input) : input;
  return date.toLocaleDateString("en-CA");
};

export const filterWordsForToday = (
  words: WordRecord[],
  today = new Date(),
): WordRecord[] => {
  const todayKey = toLocalDateKey(today);
  return words.filter((word) => toLocalDateKey(word.createdAt) === todayKey);
};

export const excerpt = (value?: string, max = 120) => {
  if (!value) return "";
  return value.length > max ? `${value.slice(0, max)}...` : value;
};

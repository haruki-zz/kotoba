import { MIN_EASINESS, defaultSm2State } from "./sm2";
import { ActivityData, ActivityDay, Sm2State, Word, WordsFile } from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asString = (value: unknown, field: string) => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  throw new Error(`${field} 字段缺失或为空`);
};

const asTimestamp = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return fallback;
};

const asNonNegativeInteger = (value: unknown, fallback: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  const normalized = Math.floor(value);
  return normalized < 0 ? fallback : normalized;
};

const normalizeSm2Shape = (value: unknown, now: number): Sm2State => {
  const base = defaultSm2State(now);

  if (!isRecord(value)) {
    return base;
  }

  const easiness = typeof value.easiness === "number" && Number.isFinite(value.easiness) ? value.easiness : base.easiness;

  return {
    repetition: asNonNegativeInteger(value.repetition, base.repetition),
    interval: asNonNegativeInteger(value.interval, base.interval),
    easiness: Math.max(MIN_EASINESS, easiness),
    next_review_at: asTimestamp(value.next_review_at, base.next_review_at),
  };
};

export const normalizeWord = (value: unknown, now = Date.now()): Word => {
  if (!isRecord(value)) {
    throw new Error("word 条目必须是对象");
  }

  return {
    id: asString(value.id, "id"),
    term: asString(value.term, "term"),
    kana: asString(value.kana, "kana"),
    definition_ja: asString(value.definition_ja, "definition_ja"),
    scene_ja: asString(value.scene_ja, "scene_ja"),
    example_ja: asString(value.example_ja, "example_ja"),
    created_at: asTimestamp(value.created_at, now),
    updated_at: asTimestamp(value.updated_at, now),
    sm2: normalizeSm2Shape(value.sm2, now),
  };
};

export const normalizeWordsFile = (payload: unknown, now = Date.now()): WordsFile => {
  if (!isRecord(payload) || !Array.isArray(payload.words)) {
    throw new Error("words 数据格式非法，应为 { words: [] }");
  }

  return {
    words: payload.words.map((entry) => normalizeWord(entry, now)),
  };
};

const normalizeActivityDay = (value: unknown): ActivityDay => {
  if (!isRecord(value)) {
    throw new Error("activity 天级数据格式非法");
  }

  return {
    added_count: asNonNegativeInteger(value.added_count, 0),
    review_count: asNonNegativeInteger(value.review_count, 0),
  };
};

export const normalizeActivityData = (payload: unknown): ActivityData => {
  if (!isRecord(payload)) {
    throw new Error("activity 数据格式非法，应为 { days: {} }");
  }

  if (payload.days === undefined) {
    return { days: {} };
  }

  if (!isRecord(payload.days)) {
    throw new Error("activity.days 需为对象映射");
  }

  const days: ActivityData["days"] = {};

  for (const [date, value] of Object.entries(payload.days)) {
    days[date] = normalizeActivityDay(value);
  }

  return { days };
};

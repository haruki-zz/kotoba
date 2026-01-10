import { WordCardFields } from "./types";

export const DEFAULT_TIMEOUT_MS = 12000;
export const MAX_TERM_LENGTH = 64;
const MAX_FIELD_LENGTH = 320;

export const normalizeTerm = (term: string) => {
  const normalized = term.trim();

  if (!normalized) {
    throw new Error("term 不能为空");
  }

  if (normalized.length > MAX_TERM_LENGTH) {
    throw new Error(`term 长度需在 ${MAX_TERM_LENGTH} 字内`);
  }

  return normalized;
};

const normalizeTextField = (value: unknown, field: string) => {
  if (typeof value !== "string") {
    throw new Error(`${field} 需为字符串`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${field} 不能为空`);
  }

  return normalized.length > MAX_FIELD_LENGTH ? normalized.slice(0, MAX_FIELD_LENGTH) : normalized;
};

export const parseWordCardFields = (payload: unknown): WordCardFields => {
  let parsed: unknown;
  try {
    parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
  } catch (error) {
    throw new Error("AI 返回内容不是 JSON 对象");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("AI 返回内容需为对象");
  }

  const record = parsed as Record<string, unknown>;

  return {
    kana: normalizeTextField(record.kana, "kana"),
    definition_ja: normalizeTextField(record.definition_ja, "definition_ja"),
    scene_ja: normalizeTextField(record.scene_ja, "scene_ja"),
    example_ja: normalizeTextField(record.example_ja, "example_ja"),
  };
};

export const runWithTimeout = async <T>(
  task: (signal: AbortSignal) => Promise<T>,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  timeoutMessage = "AI 请求超时",
): Promise<T> => {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const taskPromise = task(controller.signal);

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([taskPromise, timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }

    if (controller.signal.aborted) {
      taskPromise.catch(() => {});
    }
  }
};

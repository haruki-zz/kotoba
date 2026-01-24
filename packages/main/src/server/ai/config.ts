const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_GEMINI_MODEL = "gemini-1.5-flash";
const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

const parseInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

export type AiConfig = {
  timeoutMs: number;
  geminiApiKey?: string;
  geminiModel: string;
  openAiApiKey?: string;
  openAiModel: string;
};

export const resolveAiConfig = (): AiConfig => ({
  timeoutMs: parseInteger(
    process.env.AI_REQUEST_TIMEOUT_MS,
    DEFAULT_TIMEOUT_MS,
  ),
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiModel: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
});

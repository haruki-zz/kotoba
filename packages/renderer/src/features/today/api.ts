import type {
  AiGenerateWordRequest,
  AiGenerateWordResponse,
  WordCreateInput,
  WordRecord,
} from "@kotoba/shared";

import { apiClient } from "../../lib/api-client.js";

type SuccessResponse<T> = { ok: true; data: T };

type WordListResponse = SuccessResponse<{
  items: WordRecord[];
  pagination: { limit: number; offset: number; count: number };
}>;

type CreateWordResponse = SuccessResponse<WordRecord>;

type GenerateWordResponse = SuccessResponse<{
  provider: string;
  output: AiGenerateWordResponse;
  finishReason?: string;
  model?: string;
  latencyMs: number;
}>;

export const fetchWords = async (
  limit = 100,
  offset = 0,
): Promise<WordRecord[]> => {
  const payload = await apiClient.get<WordListResponse>("/words", {
    searchParams: { limit, offset },
  });
  return payload.data.items;
};

export const createWord = async (
  input: WordCreateInput,
): Promise<WordRecord> => {
  const payload = await apiClient.post<CreateWordResponse, WordCreateInput>(
    "/words",
    input,
  );
  return payload.data;
};

export const generateWord = async (
  input: AiGenerateWordRequest,
): Promise<GenerateWordResponse["data"]> => {
  const payload = await apiClient.post<GenerateWordResponse, AiGenerateWordRequest>(
    "/ai/generate-word",
    input,
  );
  return payload.data;
};

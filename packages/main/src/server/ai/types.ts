import {
  type AiGenerateWordRequest,
  type AiGenerateWordResponse,
  type AiProvider,
  exampleStyleSchema,
} from "@kotoba/shared";
import { z } from "zod";

export type ExampleStyle = z.infer<typeof exampleStyleSchema>;

export type NormalizedAiRequest = AiGenerateWordRequest & {
  provider: AiProvider;
  exampleStyle: ExampleStyle;
};

export type ProviderResult = {
  responseText: string;
  finishReason?: string;
  model?: string;
};

export type AiGenerationResult = {
  provider: AiProvider;
  output: AiGenerateWordResponse;
  latencyMs: number;
  finishReason?: string;
  model?: string;
};

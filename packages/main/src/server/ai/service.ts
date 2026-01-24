import {
  type AiGenerateWordRequest,
  aiGenerateWordRequestSchema,
  type AiGenerateWordResponse,
  aiGenerateWordResponseSchema,
  type AiProvider,
  aiProviderEnum,
  type AppSettings,
  defaultExampleStyle,
  exampleStyleSchema,
} from "@kotoba/shared";
import type { FastifyBaseLogger } from "fastify";

import { AppError } from "../errors.js";
import { auditGeneratedContent } from "./audit.js";
import {
  type AiProviderClient,
  type ProviderGenerateOptions,
} from "./providers/base.js";
import {
  type AiGenerationResult,
  type NormalizedAiRequest,
  type ProviderResult,
} from "./types.js";

type SettingsReader = Pick<AppSettings, "aiProvider" | "exampleStyle">;

type GenerateOptions = {
  requestId?: string;
  timeoutMs?: number;
};

type FormattedError = {
  code?: string;
  message: string;
  name?: string;
  details?: unknown;
};

const stripCodeFences = (raw: string) =>
  raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

const extractJson = (raw: string) => {
  const trimmed = stripCodeFences(raw);
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
};

const coerceResponseShape = (
  payload: unknown,
): Partial<AiGenerateWordResponse> => {
  if (typeof payload !== "object" || payload === null) {
    return {};
  }
  const record = payload as Record<string, unknown>;
  const coerceString = (value: unknown) =>
    typeof value === "string" ? value : undefined;
  return {
    reading: coerceString(record.reading),
    contextExpl: coerceString(record.contextExpl),
    sceneDesc: coerceString(record.sceneDesc),
    example: coerceString(record.example),
  };
};

export class AiService {
  constructor(
    private readonly providers: AiProviderClient[],
    private readonly settings: { getSettings(): SettingsReader },
    private readonly logger: FastifyBaseLogger,
    private readonly defaultTimeoutMs = 12_000,
  ) {}

  private normalizeRequest(input: AiGenerateWordRequest): NormalizedAiRequest {
    const parsed = aiGenerateWordRequestSchema.parse(input);
    const currentSettings = this.settings.getSettings();
    const provider = aiProviderEnum.parse(
      parsed.provider ?? currentSettings.aiProvider ?? "gemini",
    );
    const exampleStyle = exampleStyleSchema.parse(
      parsed.exampleStyle ??
        currentSettings.exampleStyle ??
        defaultExampleStyle(),
    );

    return {
      ...parsed,
      word: parsed.word.trim(),
      hint: parsed.hint?.trim(),
      locale: parsed.locale?.trim() || "ja",
      provider,
      exampleStyle,
    };
  }

  private async runWithTimeout(
    provider: AiProviderClient,
    payload: NormalizedAiRequest,
    timeoutMs: number,
  ): Promise<ProviderResult> {
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;
    const options: ProviderGenerateOptions = {
      signal: controller.signal,
      timeoutMs,
    };

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          controller.abort();
          const timeoutDetails: Record<string, unknown> = {
            provider: provider.name,
            timeoutMs,
          };
          reject(
            new AppError(
              "AI_GENERATION_FAILED",
              "AI request timed out",
              504,
              timeoutDetails,
            ),
          );
        }, timeoutMs);
      });

      const result = await Promise.race([
        provider.generate(payload, options),
        timeoutPromise,
      ]);
      return result;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  private parseProviderOutput(raw: string) {
    const candidate = extractJson(raw);
    let parsed: unknown;
    try {
      parsed = JSON.parse(candidate);
    } catch (error) {
      throw new AppError(
        "AI_GENERATION_FAILED",
        "Failed to parse AI provider response",
        502,
        { preview: candidate.slice(0, 200), error: (error as Error).message },
      );
    }

    const coerced = coerceResponseShape(parsed);
    const sanitized = aiGenerateWordResponseSchema.parse({
      reading: String(coerced.reading ?? "").trim(),
      contextExpl: String(coerced.contextExpl ?? "").trim(),
      sceneDesc: String(coerced.sceneDesc ?? "").trim(),
      example: String(coerced.example ?? "").trim(),
    });

    return sanitized;
  }

  private formatError(error: unknown): FormattedError {
    if (error instanceof AppError) {
      return {
        code: error.code,
        message: error.message,
        details: error.details,
      };
    }
    if (error instanceof Error) {
      return { message: error.message, name: error.name };
    }
    return { message: String(error) };
  }

  private buildProviderOrder(preferred: AiProvider): AiProviderClient[] {
    const enabled = this.providers.filter((provider) => provider.isEnabled());
    const preferredProvider = enabled.filter(
      (provider) => provider.name === preferred,
    );
    const others = enabled.filter((provider) => provider.name !== preferred);
    return [...preferredProvider, ...others];
  }

  async generateWord(
    request: AiGenerateWordRequest,
    options: GenerateOptions = {},
  ): Promise<AiGenerationResult> {
    const normalized = this.normalizeRequest(request);
    const candidates: AiProviderClient[] = this.buildProviderOrder(
      normalized.provider,
    );

    if (!candidates.length) {
      throw new AppError(
        "AI_PROVIDER_UNAVAILABLE",
        "No AI provider is configured or enabled",
        503,
      );
    }

    const attempts: { provider: AiProvider; error: FormattedError }[] = [];
    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;

    for (const provider of candidates) {
      const startedAt = Date.now();
      const providerName: AiProvider = provider.name;
      try {
        const raw: ProviderResult = await this.runWithTimeout(
          provider,
          normalized,
          timeoutMs,
        );
        const parsed = this.parseProviderOutput(raw.responseText);
        const audit = auditGeneratedContent(parsed, normalized.exampleStyle);
        if (!audit.ok) {
          throw new AppError(
            "AI_CONTENT_REJECTED",
            "Generated content failed audit",
            422,
            { issues: audit.issues },
          );
        }

        const latencyMs = Date.now() - startedAt;
        const response: AiGenerationResult = {
          provider: providerName,
          output: parsed,
          finishReason: raw.finishReason,
          model: raw.model,
          latencyMs,
        };
        return response;
      } catch (error) {
        const formattedError = this.formatError(error);
        attempts.push({ provider: providerName, error: formattedError });
        this.logger.warn(
          { provider: providerName, requestId: options.requestId, error },
          "AI provider failed, trying next",
        );
      }
    }

    throw new AppError("AI_GENERATION_FAILED", "All AI providers failed", 502, {
      attempts,
    });
  }
}

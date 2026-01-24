import { defaultExampleStyle } from "@kotoba/shared";
import type { FastifyBaseLogger } from "fastify";
import { describe, expect, it } from "vitest";

import { AppError } from "../../errors.js";
import { type AiProviderClient } from "../providers/base.js";
import { MockAiProvider } from "../providers/mock-provider.js";
import { AiService } from "../service.js";
import { type NormalizedAiRequest } from "../types.js";

const createNullLogger = (): FastifyBaseLogger => {
  const noop = () => {};
  const logger: FastifyBaseLogger = {
    level: "info",
    fatal: noop,
    error: noop,
    warn: noop,
    info: noop,
    debug: noop,
    trace: noop,
    child: () => logger,
  };
  return logger;
};

const createService = (
  providers: AiProviderClient[],
  overrides: Partial<{ aiProvider: "gemini" | "openai" | "mock" }> = {},
) =>
  new AiService(
    providers,
    {
      getSettings: () => ({
        aiProvider: overrides.aiProvider ?? "mock",
        exampleStyle: defaultExampleStyle(),
      }),
    },
    createNullLogger(),
    5_000,
  );

describe("AiService", () => {
  it("falls back to the next provider on failure", async () => {
    const failingProvider: AiProviderClient = {
      name: "gemini",
      isEnabled: () => true,
      generate: () => Promise.reject(new Error("boom")),
    };

    const service = createService([failingProvider, new MockAiProvider()], {
      aiProvider: "gemini",
    });

    const result = await service.generateWord({
      word: "水",
      locale: "ja",
      hint: "drinking water",
    });

    expect(result.provider).toBe("mock");
    expect(result.output.reading).toContain("水");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("rejects responses that fail the audit rules", async () => {
    const shortProvider: AiProviderClient = {
      name: "openai",
      isEnabled: () => true,
      generate: (input: NormalizedAiRequest) =>
        Promise.resolve({
          responseText: JSON.stringify({
            reading: input.word,
            contextExpl: "",
            sceneDesc: "短い",
            example: "短い",
          }),
          finishReason: "stop",
          model: "test-model",
        }),
    };

    const service = createService([shortProvider], { aiProvider: "openai" });

    await expect(
      service.generateWord({ word: "火", locale: "ja" }),
    ).rejects.toBeInstanceOf(AppError);
  });
});

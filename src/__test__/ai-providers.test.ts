import type { GenerativeModel } from "@google/generative-ai";
import { describe, expect, it, vi } from "vitest";
import { buildAiProvider } from "../main/ai";
import { createGeminiProvider } from "../main/ai/gemini";
import { createMockProvider } from "../main/ai/mock";
import { createOpenAiProvider } from "../main/ai/openai";

const buildOpenAiResponse = (content: string) => ({
  id: "chatcmpl-test",
  object: "chat.completion",
  created: Date.now(),
  model: "gpt-4o-mini",
  choices: [
    {
      index: 0,
      message: { role: "assistant", content },
      finish_reason: "stop",
      logprobs: null,
    },
  ],
  usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
});

describe("AI providers", () => {
  it("OpenAI provider 解析 JSON 结果", async () => {
    const payload = JSON.stringify({
      kana: "べんきょう",
      definition_ja: "知識や技能を身につけるために学ぶこと。",
      scene_ja: "夜遅くまで机に向かって試験の準備をしている。",
      example_ja: "毎日少しずつ日本語を勉強しています。",
    });

    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify(buildOpenAiResponse(payload)), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const provider = createOpenAiProvider({ apiKey: "sk-test", fetch: fetchMock, timeoutMs: 5000 });
    const result = await provider.generateWordCard("勉強");

    expect(fetchMock).toHaveBeenCalled();
    expect(result.term).toBe("勉強");
    expect(result.kana).toBe("べんきょう");
    expect(result.definition_ja).toContain("知識や技能");
  });

  it("OpenAI provider 返回非法 JSON 时抛错", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify(buildOpenAiResponse("not-json")), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const provider = createOpenAiProvider({ apiKey: "sk-test", fetch: fetchMock, timeoutMs: 5000 });
    await expect(provider.generateWordCard("語彙")).rejects.toThrow("JSON");
  });

  it("Gemini provider 使用注入模型并按时返回", async () => {
    const generateContent = vi.fn(async () => ({
      response: {
        text: () =>
          JSON.stringify({
            kana: "ひかり",
            definition_ja: "光や輝き",
            scene_ja: "朝日が差し込む瞬間",
            example_ja: "窓から光が差し込む。",
          }),
      },
    }));

    const provider = createGeminiProvider(
      { apiKey: "test-key", timeoutMs: 5000 },
      { model: { generateContent } as unknown as Pick<GenerativeModel, "generateContent"> },
    );
    const result = await provider.generateWordCard("光");

    expect(generateContent).toHaveBeenCalled();
    expect(result.term).toBe("光");
    expect(result.example_ja).toContain("光が差し込む");
  });

  it("Gemini provider 超时会拒绝", async () => {
    vi.useFakeTimers();
    try {
      const never = new Promise<never>(() => {});
      const generateContent = vi.fn(() => never);
      const provider = createGeminiProvider(
        { apiKey: "test-key", timeoutMs: 20 },
        { model: { generateContent } as unknown as Pick<GenerativeModel, "generateContent"> },
      );

      const promise = provider.generateWordCard("遅い");
      await vi.runAllTimersAsync();
      await expect(promise).rejects.toThrow("超时");
    } finally {
      vi.useRealTimers();
    }
  });

  it("未配置密钥时可使用 mock provider", async () => {
    const mockProvider = createMockProvider();
    const autoProvider = buildAiProvider();

    const [mockResult, autoResult] = await Promise.all([
      mockProvider.generateWordCard("雨"),
      autoProvider.generateWordCard("雪"),
    ]);

    expect(mockProvider.name).toBe("mock");
    expect(autoProvider.name).toBe("mock");
    expect(mockResult.kana).toContain("雨");
    expect(autoResult.definition_ja).toContain("雪");
  });
});

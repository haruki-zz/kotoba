import OpenAI from "openai";
import type { ChatCompletion } from "openai/resources/chat/completions";
import { buildWordCardPrompt } from "./prompt";
import { parseWordCardFields, runWithTimeout, normalizeTerm, DEFAULT_TIMEOUT_MS } from "./utils";
import { AiProvider, OpenAiProviderOptions } from "./types";

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_MAX_TOKENS = 320;
const SYSTEM_MESSAGE =
  "你是日语学习助手，只能输出 JSON 对象，字段包含 kana、definition_ja、scene_ja、example_ja，禁止返回与提示无关的文本或密钥。";

export const createOpenAiProvider = (options: OpenAiProviderOptions): AiProvider => {
  const client = new OpenAI({
    apiKey: options.apiKey,
    fetch: options.fetch,
  });

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const model = options.model ?? DEFAULT_MODEL;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;

  return {
    name: "openai",
    async generateWordCard(term: string) {
      const normalizedTerm = normalizeTerm(term);
      const prompt = buildWordCardPrompt(normalizedTerm);

      const completion = await runWithTimeout<ChatCompletion>(
        (signal) =>
          client.chat.completions.create(
            {
              model,
              messages: [
                { role: "system", content: SYSTEM_MESSAGE },
                { role: "user", content: prompt },
              ],
              max_tokens: maxTokens,
              temperature: 0.2,
              response_format: { type: "json_object" },
              stream: false,
            },
            { signal },
          ),
        timeoutMs,
        "OpenAI 请求超时",
      );

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("OpenAI 返回内容为空");
      }

      const fields = parseWordCardFields(content);
      return { term: normalizedTerm, ...fields };
    },
  };
};

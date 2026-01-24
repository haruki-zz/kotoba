import {
  type AiGenerateWordRequest,
  EXAMPLE_SENTENCE_RANGE,
  SCENE_LENGTH_RANGE,
} from "@kotoba/shared";

import { type NormalizedAiRequest } from "./types.js";

const formatRange = ([min, max]: [number, number]) => `${min}-${max}`;

export const buildGenerateWordPrompt = (
  input: NormalizedAiRequest | (AiGenerateWordRequest & { locale?: string }),
) => {
  const sentenceRange = input.exampleStyle?.sentenceLengthRange
    ? formatRange(input.exampleStyle.sentenceLengthRange)
    : formatRange(EXAMPLE_SENTENCE_RANGE);
  const sceneRange = input.exampleStyle?.sceneLengthRange
    ? formatRange(input.exampleStyle.sceneLengthRange)
    : formatRange(SCENE_LENGTH_RANGE);

  return [
    "あなたは日本語学習のための生成アシスタントです。",
    "与えられた単語に基づいて、読みに加え、日常生活での情景説明と例文を返してください。",
    "出力は JSON オブジェクトのみ。キー: reading, contextExpl, sceneDesc, example。",
    `- reading: かなで書く。入力語をそのまま返さない。`,
    `- contextExpl: 1-2 文で生活シーンを説明し、日本語で簡潔に。`,
    `- sceneDesc: ${sceneRange} 字程度の 1 文で具体的な場面を描写。`,
    `- example: ${sentenceRange} 字の口語的な例文。必ず入力語を含め、自然な日本語で。`,
    `- tone: ${input.exampleStyle?.tone ?? "life-conversational"}`,
    "- 余計な前後文やコードブロックは不要。純粋な JSON を返すこと。",
    `word: ${input.word}`,
    input.locale ? `locale: ${input.locale}` : undefined,
    input.hint ? `hint: ${input.hint}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");
};

import { type NormalizedAiRequest } from "../types.js";
import { type AiProviderClient, type ProviderGenerateOptions } from "./base.js";

const clampText = (text: string, [min, max]: [number, number]) => {
  if (text.length < min) {
    const padding = "。".repeat(min - text.length);
    return (text + padding).slice(0, max);
  }
  if (text.length > max) {
    return text.slice(0, max);
  }
  return text;
};

export class MockAiProvider implements AiProviderClient {
  readonly name = "mock";

  isEnabled(): boolean {
    return true;
  }

  generate(input: NormalizedAiRequest, _options?: ProviderGenerateOptions) {
    const sentenceRange = input.exampleStyle.sentenceLengthRange;
    const sceneRange = input.exampleStyle.sceneLengthRange;

    const reading = `${input.word}のよみ`;
    const contextExpl = `${input.word}が使われる日常の状況を簡単に説明します。`;
    const sceneDesc = clampText(
      `${input.word}を使って${input.exampleStyle.tone}に話す短い場面描写。`,
      sceneRange,
    );
    const example = clampText(
      `${input.word}を${input.hint ?? "毎日"}口に出して練習しています。`,
      sentenceRange,
    );

    const response = {
      reading,
      contextExpl,
      sceneDesc,
      example,
    };

    return Promise.resolve({
      responseText: JSON.stringify(response),
      finishReason: "mock",
      model: "mock",
    });
  }
}

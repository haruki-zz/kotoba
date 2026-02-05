import { stripIndents } from './utils';
import {
  AiScenario,
  aiToneEnum,
  aiScenarioEnum,
  wordEnrichPayloadSchema,
  exampleOnlyPayloadSchema,
} from './scenarios';

export type RenderedPrompt = {
  system: string;
  user: string;
  temperature: number;
  maxOutputTokens: number;
};

type WordEnrichPayload = typeof wordEnrichPayloadSchema._type;
type ExamplePayload = typeof exampleOnlyPayloadSchema._type;

const baseSystemPrompt = stripIndents`
你是一名日语学习教练，回答对象是中文母语学习者。
始终以紧凑 JSON 返回结果，不要添加额外解释、代码块或前后缀。
输出必须满足：
- reading：假名或カタカナ读音
- contextExpl：用中文给出情景化解释，20-40 字
- sceneDesc：用中文描述发生情境，单句 30-45 字
- example：自然口语的日语例句，长度 15-25 字
- difficulty：easy/medium/hard 之一（可选）
- tips：1 句学习提示（可选，中文）
`;

const wordEnrichTemplate = (payload: WordEnrichPayload): RenderedPrompt => {
  const focus = payload.exampleFocus ? `例句侧重：${payload.exampleFocus}` : '';
  const reading = payload.readingHint ? `读音提示：${payload.readingHint}` : '';
  const context = payload.contextHint ? `语境提示：${payload.contextHint}` : '';
  const tone = payload.tone ? `表达风格：${payload.tone}` : '';

  const user = stripIndents`
  目标单词：${payload.word}
  ${reading}
  ${context}
  ${focus}
  ${tone}

  请按 JSON 返回：{"reading":"","contextExpl":"","sceneDesc":"","example":"","difficulty":"","tips":""}
  `;

  return {
    system: baseSystemPrompt,
    user,
    temperature: payload.tone === 'tutor' ? 0.2 : 0.35,
    maxOutputTokens: 320,
  };
};

const exampleOnlyTemplate = (payload: ExamplePayload): RenderedPrompt => {
  const scene = payload.scene ? `场景提示：${payload.scene}` : '';
  const tone = `表达风格：${payload.tone}`;
  const user = stripIndents`
  仅为下列单词生成 1 句生活化日语例句（15-25 字）：
  目标单词：${payload.word}
  ${scene}
  ${tone}

  返回 JSON：{"example":"","sceneDesc":""}
  `;

  return {
    system: stripIndents`
    你是日语例句生成助手，保持自然且口语化。
    仅返回 JSON，无需其他解释。
    `,
    user,
    temperature: payload.tone === 'concise' ? 0.25 : 0.4,
    maxOutputTokens: 180,
  };
};

const templates: Record<AiScenario, (payload: unknown) => RenderedPrompt> = {
  wordEnrich: (payload) => wordEnrichTemplate(wordEnrichPayloadSchema.parse(payload)),
  exampleOnly: (payload) => exampleOnlyTemplate(exampleOnlyPayloadSchema.parse(payload)),
};

export const renderPrompt = (scenario: AiScenario, payload: unknown): RenderedPrompt => {
  if (!aiScenarioEnum.options.includes(scenario)) {
    throw new Error(`Unsupported scenario: ${scenario}`);
  }
  return templates[scenario](payload);
};

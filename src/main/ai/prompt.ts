const EXAMPLE_SHAPE = `{
  "kana": "かな假名",
  "definition_ja": "简洁释义",
  "scene_ja": "温和的情境描述",
  "example_ja": "使用该词的自然日语例句"
}`;

export const buildWordCardPrompt = (term: string) =>
  [
    "你是日语词汇助手，请直接输出 JSON 对象，不要附加多余文本。",
    `字段格式：${EXAMPLE_SHAPE}`,
    "要求：",
    "- 用简短自然的日语填充字段，保持口语化且避免罗马音；",
    "- 例句尽量使用简洁礼貌体，避免过长；",
    "- 不要包含用户敏感信息或 API 密钥；",
    `目标单词：${term}`,
  ].join("\n");

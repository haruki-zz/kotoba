import {
  type AiGenerateWordResponse,
  EXAMPLE_SENTENCE_RANGE,
  SCENE_LENGTH_RANGE,
} from "@kotoba/shared";

import { type ExampleStyle } from "./types.js";

const MAX_READING_LENGTH = 80;
const MAX_CONTEXT_LENGTH = 320;

const containsUnsafeText = (value: string) =>
  /(https?:\/\/|<script|\bEXTERNAL_LINK\b)/i.test(value);

const checkRange = (
  text: string,
  [min, max]: [number, number],
  field: string,
  issues: string[],
) => {
  const length = text.length;
  if (length < min) {
    issues.push(`${field} is too short (expected >= ${min})`);
  }
  if (length > max) {
    issues.push(`${field} is too long (expected <= ${max})`);
  }
};

export const auditGeneratedContent = (
  output: AiGenerateWordResponse,
  style: ExampleStyle,
) => {
  const issues: string[] = [];
  const [exampleMin, exampleMax] = style.sentenceLengthRange ?? [
    ...EXAMPLE_SENTENCE_RANGE,
  ];
  const [sceneMin, sceneMax] = style.sceneLengthRange ?? [
    ...SCENE_LENGTH_RANGE,
  ];

  if (!output.reading.trim()) {
    issues.push("reading is empty");
  }
  if (output.reading.length > MAX_READING_LENGTH) {
    issues.push("reading is excessively long");
  }
  if (!output.contextExpl.trim()) {
    issues.push("contextExpl is empty");
  }
  if (output.contextExpl.length > MAX_CONTEXT_LENGTH) {
    issues.push("contextExpl exceeds max length");
  }

  checkRange(output.sceneDesc, [sceneMin, sceneMax], "sceneDesc", issues);
  checkRange(output.example, [exampleMin, exampleMax], "example", issues);

  const combined = `${output.contextExpl} ${output.sceneDesc} ${output.example}`;
  if (containsUnsafeText(combined)) {
    issues.push("content contains unsafe tokens");
  }

  const ok = issues.length === 0;
  return { ok, issues };
};

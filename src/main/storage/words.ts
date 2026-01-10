import crypto from "node:crypto";
import { normalizeWord } from "../../shared/validation";
import { Word } from "../../shared/types";
import { WordDraft, WordUpdate } from "./types";

export const buildWordFromDraft = (draft: WordDraft, now: number): Word => {
  const candidate: WordDraft = {
    ...draft,
    id: draft.id ?? crypto.randomUUID(),
    created_at: draft.created_at ?? now,
    updated_at: draft.updated_at ?? now,
  };

  return normalizeWord(candidate, now);
};

export const mergeWordUpdate = (word: Word, update: WordUpdate, now: number): Word => {
  const sm2 = update.sm2 ? { ...word.sm2, ...update.sm2 } : word.sm2;

  return normalizeWord(
    {
      ...word,
      term: update.term ?? word.term,
      kana: update.kana ?? word.kana,
      definition_ja: update.definition_ja ?? word.definition_ja,
      scene_ja: update.scene_ja ?? word.scene_ja,
      example_ja: update.example_ja ?? word.example_ja,
      sm2,
      updated_at: update.updated_at ?? now,
    },
    now,
  );
};

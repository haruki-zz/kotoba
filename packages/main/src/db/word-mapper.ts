import { WordCreateInput, WordRecord } from "@kotoba/shared";

export type WordRow = {
  id: number;
  word: string;
  reading: string | null;
  context_expl: string | null;
  scene_desc: string | null;
  example: string | null;
  difficulty: string;
  ef: number;
  interval_days: number;
  repetition: number;
  last_review_at: string | null;
  next_due_at: string | null;
  created_at: string;
  updated_at: string;
};

export const mapRowToWord = (row: WordRow): WordRecord => ({
  id: row.id,
  word: row.word,
  reading: row.reading ?? undefined,
  contextExpl: row.context_expl ?? undefined,
  sceneDesc: row.scene_desc ?? undefined,
  example: row.example ?? undefined,
  difficulty: row.difficulty as WordRecord["difficulty"],
  ef: row.ef,
  intervalDays: row.interval_days,
  repetition: row.repetition,
  lastReviewAt: row.last_review_at ?? undefined,
  nextDueAt: row.next_due_at ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapWordInputToRow = (
  payload: WordCreateInput,
  timestamps: { createdAt: string; updatedAt: string },
) => ({
  word: payload.word,
  reading: payload.reading ?? null,
  context_expl: payload.contextExpl ?? null,
  scene_desc: payload.sceneDesc ?? null,
  example: payload.example ?? null,
  difficulty: payload.difficulty,
  ef: payload.ef,
  interval_days: payload.intervalDays,
  repetition: payload.repetition,
  last_review_at: payload.lastReviewAt ?? null,
  next_due_at: payload.nextDueAt ?? null,
  created_at: timestamps.createdAt,
  updated_at: timestamps.updatedAt,
});

import { Difficulty, SourceRecord, TagRecord, WordRecord } from '@shared/types';

export type WordRow = {
  id: number;
  word: string;
  reading: string;
  context_expl: string;
  scene_desc: string;
  example: string;
  difficulty: Difficulty;
  ef: number;
  interval_days: number;
  repetition: number;
  last_review_at: string;
  next_due_at: string;
  source_id: number | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TagRow = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type SourceRow = {
  id: number;
  name: string;
  url: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export const mapWordRow = (row: WordRow): WordRecord => ({
  id: row.id,
  word: row.word,
  reading: row.reading,
  contextExpl: row.context_expl,
  sceneDesc: row.scene_desc,
  example: row.example,
  difficulty: row.difficulty,
  ef: row.ef,
  intervalDays: row.interval_days,
  repetition: row.repetition,
  lastReviewAt: row.last_review_at,
  nextDueAt: row.next_due_at,
  sourceId: row.source_id ?? null,
  deletedAt: row.deleted_at ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapTagRow = (row: TagRow): TagRecord => ({
  id: row.id,
  name: row.name,
  description: row.description ?? '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapSourceRow = (row: SourceRow): SourceRecord => ({
  id: row.id,
  name: row.name,
  url: row.url ?? undefined,
  note: row.note ?? '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

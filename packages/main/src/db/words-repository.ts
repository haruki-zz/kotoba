import type Database from 'better-sqlite3';
import {
  NewWordInput,
  WordRecord,
  WordUpdate,
  newWordInputSchema,
  wordRowSchema,
  wordUpdateSchema,
} from '@kotoba/shared';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type WordRow = {
  id: number;
  word: string;
  reading: string;
  context_expl: string;
  scene_desc: string;
  example: string;
  difficulty: WordRecord['difficulty'];
  ef: number;
  interval_days: number;
  repetition: number;
  last_review_at: string;
  next_due_at: string;
  created_at: string;
  updated_at: string;
};

const toWordRecord = (row: WordRow): WordRecord =>
  wordRowSchema.parse({
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

const toDbParams = (record: Omit<WordRecord, 'id'> & { id?: number }) => ({
  id: record.id,
  word: record.word,
  reading: record.reading,
  context_expl: record.contextExpl,
  scene_desc: record.sceneDesc,
  example: record.example,
  difficulty: record.difficulty,
  ef: record.ef,
  interval_days: record.intervalDays,
  repetition: record.repetition,
  last_review_at: record.lastReviewAt,
  next_due_at: record.nextDueAt,
  created_at: record.createdAt,
  updated_at: record.updatedAt,
});

const addDays = (iso: string, days: number): string => {
  const date = new Date(iso);
  return new Date(date.getTime() + days * MS_PER_DAY).toISOString();
};

const normalizeNewWord = (input: NewWordInput): Omit<WordRecord, 'id'> => {
  const parsed = newWordInputSchema.parse(input);
  const now = new Date().toISOString();
  const lastReviewAt = parsed.lastReviewAt ?? now;
  const intervalDays = parsed.intervalDays;
  const nextDueAt = parsed.nextDueAt ?? addDays(lastReviewAt, intervalDays);

  return {
    ...parsed,
    lastReviewAt,
    nextDueAt,
    createdAt: now,
    updatedAt: now,
  };
};

const columns =
  'id, word, reading, context_expl, scene_desc, example, difficulty, ef, interval_days, repetition, last_review_at, next_due_at, created_at, updated_at';

type SqliteDb = Database.Database;

export const insertWord = (db: SqliteDb, input: NewWordInput): WordRecord => {
  const record = normalizeNewWord(input);

  const stmt = db.prepare(
    `INSERT INTO words (word, reading, context_expl, scene_desc, example, difficulty, ef, interval_days, repetition, last_review_at, next_due_at, created_at, updated_at)
     VALUES (@word, @reading, @context_expl, @scene_desc, @example, @difficulty, @ef, @interval_days, @repetition, @last_review_at, @next_due_at, @created_at, @updated_at)`,
  );

  const result = stmt.run(toDbParams(record));
  const row = db
    .prepare(`SELECT ${columns} FROM words WHERE id = ?`)
    .get(result.lastInsertRowid) as WordRow | undefined;

  if (!row) {
    throw new Error('Inserted word could not be read back from the database.');
  }

  return toWordRecord(row);
};

export const getWordById = (db: SqliteDb, id: number): WordRecord | undefined => {
  const row = db.prepare(`SELECT ${columns} FROM words WHERE id = ?`).get(id) as
    | WordRow
    | undefined;

  return row ? toWordRecord(row) : undefined;
};

export interface ListWordsOptions {
  dueBefore?: string;
  limit?: number;
}

export const listWords = (db: SqliteDb, options: ListWordsOptions = {}): WordRecord[] => {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (options.dueBefore) {
    conditions.push('next_due_at <= ?');
    params.push(options.dueBefore);
  }

  let query = `SELECT ${columns} FROM words`;
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  query += ' ORDER BY next_due_at ASC, id ASC';
  if (options.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
  }

  const rows = db.prepare(query).all(...params) as WordRow[];
  return rows.map(toWordRecord);
};

export const updateWord = (db: SqliteDb, payload: WordUpdate): WordRecord | undefined => {
  const parsed = wordUpdateSchema.parse(payload);
  const existing = getWordById(db, parsed.id);
  if (!existing) return undefined;

  const intervalDays = parsed.changes.intervalDays ?? existing.intervalDays;
  const lastReviewAt = parsed.changes.lastReviewAt ?? existing.lastReviewAt;
  const schedulingChanged =
    parsed.changes.intervalDays !== undefined ||
    parsed.changes.lastReviewAt !== undefined ||
    parsed.changes.nextDueAt !== undefined;
  const nextDueAt =
    parsed.changes.nextDueAt ??
    (schedulingChanged ? addDays(lastReviewAt, intervalDays) : existing.nextDueAt);
  const updatedAt = new Date().toISOString();

  const updated: WordRecord = wordRowSchema.parse({
    ...existing,
    ...parsed.changes,
    intervalDays,
    lastReviewAt,
    nextDueAt,
    updatedAt,
  });

  db.prepare(
    `UPDATE words
     SET word=@word,
         reading=@reading,
         context_expl=@context_expl,
         scene_desc=@scene_desc,
         example=@example,
         difficulty=@difficulty,
         ef=@ef,
         interval_days=@interval_days,
         repetition=@repetition,
         last_review_at=@last_review_at,
         next_due_at=@next_due_at,
         updated_at=@updated_at
     WHERE id=@id`,
  ).run(toDbParams(updated));

  return getWordById(db, parsed.id);
};

export const deleteWord = (db: SqliteDb, id: number): boolean => {
  const result = db.prepare('DELETE FROM words WHERE id = ?').run(id);
  return result.changes > 0;
};

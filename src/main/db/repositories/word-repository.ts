import BetterSqlite3 from 'better-sqlite3';

import {
  DEFAULT_INTERVAL_DAYS,
  DEFAULT_REPETITION,
  SM2_DEFAULT_EF,
  WordCreateInput,
  WordRecord,
  WordUpdateInput,
  wordCreateSchema,
  wordUpdateSchema,
} from '@shared/types';

import { mapWordRow, WordRow } from '../mappers';
import { nowIso } from '../time';

import { SourceRepository } from './source-repository';
import { TagRepository } from './tag-repository';

type WordCreateOptions = {
  tagNames?: string[];
  sourceName?: string;
  sourceUrl?: string | null;
  sourceNote?: string;
};

type WordUpdateOptions = {
  tagNames?: string[];
  sourceName?: string;
  sourceUrl?: string | null;
  sourceNote?: string;
};

export class WordRepository {
  constructor(
    private db: BetterSqlite3.Database,
    private tagRepo: TagRepository,
    private sourceRepo: SourceRepository
  ) {}

  create(input: WordCreateInput, options?: WordCreateOptions): WordRecord {
    const parsed = wordCreateSchema.parse(input);
    const now = nowIso();
    const lastReviewAt = parsed.lastReviewAt ?? now;
    const nextDueAt = parsed.nextDueAt ?? now;

    let sourceId = parsed.sourceId ?? null;
    if (!sourceId && options?.sourceName) {
      const source = this.sourceRepo.upsert({
        name: options.sourceName,
        url: options.sourceUrl ?? undefined,
        note: options.sourceNote,
      });
      sourceId = source.id;
    }

    const result = this.db
      .prepare(
        `INSERT INTO words
         (word, reading, context_expl, scene_desc, example, difficulty, ef, interval_days, repetition, last_review_at, next_due_at, source_id, created_at, updated_at)
         VALUES (@word, @reading, @context_expl, @scene_desc, @example, @difficulty, @ef, @interval_days, @repetition, @last_review_at, @next_due_at, @source_id, @created_at, @updated_at)`
      )
      .run({
        word: parsed.word,
        reading: parsed.reading,
        context_expl: parsed.contextExpl,
        scene_desc: parsed.sceneDesc,
        example: parsed.example,
        difficulty: parsed.difficulty,
        ef: parsed.ef ?? SM2_DEFAULT_EF,
        interval_days: parsed.intervalDays ?? DEFAULT_INTERVAL_DAYS,
        repetition: parsed.repetition ?? DEFAULT_REPETITION,
        last_review_at: lastReviewAt,
        next_due_at: nextDueAt,
        source_id: sourceId,
        created_at: now,
        updated_at: now,
      });

    const insertedId = Number(result.lastInsertRowid);
    if (options?.tagNames?.length) {
      this.replaceTags(insertedId, options.tagNames);
    }
    const stored = this.getById(insertedId);
    if (!stored) {
      throw new Error('Failed to create word record');
    }
    return stored;
  }

  getById(id: number): WordRecord | undefined {
    const row = this.db
      .prepare(
        `SELECT id, word, reading, context_expl, scene_desc, example, difficulty, ef, interval_days, repetition, last_review_at, next_due_at, source_id, created_at, updated_at
         FROM words WHERE id = ?`
      )
      .get(id) as WordRow | undefined;
    return row ? mapWordRow(row) : undefined;
  }

  listDue(limit: number, asOfIso = nowIso()): WordRecord[] {
    const rows = this.db
      .prepare(
        `SELECT id, word, reading, context_expl, scene_desc, example, difficulty, ef, interval_days, repetition, last_review_at, next_due_at, source_id, created_at, updated_at
         FROM words
         WHERE next_due_at <= @asOf
         ORDER BY next_due_at ASC, id ASC
         LIMIT @limit`
      )
      .all({ asOf: asOfIso, limit }) as WordRow[];
    return rows.map((row) => mapWordRow(row));
  }

  update(id: number, patch: WordUpdateInput, options?: WordUpdateOptions): WordRecord | undefined {
    const parsed = wordUpdateSchema.parse(patch);
    const assignments: string[] = [];
    const params: Record<string, unknown> = { id };

    const assign = (column: string, value: unknown) => {
      assignments.push(`${column} = @${column}`);
      params[column] = value;
    };

    if (parsed.word !== undefined) assign('word', parsed.word);
    if (parsed.reading !== undefined) assign('reading', parsed.reading);
    if (parsed.contextExpl !== undefined) assign('context_expl', parsed.contextExpl);
    if (parsed.sceneDesc !== undefined) assign('scene_desc', parsed.sceneDesc);
    if (parsed.example !== undefined) assign('example', parsed.example);
    if (parsed.difficulty !== undefined) assign('difficulty', parsed.difficulty);
    if (parsed.ef !== undefined) assign('ef', parsed.ef);
    if (parsed.intervalDays !== undefined) assign('interval_days', parsed.intervalDays);
    if (parsed.repetition !== undefined) assign('repetition', parsed.repetition);
    if (parsed.lastReviewAt !== undefined) assign('last_review_at', parsed.lastReviewAt);
    if (parsed.nextDueAt !== undefined) assign('next_due_at', parsed.nextDueAt);
    if (parsed.sourceId !== undefined) assign('source_id', parsed.sourceId);

    if (options?.sourceName) {
      const source = this.sourceRepo.upsert({
        name: options.sourceName,
        url: options.sourceUrl ?? undefined,
        note: options.sourceNote,
      });
      assign('source_id', source.id);
    }

    const timestamp = parsed.updatedAt ?? nowIso();
    assign('updated_at', timestamp);

    if (assignments.length > 0) {
      const sql = `UPDATE words SET ${assignments.join(', ')} WHERE id = @id`;
      const result = this.db.prepare(sql).run(params);
      if (result.changes === 0) {
        return undefined;
      }
    }

    if (options?.tagNames) {
      this.replaceTags(id, options.tagNames);
    }

    return this.getById(id);
  }

  replaceTags(wordId: number, tagNames: string[]): void {
    const tags = this.tagRepo.ensureNames(tagNames);
    this.db.prepare('DELETE FROM word_tags WHERE word_id = ?').run(wordId);
    const stmt = this.db.prepare(
      'INSERT OR IGNORE INTO word_tags (word_id, tag_id, created_at) VALUES (?, ?, ?)'
    );
    const createdAt = nowIso();
    tags.forEach((tag) => {
      stmt.run(wordId, tag.id, createdAt);
    });
  }

  listTags(wordId: number) {
    return this.tagRepo.listByWord(wordId);
  }
}

import BetterSqlite3 from 'better-sqlite3';

import {
  DEFAULT_INTERVAL_DAYS,
  DEFAULT_REPETITION,
  SM2_DEFAULT_EF,
  Difficulty,
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

type OrderField = 'next_due_at' | 'created_at' | 'updated_at';
type SortOrder = 'ASC' | 'DESC';

export type WordSearchParams = {
  query?: string;
  difficulties?: Difficulty[];
  tagNames?: string[];
  sourceId?: number;
  dueBefore?: string;
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
  limit: number;
  offset: number;
  orderBy: OrderField;
  order: SortOrder;
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
         (word, reading, context_expl, scene_desc, example, difficulty, ef, interval_days, repetition, last_review_at, next_due_at, source_id, deleted_at, created_at, updated_at)
         VALUES (@word, @reading, @context_expl, @scene_desc, @example, @difficulty, @ef, @interval_days, @repetition, @last_review_at, @next_due_at, @source_id, @deleted_at, @created_at, @updated_at)`
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
        deleted_at: null,
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
        `SELECT id, word, reading, context_expl, scene_desc, example, difficulty, ef, interval_days, repetition, last_review_at, next_due_at, source_id, deleted_at, created_at, updated_at
         FROM words WHERE id = ?`
      )
      .get(id) as WordRow | undefined;
    return row ? mapWordRow(row) : undefined;
  }

  listDue(limit: number, asOfIso = nowIso()): WordRecord[] {
    const rows = this.db
      .prepare(
        `SELECT id, word, reading, context_expl, scene_desc, example, difficulty, ef, interval_days, repetition, last_review_at, next_due_at, source_id, deleted_at, created_at, updated_at
         FROM words
         WHERE next_due_at <= @asOf AND deleted_at IS NULL
         ORDER BY next_due_at ASC, id ASC
         LIMIT @limit`
      )
      .all({ asOf: asOfIso, limit }) as WordRow[];
    return rows.map((row) => mapWordRow(row));
  }

  search(params: WordSearchParams): { items: WordRecord[]; total: number } {
    const conditions: string[] = [];
    const args: unknown[] = [];

    if (params.query) {
      const like = `%${params.query.toLowerCase()}%`;
      conditions.push(
        `(lower(w.word) LIKE ? OR lower(w.reading) LIKE ? OR lower(w.context_expl) LIKE ? OR lower(w.scene_desc) LIKE ? OR lower(w.example) LIKE ?)`
      );
      args.push(like, like, like, like, like);
    }

    if (params.difficulties?.length) {
      const placeholders = params.difficulties.map(() => '?').join(', ');
      conditions.push(`w.difficulty IN (${placeholders})`);
      args.push(...params.difficulties);
    }

    if (params.sourceId) {
      conditions.push('w.source_id = ?');
      args.push(params.sourceId);
    }

    if (params.dueBefore) {
      conditions.push('w.next_due_at <= ?');
      args.push(params.dueBefore);
    }

    if (params.createdAfter) {
      conditions.push('w.created_at >= ?');
      args.push(params.createdAfter);
    }

    if (params.createdBefore) {
      conditions.push('w.created_at <= ?');
      args.push(params.createdBefore);
    }

    if (params.updatedAfter) {
      conditions.push('w.updated_at >= ?');
      args.push(params.updatedAfter);
    }

    if (params.updatedBefore) {
      conditions.push('w.updated_at <= ?');
      args.push(params.updatedBefore);
    }

    if (params.onlyDeleted) {
      conditions.push('w.deleted_at IS NOT NULL');
    } else if (!params.includeDeleted) {
      conditions.push('w.deleted_at IS NULL');
    }

    const tagNames = params.tagNames?.filter((tag) => tag.trim().length > 0) ?? [];
    if (tagNames.length > 0) {
      const placeholders = tagNames.map(() => '?').join(', ');
      conditions.push(
        `w.id IN (
          SELECT wt.word_id
          FROM word_tags wt
          INNER JOIN tags t ON t.id = wt.tag_id
          WHERE t.name IN (${placeholders})
          GROUP BY wt.word_id
          HAVING COUNT(DISTINCT t.name) = ${tagNames.length}
        )`
      );
      args.push(...tagNames);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const base = `FROM words w ${whereClause}`;

    const orderMap: Record<WordSearchParams['orderBy'], string> = {
      next_due_at: 'w.next_due_at',
      created_at: 'w.created_at',
      updated_at: 'w.updated_at',
    };
    const orderField = orderMap[params.orderBy] ?? 'w.next_due_at';
    const orderDir = params.order === 'DESC' ? 'DESC' : 'ASC';

    const selectSql = `SELECT w.id, w.word, w.reading, w.context_expl, w.scene_desc, w.example, w.difficulty, w.ef, w.interval_days, w.repetition, w.last_review_at, w.next_due_at, w.source_id, w.deleted_at, w.created_at, w.updated_at ${base} ORDER BY ${orderField} ${orderDir} LIMIT ? OFFSET ?`;
    const totalSql = `SELECT COUNT(*) as count ${base}`;

    const rows = this.db
      .prepare(selectSql)
      .all(...args, params.limit, params.offset) as WordRow[];
    const totalRow = this.db.prepare(totalSql).get(...args) as { count: number } | undefined;

    return {
      items: rows.map(mapWordRow),
      total: totalRow?.count ?? 0,
    };
  }

  countDue(asOfIso = nowIso()): number {
    const row = this.db
      .prepare('SELECT COUNT(*) as count FROM words WHERE next_due_at <= ? AND deleted_at IS NULL')
      .get(asOfIso) as { count: number } | undefined;
    return row?.count ?? 0;
  }

  countAll(): number {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM words WHERE deleted_at IS NULL').get() as
      | { count: number }
      | undefined;
    return row?.count ?? 0;
  }

  countByDifficulty(): Record<Difficulty, number> {
    const rows = this.db
      .prepare(
        'SELECT difficulty, COUNT(*) as count FROM words WHERE deleted_at IS NULL GROUP BY difficulty'
      )
      .all() as { difficulty: Difficulty; count: number }[];
    return rows.reduce<Record<Difficulty, number>>(
      (acc, row) => {
        acc[row.difficulty] = row.count;
        return acc;
      },
      { easy: 0, medium: 0, hard: 0 }
    );
  }

  countCreatedSince(sinceIso: string): number {
    const row = this.db
      .prepare('SELECT COUNT(*) as count FROM words WHERE created_at >= ? AND deleted_at IS NULL')
      .get(sinceIso) as { count: number } | undefined;
    return row?.count ?? 0;
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

    if (options?.tagNames !== undefined) {
      this.replaceTags(id, options.tagNames);
    }

    return this.getById(id);
  }

  hardDelete(id: number): boolean {
    const result = this.db.prepare('DELETE FROM words WHERE id = ?').run(id);
    return result.changes > 0;
  }

  findExistingIds(wordIds: number[], includeDeleted = true): number[] {
    if (wordIds.length === 0) return [];
    const placeholders = wordIds.map(() => '?').join(', ');
    const deletedClause = includeDeleted ? '' : ' AND deleted_at IS NULL';
    const rows = this.db
      .prepare(`SELECT id FROM words WHERE id IN (${placeholders})${deletedClause}`)
      .all(...wordIds) as { id: number }[];
    return rows.map((row) => row.id);
  }

  softDelete(id: number, deletedAt = nowIso()): WordRecord | undefined {
    const result = this.db
      .prepare('UPDATE words SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL')
      .run(deletedAt, deletedAt, id);
    if (result.changes === 0) return undefined;
    return this.getById(id);
  }

  restore(id: number, restoredAt = nowIso()): WordRecord | undefined {
    const result = this.db
      .prepare('UPDATE words SET deleted_at = NULL, updated_at = ? WHERE id = ? AND deleted_at IS NOT NULL')
      .run(restoredAt, id);
    if (result.changes === 0) return undefined;
    return this.getById(id);
  }

  batchSetDifficulty(wordIds: number[], difficulty: Difficulty): number {
    if (wordIds.length === 0) return 0;
    const placeholders = wordIds.map(() => '?').join(', ');
    const now = nowIso();
    const result = this.db
      .prepare(
        `UPDATE words
         SET difficulty = ?, updated_at = ?
         WHERE id IN (${placeholders}) AND deleted_at IS NULL`
      )
      .run(difficulty, now, ...wordIds);
    return result.changes;
  }

  batchSoftDelete(wordIds: number[]): number {
    if (wordIds.length === 0) return 0;
    const placeholders = wordIds.map(() => '?').join(', ');
    const now = nowIso();
    const result = this.db
      .prepare(
        `UPDATE words
         SET deleted_at = ?, updated_at = ?
         WHERE id IN (${placeholders}) AND deleted_at IS NULL`
      )
      .run(now, now, ...wordIds);
    return result.changes;
  }

  batchRestore(wordIds: number[]): number {
    if (wordIds.length === 0) return 0;
    const placeholders = wordIds.map(() => '?').join(', ');
    const now = nowIso();
    const result = this.db
      .prepare(
        `UPDATE words
         SET deleted_at = NULL, updated_at = ?
         WHERE id IN (${placeholders}) AND deleted_at IS NOT NULL`
      )
      .run(now, ...wordIds);
    return result.changes;
  }

  batchAddTags(wordIds: number[], tagNames: string[]): number {
    if (wordIds.length === 0 || tagNames.length === 0) return 0;
    const tags = this.tagRepo.ensureNames(tagNames);
    const insert = this.db.prepare(
      'INSERT OR IGNORE INTO word_tags (word_id, tag_id, created_at) VALUES (?, ?, ?)'
    );
    const timestamp = nowIso();
    const run = this.db.transaction((ids: number[], tagIds: number[]) => {
      ids.forEach((wordId) => {
        tagIds.forEach((tagId) => {
          insert.run(wordId, tagId, timestamp);
        });
      });
    });
    run(wordIds, tags.map((tag) => tag.id));
    return wordIds.length;
  }

  batchRemoveTags(wordIds: number[], tagNames: string[]): number {
    if (wordIds.length === 0 || tagNames.length === 0) return 0;
    const tags = this.tagRepo.findByNames(tagNames);
    if (tags.length === 0) return 0;
    const wordPlaceholders = wordIds.map(() => '?').join(', ');
    const tagPlaceholders = tags.map(() => '?').join(', ');
    const result = this.db
      .prepare(
        `DELETE FROM word_tags
         WHERE word_id IN (${wordPlaceholders})
           AND tag_id IN (${tagPlaceholders})`
      )
      .run(...wordIds, ...tags.map((tag) => tag.id));
    return result.changes;
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

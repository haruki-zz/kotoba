import {
  WordCreateInput,
  wordCreateSchema,
  WordQuery,
  wordQuerySchema,
  WordRecord,
  WordUpdateInput,
  wordUpdateSchema,
} from "@kotoba/shared";

import type { SqliteDatabase } from "./connection";
import { mapRowToWord, mapWordInputToRow, WordRow } from "./word-mapper";

type WordUpdateColumn =
  | "word"
  | "reading"
  | "context_expl"
  | "scene_desc"
  | "example"
  | "difficulty"
  | "ef"
  | "interval_days"
  | "repetition"
  | "last_review_at"
  | "next_due_at";

const updateColumnMap: Record<keyof WordUpdateInput, WordUpdateColumn> = {
  word: "word",
  reading: "reading",
  contextExpl: "context_expl",
  sceneDesc: "scene_desc",
  example: "example",
  difficulty: "difficulty",
  ef: "ef",
  intervalDays: "interval_days",
  repetition: "repetition",
  lastReviewAt: "last_review_at",
  nextDueAt: "next_due_at",
};

export class WordRepository {
  constructor(private readonly db: SqliteDatabase) {}

  create(input: WordCreateInput): WordRecord {
    const payload = wordCreateSchema.parse(input);
    const now = new Date().toISOString();
    const mapped = mapWordInputToRow(payload, {
      createdAt: now,
      updatedAt: now,
    });

    const statement = this.db.prepare(`
      INSERT INTO words (
        word, reading, context_expl, scene_desc, example, difficulty, ef,
        interval_days, repetition, last_review_at, next_due_at, created_at, updated_at
      ) VALUES (
        @word, @reading, @context_expl, @scene_desc, @example, @difficulty, @ef,
        @interval_days, @repetition, @last_review_at, @next_due_at, @created_at, @updated_at
      )
    `);

    const result = statement.run(mapped);
    const insertedId = Number(result.lastInsertRowid);
    const record = this.getById(insertedId);
    if (!record) {
      throw new Error("Failed to fetch inserted word");
    }
    return record;
  }

  getById(id: number): WordRecord | null {
    const row = this.db
      .prepare(`SELECT * FROM words WHERE id = ? LIMIT 1`)
      .get(id) as WordRow | undefined;
    return row ? mapRowToWord(row) : null;
  }

  list(query: Partial<WordQuery> = {}): WordRecord[] {
    const parsed = wordQuerySchema.parse(query);
    const conditions: string[] = [];
    const params: Record<string, unknown> = {
      limit: parsed.limit,
      offset: parsed.offset,
    };

    if (parsed.search) {
      conditions.push(`(word LIKE @search OR reading LIKE @search)`);
      params.search = `%${parsed.search}%`;
    }

    if (parsed.difficulty) {
      conditions.push(`difficulty = @difficulty`);
      params.difficulty = parsed.difficulty;
    }

    if (parsed.dueBefore) {
      conditions.push(
        `(next_due_at IS NOT NULL AND next_due_at <= @dueBefore)`,
      );
      params.dueBefore = parsed.dueBefore;
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";
    const rows = this.db
      .prepare(
        `
        SELECT * FROM words
        ${whereClause}
        ORDER BY next_due_at IS NULL, next_due_at ASC, id ASC
        LIMIT @limit OFFSET @offset
      `,
      )
      .all(params) as WordRow[];

    return rows.map(mapRowToWord);
  }

  listDue(limit = 30, dueBefore = new Date().toISOString()): WordRecord[] {
    return this.list({
      limit,
      offset: 0,
      dueBefore,
    });
  }

  update(id: number, input: WordUpdateInput): WordRecord | null {
    const payload = wordUpdateSchema.parse(input);
    const updates = Object.entries(payload).filter(
      ([, value]) => value !== undefined,
    ) as [keyof WordUpdateInput, unknown][];

    if (!updates.length) {
      return this.getById(id);
    }

    const now = new Date().toISOString();
    const params: Record<string, unknown> = { id, updated_at: now };
    const assignments: string[] = [];

    updates.forEach(([key, value]) => {
      const column = updateColumnMap[key];
      assignments.push(`${column} = @${column}`);
      params[column] =
        value === null || value === undefined
          ? null
          : typeof value === "string"
            ? value
            : value;
    });

    assignments.push("updated_at = @updated_at");

    this.db
      .prepare(`UPDATE words SET ${assignments.join(", ")} WHERE id = @id`)
      .run(params);

    return this.getById(id);
  }

  delete(id: number): void {
    this.db.prepare(`DELETE FROM words WHERE id = ?`).run(id);
  }
}

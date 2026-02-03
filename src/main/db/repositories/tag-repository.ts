import BetterSqlite3 from 'better-sqlite3';

import { TagCreateInput, TagRecord, tagCreateSchema } from '@shared/types';

import { mapTagRow, TagRow } from '../mappers';
import { nowIso } from '../time';

export class TagRepository {
  private selectByNameStmt;

  constructor(private db: BetterSqlite3.Database) {
    this.selectByNameStmt = this.db.prepare(
      'SELECT id, name, description, created_at, updated_at FROM tags WHERE name = ?'
    );
  }

  findByName(name: string): TagRecord | undefined {
    const row = this.selectByNameStmt.get(name);
    return row ? mapTagRow(row) : undefined;
  }

  findById(id: number): TagRecord | undefined {
    const row = this.db
      .prepare('SELECT id, name, description, created_at, updated_at FROM tags WHERE id = ?')
      .get(id);
    return row ? mapTagRow(row) : undefined;
  }

  findByNames(names: string[]): TagRecord[] {
    if (names.length === 0) return [];
    const placeholders = names.map(() => '?').join(', ');
    const rows = this.db
      .prepare(
        `SELECT id, name, description, created_at, updated_at FROM tags WHERE name IN (${placeholders})`
      )
      .all(...names) as TagRow[];
    return rows.map(mapTagRow);
  }

  upsert(input: TagCreateInput): TagRecord {
    const existing = this.findByName(input.name);
    const descriptionProvided = input.description !== undefined;
    const parsed = tagCreateSchema.parse({
      ...input,
      description: descriptionProvided ? input.description : (existing?.description ?? ''),
    });
    const now = nowIso();
    this.db
      .prepare(
        `INSERT INTO tags (name, description, created_at, updated_at)
         VALUES (@name, @description, @created_at, @updated_at)
         ON CONFLICT(name) DO UPDATE SET
           description = excluded.description,
           updated_at = excluded.updated_at`
      )
      .run({
        name: parsed.name,
        description: parsed.description ?? '',
        created_at: now,
        updated_at: now,
      });
    const stored = this.findByName(parsed.name);
    if (!stored) {
      throw new Error(`Failed to upsert tag: ${parsed.name}`);
    }
    return stored;
  }

  ensureNames(names: string[]): TagRecord[] {
    const deduped = Array.from(new Set(names.filter((name) => name.trim().length > 0)));
    return deduped.map((name) => this.upsert({ name }));
  }

  listAll(): TagRecord[] {
    const rows = this.db
      .prepare('SELECT id, name, description, created_at, updated_at FROM tags ORDER BY name ASC')
      .all();
    return rows.map(mapTagRow);
  }

  listByWord(wordId: number): TagRecord[] {
    const rows = this.db
      .prepare(
        `SELECT t.id, t.name, t.description, t.created_at, t.updated_at
         FROM tags t
         INNER JOIN word_tags wt ON wt.tag_id = t.id
         WHERE wt.word_id = ?
         ORDER BY t.name ASC`
      )
      .all(wordId);
    return rows.map(mapTagRow);
  }

  listByWordIds(wordIds: number[]): Record<number, TagRecord[]> {
    if (wordIds.length === 0) return {};
    const placeholders = wordIds.map(() => '?').join(', ');
    const rows = this.db
      .prepare(
        `SELECT wt.word_id as word_id, t.id, t.name, t.description, t.created_at, t.updated_at
         FROM word_tags wt
         INNER JOIN tags t ON t.id = wt.tag_id
         WHERE wt.word_id IN (${placeholders})
         ORDER BY t.name ASC`
      )
      .all(...wordIds) as (TagRow & { word_id: number })[];

    return rows.reduce<Record<number, TagRecord[]>>((acc, row) => {
      if (!acc[row.word_id]) acc[row.word_id] = [];
      acc[row.word_id].push(
        mapTagRow({
          id: row.id,
          name: row.name,
          description: row.description,
          created_at: row.created_at,
          updated_at: row.updated_at,
        })
      );
      return acc;
    }, {});
  }
}

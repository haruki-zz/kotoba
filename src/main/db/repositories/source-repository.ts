import BetterSqlite3 from 'better-sqlite3';

import { SourceCreateInput, SourceRecord, sourceCreateSchema } from '@shared/types';

import { mapSourceRow } from '../mappers';
import { nowIso } from '../time';

export class SourceRepository {
  private selectByNameStmt;

  constructor(private db: BetterSqlite3.Database) {
    this.selectByNameStmt = this.db.prepare(
      'SELECT id, name, url, note, created_at, updated_at FROM sources WHERE name = ?'
    );
  }

  findById(id: number): SourceRecord | undefined {
    const row = this.db
      .prepare('SELECT id, name, url, note, created_at, updated_at FROM sources WHERE id = ?')
      .get(id);
    return row ? mapSourceRow(row) : undefined;
  }

  findByName(name: string): SourceRecord | undefined {
    const row = this.selectByNameStmt.get(name);
    return row ? mapSourceRow(row) : undefined;
  }

  findByIds(ids: number[]): SourceRecord[] {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(', ');
    const rows = this.db
      .prepare(
        `SELECT id, name, url, note, created_at, updated_at FROM sources WHERE id IN (${placeholders})`
      )
      .all(...ids);
    return rows.map(mapSourceRow);
  }

  listAll(): SourceRecord[] {
    const rows = this.db
      .prepare('SELECT id, name, url, note, created_at, updated_at FROM sources ORDER BY name ASC')
      .all();
    return rows.map(mapSourceRow);
  }

  upsert(input: SourceCreateInput): SourceRecord {
    const existing = this.findByName(input.name);
    const noteProvided = input.note !== undefined;
    const parsed = sourceCreateSchema.parse({
      ...input,
      note: noteProvided ? input.note : (existing?.note ?? ''),
    });
    const now = nowIso();
    this.db
      .prepare(
        `INSERT INTO sources (name, url, note, created_at, updated_at)
         VALUES (@name, @url, @note, @created_at, @updated_at)
         ON CONFLICT(name) DO UPDATE SET
           url = COALESCE(excluded.url, sources.url),
           note = excluded.note,
           updated_at = excluded.updated_at`
      )
      .run({
        name: parsed.name,
        url: parsed.url ?? null,
        note: parsed.note ?? '',
        created_at: now,
        updated_at: now,
      });
    const stored = this.findByName(parsed.name);
    if (!stored) {
      throw new Error(`Failed to upsert source: ${parsed.name}`);
    }
    return stored;
  }
}

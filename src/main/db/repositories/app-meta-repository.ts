import BetterSqlite3 from 'better-sqlite3';

import { nowIso } from '../time';

export class AppMetaRepository {
  constructor(private db: BetterSqlite3.Database) {}

  get(key: string): string | undefined {
    const row = this.db.prepare('SELECT value FROM app_meta WHERE key = ?').get(key) as
      | { value: string }
      | undefined;
    return row?.value;
  }

  set(key: string, value: string) {
    const updatedAt = nowIso();
    this.db
      .prepare(
        `INSERT INTO app_meta (key, value, updated_at)
         VALUES (@key, @value, @updated_at)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = excluded.updated_at`
      )
      .run({
        key,
        value,
        updated_at: updatedAt,
      });
  }

  delete(key: string): boolean {
    const result = this.db.prepare('DELETE FROM app_meta WHERE key = ?').run(key);
    return result.changes > 0;
  }
}

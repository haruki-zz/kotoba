// @vitest-environment node
import BetterSqlite3 from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

import { getPendingMigrations, runMigrations } from '@main/db/migrations';

describe('database migrations', () => {
  it('creates core tables and records the migration', () => {
    const db = new BetterSqlite3(':memory:');
    runMigrations(db);

    const tables = (
      db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]
    ).map((row) => row.name);

    expect(tables).toEqual(
      expect.arrayContaining(['words', 'tags', 'word_tags', 'sources', 'app_meta', 'migrations'])
    );

    const pending = getPendingMigrations(db);
    expect(pending).toHaveLength(0);

    db.close();
  });
});

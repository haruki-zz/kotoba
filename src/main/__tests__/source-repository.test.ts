// @vitest-environment node
import BetterSqlite3 from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

import { runMigrations } from '@main/db/migrations';
import { SourceRepository } from '@main/db/repositories/source-repository';

const setupRepo = () => {
  const db = new BetterSqlite3(':memory:');
  runMigrations(db);
  return { db, sourceRepo: new SourceRepository(db) };
};

describe('SourceRepository', () => {
  it('preserves existing notes when a source is reused without a note', () => {
    const { db, sourceRepo } = setupRepo();
    const original = sourceRepo.upsert({ name: 'textbook', note: 'chapter 3 notes' });

    const reused = sourceRepo.upsert({ name: 'textbook' });

    expect(reused.note).toBe(original.note);
    expect(sourceRepo.findByName('textbook')?.note).toBe(original.note);
    db.close();
  });

  it('updates note when a new one is provided', () => {
    const { db, sourceRepo } = setupRepo();
    sourceRepo.upsert({ name: 'podcast', note: 'episode 1' });

    const updated = sourceRepo.upsert({ name: 'podcast', note: 'episode 2' });

    expect(updated.note).toBe('episode 2');
    db.close();
  });
});

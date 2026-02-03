// @vitest-environment node
import BetterSqlite3 from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

import { runMigrations } from '@main/db/migrations';
import { TagRepository } from '@main/db/repositories/tag-repository';

const setupRepo = () => {
  const db = new BetterSqlite3(':memory:');
  runMigrations(db);
  return { db, tagRepo: new TagRepository(db) };
};

describe('TagRepository', () => {
  it('preserves existing description when ensuring names without descriptions', () => {
    const { db, tagRepo } = setupRepo();
    const original = tagRepo.upsert({ name: 'jlpt-n2', description: 'grammar list' });

    const [reused] = tagRepo.ensureNames(['jlpt-n2']);

    expect(reused.description).toBe(original.description);
    expect(tagRepo.findByName('jlpt-n2')?.description).toBe(original.description);
    db.close();
  });

  it('updates description when a new one is provided', () => {
    const { db, tagRepo } = setupRepo();
    tagRepo.upsert({ name: 'core-2k', description: 'initial deck' });

    const updated = tagRepo.upsert({ name: 'core-2k', description: 'refreshed deck' });

    expect(updated.description).toBe('refreshed deck');
    db.close();
  });
});

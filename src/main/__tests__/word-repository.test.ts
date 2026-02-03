// @vitest-environment node
import BetterSqlite3 from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

import { runMigrations } from '@main/db/migrations';
import { SourceRepository } from '@main/db/repositories/source-repository';
import { TagRepository } from '@main/db/repositories/tag-repository';
import { WordRepository } from '@main/db/repositories/word-repository';
import { SM2_DEFAULT_EF } from '@shared/types';

const buildRepos = () => {
  const db = new BetterSqlite3(':memory:');
  runMigrations(db);
  const tagRepo = new TagRepository(db);
  const sourceRepo = new SourceRepository(db);
  const wordRepo = new WordRepository(db, tagRepo, sourceRepo);
  return { db, tagRepo, sourceRepo, wordRepo };
};

describe('WordRepository', () => {
  it('creates and reads a word with defaults', () => {
    const { db, wordRepo } = buildRepos();

    const created = wordRepo.create({
      word: '猫',
      reading: 'ねこ',
      contextExpl: '日常生活でよく見るペット。',
      sceneDesc: '在家中看着窗外的小猫趴着晒太阳。',
      example: 'その猫は窓辺で丸くなっている。',
      difficulty: 'medium',
    });

    expect(created.id).toBeGreaterThan(0);
    expect(created.ef).toBe(SM2_DEFAULT_EF);
    expect(created.intervalDays).toBeGreaterThanOrEqual(1);
    expect(new Date(created.createdAt).toString()).not.toBe('Invalid Date');

    db.close();
  });

  it('attaches tags and a source, and lists due items', () => {
    const { db, wordRepo } = buildRepos();
    const earlyDate = new Date('2026-02-01T00:00:00.000Z').toISOString();
    const laterDate = new Date('2026-02-05T00:00:00.000Z').toISOString();

    const first = wordRepo.create(
      {
        word: '走る',
        reading: 'はしる',
        contextExpl: '奔跑、跑步。',
        sceneDesc: '晨练时在公园跑步。',
        example: '毎朝公園を走っている。',
        difficulty: 'easy',
        nextDueAt: earlyDate,
        lastReviewAt: earlyDate,
      },
      { tagNames: ['verb', 'routine'], sourceName: 'manual' }
    );

    const second = wordRepo.create({
      word: '静か',
      reading: 'しずか',
      contextExpl: '安静、平静。',
      sceneDesc: '夜晚的图书馆里安静得只能听到翻页声。',
      example: '図書館はとても静かだ。',
      difficulty: 'medium',
      nextDueAt: laterDate,
      lastReviewAt: laterDate,
    });

    const due = wordRepo.listDue(10, earlyDate);
    expect(due.map((item) => item.id)).toContain(first.id);
    expect(due.map((item) => item.id)).not.toContain(second.id);

    const tags = wordRepo.listTags(first.id);
    expect(tags.map((t) => t.name)).toEqual(expect.arrayContaining(['verb', 'routine']));
    expect(first.sourceId).toBeDefined();

    db.close();
  });

  it('clears tags when updating with an empty list', () => {
    const { db, wordRepo } = buildRepos();

    const created = wordRepo.create(
      {
        word: 'notebook',
        reading: 'notebook',
        contextExpl: 'portable paper book',
        sceneDesc: 'buying supplies before class',
        example: 'I picked up a notebook on the way to school.',
        difficulty: 'easy',
      },
      { tagNames: ['stationery', 'noun'] }
    );

    expect(wordRepo.listTags(created.id).map((t) => t.name)).toEqual(
      expect.arrayContaining(['stationery', 'noun'])
    );

    const updated = wordRepo.update(created.id, {}, { tagNames: [] });

    expect(updated).toBeDefined();
    expect(wordRepo.listTags(created.id)).toEqual([]);

    db.close();
  });
});

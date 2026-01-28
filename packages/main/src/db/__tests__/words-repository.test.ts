import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NewWordInput } from '@kotoba/shared';
import {
  connectDatabase,
  deleteWord,
  getWordById,
  insertWord,
  listWords,
  updateWord,
} from '../index';

const SAMPLE: NewWordInput = {
  word: 'kotoba',
  reading: 'ことば',
  contextExpl: 'a sample context',
  sceneDesc: 'a sample scene',
  example: 'これは例文です。',
  difficulty: 'medium',
  ef: 2.5,
  intervalDays: 0,
  repetition: 0,
};

const useFixedClock = (iso: string) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
};

describe('words repository', () => {
  const createdDirs: string[] = [];

  beforeEach(() => {
    useFixedClock('2026-01-10T12:00:00.000Z');
  });

  afterEach(() => {
    vi.useRealTimers();
    createdDirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true }));
  });

  const openTestDb = () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'kotoba-db-'));
    createdDirs.push(dir);
    const filename = path.join(dir, 'test.sqlite');
    const db = connectDatabase({ filename });
    return db;
  };

  it('inserts a word and returns the persisted record', () => {
    const db = openTestDb();
    try {
      const inserted = insertWord(db, { ...SAMPLE, intervalDays: 2 });

      expect(inserted.id).toBeGreaterThan(0);
      expect(inserted.lastReviewAt).toBe('2026-01-10T12:00:00.000Z');
      expect(inserted.nextDueAt).toBe('2026-01-12T12:00:00.000Z');
      expect(getWordById(db, inserted.id)).toMatchObject(inserted);
    } finally {
      db.close();
    }
  });

  it('lists words ordered by next_due_at and filters by dueBefore', () => {
    const db = openTestDb();
    try {
      const first = insertWord(db, { ...SAMPLE, word: 'alpha', intervalDays: 1 });
      insertWord(db, { ...SAMPLE, word: 'beta', intervalDays: 3 });

      const all = listWords(db);
      expect(all.map((w) => w.word)).toEqual(['alpha', 'beta']);

      const dueSoon = listWords(db, { dueBefore: first.nextDueAt });
      expect(dueSoon).toHaveLength(1);
      expect(dueSoon[0].word).toBe('alpha');
    } finally {
      db.close();
    }
  });

  it('updates a word and recomputes next_due_at when interval changes', () => {
    const db = openTestDb();
    try {
      const inserted = insertWord(db, { ...SAMPLE, intervalDays: 1 });

      vi.advanceTimersByTime(1000);
      const updated = updateWord(db, {
        id: inserted.id,
        changes: { intervalDays: 5, ef: 2.8, repetition: 2 },
      });

      expect(updated?.intervalDays).toBe(5);
      expect(updated?.nextDueAt).toBe('2026-01-15T12:00:00.000Z');
      expect(updated?.updatedAt).not.toBe(inserted.updatedAt);
    } finally {
      db.close();
    }
  });

  it('keeps existing next_due_at when only non-scheduling fields change', () => {
    const db = openTestDb();
    try {
      const inserted = insertWord(db, {
        ...SAMPLE,
        intervalDays: 2,
        nextDueAt: '2026-02-01T00:00:00.000Z',
      });

      const updated = updateWord(db, { id: inserted.id, changes: { word: 'kotoba-updated' } });

      expect(updated?.word).toBe('kotoba-updated');
      expect(updated?.nextDueAt).toBe('2026-02-01T00:00:00.000Z');
    } finally {
      db.close();
    }
  });

  it('deletes a word', () => {
    const db = openTestDb();
    try {
      const inserted = insertWord(db, SAMPLE);
      const removed = deleteWord(db, inserted.id);

      expect(removed).toBe(true);
      expect(getWordById(db, inserted.id)).toBeUndefined();
    } finally {
      db.close();
    }
  });
});

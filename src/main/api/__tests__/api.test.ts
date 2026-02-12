// @vitest-environment node
import { afterEach, describe, expect, test } from 'vitest';

import { createAppContext } from '@main/api/context';
import { buildServer } from '@main/api/server';

describe('Fastify API', () => {
  const servers: { close: () => Promise<void> }[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => server.close()));
  });

  const setupServer = async () => {
    const ctx = createAppContext(':memory:');
    const app = buildServer(ctx);
    await app.ready();
    servers.push({ close: () => app.close() });
    return app;
  };

  test('creates and reads a word with tags and source', async () => {
    const app = await setupServer();

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/words',
      payload: {
        word: '猫',
        reading: 'ねこ',
        contextExpl: 'a domestic cat',
        sceneDesc: '在公园里遇到一只流浪猫。',
        example: 'この猫はとても人懐っこい。',
        difficulty: 'medium',
        tags: ['animal', 'pet'],
        source: { name: 'journal', note: 'daily note' },
        lastReviewAt: '2024-01-01T00:00:00.000Z',
        nextDueAt: '2024-01-01T00:00:00.000Z',
      },
    });

    expect(createRes.statusCode).toBe(201);
    const created = createRes.json();
    expect(created.tags.map((t: { name: string }) => t.name)).toContain('animal');
    expect(created.source?.name).toBe('journal');

    const listRes = await app.inject({ method: 'GET', url: '/api/words?limit=10' });
    const list = listRes.json();
    expect(list.items).toHaveLength(1);
    expect(list.page.total).toBe(1);
  });

  test('applies SM-2 review and updates schedule', async () => {
    const app = await setupServer();

    const wordRes = await app.inject({
      method: 'POST',
      url: '/api/words',
      payload: {
        word: '走る',
        reading: 'はしる',
        contextExpl: 'to run',
        sceneDesc: '朝の公園でジョギングする。',
        example: '毎朝5キロ走る。',
        difficulty: 'hard',
        lastReviewAt: '2024-01-01T00:00:00.000Z',
        nextDueAt: '2024-01-01T00:00:00.000Z',
      },
    });
    const wordId = wordRes.json().id;

    const reviewRes = await app.inject({
      method: 'POST',
      url: `/api/words/${wordId}/review`,
      payload: { difficulty: 'easy', reviewedAt: '2024-01-02T00:00:00.000Z' },
    });

    expect(reviewRes.statusCode).toBe(200);
    const reviewed = reviewRes.json();
    expect(new Date(reviewed.lastReviewAt).toISOString()).toBe('2024-01-02T00:00:00.000Z');
    expect(reviewed.nextDueAt > reviewed.lastReviewAt).toBe(true);
    expect(reviewed.repetition).toBeGreaterThan(0);
  });

  test('bulk import, review queue, and stats overview', async () => {
    const app = await setupServer();

    const bulkRes = await app.inject({
      method: 'POST',
      url: '/api/words/bulk',
      payload: {
        items: [
          {
            word: '水',
            reading: 'みず',
            contextExpl: 'water',
            sceneDesc: 'コンビニでペットボトルを買う。',
            example: '冷たい水を一口飲む。',
            difficulty: 'medium',
            nextDueAt: '2023-12-31T00:00:00.000Z',
          },
          {
            word: '火',
            reading: 'ひ',
            contextExpl: 'fire',
            sceneDesc: '焚き火の周りで話す。',
            example: '火を見ながら暖を取る。',
            difficulty: 'hard',
            nextDueAt: '2024-01-05T00:00:00.000Z',
          },
        ],
      },
    });

    expect(bulkRes.statusCode).toBe(201);
    const bulk = bulkRes.json();
    expect(bulk.count).toBe(2);

    const queueRes = await app.inject({
      method: 'GET',
      url: '/api/review/queue?limit=5&asOf=2024-01-02T00:00:00.000Z',
    });
    const queue = queueRes.json();
    expect(queue.items.length).toBe(1);
    expect(queue.items[0].word).toBe('水');

    const statsRes = await app.inject({ method: 'GET', url: '/api/stats/overview' });
    const stats = statsRes.json();
    expect(stats.totalWords).toBe(2);
    expect(stats.dueCount).toBe(2);
    expect(
      stats.difficultyCounts.hard + stats.difficultyCounts.medium + stats.difficultyCounts.easy
    ).toBe(2);
  });

  test('supports soft delete and restore in library flow', async () => {
    const app = await setupServer();

    const createdRes = await app.inject({
      method: 'POST',
      url: '/api/words',
      payload: {
        word: '海',
        reading: 'うみ',
        contextExpl: 'sea',
        sceneDesc: '海边散步',
        example: '夏に海へ行く。',
        difficulty: 'medium',
      },
    });
    const wordId = createdRes.json().id as number;

    const softDeleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/words/${wordId}`,
    });
    expect(softDeleteRes.statusCode).toBe(200);
    expect(softDeleteRes.json().mode).toBe('soft');

    const listActive = await app.inject({
      method: 'GET',
      url: '/api/words?limit=10',
    });
    expect(listActive.json().items).toHaveLength(0);

    const listDeleted = await app.inject({
      method: 'GET',
      url: '/api/words?limit=10&includeDeleted=true',
    });
    expect(listDeleted.json().items).toHaveLength(1);
    expect(listDeleted.json().items[0].deletedAt).toBeTruthy();

    const restoreRes = await app.inject({
      method: 'POST',
      url: `/api/words/${wordId}/restore`,
    });
    expect(restoreRes.statusCode).toBe(200);
    expect(restoreRes.json().deletedAt).toBeNull();
  });

  test('supports batch operations, import validation, export and tag lifecycle', async () => {
    const app = await setupServer();

    const firstRes = await app.inject({
      method: 'POST',
      url: '/api/words',
      payload: {
        word: '朝',
        reading: 'あさ',
        contextExpl: 'morning',
        sceneDesc: '早晨出门上班',
        example: '朝ごはんを食べる。',
        difficulty: 'medium',
      },
    });
    const secondRes = await app.inject({
      method: 'POST',
      url: '/api/words',
      payload: {
        word: '夜',
        reading: 'よる',
        contextExpl: 'night',
        sceneDesc: '夜晚散步',
        example: '夜に散歩する。',
        difficulty: 'easy',
      },
    });
    const firstId = firstRes.json().id as number;
    const secondId = secondRes.json().id as number;

    const tagCreateRes = await app.inject({
      method: 'POST',
      url: '/api/tags',
      payload: { name: 'time' },
    });
    expect(tagCreateRes.statusCode).toBe(200);
    const tagId = tagCreateRes.json().id as number;

    const tagPatchRes = await app.inject({
      method: 'PATCH',
      url: `/api/tags/${tagId}`,
      payload: { name: 'temporal' },
    });
    expect(tagPatchRes.statusCode).toBe(200);
    expect(tagPatchRes.json().name).toBe('temporal');

    const batchDifficultyRes = await app.inject({
      method: 'POST',
      url: '/api/words/batch',
      payload: {
        action: 'setDifficulty',
        wordIds: [firstId, secondId],
        difficulty: 'hard',
      },
    });
    expect(batchDifficultyRes.statusCode).toBe(200);
    expect(batchDifficultyRes.json().affected).toBe(2);

    const batchTagRes = await app.inject({
      method: 'POST',
      url: '/api/words/batch',
      payload: {
        action: 'addTags',
        wordIds: [firstId, secondId],
        tags: ['temporal'],
      },
    });
    expect(batchTagRes.statusCode).toBe(200);

    const exportRes = await app.inject({
      method: 'GET',
      url: '/api/words/export?limit=10&tag=temporal',
    });
    expect(exportRes.statusCode).toBe(200);
    expect(exportRes.json().count).toBe(2);

    const validateRes = await app.inject({
      method: 'POST',
      url: '/api/words/import/validate',
      payload: {
        items: [
          {
            word: '空',
            reading: 'そら',
            contextExpl: 'sky',
            sceneDesc: '抬头看天空',
            example: '空が青い。',
            difficulty: 'easy',
          },
          { word: 'invalid' },
        ],
      },
    });
    expect(validateRes.statusCode).toBe(200);
    expect(validateRes.json().invalidCount).toBe(1);

    const tagDeleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/tags/${tagId}`,
    });
    expect(tagDeleteRes.statusCode).toBe(200);
    expect(tagDeleteRes.json().deleted).toBe(true);
  });

  test('supports settings read, update, import/export and reset flow', async () => {
    const app = await setupServer();

    const initialRes = await app.inject({ method: 'GET', url: '/api/settings' });
    expect(initialRes.statusCode).toBe(200);
    expect(initialRes.json().settings.review.queueLimit).toBe(30);

    const updateRes = await app.inject({
      method: 'PATCH',
      url: '/api/settings',
      payload: {
        patch: {
          review: { queueLimit: 45 },
          shortcuts: { scoreHard: 'h' },
        },
      },
    });
    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.json().settings.review.queueLimit).toBe(45);
    expect(updateRes.json().settings.shortcuts.scoreHard).toBe('h');

    const sensitiveWithoutConfirm = await app.inject({
      method: 'PATCH',
      url: '/api/settings',
      payload: {
        patch: {
          privacy: { allowNetwork: false },
        },
      },
    });
    expect(sensitiveWithoutConfirm.statusCode).toBe(400);

    const sensitiveWithConfirm = await app.inject({
      method: 'PATCH',
      url: '/api/settings',
      payload: {
        patch: {
          privacy: { allowNetwork: false },
        },
        confirmSensitive: true,
      },
    });
    expect(sensitiveWithConfirm.statusCode).toBe(200);
    expect(sensitiveWithConfirm.json().settings.privacy.allowNetwork).toBe(false);

    const exportRes = await app.inject({
      method: 'GET',
      url: '/api/settings/export',
    });
    expect(exportRes.statusCode).toBe(200);
    expect(exportRes.json().checksum.length).toBeGreaterThan(10);

    const importFailRes = await app.inject({
      method: 'POST',
      url: '/api/settings/import',
      payload: {
        backup: {
          ...exportRes.json(),
          checksum: 'broken',
        },
        confirmOverwrite: true,
      },
    });
    expect(importFailRes.statusCode).toBe(400);

    const resetRes = await app.inject({
      method: 'POST',
      url: '/api/settings/reset',
      payload: { confirm: true },
    });
    expect(resetRes.statusCode).toBe(200);
    expect(resetRes.json().settings.review.queueLimit).toBe(30);

    const backupRes = await app.inject({
      method: 'POST',
      url: '/api/settings/backup',
    });
    expect(backupRes.statusCode).toBe(400);
  });
});

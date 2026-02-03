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
});

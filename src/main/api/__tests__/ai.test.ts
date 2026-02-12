// @vitest-environment node
import { afterEach, describe, expect, test } from 'vitest';

import { createAppContext } from '@main/api/context';
import { buildServer } from '@main/api/server';

describe('AI routes', () => {
  const servers: { close: () => Promise<void> }[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => server.close()));
  });

  const setupServer = async () => {
    const ctx = createAppContext(':memory:');
    const app = buildServer(ctx);
    await app.ready();
    servers.push({ close: () => app.close() });
    return { app, ctx };
  };

  test('lists providers and generates word enrich via mock with persistence', async () => {
    const { app, ctx } = await setupServer();

    const providersRes = await app.inject({ method: 'GET', url: '/api/ai/providers' });
    expect(providersRes.statusCode).toBe(200);
    expect(providersRes.json().items).toContain('mock');

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/words',
      payload: {
        word: 'sakura',
        reading: 'さくら',
        contextExpl: 'Spring cherry blossoms along the river.',
        sceneDesc: 'Two friends planning a hanami picnic.',
        example: '公園で桜を見ながら弁当を食べる。',
        difficulty: 'medium',
        lastReviewAt: '2024-01-01T00:00:00.000Z',
        nextDueAt: '2024-01-01T00:00:00.000Z',
      },
    });
    const wordId = createRes.json().id;

    const aiRes = await app.inject({
      method: 'POST',
      url: '/api/ai/generate',
      payload: {
        scenario: 'wordEnrich',
        provider: 'mock',
        payload: {
          word: 'sakura',
          contextHint: 'Casual chat about cherry blossoms in the park.',
        },
        persist: { wordId, mode: 'overwrite' },
      },
    });

    expect(aiRes.statusCode).toBe(200);
    const body = aiRes.json();
    expect(body.result.reading.length).toBeGreaterThan(0);
    expect(body.persistedWordId).toBe(wordId);

    const wordRes = await app.inject({ method: 'GET', url: `/api/words/${wordId}` });
    expect(wordRes.statusCode).toBe(200);
    expect(wordRes.json().reading).toContain('kana');

    const log = ctx.dbContext.aiRequestRepo.getLatestByTraceId(body.traceId);
    expect(log?.status).toBe('success');
  });

  test('logs errors when provider is misconfigured', async () => {
    const { app, ctx } = await setupServer();
    const aiRes = await app.inject({
      method: 'POST',
      url: '/api/ai/generate',
      payload: {
        scenario: 'exampleOnly',
        provider: 'openai',
        payload: { word: '山' },
      },
    });

    expect(aiRes.statusCode).toBe(502);
    const body = aiRes.json();
    const traceId = body.details?.traceId;
    expect(traceId).toBeDefined();

    const log = traceId ? ctx.dbContext.aiRequestRepo.getLatestByTraceId(traceId) : undefined;
    expect(log?.status).toBe('error');
    expect(log?.provider).toBe('openai');
  });

  test('blocks network providers when privacy setting disables network', async () => {
    const { app } = await setupServer();

    const settingsRes = await app.inject({
      method: 'PATCH',
      url: '/api/settings',
      payload: {
        patch: {
          privacy: { allowNetwork: false },
        },
        confirmSensitive: true,
      },
    });
    expect(settingsRes.statusCode).toBe(200);

    const blockedRes = await app.inject({
      method: 'POST',
      url: '/api/ai/generate',
      payload: {
        scenario: 'exampleOnly',
        provider: 'openai',
        payload: { word: '山' },
      },
    });
    expect(blockedRes.statusCode).toBe(400);

    const allowedRes = await app.inject({
      method: 'POST',
      url: '/api/ai/generate',
      payload: {
        scenario: 'exampleOnly',
        payload: { word: '山' },
      },
    });
    expect(allowedRes.statusCode).toBe(200);
    expect(allowedRes.json().provider).toBe('mock');
  });
});

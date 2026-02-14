import fs from 'node:fs';
import path from 'node:path';

import { createAppContext } from '../src/main/api/context';
import { buildServer } from '../src/main/api/server';

const asNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

async function run() {
  const seedCount = asNumber(process.env.SMOKE_SEED_WORDS, 90);
  const cycles = asNumber(process.env.SMOKE_CYCLES, 120);
  const maxHeapDeltaMb = asNumber(process.env.SMOKE_MAX_HEAP_DELTA_MB, 180);
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';

  const ctx = createAppContext(':memory:');
  const app = buildServer(ctx);

  let failures = 0;
  let reviewOps = 0;
  let queueHits = 0;

  await app.ready();

  const asOf = '2024-03-01T00:00:00.000Z';
  const startHeap = process.memoryUsage().heapUsed;

  try {
    for (let i = 0; i < seedCount; i += 1) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/words',
        payload: {
          word: `smoke-${i}`,
          reading: `smoke-${i}`,
          contextExpl: 'smoke context',
          sceneDesc: 'smoke scene',
          example: 'smoke example',
          difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
          lastReviewAt: '2024-02-01T00:00:00.000Z',
          nextDueAt: '2024-02-01T00:00:00.000Z',
        },
      });

      if (res.statusCode >= 400) {
        failures += 1;
      }
    }

    for (let cycle = 0; cycle < cycles; cycle += 1) {
      const queueRes = await app.inject({
        method: 'GET',
        url: `/api/review/queue?limit=10&asOf=${encodeURIComponent(asOf)}`,
      });
      if (queueRes.statusCode >= 400) {
        failures += 1;
        continue;
      }

      const queue = queueRes.json() as { items?: { id: number }[] };
      const first = queue.items?.[0];
      queueHits += queue.items?.length ?? 0;

      if (first && cycle % 2 === 0) {
        const reviewRes = await app.inject({
          method: 'POST',
          url: `/api/words/${first.id}/review`,
          payload: {
            difficulty: 'medium',
            reviewedAt: asOf,
          },
        });
        if (reviewRes.statusCode >= 400) {
          failures += 1;
        } else {
          reviewOps += 1;
        }
      }

      const statsRes = await app.inject({ method: 'GET', url: '/api/stats/overview' });
      if (statsRes.statusCode >= 400) {
        failures += 1;
      }

      const listRes = await app.inject({
        method: 'GET',
        url: '/api/words?limit=20&offset=0&q=smoke',
      });
      if (listRes.statusCode >= 400) {
        failures += 1;
      }
    }
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
    await app.close();
    ctx.close();
  }

  const endHeap = process.memoryUsage().heapUsed;
  const heapDeltaMb = (endHeap - startHeap) / (1024 * 1024);
  const passed = failures === 0 && heapDeltaMb <= maxHeapDeltaMb;

  const report = {
    generatedAt: new Date().toISOString(),
    seedCount,
    cycles,
    failures,
    reviewOps,
    queueHits,
    heapDeltaMb,
    maxHeapDeltaMb,
    passed,
  };

  const reportPath = path.resolve(process.cwd(), 'reports', 'stability-smoke.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // eslint-disable-next-line no-console
  console.log(`[smoke] Stability report written to ${reportPath}`);

  if (!passed) {
    // eslint-disable-next-line no-console
    console.error('[smoke] Stability check failed', report);
    process.exitCode = 1;
  }
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[smoke] Stability check failed with exception', error);
  process.exit(1);
});

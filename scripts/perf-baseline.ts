import fs from 'node:fs';
import path from 'node:path';

import { createAppContext } from '../src/main/api/context';

type Metric = {
  name: string;
  durationMs: number;
  thresholdMs: number;
  passed: boolean;
};

const asNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toMs = (start: bigint, end: bigint) => Number(end - start) / 1_000_000;

async function run() {
  const seedWords = asNumber(process.env.PERF_SEED_WORDS, 800);
  const queueIterations = asNumber(process.env.PERF_QUEUE_ITERATIONS, 120);
  const searchIterations = asNumber(process.env.PERF_SEARCH_ITERATIONS, 80);
  const reviewIterations = asNumber(process.env.PERF_REVIEW_ITERATIONS, 160);

  const thresholds = {
    seedMs: asNumber(process.env.PERF_THRESHOLD_SEED_MS, 6_000),
    queueMs: asNumber(process.env.PERF_THRESHOLD_QUEUE_MS, 2_500),
    searchMs: asNumber(process.env.PERF_THRESHOLD_SEARCH_MS, 2_000),
    reviewMs: asNumber(process.env.PERF_THRESHOLD_REVIEW_MS, 5_000),
  };

  const ctx = createAppContext(':memory:');
  const wordService = ctx.services.wordService;
  const seedDueAt = '2024-01-01T00:00:00.000Z';
  const reviewAt = '2024-02-01T00:00:00.000Z';

  const metrics: Metric[] = [];

  try {
    let start = process.hrtime.bigint();
    for (let i = 0; i < seedWords; i += 1) {
      wordService.create({
        word: `seed-${i}`,
        reading: `seed-${i}`,
        contextExpl: 'seed context',
        sceneDesc: 'seed scene',
        example: 'seed example',
        difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
        lastReviewAt: seedDueAt,
        nextDueAt: seedDueAt,
      });
    }
    let end = process.hrtime.bigint();
    metrics.push({
      name: 'seed_words',
      durationMs: toMs(start, end),
      thresholdMs: thresholds.seedMs,
      passed: toMs(start, end) <= thresholds.seedMs,
    });

    start = process.hrtime.bigint();
    for (let i = 0; i < queueIterations; i += 1) {
      wordService.queue({ limit: 50, asOf: reviewAt });
    }
    end = process.hrtime.bigint();
    metrics.push({
      name: 'queue_fetch',
      durationMs: toMs(start, end),
      thresholdMs: thresholds.queueMs,
      passed: toMs(start, end) <= thresholds.queueMs,
    });

    start = process.hrtime.bigint();
    for (let i = 0; i < searchIterations; i += 1) {
      wordService.list({
        q: `seed-${i % 10}`,
        limit: 20,
        offset: 0,
        orderBy: 'nextDueAt',
        order: 'asc',
      });
    }
    end = process.hrtime.bigint();
    metrics.push({
      name: 'search_query',
      durationMs: toMs(start, end),
      thresholdMs: thresholds.searchMs,
      passed: toMs(start, end) <= thresholds.searchMs,
    });

    const due = wordService.queue({ limit: reviewIterations, asOf: reviewAt });
    start = process.hrtime.bigint();
    due.forEach((word) => {
      wordService.review(word.id, {
        difficulty: 'medium',
        reviewedAt: reviewAt,
      });
    });
    end = process.hrtime.bigint();
    metrics.push({
      name: 'review_apply',
      durationMs: toMs(start, end),
      thresholdMs: thresholds.reviewMs,
      passed: toMs(start, end) <= thresholds.reviewMs,
    });
  } finally {
    ctx.close();
  }

  const report = {
    generatedAt: new Date().toISOString(),
    seedWords,
    queueIterations,
    searchIterations,
    reviewIterations,
    metrics,
    passed: metrics.every((metric) => metric.passed),
  };

  const reportPath = path.resolve(process.cwd(), 'reports', 'perf-baseline.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // eslint-disable-next-line no-console
  console.log(`[perf] Baseline written to ${reportPath}`);

  if (!report.passed) {
    const failed = metrics.filter((metric) => !metric.passed);
    // eslint-disable-next-line no-console
    console.error('[perf] Threshold exceeded:', failed);
    process.exitCode = 1;
  }
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[perf] Baseline failed', error);
  process.exit(1);
});

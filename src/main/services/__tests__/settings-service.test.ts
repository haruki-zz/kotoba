// @vitest-environment node
import { afterEach, describe, expect, test } from 'vitest';

import { createDbContext } from '@main/db';
import { SettingsService } from '@main/services/settings-service';

const ENV_KEYS = [
  'KOTOBA_FORCE_REVIEW_LIMIT',
  'KOTOBA_FORCE_AI_PROVIDER',
  'KOTOBA_FORCE_THEME',
  'KOTOBA_FORCE_LANGUAGE',
  'KOTOBA_DISABLE_NETWORK',
] as const;

const ORIGINAL_ENV = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

const restoreEnv = () => {
  for (const key of ENV_KEYS) {
    const value = ORIGINAL_ENV[key];
    if (value === undefined) {
      delete process.env[key];
      continue;
    }
    process.env[key] = value;
  }
};

afterEach(() => {
  restoreEnv();
});

describe('SettingsService', () => {
  test('applies runtime overrides and reports shortcut conflicts', () => {
    process.env.KOTOBA_FORCE_REVIEW_LIMIT = '12';
    process.env.KOTOBA_FORCE_AI_PROVIDER = 'gemini';

    const ctx = createDbContext(':memory:');
    const service = new SettingsService(ctx.db, ctx.appMetaRepo, ':memory:');

    service.update({
      review: { queueLimit: 48 },
      shortcuts: {
        scoreHard: 'cmd+k',
        scoreMedium: 'command+k',
      },
    });

    const snapshot = service.getSnapshot();

    expect(snapshot.settings.review.queueLimit).toBe(12);
    expect(snapshot.settings.ai.defaultProvider).toBe('gemini');
    expect(snapshot.settings.shortcuts.scoreHard).toBe('meta+k');
    expect(snapshot.settings.shortcuts.scoreMedium).toBe('meta+k');
    expect(snapshot.meta.runtimeOverrides).toEqual(
      expect.arrayContaining(['KOTOBA_FORCE_REVIEW_LIMIT', 'KOTOBA_FORCE_AI_PROVIDER'])
    );
    expect(snapshot.meta.shortcutConflicts).toEqual([
      {
        binding: 'meta+k',
        actions: ['scoreHard', 'scoreMedium'],
      },
    ]);

    ctx.close();
  });

  test('rejects corrupted backup checksum during import', () => {
    const ctx = createDbContext(':memory:');
    const service = new SettingsService(ctx.db, ctx.appMetaRepo, ':memory:');

    service.update({ review: { queueLimit: 35 } });
    const backup = service.exportSettings();

    expect(() =>
      service.importSettings({
        ...backup,
        checksum: 'tampered-checksum',
      })
    ).toThrowError(/checksum/i);

    ctx.close();
  });

  test('reset removes persisted patch and restores defaults', () => {
    const ctx = createDbContext(':memory:');
    const service = new SettingsService(ctx.db, ctx.appMetaRepo, ':memory:');

    service.update({ review: { queueLimit: 60 }, privacy: { allowNetwork: false } });
    const updated = service.getSnapshot();
    expect(updated.settings.review.queueLimit).toBe(60);
    expect(updated.settings.privacy.allowNetwork).toBe(false);

    const reset = service.reset();
    expect(reset.settings.review.queueLimit).toBe(30);
    expect(reset.settings.privacy.allowNetwork).toBe(true);

    ctx.close();
  });
});

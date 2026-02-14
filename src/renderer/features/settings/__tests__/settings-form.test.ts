import { describe, expect, it } from 'vitest';

import { defaultAppSettings } from '@shared/types';

import { buildPatchFromDiff, hasSensitivePatchChanges } from '../settings-form';

describe('settings-form helpers', () => {
  it('builds a minimal patch from changed fields', () => {
    const next = {
      ...defaultAppSettings,
      review: {
        ...defaultAppSettings.review,
        queueLimit: 40,
      },
      appearance: {
        ...defaultAppSettings.appearance,
        themeMode: 'dark' as const,
      },
    };

    const patch = buildPatchFromDiff(defaultAppSettings, next);

    expect(patch).toEqual({
      appearance: {
        themeMode: 'dark',
      },
      review: {
        queueLimit: 40,
      },
      contentStyle: undefined,
      ai: undefined,
      notifications: undefined,
      privacy: undefined,
      shortcuts: undefined,
    });
  });

  it('detects sensitive privacy changes only', () => {
    expect(hasSensitivePatchChanges({ review: { queueLimit: 50 } })).toBe(false);
    expect(hasSensitivePatchChanges({ privacy: { allowNetwork: false } })).toBe(true);
    expect(hasSensitivePatchChanges({ privacy: { aiRequestLogging: false } })).toBe(true);
  });
});

import { fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { SettingsSnapshot, defaultAppSettings } from '@shared/types';

import { renderWithProviders } from '../../test-utils';
import SettingsPage from '../SettingsPage';

const baseSnapshot: SettingsSnapshot = {
  settings: defaultAppSettings,
  meta: {
    version: 1,
    storageKey: 'settings.user.v1',
    databasePath: '/tmp/kotoba.sqlite',
    backupDirectory: '/tmp/backups',
    runtimeOverrides: [],
    shortcutConflicts: [],
  },
};

describe('SettingsPage', () => {
  beforeEach(() => {
    (global.fetch as unknown as vi.Mock) = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      const url = input.toString();

      if (url.includes('/api/settings') && (!init?.method || init.method === 'GET')) {
        return new Response(JSON.stringify(baseSnapshot), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (url.includes('/api/settings') && init?.method === 'PATCH') {
        const payload = JSON.parse(String(init.body)) as {
          patch?: { review?: { queueLimit?: number } };
        };
        const next = {
          ...baseSnapshot,
          settings: {
            ...baseSnapshot.settings,
            review: {
              ...baseSnapshot.settings.review,
              queueLimit: payload.patch?.review?.queueLimit ?? baseSnapshot.settings.review.queueLimit,
            },
          },
        };

        return new Response(JSON.stringify(next), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (url.includes('/api/settings/reset')) {
        return new Response(JSON.stringify(baseSnapshot), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (url.includes('/api/settings/export')) {
        return new Response(
          JSON.stringify({
            version: 1,
            exportedAt: new Date().toISOString(),
            userSettings: {},
            checksum: 'checksum',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      if (url.includes('/api/settings/backup')) {
        return new Response(
          JSON.stringify({
            backupPath: '/tmp/backups/kotoba.sqlite',
            createdAt: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      if (url.includes('/api/settings/import')) {
        return new Response(JSON.stringify(baseSnapshot), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`Unhandled fetch ${url}`);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads settings and submits update patch', async () => {
    renderWithProviders(<SettingsPage />, { route: '/settings' });

    expect(await screen.findByText('设置与偏好')).toBeInTheDocument();

    const queueInput = screen.getByLabelText('复习队列默认数量') as HTMLInputElement;
    fireEvent.change(queueInput, { target: { value: '40' } });

    fireEvent.click(screen.getByRole('button', { name: '保存设置' }));

    await waitFor(() => {
      const called = (global.fetch as unknown as vi.Mock).mock.calls
        .map((call) => [call[0].toString(), call[1]?.method ?? 'GET'] as const)
        .some(([url, method]) => url.includes('/api/settings') && method === 'PATCH');
      expect(called).toBe(true);
    });
  });
});

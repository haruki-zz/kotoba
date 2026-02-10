import { fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { WordView } from '@shared/types';

import { renderWithProviders } from '../../test-utils';
import LibraryPage from '../LibraryPage';

const sampleWord: WordView = {
  id: 7,
  word: 'michi',
  reading: 'みち',
  contextExpl: '道路、路径',
  sceneDesc: '回家的路上经过便利店。',
  example: 'この道をまっすぐ行く。',
  difficulty: 'medium',
  ef: 2.5,
  intervalDays: 1,
  repetition: 0,
  lastReviewAt: new Date().toISOString(),
  nextDueAt: new Date().toISOString(),
  sourceId: null,
  deletedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tags: [{ id: 1, name: 'daily', description: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
  source: null,
};

describe('LibraryPage', () => {
  beforeEach(() => {
    (global.fetch as unknown as vi.Mock) = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      const url = input.toString();

      if (url.includes('/api/words/batch') && init?.method === 'POST') {
        return new Response(JSON.stringify({ action: 'setDifficulty', affected: 1, missingIds: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (url.includes('/api/words?')) {
        return new Response(
          JSON.stringify({
            items: [sampleWord],
            page: { total: 1, limit: 20, offset: 0, hasMore: false },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (url.includes('/api/tags')) {
        return new Response(
          JSON.stringify([{ id: 1, name: 'daily', description: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (url.includes('/api/stats/overview')) {
        return new Response(
          JSON.stringify({
            totalWords: 1,
            dueCount: 0,
            difficultyCounts: { easy: 0, medium: 1, hard: 0 },
            todayNewCount: 1,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`Unhandled fetch ${url}`);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders library list and triggers batch action', async () => {
    renderWithProviders(<LibraryPage />, { route: '/library' });

    expect(await screen.findByText('michi')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('选择 michi'));
    const batchButton = screen.getByText('批量设为 Easy');

    await waitFor(() => expect(batchButton).not.toBeDisabled());
    fireEvent.click(batchButton);

    await waitFor(() => {
      const called = (global.fetch as unknown as vi.Mock).mock.calls
        .map((call) => [call[0].toString(), call[1]?.method ?? 'GET'] as const)
        .some(([url, method]) => url.includes('/api/words/batch') && method === 'POST');
      expect(called).toBe(true);
    });
  });
});

import { fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { WordView } from '@shared/types';

import { renderWithProviders } from '../../test-utils';
import HomePage from '../HomePage';

const previewWord: WordView = {
  id: 11,
  word: 'aruku',
  reading: 'あるく',
  contextExpl: '走路，步行',
  sceneDesc: '下班后在河边散步。',
  example: '駅までゆっくり歩く。',
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
  tags: [],
  source: null,
};

describe('HomePage', () => {
  beforeEach(() => {
    (global.fetch as unknown as vi.Mock) = vi.fn(async (input: RequestInfo) => {
      const url = input.toString();

      if (url.includes('/api/stats/overview')) {
        return new Response(
          JSON.stringify({
            totalWords: 20,
            dueCount: 5,
            difficultyCounts: { easy: 6, medium: 10, hard: 4 },
            todayNewCount: 2,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (url.includes('/api/review/queue')) {
        return new Response(JSON.stringify({ items: [previewWord] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (url.includes('/api/ai/providers')) {
        return new Response(JSON.stringify({ items: ['mock', 'openai'] }), {
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

  it('renders queue preview and refetches on refresh', async () => {
    renderWithProviders(<HomePage />, { route: '/' });

    expect(await screen.findByText('aruku')).toBeInTheDocument();

    const callsBefore = (global.fetch as unknown as vi.Mock).mock.calls.filter((call) =>
      call[0].toString().includes('/api/review/queue')
    ).length;

    fireEvent.click(screen.getByRole('button', { name: '刷新队列预览' }));

    await waitFor(() => {
      const callsAfter = (global.fetch as unknown as vi.Mock).mock.calls.filter((call) =>
        call[0].toString().includes('/api/review/queue')
      ).length;
      expect(callsAfter).toBeGreaterThan(callsBefore);
    });
  });
});

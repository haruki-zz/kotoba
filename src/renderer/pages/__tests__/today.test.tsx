import { fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { WordView } from '@shared/types';

import { renderWithProviders } from '../../test-utils';
import TodayPage from '../TodayPage';

const sampleWord: WordView = {
  id: 3,
  word: 'kumo',
  reading: 'くも',
  contextExpl: '云',
  sceneDesc: '空に浮かぶ白い雲',
  example: '青空に大きな雲が流れていく。',
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

function mockWordsApi() {
  (global.fetch as unknown as vi.Mock) = vi.fn(async (input: RequestInfo) => {
    const url = input.toString();
    if (url.includes('/words')) {
      return new Response(
        JSON.stringify({
          items: [sampleWord],
          page: { total: 1, limit: 12, offset: 0, hasMore: false },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({
        totalWords: 1,
        dueCount: 1,
        difficultyCounts: { easy: 0, medium: 1, hard: 0 },
        todayNewCount: 0,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  });
}

describe('TodayPage', () => {
  beforeEach(() => {
    mockWordsApi();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders list and triggers search with params', async () => {
    renderWithProviders(<TodayPage />, { route: '/today' });

    expect(await screen.findByText('kumo')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('搜索词或假名'), {
      target: { value: 'sakura' },
    });
    await waitFor(() => {
      const calls = (global.fetch as unknown as vi.Mock).mock.calls.map((call) => call[0].toString());
      const hasQuery = calls.some((url) => url.includes('q=sakura'));
      expect(hasQuery).toBe(true);
    });
  });
});

import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TodayPage from '../TodayPage';
import { renderWithProviders } from '../../test-utils';
import { WordView } from '@shared/types';

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

    await userEvent.type(screen.getByPlaceholderText('搜索词或假名'), 'sakura');
    await userEvent.click(screen.getByText('搜索'));

    const calls = (global.fetch as unknown as vi.Mock).mock.calls.map((call) => call[0].toString());
    const lastCall = calls[calls.length - 1];
    expect(lastCall).toContain('q=sakura');
  });
});

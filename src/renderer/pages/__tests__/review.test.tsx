import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ReviewPage from '../ReviewPage';
import { renderWithProviders } from '../../test-utils';
import { WordView } from '@shared/types';

const baseWord = {
  id: 1,
  word: 'sakura',
  reading: 'さくら',
  contextExpl: '春の花',
  sceneDesc: '公園で桜を眺める場面',
  example: '公園で桜を見ながら友達と話した。',
  difficulty: 'medium',
  ef: 2.5,
  intervalDays: 1,
  repetition: 1,
  lastReviewAt: new Date().toISOString(),
  nextDueAt: new Date().toISOString(),
  sourceId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tags: [],
  source: null,
} satisfies WordView;

const secondWord: WordView = {
  ...baseWord,
  id: 2,
  word: 'yama',
  reading: 'やま',
  difficulty: 'hard',
};

const reviewedWord: WordView = {
  ...baseWord,
  repetition: 2,
  intervalDays: 6,
};

function mockApi() {
  (global.fetch as unknown as vi.Mock) = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
    const url = input.toString();
    if (url.includes('/review/queue')) {
      return new Response(JSON.stringify({ items: [baseWord, secondWord] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.endsWith('/words/1/review')) {
      return new Response(JSON.stringify(reviewedWord), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.endsWith('/words/1') && init?.method === 'PATCH') {
      return new Response(JSON.stringify(baseWord), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.includes('/stats/overview')) {
      return new Response(
        JSON.stringify({
          totalWords: 2,
          dueCount: 2,
          difficultyCounts: { easy: 0, medium: 1, hard: 1 },
          todayNewCount: 0,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    throw new Error(`Unhandled fetch: ${url}`);
  });
}

describe('ReviewPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockApi();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('progresses queue and supports undo', async () => {
    renderWithProviders(<ReviewPage />, { route: '/review' });

    expect(await screen.findByText('sakura')).toBeInTheDocument();

    await userEvent.click(screen.getByText(/Easy · 3/i));
    expect(await screen.findByText('yama')).toBeInTheDocument();

    await userEvent.click(screen.getByText(/回退上一条/));

    await waitFor(() => expect(screen.getByText('sakura')).toBeInTheDocument());
  });
});

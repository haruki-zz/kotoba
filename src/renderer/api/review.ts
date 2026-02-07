import { Difficulty, ReviewRequestInput, WordView } from '@shared/types';

import { apiFetch } from './client';

type ReviewQueueResponse = { items: WordView[] };

export function fetchReviewQueue(limit = 30): Promise<ReviewQueueResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  return apiFetch<ReviewQueueResponse>(`/review/queue?${params.toString()}`);
}

export function submitReview(wordId: number, difficulty: Difficulty, reviewedAt?: string) {
  const body: ReviewRequestInput = {
    difficulty,
    reviewedAt,
  };
  return apiFetch<WordView>(`/words/${wordId}/review`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function undoReviewToSnapshot(snapshot: WordView) {
  // Restore scheduling fields to the snapshot prior to review.
  return apiFetch<WordView>(`/words/${snapshot.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      difficulty: snapshot.difficulty,
      ef: snapshot.ef,
      intervalDays: snapshot.intervalDays,
      repetition: snapshot.repetition,
      lastReviewAt: snapshot.lastReviewAt,
      nextDueAt: snapshot.nextDueAt,
      updatedAt: new Date().toISOString(),
    }),
  });
}

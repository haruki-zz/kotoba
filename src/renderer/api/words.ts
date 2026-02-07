import { WordListQuery, WordListResponse } from '@shared/types';

import { apiFetch } from './client';

export function fetchWords(query: Partial<WordListQuery> = {}): Promise<WordListResponse> {
  const params = new URLSearchParams();
  const entries = Object.entries(query) as [keyof WordListQuery, unknown][];

  entries.forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, String(item)));
    } else {
      params.set(key, String(value));
    }
  });

  const suffix = params.toString();
  const qs = suffix ? `?${suffix}` : '';
  return apiFetch<WordListResponse>(`/words${qs}`);
}

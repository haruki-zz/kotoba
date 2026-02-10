import {
  BulkImportInput,
  ImportValidationResponse,
  WordBatchRequest,
  WordBatchResponse,
  WordDeleteQuery,
  WordExportQuery,
  WordExportResponse,
  WordListQuery,
  WordListResponse,
  WordUpdateWithMetaInput,
  WordView,
} from '@shared/types';

import { apiFetch } from './client';

function build_query_string(query: Record<string, unknown>): string {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, String(item)));
      return;
    }
    params.set(key, String(value));
  });

  const suffix = params.toString();
  return suffix ? `?${suffix}` : '';
}

export function fetchWords(query: Partial<WordListQuery> = {}): Promise<WordListResponse> {
  const qs = build_query_string(query as Record<string, unknown>);
  return apiFetch<WordListResponse>(`/words${qs}`);
}

export function fetchWordById(id: number): Promise<WordView> {
  return apiFetch<WordView>(`/words/${id}`);
}

export function updateWord(id: number, patch: WordUpdateWithMetaInput): Promise<WordView> {
  return apiFetch<WordView>(`/words/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function deleteWord(id: number, query: Partial<WordDeleteQuery> = {}): Promise<{ deleted: boolean; mode: 'soft' | 'hard' }> {
  const qs = build_query_string(query as Record<string, unknown>);
  return apiFetch<{ deleted: boolean; mode: 'soft' | 'hard' }>(`/words/${id}${qs}`, {
    method: 'DELETE',
  });
}

export function restoreWord(id: number): Promise<WordView> {
  return apiFetch<WordView>(`/words/${id}/restore`, {
    method: 'POST',
  });
}

export function bulkImportWords(payload: BulkImportInput): Promise<{ items: WordView[]; count: number }> {
  return apiFetch<{ items: WordView[]; count: number }>('/words/bulk', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function validateWordImport(items: unknown[]): Promise<ImportValidationResponse> {
  return apiFetch<ImportValidationResponse>('/words/import/validate', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export function exportWords(query: Partial<WordExportQuery> = {}): Promise<WordExportResponse> {
  const qs = build_query_string(query as Record<string, unknown>);
  return apiFetch<WordExportResponse>(`/words/export${qs}`);
}

export function batchOperateWords(payload: WordBatchRequest): Promise<WordBatchResponse> {
  return apiFetch<WordBatchResponse>('/words/batch', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

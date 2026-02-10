import { TagCreateInput, TagRecord, TagUpdateInput } from '@shared/types';

import { apiFetch } from './client';

export function fetchTags(): Promise<TagRecord[]> {
  return apiFetch<TagRecord[]>('/tags');
}

export function createTag(payload: TagCreateInput): Promise<TagRecord> {
  return apiFetch<TagRecord>('/tags', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTag(id: number, patch: TagUpdateInput): Promise<TagRecord> {
  return apiFetch<TagRecord>(`/tags/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function deleteTag(id: number): Promise<{ deleted: boolean }> {
  return apiFetch<{ deleted: boolean }>(`/tags/${id}`, {
    method: 'DELETE',
  });
}

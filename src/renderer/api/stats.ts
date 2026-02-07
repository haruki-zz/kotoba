import { StatsOverview } from '@shared/types';

import { apiFetch } from './client';

export function fetchStatsOverview(): Promise<StatsOverview> {
  return apiFetch<StatsOverview>('/stats/overview');
}

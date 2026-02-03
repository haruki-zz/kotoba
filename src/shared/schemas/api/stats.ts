import { z } from 'zod';

import { difficultyEnum } from '../word';

export const statsOverviewSchema = z.object({
  totalWords: z.number().int().nonnegative(),
  dueCount: z.number().int().nonnegative(),
  difficultyCounts: z.record(difficultyEnum, z.number().int().nonnegative()),
  todayNewCount: z.number().int().nonnegative(),
});

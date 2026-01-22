import { WordRecord } from "@kotoba/shared";

import { WordRepository } from "../../db/word-repository.js";

export type StatsSummary = {
  totalWords: number;
  difficultyDistribution: Record<WordRecord["difficulty"], number>;
  dueCount: number;
  overdueCount: number;
  hardSamples: WordRecord[];
  todayNew: number;
  thisWeekNew: number;
};

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const startOfWeek = (date: Date) => {
  const copy = startOfDay(date);
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - (day - 1));
  return copy;
};

export class StatsService {
  constructor(private readonly words: WordRepository) {}

  getSummary(now = new Date()): StatsSummary {
    // limit intentionally generous; follow-up work can add paged aggregation
    const records = this.words.list({ limit: 500, offset: 0 });
    const totalWords = records.length;
    const distribution: StatsSummary["difficultyDistribution"] = {
      easy: 0,
      medium: 0,
      hard: 0,
    };

    const nowMs = now.getTime();
    const todayStart = startOfDay(now).getTime();
    const weekStart = startOfWeek(now).getTime();

    let dueCount = 0;
    let overdueCount = 0;
    let todayNew = 0;
    let thisWeekNew = 0;

    records.forEach((word) => {
      distribution[word.difficulty] += 1;

      if (word.nextDueAt) {
        const dueMs = Date.parse(word.nextDueAt);
        if (!Number.isNaN(dueMs)) {
          if (dueMs <= nowMs) {
            dueCount += 1;
            if (dueMs < nowMs) {
              overdueCount += 1;
            }
          }
        }
      }

      const createdMs = Date.parse(word.createdAt);
      if (!Number.isNaN(createdMs)) {
        if (createdMs >= todayStart) {
          todayNew += 1;
        }
        if (createdMs >= weekStart) {
          thisWeekNew += 1;
        }
      }
    });

    const hardSamples = records
      .filter((word) => word.difficulty === "hard")
      .slice(0, 5);

    return {
      totalWords,
      difficultyDistribution: distribution,
      dueCount,
      overdueCount,
      hardSamples,
      todayNew,
      thisWeekNew,
    };
  }
}

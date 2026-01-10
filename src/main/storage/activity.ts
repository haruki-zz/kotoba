import { DAY_IN_MS } from "../../shared/sm2";
import { ActivityData, ActivityDay } from "../../shared/types";

export const formatDateKey = (timestamp = Date.now()) => new Date(timestamp).toISOString().slice(0, 10);

const addActivityCounts = (activity: ActivityData, date: string, delta: Partial<ActivityDay>): ActivityData => {
  const current = activity.days[date] ?? { added_count: 0, review_count: 0 };

  return {
    days: {
      ...activity.days,
      [date]: {
        added_count: Math.max(0, current.added_count + (delta.added_count ?? 0)),
        review_count: Math.max(0, current.review_count + (delta.review_count ?? 0)),
      },
    },
  };
};

export const recordAddedWord = (activity: ActivityData, date: string) =>
  addActivityCounts(activity, date, { added_count: 1 });

export const recordReviewedWord = (activity: ActivityData, date: string) =>
  addActivityCounts(activity, date, { review_count: 1 });

const asDayNumber = (date: string) => Math.floor(Date.parse(`${date}T00:00:00Z`) / DAY_IN_MS);

export const calculateStreak = (activity: ActivityData): number => {
  const activeDayNumbers = Object.entries(activity.days)
    .filter(([, value]) => value.added_count + value.review_count > 0)
    .map(([date]) => asDayNumber(date))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a);

  if (activeDayNumbers.length === 0) {
    return 0;
  }

  let streak = 1;
  let cursor = activeDayNumbers[0];

  for (let i = 1; i < activeDayNumbers.length; i += 1) {
    const next = activeDayNumbers[i];

    if (next === cursor) {
      continue;
    }

    if (next === cursor - 1) {
      streak += 1;
      cursor = next;
      continue;
    }

    break;
  }

  return streak;
};

export const summarizeActivity = (activity: ActivityData, now = Date.now()) => {
  const todayKey = formatDateKey(now);
  const today: ActivityDay = activity.days[todayKey] ?? { added_count: 0, review_count: 0 };

  return {
    today: {
      ...today,
      total: today.added_count + today.review_count,
    },
    streak: calculateStreak(activity),
  };
};

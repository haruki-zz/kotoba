import { describe, expect, it } from "vitest";
import {
  DAY_IN_MS,
  buildReviewQueue,
  defaultSm2State,
  sortByNextReview,
  updateSm2,
} from "../shared/sm2";
import { Word } from "../shared/types";

const now = Date.UTC(2024, 0, 1);

const createWord = (id: string, nextReviewOffsetDays: number): Word => {
  const baseSm2 = defaultSm2State(now);

  return {
    id,
    term: `term-${id}`,
    kana: `kana-${id}`,
    definition_ja: "definition",
    scene_ja: "scene",
    example_ja: "example",
    created_at: now,
    updated_at: now,
    sm2: { ...baseSm2, next_review_at: now + nextReviewOffsetDays * DAY_IN_MS },
  };
};

describe("updateSm2", () => {
  it("高评分时提升 easiness 并递增复习间隔", () => {
    const initial = defaultSm2State(now);
    const updated = updateSm2(initial, 5, now);

    expect(updated.repetition).toBe(1);
    expect(updated.interval).toBe(1);
    expect(updated.easiness).toBeCloseTo(2.6);
    expect(updated.next_review_at).toBe(now + DAY_IN_MS);
  });

  it("低评分时重置重复次数并夹紧 easiness 下限", () => {
    const updated = updateSm2(
      { repetition: 3, interval: 10, easiness: 1.31, next_review_at: now },
      1,
      now,
    );

    expect(updated.repetition).toBe(0);
    expect(updated.interval).toBe(1);
    expect(updated.easiness).toBe(1.3);
    expect(updated.next_review_at).toBe(now + DAY_IN_MS);
  });

  it("累计复习时根据上一间隔推导新的计划", () => {
    const updated = updateSm2(
      { repetition: 2, interval: 6, easiness: 2.5, next_review_at: now },
      4,
      now,
    );

    expect(updated.repetition).toBe(3);
    expect(updated.interval).toBe(15);
    expect(updated.next_review_at).toBe(now + 15 * DAY_IN_MS);
  });
});

describe("review queue", () => {
  it("只返回到期的词条并按 next_review_at 排序", () => {
    const words = [createWord("a", -1), createWord("b", 2), createWord("c", -2)];
    const queue = buildReviewQueue(words, now);

    expect(queue.map((word) => word.id)).toEqual(["c", "a"]);
  });

  it("当到期时间相同，按更新时间保持稳定顺序", () => {
    const older = createWord("older", 0);
    const newer = { ...createWord("newer", 0), updated_at: now + 1 };
    const sorted = sortByNextReview([newer, older]);

    expect(sorted[0].id).toBe("older");
    expect(sorted[1].id).toBe("newer");
  });
});

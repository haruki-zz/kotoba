import { describe, expect, it } from "vitest";
import { MIN_EASINESS, defaultSm2State } from "../shared/sm2";
import { normalizeActivityData, normalizeWord, normalizeWordsFile } from "../shared/validation";

const now = Date.UTC(2024, 5, 1);

describe("normalizeWord", () => {
  it("填充缺失的 sm2 与时间字段", () => {
    const normalized = normalizeWord(
      {
        id: "1",
        term: "term",
        kana: "kana",
        definition_ja: "definition",
        scene_ja: "scene",
        example_ja: "example",
      },
      now,
    );

    expect(normalized.sm2).toEqual(defaultSm2State(now));
    expect(normalized.created_at).toBe(now);
    expect(normalized.updated_at).toBe(now);
  });

  it("保留部分 sm2 字段并夹紧易记度下限", () => {
    const normalized = normalizeWord(
      {
        id: "2",
        term: "term",
        kana: "kana",
        definition_ja: "definition",
        scene_ja: "scene",
        example_ja: "example",
        created_at: now - 5000,
        sm2: { repetition: 2, easiness: 1.1, next_review_at: now - 1000 },
      },
      now,
    );

    expect(normalized.sm2.repetition).toBe(2);
    expect(normalized.sm2.interval).toBe(0);
    expect(normalized.sm2.easiness).toBe(MIN_EASINESS);
    expect(normalized.sm2.next_review_at).toBe(now - 1000);
    expect(normalized.created_at).toBe(now - 5000);
    expect(normalized.updated_at).toBe(now);
  });
});

describe("normalizeWordsFile", () => {
  it("words 字段不是数组时抛出错误", () => {
    expect(() => normalizeWordsFile({ words: "not-array" }, now)).toThrow(/words 数据格式非法/);
  });
});

describe("normalizeActivityData", () => {
  it("当 days 缺失时返回空映射", () => {
    expect(normalizeActivityData({}).days).toEqual({});
  });

  it("负值会被重置为 0", () => {
    const data = normalizeActivityData({
      days: { "2024-01-01": { added_count: 3, review_count: -5 } },
    });

    expect(data.days["2024-01-01"]).toEqual({ added_count: 3, review_count: 0 });
  });

  it("非法 days 结构抛出错误", () => {
    expect(() => normalizeActivityData({ days: "invalid" })).toThrow(/activity\.days 需为对象映射/);
  });
});

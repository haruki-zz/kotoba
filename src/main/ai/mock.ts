import { AiProvider } from "./types";
import { normalizeTerm } from "./utils";

export const createMockProvider = (): AiProvider => ({
  name: "mock",
  async generateWordCard(term: string) {
    const normalizedTerm = normalizeTerm(term);

    return {
      term: normalizedTerm,
      kana: `${normalizedTerm} かな`,
      definition_ja: `${normalizedTerm} の意味`,
      scene_ja: `${normalizedTerm} を使った情景`,
      example_ja: `${normalizedTerm} を学びます。`,
    };
  },
});

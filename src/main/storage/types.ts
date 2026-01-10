import { ActivityDay, Sm2State } from "../../shared/types";

export interface WordDraft {
  id?: string;
  term: string;
  kana: string;
  definition_ja: string;
  scene_ja: string;
  example_ja: string;
  sm2?: Partial<Sm2State>;
  created_at?: number;
  updated_at?: number;
}

export interface WordUpdate {
  term?: string;
  kana?: string;
  definition_ja?: string;
  scene_ja?: string;
  example_ja?: string;
  sm2?: Partial<Sm2State>;
  updated_at?: number;
}

export interface ActivitySummary {
  today: ActivityDay & { total: number };
  streak: number;
}

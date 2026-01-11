export type ReviewRating = 0 | 1 | 2 | 3 | 4 | 5;

export interface Sm2State {
  repetition: number;
  interval: number;
  easiness: number;
  next_review_at: number;
}

export interface Word {
  id: string;
  term: string;
  kana: string;
  definition_ja: string;
  scene_ja: string;
  example_ja: string;
  created_at: number;
  updated_at: number;
  sm2: Sm2State;
}

export interface WordsFile {
  words: Word[];
}

export interface ReviewLogEntry {
  word_id: string;
  grade: ReviewRating;
  reviewed_at: number;
}

export interface ActivityDay {
  added_count: number;
  review_count: number;
}

export interface ActivityData {
  days: Record<string, ActivityDay>;
}

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

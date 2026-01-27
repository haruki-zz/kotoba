export type Difficulty = 'easy' | 'medium' | 'hard';

export interface WordRecord {
  id?: number;
  word: string;
  reading: string;
  contextExpl: string;
  sceneDesc: string;
  example: string;
  difficulty: Difficulty;
  ef: number;
  intervalDays: number;
  repetition: number;
  lastReviewAt: string;
  nextDueAt: string;
  createdAt: string;
  updatedAt: string;
}

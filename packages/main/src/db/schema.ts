export const createWordsTable = `
CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL,
  reading TEXT NOT NULL,
  context_expl TEXT NOT NULL,
  scene_desc TEXT NOT NULL,
  example TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  ef REAL NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 0,
  repetition INTEGER NOT NULL DEFAULT 0,
  last_review_at TEXT NOT NULL,
  next_due_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_words_next_due_at ON words(next_due_at);
`;

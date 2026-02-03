import { Migration } from './types';

export const migration001: Migration = {
  id: 1,
  name: 'init-words-tags-sources',
  statements: [
    `CREATE TABLE IF NOT EXISTS sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      url TEXT,
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );`,
    `CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );`,
    `CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL,
      reading TEXT NOT NULL,
      context_expl TEXT NOT NULL,
      scene_desc TEXT NOT NULL,
      example TEXT NOT NULL,
      difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
      ef REAL NOT NULL DEFAULT 2.5 CHECK (ef >= 1.3),
      interval_days INTEGER NOT NULL DEFAULT 1 CHECK (interval_days >= 1),
      repetition INTEGER NOT NULL DEFAULT 0 CHECK (repetition >= 0),
      last_review_at TEXT NOT NULL DEFAULT (datetime('now')),
      next_due_at TEXT NOT NULL DEFAULT (datetime('now')),
      source_id INTEGER NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE SET NULL
    );`,
    `CREATE TABLE IF NOT EXISTS word_tags (
      word_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (word_id, tag_id),
      FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );`,
    `CREATE INDEX IF NOT EXISTS idx_words_next_due_at ON words(next_due_at);`,
    `CREATE INDEX IF NOT EXISTS idx_words_difficulty ON words(difficulty);`,
    `CREATE INDEX IF NOT EXISTS idx_words_lookup ON words(word, reading);`,
    `CREATE INDEX IF NOT EXISTS idx_word_tags_word ON word_tags(word_id);`,
    `CREATE INDEX IF NOT EXISTS idx_word_tags_tag ON word_tags(tag_id);`,
  ],
};

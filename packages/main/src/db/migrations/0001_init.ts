import { difficultyValues, EF_DEFAULT, EF_MIN } from "@kotoba/shared";

import type { Migration } from "../migrator";

export const migration_0001: Migration = {
  id: "0001_init_words",
  name: "initialize words table",
  up: (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL,
        reading TEXT,
        context_expl TEXT,
        scene_desc TEXT,
        example TEXT,
        difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN (${difficultyValues
          .map((value) => `'${value}'`)
          .join(", ")})),
        ef REAL NOT NULL DEFAULT ${EF_DEFAULT} CHECK (ef >= ${EF_MIN}),
        interval_days INTEGER NOT NULL DEFAULT 0,
        repetition INTEGER NOT NULL DEFAULT 0,
        last_review_at TEXT,
        next_due_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    db.exec(
      `CREATE INDEX IF NOT EXISTS idx_words_next_due_at ON words (next_due_at)`,
    );
    db.exec(
      `CREATE INDEX IF NOT EXISTS idx_words_difficulty ON words (difficulty)`,
    );
  },
};

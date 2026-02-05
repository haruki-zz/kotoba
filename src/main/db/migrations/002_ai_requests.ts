import { Migration } from './types';

export const migration002: Migration = {
  id: 2,
  name: 'ai-requests-log',
  statements: [
    `CREATE TABLE IF NOT EXISTS ai_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trace_id TEXT NOT NULL,
      scenario TEXT NOT NULL,
      provider TEXT NOT NULL,
      word_id INTEGER NULL,
      input_json TEXT NOT NULL,
      output_json TEXT NULL,
      status TEXT NOT NULL CHECK (status IN ('success','error')),
      error_message TEXT,
      latency_ms INTEGER NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE SET NULL
    );`,
    `CREATE INDEX IF NOT EXISTS idx_ai_requests_word ON ai_requests(word_id);`,
    `CREATE INDEX IF NOT EXISTS idx_ai_requests_created_at ON ai_requests(created_at);`,
    `CREATE INDEX IF NOT EXISTS idx_ai_requests_trace ON ai_requests(trace_id);`,
  ],
};

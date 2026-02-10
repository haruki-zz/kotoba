import { Migration } from './types';

export const migration003: Migration = {
  id: 3,
  name: 'words-soft-delete',
  statements: [
    `ALTER TABLE words ADD COLUMN deleted_at TEXT NULL;`,
    `CREATE INDEX IF NOT EXISTS idx_words_deleted_at ON words(deleted_at);`,
  ],
};

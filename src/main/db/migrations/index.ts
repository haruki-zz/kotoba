import BetterSqlite3 from 'better-sqlite3';

import { migration001 } from './001_init';
import { migration002 } from './002_ai_requests';
import { migration003 } from './003_soft_delete_words';
import { Migration } from './types';

const MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

const migrations: Migration[] = [migration001, migration002, migration003];

type Db = BetterSqlite3.Database;

const ensureMigrationsTable = (db: Db) => {
  db.exec(MIGRATIONS_TABLE);
};

export const runMigrations = (db: Db) => {
  ensureMigrationsTable(db);
  const appliedRows = db.prepare('SELECT id FROM migrations').all() as { id: number }[];
  const applied = new Set(appliedRows.map((row) => row.id));

  const apply = db.transaction((migration: Migration) => {
    migration.statements.forEach((sql) => {
      db.prepare(sql).run();
    });
    db.prepare('INSERT INTO migrations (id, name) VALUES (?, ?)').run(migration.id, migration.name);
  });

  migrations.forEach((migration) => {
    if (!applied.has(migration.id)) {
      apply(migration);
    }
  });
};

export const getPendingMigrations = (db: Db) => {
  ensureMigrationsTable(db);
  const appliedRows = db.prepare('SELECT id FROM migrations').all() as { id: number }[];
  const applied = new Set(appliedRows.map((row) => row.id));
  return migrations.filter((migration) => !applied.has(migration.id));
};

export const migrationList = migrations;

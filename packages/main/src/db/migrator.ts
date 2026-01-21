import type { SqliteDatabase } from "./connection";

export type Migration = {
  id: string;
  name: string;
  up: (db: SqliteDatabase) => void;
};

const ensureMigrationsTable = (db: SqliteDatabase) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);
};

const getAppliedMigrationIds = (db: SqliteDatabase) => {
  const rows = db
    .prepare(`SELECT id FROM _migrations ORDER BY applied_at ASC`)
    .all() as { id: string }[];
  return new Set(rows.map((row) => row.id));
};

export const applyMigrations = (
  db: SqliteDatabase,
  migrations: Migration[],
) => {
  ensureMigrationsTable(db);
  const applied = getAppliedMigrationIds(db);
  const recordRun = db.transaction((migration: Migration) => {
    migration.up(db);
    db.prepare(
      `INSERT INTO _migrations (id, name, applied_at) VALUES (?, ?, ?)`,
    ).run(migration.id, migration.name, new Date().toISOString());
  });

  migrations.forEach((migration) => {
    if (applied.has(migration.id)) {
      return;
    }
    recordRun(migration);
  });
};

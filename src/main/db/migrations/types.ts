import BetterSqlite3 from 'better-sqlite3';

export interface Migration {
  id: number;
  name: string;
  statements: string[];
}

export type MigrationRunner = (db: BetterSqlite3.Database) => void;

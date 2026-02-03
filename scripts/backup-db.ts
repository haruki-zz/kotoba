import fs from 'node:fs';
import path from 'node:path';
import { getDatabasePath } from '../src/main/db';

const dbPath = getDatabasePath();

if (!fs.existsSync(dbPath)) {
  // eslint-disable-next-line no-console
  console.error(`[kotoba] Database not found at ${dbPath}. Nothing to back up.`);
  process.exit(1);
}

const backupDir = path.join(path.dirname(dbPath), 'backups');
fs.mkdirSync(backupDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:]/g, '-');
const targetPath = path.join(backupDir, `kotoba-${timestamp}.sqlite`);

fs.copyFileSync(dbPath, targetPath);

// eslint-disable-next-line no-console
console.log(`[kotoba] Backup created at ${targetPath}`);

import { createDbContext, getPendingMigrations, migrationList } from '../src/main/db';

const { db, close } = createDbContext();
const pending = getPendingMigrations(db);

if (pending.length === 0) {
  // eslint-disable-next-line no-console
  console.log('[kotoba] No pending migrations. Database is up to date.');
} else {
  // eslint-disable-next-line no-console
  console.log(
    `[kotoba] Applying ${pending.length} pending migration(s): ${pending
      .map((m) => m.name)
      .join(', ')}`
  );
  pending.forEach((migration) => {
    // Each migration will be applied by createDbContext/runMigrations already.
    // This loop is only to mirror applied order in output.
    // eslint-disable-next-line no-console
    console.log(` - ${migration.id}: ${migration.name}`);
  });
}

// eslint-disable-next-line no-console
console.log(`[kotoba] Total migrations known: ${migrationList.length}`);
close();

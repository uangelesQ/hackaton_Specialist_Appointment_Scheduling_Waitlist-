import { createDb, DEFAULT_DB_FILE } from './connection.js';
import { migrateLatest } from './migrate.js';

const db = createDb(process.env.DATABASE_FILE ?? DEFAULT_DB_FILE);
try {
  await migrateLatest(db);
  console.log('Migrations applied');
} finally {
  await db.destroy();
}

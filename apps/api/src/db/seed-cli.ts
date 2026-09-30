import { createDb, DEFAULT_DB_FILE } from './connection.js';
import { migrateLatest } from './migrate.js';
import { seedDatabase } from './seed.js';

const db = createDb(process.env.DATABASE_FILE ?? DEFAULT_DB_FILE);
try {
  await migrateLatest(db);
  await seedDatabase(db);
  const count = async (table: string) => Number((await db(table).count({ n: '*' }).first())?.n);
  console.log(
    `Seeded: ${await count('specialist')} specialist, ${await count('patients')} patients, ${await count('staff')} staff`,
  );
} finally {
  await db.destroy();
}

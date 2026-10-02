import { createDb, DEFAULT_DB_FILE } from './connection.js';
import { migrateLatest } from './migrate.js';
import { seedDatabase, seedDemoWaitlist } from './seed.js';

const db = createDb(process.env.DATABASE_FILE ?? DEFAULT_DB_FILE);
try {
  await migrateLatest(db);
  await seedDatabase(db);
  await seedDemoWaitlist(db);
  const count = async (table: string, where: object = {}) => Number((await db(table).where(where).count({ n: '*' }).first())?.n);
  console.log(
    `Seeded: ${await count('specialist')} specialist, ${await count('patients')} patients, ${await count('staff')} staff, ` +
      `${await count('waitlist_entries', { status: 'waiting' })} already waiting`,
  );
} finally {
  await db.destroy();
}

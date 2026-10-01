import { createApp } from './app.js';
import { createDb, DEFAULT_DB_FILE } from './db/connection.js';
import { migrateLatest } from './db/migrate.js';
import { seedDatabase } from './db/seed.js';

const demoLogin = process.env.DEMO_LOGIN === 'true';
const port = Number(process.env.PORT ?? 3001);

// A real secret is mandatory; the built-in one exists only so the demo runs with no setup.
const jwtSecret = process.env.JWT_SECRET ?? (demoLogin ? 'demo-only-secret' : undefined);
if (!jwtSecret) {
  console.error('JWT_SECRET is required unless DEMO_LOGIN=true');
  process.exit(1);
}

const db = createDb(process.env.DATABASE_FILE ?? DEFAULT_DB_FILE);
await migrateLatest(db);
if (demoLogin) await seedDatabase(db);

createApp({ db, jwtSecret, demoLogin }).listen(port, () => {
  console.log(`API listening on http://localhost:${port}${demoLogin ? ' (demo login enabled)' : ''}`);
});

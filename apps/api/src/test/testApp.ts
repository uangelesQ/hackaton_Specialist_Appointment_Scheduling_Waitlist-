import type { Server } from 'node:http';
import type { Knex } from 'knex';
import { createApp } from '../app.js';
import { signToken } from '../auth/auth.js';
import { createDb } from '../db/connection.js';
import { migrateLatest } from '../db/migrate.js';
import { seedDatabase } from '../db/seed.js';
import { createRepositories, type Clock } from '../repositories/index.js';
import { close, listen } from './server.js';

export const TEST_SECRET = 'test-secret';

export interface TestApp {
  /** A listening server; pass it to supertest's `request()`. */
  app: Server;
  db: Knex;
  patient: (id: number) => string;
  staff: (id: number) => string;
  bearer: (token: string) => string;
  /** The app's clock, so anything seeded directly shares its timeline and FIFO order stays meaningful. */
  clock: Clock;
  /**
   * Puts a patient on the waitlist the way the demo seed does, bypassing the preference gate. This is how a
   * patient with no recorded preference can be waiting: they joined before a choice was required (BR-019).
   * Returns the entry id.
   */
  addLegacyEntry: (patientId: number) => Promise<number>;
  /** Stops the server and closes the database. Call from `afterEach`. */
  close: () => Promise<void>;
}

/** An app over a fresh seeded in-memory database. Each clock call is one minute later. */
export async function buildTestApp(options: { demoLogin?: boolean } = {}): Promise<TestApp> {
  let tick = 0;
  const clock = () => new Date(Date.UTC(2026, 9, 1, 9, tick++)).toISOString();

  const db = createDb(':memory:');
  await migrateLatest(db);
  await seedDatabase(db);

  const server = await listen(createApp({ db, jwtSecret: TEST_SECRET, clock, demoLogin: options.demoLogin ?? true }));

  return {
    app: server,
    db,
    patient: (id) => signToken({ role: 'patient', id }, TEST_SECRET),
    staff: (id) => signToken({ role: 'staff', id }, TEST_SECRET),
    bearer: (token) => `Bearer ${token}`,
    clock,
    addLegacyEntry: async (patientId) => {
      const repos = createRepositories(db, clock);
      const entry = await repos.entries.create({ patientId, createdByType: 'staff', createdById: 1 });
      await repos.audit.record({ action: 'entry_created', entryId: entry.id, actorType: 'staff', actorId: 1 });
      return entry.id;
    },
    close: async () => {
      await close(server);
      await db.destroy();
    },
  };
}

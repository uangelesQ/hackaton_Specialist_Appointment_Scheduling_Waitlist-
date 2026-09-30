import type { Knex } from 'knex';
import { migrationSource } from './migrations.js';

export async function migrateLatest(db: Knex): Promise<void> {
  await db.migrate.latest({ migrationSource });
}

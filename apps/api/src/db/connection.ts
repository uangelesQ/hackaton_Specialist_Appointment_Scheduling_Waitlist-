import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import knex, { type Knex } from 'knex';

export const DEFAULT_DB_FILE = 'data/waitlist.db';

export function createDb(filename: string): Knex {
  const inMemory = filename === ':memory:';
  if (!inMemory) {
    mkdirSync(dirname(filename), { recursive: true });
  }
  return knex({
    client: 'better-sqlite3',
    connection: { filename },
    useNullAsDefault: true,
    // An in-memory database exists per connection, so keep a single one.
    pool: {
      min: 1,
      max: inMemory ? 1 : 4,
      afterCreate: (conn: { pragma: (sql: string) => unknown }, done: (err: Error | null, conn: unknown) => void) => {
        conn.pragma('foreign_keys = ON');
        done(null, conn);
      },
    },
  });
}

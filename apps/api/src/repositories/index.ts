import type { Knex } from 'knex';
import { auditRepository } from './audit.js';
import { entryRepository } from './entries.js';
import { offerRepository } from './offers.js';
import { patientRepository } from './patients.js';
import { slotRepository } from './slots.js';
import { specialistRepository } from './specialist.js';
import { staffRepository } from './staff.js';
import type { Clock } from './types.js';

export type * from './types.js';

const systemClock: Clock = () => new Date().toISOString();

export function createRepositories(db: Knex | Knex.Transaction, clock: Clock = systemClock) {
  return {
    patients: patientRepository(db),
    specialist: specialistRepository(db),
    staff: staffRepository(db),
    entries: entryRepository(db, clock),
    slots: slotRepository(db),
    offers: offerRepository(db, clock),
    audit: auditRepository(db, clock),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;

/**
 * Runs `work` with repositories bound to one transaction. Everything the callback writes
 * commits together, or rolls back together if it throws.
 */
export function withTransaction<T>(
  db: Knex,
  work: (repositories: Repositories) => Promise<T>,
  clock: Clock = systemClock,
): Promise<T> {
  return db.transaction((trx) => work(createRepositories(trx, clock)));
}

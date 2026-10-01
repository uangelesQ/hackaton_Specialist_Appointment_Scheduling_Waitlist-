import type { Knex } from 'knex';

// Fictional demo data. Fixed ids make the seed safe to run more than once.
const SPECIALIST = { id: 1, name: 'Dr. Elena Ruiz', clinic: 'Dermatology' };

const PATIENTS = [
  { id: 1, full_name: 'Ana Torres' },
  { id: 2, full_name: 'Ben Carter' },
  { id: 3, full_name: 'Chloe Nguyen' },
  { id: 4, full_name: 'David Okafor' },
  { id: 5, full_name: 'Eva Lindqvist' },
];

const STAFF = [
  { id: 1, full_name: 'Sam Patel', specialist_id: SPECIALIST.id },
  { id: 2, full_name: 'Maria Gomez', specialist_id: SPECIALIST.id },
];

export async function seedDatabase(db: Knex): Promise<void> {
  await db.transaction(async (trx) => {
    await trx('specialist').insert(SPECIALIST).onConflict('id').merge();
    await trx('patients').insert(PATIENTS).onConflict('id').merge();
    await trx('staff').insert(STAFF).onConflict('id').merge();
  });
}

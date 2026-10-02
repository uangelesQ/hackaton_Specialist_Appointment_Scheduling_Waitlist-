import type { Knex } from 'knex';
import { withTransaction, type Clock } from '../repositories/index.js';

// Fictional demo data following the V3 walkthrough. Fixed ids make the seed safe to run more than once.
const SPECIALIST = { id: 1, name: 'Dr. Elena Ruiz', clinic: 'Cardiology' };

// A null preference means "not recorded". Sofía Reyes is deliberately not seeded: she is the
// person who is not registered in hospital records.
const PATIENTS = [
  { id: 1, full_name: 'Maria Gómez', contact_preference: 'in_app' },
  { id: 2, full_name: 'Diego Herrera', contact_preference: 'in_app' },
  { id: 3, full_name: 'Valeria Tapia', contact_preference: 'in_app' },
  { id: 4, full_name: 'Carlos Mendoza', contact_preference: 'telephone' },
  { id: 5, full_name: 'Ana Torres', contact_preference: null },
  { id: 6, full_name: 'Jorge Ramírez', contact_preference: 'telephone' },
];

const STAFF = [
  { id: 1, full_name: 'Ricardo Salazar', specialist_id: SPECIALIST.id },
  { id: 2, full_name: 'Guadalupe Ortega', specialist_id: SPECIALIST.id },
];

/** People only. The waitlist starts empty so tests and fresh installs have a clean slate. */
export async function seedDatabase(db: Knex): Promise<void> {
  await db.transaction(async (trx) => {
    await trx('specialist').insert(SPECIALIST).onConflict('id').merge();
    await trx('patients').insert(PATIENTS).onConflict('id').merge();
    await trx('staff').insert(STAFF).onConflict('id').merge();
  });
}

// The V3 walkthrough starts with Carlos (telephone) and then Ana (not recorded) already waiting.
const DEMO_WAITING_PATIENT_IDS = [4, 5];

/**
 * The walkthrough's starting waitlist: Carlos then Ana, added by the first staff member.
 * Called only by the seed command, never by `seedDatabase`. Safe to run twice: anyone who is
 * already on the waitlist is left alone.
 */
export async function seedDemoWaitlist(db: Knex, clock?: Clock): Promise<void> {
  const staff = STAFF[0];
  if (!staff) throw new Error('No staff seeded');

  await withTransaction(
    db,
    async (repos) => {
      for (const patientId of DEMO_WAITING_PATIENT_IDS) {
        if (await repos.entries.findActiveByPatient(patientId)) continue;
        const entry = await repos.entries.create({ patientId, createdByType: 'staff', createdById: staff.id });
        await repos.audit.record({ action: 'entry_created', entryId: entry.id, actorType: 'staff', actorId: staff.id });
      }
    },
    clock,
  );
}

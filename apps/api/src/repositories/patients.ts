import type { Knex } from 'knex';
import type { ContactPreference } from '@waitlist/shared';

export interface PatientRecord {
  id: number;
  fullName: string;
  /** How the patient asked to be reached; null means not recorded. */
  contactPreference: ContactPreference | null;
}

interface PatientRow {
  id: number;
  full_name: string;
  contact_preference: ContactPreference | null;
}

const toRecord = (row: PatientRow): PatientRecord => ({
  id: row.id,
  fullName: row.full_name,
  contactPreference: row.contact_preference,
});

export function patientRepository(db: Knex | Knex.Transaction) {
  return {
    async exists(id: number): Promise<boolean> {
      const row = await db('patients').where({ id }).first('id');
      return row !== undefined;
    },

    async findById(id: number): Promise<PatientRecord | undefined> {
      const row: PatientRow | undefined = await db('patients').where({ id }).first();
      return row && toRecord(row);
    },

    async list(): Promise<PatientRecord[]> {
      const rows: PatientRow[] = await db('patients').orderBy('id');
      return rows.map(toRecord);
    },

    /**
     * The patient's recorded contact preference: `null` when none is recorded, `undefined` when
     * there is no such patient. The two are different, so callers must not collapse them.
     */
    async preferenceOf(id: number): Promise<ContactPreference | null | undefined> {
      const row: { contact_preference: ContactPreference | null } | undefined = await db('patients')
        .where({ id })
        .first('contact_preference');
      return row === undefined ? undefined : row.contact_preference;
    },

    /** Patient records keyed by id. Unknown ids are simply absent. */
    async byIds(ids: readonly number[]): Promise<Map<number, PatientRecord>> {
      const rows: PatientRow[] = await db('patients').whereIn('id', [...ids]);
      return new Map(rows.map((row) => [row.id, toRecord(row)]));
    },
  };
}

import type { Knex } from 'knex';

export interface SpecialistRecord {
  id: number;
  name: string;
  clinic: string;
}

/** The deployment has exactly one specialist; this returns that row. */
export function specialistRepository(db: Knex | Knex.Transaction) {
  return {
    async get(): Promise<SpecialistRecord> {
      const row: SpecialistRecord | undefined = await db('specialist').first();
      if (!row) throw new Error('No specialist configured');
      return row;
    },
  };
}

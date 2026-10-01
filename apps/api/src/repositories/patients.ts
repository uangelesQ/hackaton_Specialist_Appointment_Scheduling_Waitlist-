import type { Knex } from 'knex';

export function patientRepository(db: Knex | Knex.Transaction) {
  return {
    async exists(id: number): Promise<boolean> {
      const row = await db('patients').where({ id }).first('id');
      return row !== undefined;
    },
  };
}

import type { Knex } from 'knex';

export function patientRepository(db: Knex | Knex.Transaction) {
  return {
    async exists(id: number): Promise<boolean> {
      const row = await db('patients').where({ id }).first('id');
      return row !== undefined;
    },

    /** Display names keyed by patient id. Unknown ids are simply absent. */
    async namesByIds(ids: readonly number[]): Promise<Map<number, string>> {
      const rows: { id: number; full_name: string }[] = await db('patients').whereIn('id', [...ids]).select('id', 'full_name');
      return new Map(rows.map((row) => [row.id, row.full_name]));
    },
  };
}

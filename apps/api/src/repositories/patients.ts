import type { Knex } from 'knex';

export function patientRepository(db: Knex | Knex.Transaction) {
  return {
    async exists(id: number): Promise<boolean> {
      const row = await db('patients').where({ id }).first('id');
      return row !== undefined;
    },

    async findById(id: number): Promise<{ id: number; fullName: string } | undefined> {
      const row: { id: number; full_name: string } | undefined = await db('patients').where({ id }).first();
      return row && { id: row.id, fullName: row.full_name };
    },

    async list(): Promise<{ id: number; fullName: string }[]> {
      const rows: { id: number; full_name: string }[] = await db('patients').orderBy('id');
      return rows.map((row) => ({ id: row.id, fullName: row.full_name }));
    },

    /** Display names keyed by patient id. Unknown ids are simply absent. */
    async namesByIds(ids: readonly number[]): Promise<Map<number, string>> {
      const rows: { id: number; full_name: string }[] = await db('patients').whereIn('id', [...ids]).select('id', 'full_name');
      return new Map(rows.map((row) => [row.id, row.full_name]));
    },
  };
}

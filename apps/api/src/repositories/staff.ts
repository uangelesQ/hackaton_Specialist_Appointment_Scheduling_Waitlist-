import type { Knex } from 'knex';

export interface StaffRecord {
  id: number;
  fullName: string;
}

export function staffRepository(db: Knex | Knex.Transaction) {
  return {
    async findById(id: number): Promise<StaffRecord | undefined> {
      const row: { id: number; full_name: string } | undefined = await db('staff').where({ id }).first();
      return row && { id: row.id, fullName: row.full_name };
    },

    async list(): Promise<StaffRecord[]> {
      const rows: { id: number; full_name: string }[] = await db('staff').orderBy('id');
      return rows.map((row) => ({ id: row.id, fullName: row.full_name }));
    },
  };
}

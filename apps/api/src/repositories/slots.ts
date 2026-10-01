import type { Knex } from 'knex';
import type { SlotRecord, SlotStatus } from './types.js';

interface SlotRow {
  id: number;
  starts_at: string;
  status: SlotStatus;
}

const toRecord = (row: SlotRow): SlotRecord => ({ id: row.id, startsAt: row.starts_at, status: row.status });

export function slotRepository(db: Knex | Knex.Transaction) {
  const table = () => db<SlotRow>('slots');

  return {
    async create(startsAt: string): Promise<SlotRecord> {
      const [row] = await table().insert({ starts_at: startsAt, status: 'open' }).returning('*');
      return toRecord(row as SlotRow);
    },

    async findById(id: number): Promise<SlotRecord | undefined> {
      const row = await table().where({ id }).first();
      return row && toRecord(row);
    },

    /** The returned slot waiting to be released again, if any. There is at most one at a time. */
    async findOpen(): Promise<SlotRecord | undefined> {
      const row = await table().where({ status: 'open' }).orderBy('id').first();
      return row && toRecord(row);
    },

    async setStatus(id: number, status: SlotStatus): Promise<void> {
      await table().where({ id }).update({ status });
    },
  };
}

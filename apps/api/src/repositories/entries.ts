import type { Knex } from 'knex';
import type { EntryStatus } from '@waitlist/shared';
import type { ActorType, Clock, EntryRecord } from './types.js';

interface EntryRow {
  id: number;
  patient_id: number;
  status: EntryStatus;
  joined_at: string;
  closed_at: string | null;
  created_by_type: ActorType;
  created_by_id: number;
}

const toRecord = (row: EntryRow): EntryRecord => ({
  id: row.id,
  patientId: row.patient_id,
  status: row.status,
  joinedAt: row.joined_at,
  closedAt: row.closed_at,
  createdByType: row.created_by_type,
  createdById: row.created_by_id,
});

const ACTIVE: EntryStatus[] = ['waiting', 'notified'];
const CLOSED: EntryStatus[] = ['booked', 'removed'];

export function entryRepository(db: Knex | Knex.Transaction, clock: Clock) {
  const table = () => db<EntryRow>('waitlist_entries');

  return {
    async create(input: { patientId: number; createdByType: ActorType; createdById: number }): Promise<EntryRecord> {
      const [row] = await table()
        .insert({
          patient_id: input.patientId,
          status: 'waiting',
          joined_at: clock(),
          created_by_type: input.createdByType,
          created_by_id: input.createdById,
        })
        .returning('*');
      return toRecord(row as EntryRow);
    },

    async findById(id: number): Promise<EntryRecord | undefined> {
      const row = await table().where({ id }).first();
      return row && toRecord(row);
    },

    async findActiveByPatient(patientId: number): Promise<EntryRecord | undefined> {
      const row = await table().where({ patient_id: patientId }).whereIn('status', ACTIVE).first();
      return row && toRecord(row);
    },

    /** Active entries in FIFO order: join time, then id. */
    async listActive(): Promise<EntryRecord[]> {
      const rows = await table().whereIn('status', ACTIVE).orderBy([{ column: 'joined_at' }, { column: 'id' }]);
      return rows.map(toRecord);
    },

    /**
     * Moves an entry to `to` only if its current status is one of `from`.
     * Returns false when another action got there first. Closing stamps `closed_at`.
     */
    async transition(id: number, from: EntryStatus[], to: EntryStatus): Promise<boolean> {
      const changed = await table()
        .where({ id })
        .whereIn('status', from)
        .update({ status: to, closed_at: CLOSED.includes(to) ? clock() : null });
      return changed > 0;
    },
  };
}

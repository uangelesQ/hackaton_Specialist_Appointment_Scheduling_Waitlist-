import type { Knex } from 'knex';
import type { Clock, OfferRecord, OfferStatus, ResolvedOfferStatus } from './types.js';

interface OfferRow {
  id: number;
  slot_id: number;
  entry_id: number;
  status: OfferStatus;
  created_at: string;
  resolved_at: string | null;
  released_by: number;
}

const toRecord = (row: OfferRow): OfferRecord => ({
  id: row.id,
  slotId: row.slot_id,
  entryId: row.entry_id,
  status: row.status,
  createdAt: row.created_at,
  resolvedAt: row.resolved_at,
  releasedBy: row.released_by,
});

export function offerRepository(db: Knex | Knex.Transaction, clock: Clock) {
  const table = () => db<OfferRow>('slot_offers');

  return {
    /** Fails on the unique index when another offer is already outstanding. */
    async create(input: { slotId: number; entryId: number; releasedBy: number }): Promise<OfferRecord> {
      const [row] = await table()
        .insert({
          slot_id: input.slotId,
          entry_id: input.entryId,
          status: 'outstanding',
          created_at: clock(),
          released_by: input.releasedBy,
        })
        .returning('*');
      return toRecord(row as OfferRow);
    },

    async findById(id: number): Promise<OfferRecord | undefined> {
      const row = await table().where({ id }).first();
      return row && toRecord(row);
    },

    async findOutstanding(): Promise<OfferRecord | undefined> {
      const row = await table().where({ status: 'outstanding' }).first();
      return row && toRecord(row);
    },

    /** Resolves the offer only while it is still outstanding; returns false for the loser of a race. */
    async resolveIfOutstanding(id: number, status: ResolvedOfferStatus): Promise<boolean> {
      const changed = await table()
        .where({ id, status: 'outstanding' })
        .update({ status, resolved_at: clock() });
      return changed > 0;
    },
  };
}

import type { Knex } from 'knex';
import type { EntryStatus } from '@waitlist/shared';
import { withTransaction, type Clock } from '../repositories/index.js';
import { assignPositions } from './position.js';

export interface OfferBanner {
  id: number;
  slotStartsAt: string;
  specialistName: string;
}

export interface MyEntryView {
  id: number;
  status: EntryStatus;
  position: number;
  joinedAt: string;
  offer: OfferBanner | null;
}

export interface StaffEntryView {
  id: number;
  patientId: number;
  patientName: string;
  status: EntryStatus;
  position: number;
  joinedAt: string;
  holdsOffer: boolean;
}

export interface StaffWaitlistView {
  entries: StaffEntryView[];
  offer: { id: number; entryId: number; slotStartsAt: string } | null;
}

/** Read-only views. Every call reads current data in one transaction, so nothing here can go stale. */
export function waitlistViewService(db: Knex, clock?: Clock) {
  return {
    /** The patient's own active entry, or null. The position is a bare number: no total is ever returned. */
    async forPatient(patientId: number): Promise<{ entry: MyEntryView | null }> {
      return withTransaction(
        db,
        async (repos) => {
          const entry = await repos.entries.findActiveByPatient(patientId);
          if (!entry) return { entry: null };

          const outstanding = await repos.offers.findOutstanding();
          let offer: OfferBanner | null = null;
          if (outstanding && outstanding.entryId === entry.id) {
            const slot = await repos.slots.findById(outstanding.slotId);
            const specialist = await repos.specialist.get();
            if (slot) offer = { id: outstanding.id, slotStartsAt: slot.startsAt, specialistName: specialist.name };
          }

          return {
            entry: {
              id: entry.id,
              status: entry.status,
              position: await repos.entries.positionOf(entry),
              joinedAt: entry.joinedAt,
              offer,
            },
          };
        },
        clock,
      );
    },

    /** Every active entry in position order, plus the outstanding offer and who holds it. */
    async forStaff(): Promise<StaffWaitlistView> {
      return withTransaction(
        db,
        async (repos) => {
          const active = assignPositions(await repos.entries.listActive());
          const names = await repos.patients.namesByIds(active.map((e) => e.patientId));
          const outstanding = await repos.offers.findOutstanding();
          const slot = outstanding && (await repos.slots.findById(outstanding.slotId));

          return {
            entries: active.map((e) => ({
              id: e.id,
              patientId: e.patientId,
              patientName: names.get(e.patientId) ?? '',
              status: e.status,
              position: e.position,
              joinedAt: e.joinedAt,
              holdsOffer: outstanding?.entryId === e.id,
            })),
            offer:
              outstanding && slot
                ? { id: outstanding.id, entryId: outstanding.entryId, slotStartsAt: slot.startsAt }
                : null,
          };
        },
        clock,
      );
    },
  };
}

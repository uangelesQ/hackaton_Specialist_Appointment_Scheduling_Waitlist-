import type { Knex } from 'knex';
import type { MyWaitlistResponse, OfferBanner, ReleaseState, StaffWaitlistResponse } from '@waitlist/shared';
import { withTransaction, type Clock } from '../repositories/index.js';
import { nextEligibleEntry } from './offers.js';
import { assignPositions } from './position.js';

/** Read-only views. Every call reads current data in one transaction, so nothing here can go stale. */
export function waitlistViewService(db: Knex, clock?: Clock) {
  return {
    /** The patient's own active entry, or null. The position is a bare number: no total is ever returned. */
    async forPatient(patientId: number): Promise<MyWaitlistResponse> {
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
    async forStaff(): Promise<StaffWaitlistResponse> {
      return withTransaction(
        db,
        async (repos) => {
          const active = assignPositions(await repos.entries.listActive());
          const names = await repos.patients.namesByIds(active.map((e) => e.patientId));
          const outstanding = await repos.offers.findOutstanding();
          const slot = outstanding && (await repos.slots.findById(outstanding.slotId));

          const returned = await repos.slots.findOpen();
          const openSlotStartsAt = returned?.startsAt ?? null;
          let release: ReleaseState = { available: true, reason: null, openSlotStartsAt };
          if (outstanding) {
            release = { available: false, reason: 'offer_outstanding', openSlotStartsAt };
          } else if (!active.some((e) => e.status === 'waiting')) {
            release = { available: false, reason: 'no_waiting_patients', openSlotStartsAt };
          } else if (!(await nextEligibleEntry(repos, returned?.id ?? null))) {
            release = { available: false, reason: 'all_waiting_declined', openSlotStartsAt };
          }

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
            release,
          };
        },
        clock,
      );
    },
  };
}

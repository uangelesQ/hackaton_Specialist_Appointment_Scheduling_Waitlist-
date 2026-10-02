import type { Knex } from 'knex';
import type { MyWaitlistResponse, OfferBanner, ReleaseState, StaffWaitlistResponse } from '@waitlist/shared';
import { withTransaction, type Clock } from '../repositories/index.js';
import { nextEligibleEntry } from './offers.js';
import { assignPositions } from './position.js';
import { responseChannelOf } from './responseChannel.js';

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

          const responseChannel = responseChannelOf((await repos.patients.preferenceOf(patientId)) ?? null);
          const outstanding = await repos.offers.findOutstanding();
          const holdsOffer = outstanding?.entryId === entry.id;

          // Only an in-app patient is shown the banner. A patient staff must call holds the offer too,
          // but the app shows them no banner and no accept or decline: staff record the outcome.
          let offer: OfferBanner | null = null;
          if (outstanding && holdsOffer && responseChannel === 'in_app') {
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
              holdsOffer,
              responseChannel,
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
          const patients = await repos.patients.byIds(active.map((e) => e.patientId));
          const outstanding = await repos.offers.findOutstanding();
          const slot = outstanding && (await repos.slots.findById(outstanding.slotId));
          const holder = outstanding && active.find((e) => e.id === outstanding.entryId);
          // Staff must call whoever does not answer in the app, including a patient with no recorded preference.
          const holderRequiresCall = holder
            ? responseChannelOf(patients.get(holder.patientId)?.contactPreference ?? null) === 'staff'
            : false;

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
              patientName: patients.get(e.patientId)?.fullName ?? '',
              contactPreference: patients.get(e.patientId)?.contactPreference ?? null,
              status: e.status,
              position: e.position,
              joinedAt: e.joinedAt,
              holdsOffer: outstanding?.entryId === e.id,
            })),
            offer:
              outstanding && slot
                ? {
                    id: outstanding.id,
                    entryId: outstanding.entryId,
                    slotStartsAt: slot.startsAt,
                    requiresCall: holderRequiresCall,
                    createdAt: outstanding.createdAt,
                  }
                : null,
            release,
          };
        },
        clock,
      );
    },
  };
}

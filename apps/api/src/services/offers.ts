import type { Knex } from 'knex';
import type { EntryStatus } from '@waitlist/shared';
import { isUniqueViolation } from '../db/errors.js';
import { HttpError } from '../http/errors.js';
import {
  withTransaction,
  type Clock,
  type EntryRecord,
  type OfferRecord,
  type Repositories,
  type SlotRecord,
} from '../repositories/index.js';
import type { Actor } from './waitlist.js';

export interface OfferView {
  id: number;
  slotId: number;
  slotStartsAt: string;
  entryId: number;
}

const toOfferView = (offer: OfferRecord, slot: SlotRecord): OfferView => ({
  id: offer.id,
  slotId: slot.id,
  slotStartsAt: slot.startsAt,
  entryId: offer.entryId,
});

/**
 * The next patient to offer a slot to: the first `waiting` entry in position order that has not
 * declined this slot. `behind` limits the search to entries after that entry (used by pass-on).
 */
export async function nextEligibleEntry(
  repos: Repositories,
  slotId: number | null,
  behind?: EntryRecord,
): Promise<EntryRecord | undefined> {
  const declined = new Set(slotId === null ? [] : await repos.offers.declinedPatientIds(slotId));
  let queue = await repos.entries.listActive();
  if (behind) {
    const index = queue.findIndex((e) => e.id === behind.id);
    queue = queue.slice(index + 1);
  }
  return queue.find((e) => e.status === 'waiting' && !declined.has(e.patientId));
}

/**
 * Moves the slot offer to `entry`: raises the outstanding offer and marks the entry notified.
 * The entry transition is conditional, so it fails if the entry changed in the meantime.
 */
async function offerSlot(repos: Repositories, slot: SlotRecord, entry: EntryRecord, releasedBy: number) {
  const offer = await repos.offers.create({ slotId: slot.id, entryId: entry.id, releasedBy });
  if (!(await repos.entries.transition(entry.id, ['waiting'], 'notified'))) {
    throw new HttpError(409, 'entry_not_waiting');
  }
  await repos.slots.setStatus(slot.id, 'offered');
  return offer;
}

/** An outstanding offer implies a notified holder. If that ever fails, roll the whole transition back. */
async function transitionOrFail(repos: Repositories, entryId: number, from: EntryStatus[], to: EntryStatus) {
  if (!(await repos.entries.transition(entryId, from, to))) {
    throw new Error(`Entry ${entryId} was not ${from.join('/')}`);
  }
}

/** Loads an offer and checks the caller holds it. Not found and not holder are distinct failures. */
async function loadForHolder(repos: Repositories, offerId: number, patientId: number) {
  const offer = await repos.offers.findById(offerId);
  if (!offer) throw new HttpError(404, 'not_found');
  const entry = await repos.entries.findById(offer.entryId);
  if (!entry || entry.patientId !== patientId) throw new HttpError(403, 'forbidden');
  return { offer, entry };
}

export function offerService(db: Knex, clock?: Clock) {
  const run = <T>(work: (repos: Repositories) => Promise<T>) => withTransaction(db, work, clock);

  return {
    /**
     * Staff release a slot. A returned (open) slot is reused with its original date and time;
     * otherwise `startsAt` creates a new one. The lowest-position waiting patient who has not
     * declined the slot is notified.
     */
    async release(actor: Actor, startsAt: string | undefined): Promise<OfferView> {
      try {
        return await run(async (repos) => {
          if (await repos.offers.findOutstanding()) throw new HttpError(409, 'offer_outstanding');

          const returned = await repos.slots.findOpen();
          if (!returned && !startsAt) throw new HttpError(400, 'slot_time_required');

          const entry = await nextEligibleEntry(repos, returned?.id ?? null);
          if (!entry) throw new HttpError(409, 'no_eligible_patient');

          const slot = returned ?? (await repos.slots.create(startsAt as string));
          const offer = await offerSlot(repos, slot, entry, actor.id);
          await repos.audit.record({
            action: 'slot_released',
            entryId: entry.id,
            slotId: slot.id,
            actorType: actor.type,
            actorId: actor.id,
          });
          return toOfferView(offer, slot);
        });
      } catch (err) {
        // Two releases at once: the unique index let one through.
        if (isUniqueViolation(err)) throw new HttpError(409, 'offer_outstanding');
        throw err;
      }
    },

    /** The holder confirms: the slot is booked and the entry closes as `booked`. */
    async accept(offerId: number, actor: Actor) {
      return run(async (repos) => {
        const { offer, entry } = await loadForHolder(repos, offerId, actor.id);
        if (!(await repos.offers.resolveIfOutstanding(offer.id, 'accepted'))) {
          throw new HttpError(409, 'offer_not_available');
        }
        await transitionOrFail(repos, entry.id, ['notified'], 'booked');
        await repos.slots.setStatus(offer.slotId, 'booked');
        await repos.audit.record({
          action: 'offer_accepted',
          entryId: entry.id,
          slotId: offer.slotId,
          actorType: actor.type,
          actorId: actor.id,
        });

        const slot = await repos.slots.findById(offer.slotId);
        const specialist = await repos.specialist.get();
        return {
          entry: { id: entry.id, status: 'booked' as EntryStatus },
          booking: { slotId: offer.slotId, slotStartsAt: slot?.startsAt ?? '', specialistName: specialist.name },
        };
      });
    },

    /** The holder declines: back to `waiting` at the same position, slot returns to staff. Nobody else is notified. */
    async decline(offerId: number, actor: Actor) {
      return run(async (repos) => {
        const { offer, entry } = await loadForHolder(repos, offerId, actor.id);
        if (!(await repos.offers.resolveIfOutstanding(offer.id, 'declined'))) {
          throw new HttpError(409, 'offer_not_available');
        }
        await transitionOrFail(repos, entry.id, ['notified'], 'waiting');
        await repos.slots.setStatus(offer.slotId, 'open');
        await repos.audit.record({
          action: 'offer_declined',
          entryId: entry.id,
          slotId: offer.slotId,
          actorType: actor.type,
          actorId: actor.id,
        });

        return { entry: { id: entry.id, status: 'waiting' as EntryStatus, position: await repos.entries.positionOf(entry) } };
      });
    },

    /**
     * Staff pass an unanswered offer on. The holder returns to `waiting`; the next eligible patient
     * behind them is notified for the same slot, or the slot returns to staff if there is none.
     */
    async passOn(offerId: number, actor: Actor): Promise<{ offer: OfferView | null }> {
      return run(async (repos) => {
        const offer = await repos.offers.findById(offerId);
        if (!offer) throw new HttpError(404, 'not_found');
        if (!(await repos.offers.resolveIfOutstanding(offer.id, 'passed_on'))) {
          throw new HttpError(409, 'offer_not_available');
        }

        const holder = await repos.entries.findById(offer.entryId);
        const slot = await repos.slots.findById(offer.slotId);
        if (!holder || !slot) throw new Error('Offer refers to a missing entry or slot');

        await transitionOrFail(repos, holder.id, ['notified'], 'waiting');
        await repos.audit.record({
          action: 'offer_passed_on',
          entryId: holder.id,
          slotId: slot.id,
          actorType: actor.type,
          actorId: actor.id,
        });

        const next = await nextEligibleEntry(repos, slot.id, holder);
        if (!next) {
          await repos.slots.setStatus(slot.id, 'open');
          return { offer: null };
        }
        return { offer: toOfferView(await offerSlot(repos, slot, next, actor.id), slot) };
      });
    },
  };
}

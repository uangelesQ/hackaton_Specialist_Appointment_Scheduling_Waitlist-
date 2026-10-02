import type { Knex } from 'knex';
import type { AcceptResponse, DeclineResponse, EntryStatus, OfferView } from '@waitlist/shared';
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
import { responseChannelOf } from './responseChannel.js';
import type { Actor } from './waitlist.js';

const toOfferView = (offer: OfferRecord, slot: SlotRecord): OfferView => ({
  id: offer.id,
  slotId: slot.id,
  slotStartsAt: slot.startsAt,
  entryId: offer.entryId,
});

/**
 * The patient who is next in line for a slot: the `waiting` entry with the lowest position whose
 * patient has neither declined this slot nor been passed over for it. `slotId` is null for a slot
 * that does not exist yet, which nobody can have been excluded from.
 *
 * A pass-on resolves the holder's offer as `passed_on` before searching, so the holder is excluded
 * by their own offer row and no separate "behind the holder" rule is needed.
 */
export async function nextEligibleEntry(repos: Repositories, slotId: number | null): Promise<EntryRecord | undefined> {
  const excluded = new Set(slotId === null ? [] : await repos.offers.excludedPatientIds(slotId));
  const queue = await repos.entries.listActive();
  return queue.find((e) => e.status === 'waiting' && !excluded.has(e.patientId));
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

/** Whether `patientId` answers offers in the app or through staff, from their recorded preference. */
async function channelOf(repos: Repositories, patientId: number) {
  return responseChannelOf((await repos.patients.preferenceOf(patientId)) ?? null);
}

/** Who is responding, and whether staff are recording it on the patient's behalf. */
interface ResponseContext {
  actor: Actor;
  recordedByStaff: boolean;
}

/**
 * Accepts an outstanding offer: the slot is booked and the entry closes as `booked`. This is the one
 * implementation for the patient's own acceptance and for staff recording it on their behalf, so both
 * have exactly the same effect (BR-010). Only the audit action and actor differ.
 */
async function applyAccept(
  repos: Repositories,
  offer: OfferRecord,
  entry: EntryRecord,
  { actor, recordedByStaff }: ResponseContext,
): Promise<AcceptResponse> {
  if (!(await repos.offers.resolveIfOutstanding(offer.id, 'accepted'))) {
    throw new HttpError(409, 'offer_not_available');
  }
  await transitionOrFail(repos, entry.id, ['notified'], 'booked');
  await repos.slots.setStatus(offer.slotId, 'booked');
  await repos.audit.record({
    action: recordedByStaff ? 'offer_accepted_by_staff' : 'offer_accepted',
    entryId: entry.id,
    slotId: offer.slotId,
    actorType: actor.type,
    actorId: actor.id,
  });

  const slot = await repos.slots.findById(offer.slotId);
  const specialist = await repos.specialist.get();
  return {
    entry: { id: entry.id, status: 'booked' },
    booking: { slotId: offer.slotId, slotStartsAt: slot?.startsAt ?? '', specialistName: specialist.name },
  };
}

/**
 * Declines an outstanding offer: the entry goes back to `waiting` at the same position, the slot returns
 * to staff, and nobody else is notified. Shared by the patient and by staff recording on their behalf.
 */
async function applyDecline(
  repos: Repositories,
  offer: OfferRecord,
  entry: EntryRecord,
  { actor, recordedByStaff }: ResponseContext,
): Promise<DeclineResponse> {
  if (!(await repos.offers.resolveIfOutstanding(offer.id, 'declined'))) {
    throw new HttpError(409, 'offer_not_available');
  }
  await transitionOrFail(repos, entry.id, ['notified'], 'waiting');
  await repos.slots.setStatus(offer.slotId, 'open');
  await repos.audit.record({
    action: recordedByStaff ? 'offer_declined_by_staff' : 'offer_declined',
    entryId: entry.id,
    slotId: offer.slotId,
    actorType: actor.type,
    actorId: actor.id,
  });

  return { entry: { id: entry.id, status: 'waiting', position: await repos.entries.positionOf(entry) } };
}

/**
 * Loads an offer for a patient answering in the app: they must hold it, and their own channel must be
 * the app. Not found, not the holder and "staff answer for you" are three distinct failures.
 */
async function loadForPatientResponse(repos: Repositories, offerId: number, patientId: number) {
  const loaded = await loadForHolder(repos, offerId, patientId);
  if ((await channelOf(repos, loaded.entry.patientId)) !== 'in_app') throw new HttpError(403, 'response_by_staff');
  return loaded;
}

/** Loads an offer for staff recording a response: only a patient staff must call can have one recorded. */
async function loadForStaffRecording(repos: Repositories, offerId: number) {
  const offer = await repos.offers.findById(offerId);
  if (!offer) throw new HttpError(404, 'not_found');
  const entry = await repos.entries.findById(offer.entryId);
  if (!entry) throw new Error(`Offer ${offer.id} refers to a missing entry`);
  if ((await channelOf(repos, entry.patientId)) === 'in_app') throw new HttpError(409, 'patient_responds_in_app');
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

          // A slot is identified by its date and time, so compare canonical instants: the same
          // moment can be written several ways ("…:00Z", "…:00.000Z").
          const instant = startsAt ? new Date(startsAt).toISOString() : undefined;
          if (instant && (await repos.slots.findBookedAt(instant))) throw new HttpError(409, 'slot_already_booked');

          const returned = await repos.slots.findOpen();
          if (!returned && !instant) throw new HttpError(400, 'slot_time_required');

          const entry = await nextEligibleEntry(repos, returned?.id ?? null);
          if (!entry) throw new HttpError(409, 'no_eligible_patient');

          const slot = returned ?? (await repos.slots.create(instant as string));
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

    /** The holder confirms in the app. Only patients whose preference is `in_app` answer here. */
    async accept(offerId: number, actor: Actor): Promise<AcceptResponse> {
      return run(async (repos) => {
        const { offer, entry } = await loadForPatientResponse(repos, offerId, actor.id);
        return applyAccept(repos, offer, entry, { actor, recordedByStaff: false });
      });
    },

    /** The holder declines in the app. Back to `waiting` at the same position; nobody else is notified. */
    async decline(offerId: number, actor: Actor): Promise<DeclineResponse> {
      return run(async (repos) => {
        const { offer, entry } = await loadForPatientResponse(repos, offerId, actor.id);
        return applyDecline(repos, offer, entry, { actor, recordedByStaff: false });
      });
    },

    /** Staff record that a patient they reached by telephone accepted. Same effect as the patient accepting. */
    async recordAccept(offerId: number, actor: Actor): Promise<AcceptResponse> {
      return run(async (repos) => {
        const { offer, entry } = await loadForStaffRecording(repos, offerId);
        return applyAccept(repos, offer, entry, { actor, recordedByStaff: true });
      });
    },

    /** Staff record that a patient they reached by telephone declined. Same effect as the patient declining. */
    async recordDecline(offerId: number, actor: Actor): Promise<DeclineResponse> {
      return run(async (repos) => {
        const { offer, entry } = await loadForStaffRecording(repos, offerId);
        return applyDecline(repos, offer, entry, { actor, recordedByStaff: true });
      });
    },

    /**
     * Staff pass an unanswered offer on. The holder returns to `waiting` and is passed over for this
     * slot; the next patient in line is notified for the same slot, or the slot returns to staff if
     * nobody is eligible.
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

        const next = await nextEligibleEntry(repos, slot.id);
        if (!next) {
          await repos.slots.setStatus(slot.id, 'open');
          return { offer: null };
        }
        return { offer: toOfferView(await offerSlot(repos, slot, next, actor.id), slot) };
      });
    },
  };
}

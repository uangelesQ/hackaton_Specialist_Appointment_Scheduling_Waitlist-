import type { Knex } from 'knex';
import type { ContactPreference, EntryStatus, EntryView, JoinResponse } from '@waitlist/shared';
import { isUniqueViolation } from '../db/errors.js';
import { HttpError } from '../http/errors.js';
import { createRepositories, withTransaction, type ActorType, type Clock, type EntryRecord, type Repositories } from '../repositories/index.js';
import { preferenceService } from './preference.js';

export interface Actor {
  type: ActorType;
  id: number;
}

async function toView(repos: Repositories, entry: EntryRecord): Promise<EntryView> {
  return {
    id: entry.id,
    patientId: entry.patientId,
    status: entry.status,
    position: await repos.entries.positionOf(entry),
    joinedAt: entry.joinedAt,
  };
}

export function waitlistService(db: Knex, clock?: Clock) {
  const preferences = preferenceService(db, clock);
  async function viewExisting(patientId: number): Promise<JoinResponse | undefined> {
    const repos = createRepositories(db, clock);
    const existing = await repos.entries.findActiveByPatient(patientId);
    return existing && { entry: await toView(repos, existing), created: false };
  }

  return {
    /**
     * Adds a patient to the waitlist, on their own behalf or on staff's. A patient who is
     * already on the list gets their existing entry back and nothing is created, recorded or audited.
     *
     * A patient with no recorded preference needs one before an entry is created (BR-014). Staff may
     * supply it when adding a caller who has none, and it is saved with the entry or not at all (BR-016);
     * a patient chooses beforehand through `preferenceService`, so it survives a failed join (US-012).
     */
    async join(patientId: number, actor: Actor, supplied?: ContactPreference): Promise<JoinResponse> {
      try {
        return await withTransaction(
          db,
          async (repos) => {
            if (!(await repos.patients.exists(patientId))) {
              // A patient token for an unknown person is forbidden; staff naming an unknown patient is a 404.
              throw new HttpError(actor.type === 'patient' ? 403 : 404, actor.type === 'patient' ? 'not_registered' : 'patient_not_found');
            }

            const existing = await repos.entries.findActiveByPatient(patientId);
            if (existing) return { entry: await toView(repos, existing), created: false };

            const recorded = await repos.patients.preferenceOf(patientId);
            if (recorded === null && supplied === undefined) throw new HttpError(409, 'preference_required');
            if (recorded !== null && supplied !== undefined) throw new HttpError(409, 'preference_already_recorded');

            const entry = await repos.entries.create({ patientId, createdByType: actor.type, createdById: actor.id });
            if (supplied !== undefined) await preferences.setIn(repos, patientId, supplied, actor, entry.id);
            await repos.audit.record({ action: 'entry_created', entryId: entry.id, actorType: actor.type, actorId: actor.id });
            return { entry: await toView(repos, entry), created: true };
          },
          clock,
        );
      } catch (err) {
        // A concurrent join won the race on the unique index; answer with the entry it created.
        if (isUniqueViolation(err)) {
          const existing = await viewExisting(patientId);
          if (existing) return existing;
        }
        throw err;
      }
    },

    /** Closes an active entry as `removed`. Fails with 409 when the entry is already closed. */
    async remove(entryId: number, actor: Actor): Promise<{ id: number; status: EntryStatus }> {
      return withTransaction(
        db,
        async (repos) => {
          const entry = await repos.entries.findById(entryId);
          if (!entry) throw new HttpError(404, 'not_found');

          const closed = await repos.entries.transition(entryId, ['waiting', 'notified'], 'removed');
          if (!closed) throw new HttpError(409, 'entry_not_active');

          await repos.audit.record({ action: 'entry_removed', entryId, actorType: actor.type, actorId: actor.id });

          // Removing the offer holder closes their offer; the slot returns to staff and nobody else is notified.
          if (entry.status === 'notified') {
            const offer = await repos.offers.findOutstanding();
            if (offer?.entryId === entryId && (await repos.offers.resolveIfOutstanding(offer.id, 'closed'))) {
              await repos.slots.setStatus(offer.slotId, 'open');
              await repos.audit.record({
                action: 'offer_closed',
                entryId,
                slotId: offer.slotId,
                actorType: actor.type,
                actorId: actor.id,
              });
            }
          }
          return { id: entryId, status: 'removed' };
        },
        clock,
      );
    },
  };
}

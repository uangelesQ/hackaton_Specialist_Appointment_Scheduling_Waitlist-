import type { Knex } from 'knex';
import type { EntryStatus } from '@waitlist/shared';
import { isUniqueViolation } from '../db/errors.js';
import { HttpError } from '../http/errors.js';
import { createRepositories, withTransaction, type ActorType, type Clock, type EntryRecord, type Repositories } from '../repositories/index.js';

export interface Actor {
  type: ActorType;
  id: number;
}

export interface EntryView {
  id: number;
  patientId: number;
  status: EntryStatus;
  position: number;
  joinedAt: string;
}

export interface JoinResult {
  entry: EntryView;
  /** False when the patient was already on the waitlist and nothing was created. */
  created: boolean;
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
  async function viewExisting(patientId: number): Promise<JoinResult | undefined> {
    const repos = createRepositories(db, clock);
    const existing = await repos.entries.findActiveByPatient(patientId);
    return existing && { entry: await toView(repos, existing), created: false };
  }

  return {
    /**
     * Adds a patient to the waitlist, on their own behalf or on staff's. A patient who is
     * already on the list gets their existing entry back and nothing is created or audited.
     */
    async join(patientId: number, actor: Actor): Promise<JoinResult> {
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

            const entry = await repos.entries.create({ patientId, createdByType: actor.type, createdById: actor.id });
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

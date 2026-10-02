import type { Knex } from 'knex';
import type { ContactPreference } from '@waitlist/shared';
import { HttpError } from '../http/errors.js';
import { withTransaction, type Clock, type Repositories } from '../repositories/index.js';
import type { Actor } from './waitlist.js';

export function preferenceService(db: Knex, clock?: Clock) {
  /**
   * Writes a patient's preference inside a transaction the caller already holds, so a staff add can
   * save it together with the new entry. An unchanged value writes nothing and audits nothing.
   * Every save that changes the value is audited with the previous and new value (BR-015, BR-016).
   */
  async function setIn(
    repos: Repositories,
    patientId: number,
    value: ContactPreference,
    actor: Actor,
    entryId?: number,
  ): Promise<ContactPreference> {
    const previous = await repos.patients.preferenceOf(patientId);
    if (previous === undefined) throw new HttpError(404, 'patient_not_found');
    if (previous === value) return value;

    await repos.patients.setPreference(patientId, value);
    await repos.audit.record({
      action: 'contact_preference_set',
      entryId,
      actorType: actor.type,
      actorId: actor.id,
      patientId,
      previousValue: previous,
      newValue: value,
    });
    return value;
  }

  return {
    setIn,

    /** Saves a preference in its own transaction. */
    set(patientId: number, value: ContactPreference, actor: Actor, entryId?: number): Promise<ContactPreference> {
      return withTransaction(db, (repos) => setIn(repos, patientId, value, actor, entryId), clock);
    },
  };
}

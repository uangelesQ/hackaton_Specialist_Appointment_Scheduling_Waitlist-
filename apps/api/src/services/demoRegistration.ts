import type { Knex } from 'knex';
import type { ContactPreference } from '@waitlist/shared';
import { isUniqueViolation } from '../db/errors.js';
import { HttpError } from '../http/errors.js';
import { withTransaction, type Clock } from '../repositories/index.js';
import type { PatientRecord } from '../repositories/patients.js';
import { preferenceService } from './preference.js';

/** Names are compared without regard to letter case or surrounding spaces, including accented letters. */
const nameKey = (name: string) => name.trim().normalize('NFC').toLocaleLowerCase('es');

/**
 * DEMO ONLY (PS-001 v2.5 Appendix A). Registers a patient with a chosen contact preference, standing in
 * for hospital registration. A name is the uniqueness key here only because this is a demonstration.
 * The first choice is audited with the new patient as the actor.
 */
export function demoRegistrationService(db: Knex, clock?: Clock) {
  const preferences = preferenceService(db, clock);

  return {
    async register(name: string, preference: ContactPreference): Promise<PatientRecord> {
      const trimmed = name.trim();
      try {
        return await withTransaction(
          db,
          async (repos) => {
            const taken = (await repos.patients.list()).some((p) => nameKey(p.fullName) === nameKey(trimmed));
            if (taken) throw new HttpError(409, 'name_already_registered');

            const patient = await repos.patients.create(trimmed);
            await preferences.setIn(repos, patient.id, preference, { type: 'patient', id: patient.id });
            return { ...patient, contactPreference: preference };
          },
          clock,
        );
      } catch (err) {
        // A simultaneous registration won the race on the unique index.
        if (isUniqueViolation(err)) throw new HttpError(409, 'name_already_registered');
        throw err;
      }
    },
  };
}

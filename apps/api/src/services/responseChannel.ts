import type { ContactPreference, ResponseChannel } from '@waitlist/shared';

/**
 * Who answers an offer for a patient. An in-app patient answers in the app; a telephone patient,
 * and a patient with no recorded preference, are reached by staff, who record the outcome.
 *
 * This is the one place "not recorded means telephone" is decided (BR-001).
 */
export function responseChannelOf(preference: ContactPreference | null): ResponseChannel {
  return preference === 'in_app' ? 'in_app' : 'staff';
}

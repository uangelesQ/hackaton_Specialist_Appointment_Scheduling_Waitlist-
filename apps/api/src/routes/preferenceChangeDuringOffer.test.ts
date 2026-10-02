import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { MyWaitlistResponse, StaffWaitlistResponse } from '@waitlist/shared';
import { buildTestApp, type TestApp } from '../test/testApp.js';

const SLOT = '2026-10-02T10:30:00.000Z';

/**
 * A change of contact preference while holding an offer (US-013, BR-017, BR-018, BR-021). Nothing caches
 * the channel: it is read from the patient record on every view and every action, so a saved change is
 * seen by the next request. These tests prove that, and that the offer itself is untouched.
 */
describe('a change of preference while holding an offer', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await buildTestApp();
  });

  afterEach(async () => {
    await t.close();
  });

  const asPatient = (id: number) => t.bearer(t.patient(id));
  const asStaff = () => t.bearer(t.staff(1));

  // Patient 5 has no recorded preference, so they can only be waiting as a legacy entry (BR-019).
  async function join(patientId: number): Promise<number> {
    if (patientId === 5) return t.addLegacyEntry(patientId);
    const res = await request(t.app).post('/waitlist').set('Authorization', asPatient(patientId)).expect(201);
    return res.body.entry.id;
  }
  /** The first patient to join is the one offered the slot. */
  async function holdsOffer(patientId: number): Promise<number> {
    await join(patientId);
    await join(2);
    const res = await request(t.app).post('/offers').set('Authorization', asStaff()).send({ startsAt: SLOT }).expect(201);
    return res.body.offer.id;
  }
  const change = (patientId: number, value: string) =>
    request(t.app).put('/me/contact-preference').set('Authorization', asPatient(patientId)).send({ contactPreference: value }).expect(200);
  const patientView = async (id: number) => (await request(t.app).get('/me/waitlist').set('Authorization', asPatient(id)).expect(200)).body as MyWaitlistResponse;
  const staffView = async () => (await request(t.app).get('/waitlist').set('Authorization', asStaff()).expect(200)).body as StaffWaitlistResponse;
  const accept = (offerId: number, id: number) => request(t.app).post(`/offers/${offerId}/accept`).set('Authorization', asPatient(id));
  const decline = (offerId: number, id: number) => request(t.app).post(`/offers/${offerId}/decline`).set('Authorization', asPatient(id));
  const recordAccept = (offerId: number) => request(t.app).post(`/offers/${offerId}/record-accept`).set('Authorization', asStaff());
  const recordDecline = (offerId: number) => request(t.app).post(`/offers/${offerId}/record-decline`).set('Authorization', asStaff());
  const offerRow = (id: number) => t.db('slot_offers').where({ id }).first();
  const entryStatuses = async () => (await t.db('waitlist_entries').orderBy('id')).map((e) => e.status);

  describe('takes effect at once (4.1)', () => {
    it('in-app to telephone: no banner, staff see a call flag, the patient cannot answer, staff can record', async () => {
      const offerId = await holdsOffer(1);
      expect((await patientView(1)).entry?.offer).toMatchObject({ id: offerId });
      expect((await staffView()).offer?.requiresCall).toBe(false);

      await change(1, 'telephone');

      const mine = (await patientView(1)).entry;
      expect(mine).toMatchObject({ offer: null, holdsOffer: true, responseChannel: 'staff', status: 'notified' });
      expect((await staffView()).offer).toMatchObject({ id: offerId, requiresCall: true });
      const refused = await accept(offerId, 1);
      expect(refused.status).toBe(403);
      expect(refused.body).toEqual({ error: 'response_by_staff' });
      expect((await recordAccept(offerId)).status).toBe(200);
    });

    it.each([
      ['telephone', 4],
      ['not recorded', 5],
    ])('%s to in-app: the banner appears, the call flag clears, staff can no longer record, the patient can answer', async (_label, id) => {
      const offerId = await holdsOffer(id);
      expect((await patientView(id)).entry).toMatchObject({ offer: null, holdsOffer: true, responseChannel: 'staff' });
      expect((await staffView()).offer?.requiresCall).toBe(true);

      await change(id, 'in_app');

      expect((await patientView(id)).entry).toMatchObject({ offer: { id: offerId }, holdsOffer: true, responseChannel: 'in_app' });
      expect((await staffView()).offer?.requiresCall).toBe(false);
      const refused = await recordAccept(offerId);
      expect(refused.status).toBe(409);
      expect(refused.body).toEqual({ error: 'patient_responds_in_app' });
      expect((await accept(offerId, id)).status).toBe(200);
    });

    it('the staff entry row shows the new preference', async () => {
      await holdsOffer(1);

      await change(1, 'telephone');

      expect((await staffView()).entries.find((e) => e.patientId === 1)?.contactPreference).toBe('telephone');
    });

    it('does not restart, withdraw or reassign the offer', async () => {
      const offerId = await holdsOffer(1);
      const before = await offerRow(offerId);
      const slotsBefore = await t.db('slots');
      const entriesBefore = await entryStatuses();

      await change(1, 'telephone');
      await change(1, 'in_app');

      expect(await offerRow(offerId)).toEqual(before);
      expect(await t.db('slots')).toEqual(slotsBefore);
      expect(await entryStatuses()).toEqual(entriesBefore);
      expect((await staffView()).offer).toMatchObject({ id: offerId, createdAt: before.created_at });
    });

    it('writes no offer or entry audit row, only the preference change', async () => {
      await holdsOffer(1);
      const before = (await t.db('audit_log')).length;

      await change(1, 'telephone');

      const added = (await t.db('audit_log').orderBy('id')).slice(before);
      expect(added.map((a) => a.action)).toEqual(['contact_preference_set']);
    });
  });

  describe('an action is judged at the moment it is taken (4.2)', () => {
    it('refuses a patient who confirms after switching to telephone in another session, and books nothing', async () => {
      const offerId = await holdsOffer(1);
      // The first session shows the confirmation step; the patient then switches in another session.
      expect((await patientView(1)).entry?.offer).not.toBeNull();
      await change(1, 'telephone');

      const res = await accept(offerId, 1);

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'response_by_staff' });
      expect((await offerRow(offerId)).status).toBe('outstanding');
      expect(await entryStatuses()).toEqual(['notified', 'waiting']);
      expect(await t.db('slots').where({ status: 'booked' })).toHaveLength(0);
    });

    it('refuses a decline made after switching to telephone, and leaves the offer outstanding', async () => {
      const offerId = await holdsOffer(1);
      await change(1, 'telephone');

      expect((await decline(offerId, 1)).status).toBe(403);
      expect((await offerRow(offerId)).status).toBe('outstanding');
    });

    it('refuses staff recording after the patient switched to in-app, and the offer stays outstanding', async () => {
      const offerId = await holdsOffer(4);
      // Staff loaded the view and saw a call flag; the patient then switches to in-app.
      expect((await staffView()).offer?.requiresCall).toBe(true);
      await change(4, 'in_app');

      const accepted = await recordAccept(offerId);
      const declined = await recordDecline(offerId);

      expect(accepted.status).toBe(409);
      expect(accepted.body).toEqual({ error: 'patient_responds_in_app' });
      expect(declined.status).toBe(409);
      expect((await offerRow(offerId)).status).toBe('outstanding');
      expect(await entryStatuses()).toEqual(['notified', 'waiting']);
      expect(await t.db('slots').where({ status: 'booked' })).toHaveLength(0);
    });
  });

  describe('a recorded response is not affected (4.3)', () => {
    it("keeps a patient's own acceptance: booked entry, booked slot, accepted offer and the audit rows", async () => {
      const offerId = await holdsOffer(1);
      await accept(offerId, 1).expect(200);
      const snapshot = async () => ({
        entries: await t.db('waitlist_entries').orderBy('id'),
        slots: await t.db('slots'),
        offers: await t.db('slot_offers'),
        audit: (await t.db('audit_log').orderBy('id')).map((a) => [a.action, a.actor_type, a.actor_id, a.entry_id]),
      });
      const before = await snapshot();

      await change(1, 'telephone');

      const after = await snapshot();
      expect(after.entries).toEqual(before.entries);
      expect(after.slots).toEqual(before.slots);
      expect(after.offers).toEqual(before.offers);
      expect(after.audit).toEqual([...before.audit, ['contact_preference_set', 'patient', 1, null]]);
      expect(after.entries[0]?.status).toBe('booked');
      expect(after.slots[0]?.status).toBe('booked');
    });

    it('keeps a staff-recorded decline: the entry waits at its position and the slot stays with staff', async () => {
      const offerId = await holdsOffer(4);
      await recordDecline(offerId).expect(200);
      const before = { entries: await t.db('waitlist_entries').orderBy('id'), slots: await t.db('slots'), offers: await t.db('slot_offers') };

      await change(4, 'in_app');

      expect({ entries: await t.db('waitlist_entries').orderBy('id'), slots: await t.db('slots'), offers: await t.db('slot_offers') }).toEqual(before);
      expect((await patientView(4)).entry).toMatchObject({ status: 'waiting', position: 1 });
    });

    it('keeps a staff-recorded acceptance and its audit action', async () => {
      const offerId = await holdsOffer(4);
      await recordAccept(offerId).expect(200);

      await change(4, 'in_app');

      expect((await offerRow(offerId)).status).toBe('accepted');
      expect(await entryStatuses()).toEqual(['booked', 'waiting']);
      expect((await t.db('audit_log').where({ action: 'offer_accepted_by_staff' })).length).toBe(1);
    });
  });
});

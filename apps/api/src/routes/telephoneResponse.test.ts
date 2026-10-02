import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildTestApp, type TestApp } from '../test/testApp.js';

const SLOT = '2026-10-02T10:30:00.000Z';

/**
 * Seed: patients 1, 2, 3 are in-app; 4 and 6 are telephone; 5 has no recorded preference.
 * Whoever joins first is offered the slot, so the join order decides who holds it.
 */
describe('telephone path: responding to an offer', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await buildTestApp();
  });

  afterEach(async () => {
    await t.close();
  });

  const asPatient = (id: number) => t.bearer(t.patient(id));
  const asStaff = (id = 1) => t.bearer(t.staff(id));

  async function join(patientId: number): Promise<number> {
    const res = await request(t.app).post('/waitlist').set('Authorization', asPatient(patientId));
    return res.body.entry.id;
  }
  const release = (body: object = { startsAt: SLOT }) => request(t.app).post('/offers').set('Authorization', asStaff()).send(body);
  const patientAccept = (offerId: number, patientId: number) => request(t.app).post(`/offers/${offerId}/accept`).set('Authorization', asPatient(patientId));
  const patientDecline = (offerId: number, patientId: number) => request(t.app).post(`/offers/${offerId}/decline`).set('Authorization', asPatient(patientId));
  const recordAccept = (offerId: number, staffId = 1) => request(t.app).post(`/offers/${offerId}/record-accept`).set('Authorization', asStaff(staffId));
  const recordDecline = (offerId: number, staffId = 1) => request(t.app).post(`/offers/${offerId}/record-decline`).set('Authorization', asStaff(staffId));
  const pass = (offerId: number) => request(t.app).post(`/offers/${offerId}/pass`).set('Authorization', asStaff());
  const myView = async (patientId: number) => (await request(t.app).get('/me/waitlist').set('Authorization', asPatient(patientId)).expect(200)).body;

  const entryRow = (id: number) => t.db('waitlist_entries').where({ id }).first();
  const offerRow = (id: number) => t.db('slot_offers').where({ id }).first();
  const slotRow = (id: number) => t.db('slots').where({ id }).first();
  const statuses = async () => (await t.db('waitlist_entries').orderBy('id')).map((e) => e.status);
  const actions = async () => (await t.db('audit_log').orderBy('id')).map((a) => a.action);

  /** Telephone patient 4 joins first and is offered the slot; in-app patients 1 and 2 follow. */
  async function telephoneHolder() {
    const holder = await join(4);
    await join(1);
    await join(2);
    const offer = (await release()).body.offer;
    return { holder, offer };
  }

  /** Asserts nothing about the offer, entry or slot changed, and no audit record was added. */
  async function expectUnchanged(offer: { id: number; slotId: number; entryId: number }, auditBefore: string[]) {
    expect(await offerRow(offer.id)).toMatchObject({ status: 'outstanding', resolved_at: null });
    expect(await entryRow(offer.entryId)).toMatchObject({ status: 'notified', closed_at: null });
    expect(await slotRow(offer.slotId)).toMatchObject({ status: 'offered' });
    expect(await actions()).toEqual(auditBefore);
  }

  describe('in-app response is refused for patients staff must call (3.1)', () => {
    it.each([
      ['a telephone patient', 4],
      ['a patient with no recorded preference', 5],
    ])('refuses %s accepting in the app', async (_label, patientId) => {
      await join(patientId);
      await join(1);
      const { offer } = (await release()).body;
      const auditBefore = await actions();

      const res = await patientAccept(offer.id, patientId);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('response_by_staff');
      await expectUnchanged(offer, auditBefore);
    });

    it.each([
      ['a telephone patient', 4],
      ['a patient with no recorded preference', 5],
    ])('refuses %s declining in the app', async (_label, patientId) => {
      await join(patientId);
      await join(1);
      const { offer } = (await release()).body;
      const auditBefore = await actions();

      const res = await patientDecline(offer.id, patientId);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('response_by_staff');
      await expectUnchanged(offer, auditBefore);
    });

    it('still lets an in-app patient answer in the app', async () => {
      await join(1);
      await join(4);
      const { offer } = (await release()).body;

      expect((await patientDecline(offer.id, 1)).status).toBe(200);
    });

    it('answers "forbidden", not "response_by_staff", to a telephone patient who does not hold the offer', async () => {
      const { offer } = await telephoneHolder();
      await join(6);

      const res = await patientAccept(offer.id, 6);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('forbidden');
    });
  });

  describe('staff record an acceptance (3.3)', () => {
    it('books the slot, closes the entry as booked and moves later entries up', async () => {
      const { holder, offer } = await telephoneHolder();

      const res = await recordAccept(offer.id);

      expect(res.status).toBe(200);
      expect(res.body.booking).toEqual({ slotId: offer.slotId, slotStartsAt: SLOT, specialistName: 'Dr. Elena Ruiz' });
      expect(await entryRow(holder)).toMatchObject({ status: 'booked' });
      expect((await entryRow(holder)).closed_at).not.toBeNull();
      expect(await offerRow(offer.id)).toMatchObject({ status: 'accepted' });
      expect(await slotRow(offer.slotId)).toMatchObject({ status: 'booked' });
      expect((await myView(1)).entry.position).toBe(1);
      expect((await myView(2)).entry.position).toBe(2);
    });

    it('works the same for a patient with no recorded preference', async () => {
      const holder = await join(5);
      await join(1);
      const { offer } = (await release()).body;

      const res = await recordAccept(offer.id);

      expect(res.status).toBe(200);
      expect(await entryRow(holder)).toMatchObject({ status: 'booked' });
      expect(await slotRow(offer.slotId)).toMatchObject({ status: 'booked' });
    });

    it('leaves nothing outstanding and the slot cannot be released again', async () => {
      const { offer } = await telephoneHolder();
      await recordAccept(offer.id);

      const again = await release({ startsAt: SLOT });

      expect(again.status).toBe(409);
      expect(again.body.error).toBe('slot_already_booked');
    });
  });

  describe('staff record a decline (3.3)', () => {
    it('returns the entry to waiting at the same position, the slot to staff, and notifies nobody', async () => {
      const { holder, offer } = await telephoneHolder();

      const res = await recordDecline(offer.id);

      expect(res.status).toBe(200);
      expect(res.body.entry).toEqual({ id: holder, status: 'waiting', position: 1 });
      expect(await offerRow(offer.id)).toMatchObject({ status: 'declined' });
      expect(await slotRow(offer.slotId)).toMatchObject({ status: 'open', starts_at: SLOT });
      expect(await statuses()).toEqual(['waiting', 'waiting', 'waiting']);
    });

    it('does not offer the returned slot to the patient who declined it', async () => {
      const { offer } = await telephoneHolder();
      await recordDecline(offer.id);

      const again = await release({});

      expect(again.status).toBe(201);
      expect(again.body.offer.slotId).toBe(offer.slotId);
      expect((await entryRow(again.body.offer.entryId)).patient_id).toBe(1);
    });

    it('works the same for a patient with no recorded preference', async () => {
      const holder = await join(5);
      await join(1);
      const { offer } = (await release()).body;

      const res = await recordDecline(offer.id);

      expect(res.status).toBe(200);
      expect(await entryRow(holder)).toMatchObject({ status: 'waiting' });
      expect(await slotRow(offer.slotId)).toMatchObject({ status: 'open' });
    });
  });

  describe('who may record, and for whom (3.3)', () => {
    it.each(['record-accept', 'record-decline'])('refuses a patient token on %s', async (route) => {
      const { offer } = await telephoneHolder();
      const auditBefore = await actions();

      const res = await request(t.app).post(`/offers/${offer.id}/${route}`).set('Authorization', asPatient(4));

      expect(res.status).toBe(403);
      await expectUnchanged(offer, auditBefore);
    });

    it.each(['record-accept', 'record-decline'])('needs a token for %s', async (route) => {
      const { offer } = await telephoneHolder();

      expect((await request(t.app).post(`/offers/${offer.id}/${route}`)).status).toBe(401);
    });

    it.each(['record-accept', 'record-decline'])('refuses %s for an in-app holder and changes nothing', async (route) => {
      await join(1);
      await join(4);
      const { offer } = (await release()).body;
      const auditBefore = await actions();

      const res = await request(t.app).post(`/offers/${offer.id}/${route}`).set('Authorization', asStaff());

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('patient_responds_in_app');
      await expectUnchanged(offer, auditBefore);
    });

    it.each(['record-accept', 'record-decline'])('returns 404 on %s for an offer that does not exist', async (route) => {
      expect((await request(t.app).post(`/offers/99/${route}`).set('Authorization', asStaff())).status).toBe(404);
    });
  });

  describe('staff-recorded responses are audited as staff-entered (3.4)', () => {
    it('records an acceptance as offer_accepted_by_staff, by the staff member, for the patient\'s entry and slot', async () => {
      const { holder, offer } = await telephoneHolder();

      await recordAccept(offer.id, 2);

      const row = (await t.db('audit_log').orderBy('id')).find((a) => a.action === 'offer_accepted_by_staff');
      expect(row).toMatchObject({ actor_type: 'staff', actor_id: 2, entry_id: holder, slot_id: offer.slotId });
      expect(row.at).toEqual(expect.any(String));
    });

    it('records a decline as offer_declined_by_staff', async () => {
      const { holder, offer } = await telephoneHolder();

      await recordDecline(offer.id, 2);

      const row = (await t.db('audit_log').orderBy('id')).find((a) => a.action === 'offer_declined_by_staff');
      expect(row).toMatchObject({ actor_type: 'staff', actor_id: 2, entry_id: holder, slot_id: offer.slotId });
    });

    it('does not use the patient actions for a staff-recorded response', async () => {
      const { offer } = await telephoneHolder();
      await recordAccept(offer.id);

      const all = await actions();
      expect(all).toContain('offer_accepted_by_staff');
      expect(all).not.toContain('offer_accepted');
    });

    it('keeps an in-app patient\'s own responses on the patient actions, attributed to the patient', async () => {
      await join(1);
      await join(2);
      const first = (await release()).body.offer;
      await patientDecline(first.id, 1);
      const second = (await release({})).body.offer;
      await patientAccept(second.id, 2);

      const rows = (await t.db('audit_log').orderBy('id')).filter((a) => a.action.startsWith('offer_'));
      expect(rows.map((r) => [r.action, r.actor_type, r.actor_id])).toEqual([
        ['offer_declined', 'patient', 1],
        ['offer_accepted', 'patient', 2],
      ]);
    });

    it('writes no audit record when the audit table is unavailable, and changes nothing', async () => {
      const { offer } = await telephoneHolder();
      await t.db.schema.dropTable('audit_log');

      const res = await recordAccept(offer.id);

      expect(res.status).toBe(500);
      expect(await offerRow(offer.id)).toMatchObject({ status: 'outstanding' });
      expect(await entryRow(offer.entryId)).toMatchObject({ status: 'notified' });
      expect(await slotRow(offer.slotId)).toMatchObject({ status: 'offered' });
    });
  });

  describe('only one response resolves an offer (3.5)', () => {
    it('refuses a recorded accept after the offer was passed on, leaving the new offer alone', async () => {
      const { offer } = await telephoneHolder();
      const passed = (await pass(offer.id)).body.offer;
      const auditBefore = await actions();

      const res = await recordAccept(offer.id);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('offer_not_available');
      expect(await offerRow(offer.id)).toMatchObject({ status: 'passed_on' });
      expect(await offerRow(passed.id)).toMatchObject({ status: 'outstanding' });
      expect(await statuses()).toEqual(['waiting', 'notified', 'waiting']);
      expect(await actions()).toEqual(auditBefore);
    });

    it('refuses a recorded decline after the offer was passed on', async () => {
      const { offer } = await telephoneHolder();
      await pass(offer.id);

      const res = await recordDecline(offer.id);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('offer_not_available');
    });

    it.each([
      ['accept', recordAccept, 'accepted'],
      ['decline', recordDecline, 'declined'],
    ])('refuses a pass-on after a recorded %s, keeping the recorded outcome', async (_label, record, outcome) => {
      const { offer } = await telephoneHolder();
      await record(offer.id);
      const stateBefore = { statuses: await statuses(), actions: await actions() };

      const res = await pass(offer.id);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('offer_not_available');
      expect(await offerRow(offer.id)).toMatchObject({ status: outcome });
      expect(await statuses()).toEqual(stateBefore.statuses);
      expect(await actions()).toEqual(stateBefore.actions);
    });

    it('refuses a second recorded response', async () => {
      const { offer } = await telephoneHolder();
      await recordDecline(offer.id);

      const res = await recordAccept(offer.id);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('offer_not_available');
      expect(await offerRow(offer.id)).toMatchObject({ status: 'declined' });
    });

    it('applies exactly one of a recorded accept and a pass-on arriving together', async () => {
      const { offer } = await telephoneHolder();

      const [a, b] = await Promise.all([recordAccept(offer.id), pass(offer.id)]);

      expect([a.status, b.status].sort()).toEqual([200, 409]);
      const notified = await t.db('waitlist_entries').where({ status: 'notified' });
      const outstanding = await t.db('slot_offers').where({ status: 'outstanding' });
      expect(notified.length).toBe(outstanding.length);
      expect((await t.db('audit_log').whereIn('action', ['offer_accepted_by_staff', 'offer_passed_on'])).length).toBe(1);
    });

    it('applies exactly one of two recorded responses arriving together', async () => {
      const { offer } = await telephoneHolder();

      const [a, b] = await Promise.all([recordAccept(offer.id), recordDecline(offer.id)]);

      expect([a.status, b.status].sort()).toEqual([200, 409]);
      const resolved = await offerRow(offer.id);
      expect(['accepted', 'declined']).toContain(resolved.status);
      expect((await t.db('audit_log').whereIn('action', ['offer_accepted_by_staff', 'offer_declined_by_staff'])).length).toBe(1);
    });

    it('tells an in-app patient the offer is no longer available when staff passed it on first', async () => {
      await join(1);
      await join(2);
      const first = (await release()).body.offer;
      await pass(first.id);

      const res = await patientAccept(first.id, 1);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('offer_not_available');
      expect(await statuses()).toEqual(['waiting', 'notified']);
    });
  });
});

import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildTestApp, type TestApp } from '../test/testApp.js';

const SLOT = '2026-10-02T10:30:00.000Z';

/**
 * Rules the built code already satisfies. They get tests here and no source change: a failure means
 * the code does not meet the spec and the change needs to be reopened, not that the test is wrong.
 * Seed: patients 1, 2, 3 are in-app; 4 and 6 are telephone; 5 has no recorded preference.
 */
describe('regression: rules the built code already meets (6.1)', () => {
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
  const accept = (offerId: number, patientId: number) => request(t.app).post(`/offers/${offerId}/accept`).set('Authorization', asPatient(patientId));
  const decline = (offerId: number, patientId: number) => request(t.app).post(`/offers/${offerId}/decline`).set('Authorization', asPatient(patientId));
  const pass = (offerId: number) => request(t.app).post(`/offers/${offerId}/pass`).set('Authorization', asStaff());
  const count = async (table: string) => Number((await t.db(table).count({ n: '*' }).first())?.n);
  const statuses = async () => (await t.db('waitlist_entries').orderBy('id')).map((e) => e.status);

  describe('US-006: an unregistered person cannot be added', () => {
    it.each([7, 99, 1000])('returns 404 for person %i and creates no entry, no patient and no audit record', async (personId) => {
      const before = { entries: await count('waitlist_entries'), patients: await count('patients'), audit: await count('audit_log') };

      const res = await request(t.app).post(`/waitlist/patients/${personId}`).set('Authorization', asStaff());

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('patient_not_found');
      expect({ entries: await count('waitlist_entries'), patients: await count('patients'), audit: await count('audit_log') }).toEqual(before);
    });

    it('does not create a patient when an unregistered person tries to join for themselves', async () => {
      const before = { entries: await count('waitlist_entries'), patients: await count('patients') };

      const res = await request(t.app).post('/waitlist').set('Authorization', asPatient(99));

      expect(res.status).toBe(403);
      expect({ entries: await count('waitlist_entries'), patients: await count('patients') }).toEqual(before);
    });

    it('does not seed the person the V3 walkthrough uses as the unregistered caller', async () => {
      expect(await t.db('patients').where({ full_name: 'Sofía Reyes' }).first()).toBeUndefined();
    });
  });

  describe('BR-011: a patient sees and answers only their own offer', () => {
    it('shows another patient no sign of an offer held by someone else', async () => {
      await join(1);
      await join(2);
      await release();

      const other = (await request(t.app).get('/me/waitlist').set('Authorization', asPatient(2)).expect(200)).body.entry;

      expect(other).toMatchObject({ offer: null, holdsOffer: false });
      expect(JSON.stringify(other)).not.toContain(SLOT);
    });

    it.each([
      ['accept', accept],
      ['decline', decline],
    ])('refuses another patient who tries to %s it, changing nothing', async (_label, respond) => {
      await join(1);
      await join(2);
      const { offer } = (await release()).body;
      const auditBefore = await count('audit_log');

      const res = await respond(offer.id, 2);

      expect(res.status).toBe(403);
      expect(await statuses()).toEqual(['notified', 'waiting']);
      expect(await t.db('slot_offers').where({ id: offer.id }).first()).toMatchObject({ status: 'outstanding' });
      expect(await count('audit_log')).toBe(auditBefore);
    });

    it('has no endpoint that returns an offer or another patient\'s entry', async () => {
      await join(1);
      const { offer } = (await release()).body;

      expect((await request(t.app).get(`/offers/${offer.id}`).set('Authorization', asPatient(2))).status).toBe(404);
      expect((await request(t.app).get('/me/waitlist?patientId=1').set('Authorization', asPatient(2)).expect(200)).body.entry).toBeNull();
    });
  });

  describe('BR-012: the first action on an offer wins', () => {
    it('applies exactly one of an accept and a decline from the same patient arriving together', async () => {
      await join(1);
      await join(2);
      const { offer } = (await release()).body;

      const [a, b] = await Promise.all([accept(offer.id, 1), decline(offer.id, 1)]);

      expect([a.status, b.status].sort()).toEqual([200, 409]);
      const { status } = await t.db('slot_offers').where({ id: offer.id }).first();
      expect(['accepted', 'declined']).toContain(status);
      expect((await t.db('audit_log').whereIn('action', ['offer_accepted', 'offer_declined'])).length).toBe(1);
    });

    it('rejects a decline after an accept, and an accept after a decline, with offer_not_available', async () => {
      await join(1);
      await join(2);
      const first = (await release()).body.offer;
      await accept(first.id, 1);
      const afterAccept = await decline(first.id, 1);

      expect(afterAccept.status).toBe(409);
      expect(afterAccept.body.error).toBe('offer_not_available');
      expect(await t.db('slot_offers').where({ id: first.id }).first()).toMatchObject({ status: 'accepted' });
      expect((await t.db('waitlist_entries').where({ patient_id: 1 }).first()).status).toBe('booked');

      const second = (await release({ startsAt: '2026-10-09T10:30:00.000Z' })).body.offer;
      await decline(second.id, 2);
      const afterDecline = await accept(second.id, 2);

      expect(afterDecline.status).toBe(409);
      expect(afterDecline.body.error).toBe('offer_not_available');
      expect(await t.db('slot_offers').where({ id: second.id }).first()).toMatchObject({ status: 'declined' });
    });

    it('rejects a late action after a pass-on, telling the person the offer is no longer available', async () => {
      await join(1);
      await join(2);
      const { offer } = (await release()).body;
      await pass(offer.id);

      const res = await accept(offer.id, 1);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('offer_not_available');
      expect(await statuses()).toEqual(['waiting', 'notified']);
    });
  });

  describe('the screens hide these, the API keeps them', () => {
    it('still returns the position in the patient view', async () => {
      await join(1);
      await join(2);
      await join(3);

      const positions = await Promise.all([1, 2, 3].map(async (id) => (await request(t.app).get('/me/waitlist').set('Authorization', asPatient(id))).body.entry.position));

      expect(positions).toEqual([1, 2, 3]);
    });

    it('still lets a patient leave, moving everyone behind them up', async () => {
      const first = await join(1);
      await join(2);
      await join(3);

      const res = await request(t.app).delete(`/waitlist/${first}`).set('Authorization', asPatient(1));

      expect(res.status).toBe(200);
      expect(res.body.entry).toEqual({ id: first, status: 'removed' });
      expect((await request(t.app).get('/me/waitlist').set('Authorization', asPatient(2))).body.entry.position).toBe(1);
      expect((await request(t.app).get('/me/waitlist').set('Authorization', asPatient(3))).body.entry.position).toBe(2);
    });

    it('still lets staff remove a patient, and the removal is audited to the staff member', async () => {
      await join(1);
      const second = await join(2);

      const res = await request(t.app).delete(`/waitlist/${second}`).set('Authorization', asStaff(2));

      expect(res.status).toBe(200);
      const row = (await t.db('audit_log').orderBy('id')).find((a) => a.action === 'entry_removed');
      expect(row).toMatchObject({ actor_type: 'staff', actor_id: 2, entry_id: second });
    });

    it('still closes the offer when its holder leaves, and returns the slot to staff', async () => {
      const holder = await join(1);
      await join(2);
      const { offer } = (await release()).body;

      await request(t.app).delete(`/waitlist/${holder}`).set('Authorization', asPatient(1)).expect(200);

      expect(await t.db('slot_offers').where({ id: offer.id }).first()).toMatchObject({ status: 'closed' });
      expect(await t.db('slots').where({ id: offer.slotId }).first()).toMatchObject({ status: 'open' });
    });
  });
});

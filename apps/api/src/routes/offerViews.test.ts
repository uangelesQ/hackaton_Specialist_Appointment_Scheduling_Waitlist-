import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { MyWaitlistResponse, StaffWaitlistResponse } from '@waitlist/shared';
import { buildTestApp, type TestApp } from '../test/testApp.js';

const SLOT = '2026-10-02T10:30:00.000Z';

/** Seed: patients 1, 2, 3 are in-app; 4 and 6 are telephone; 5 has no recorded preference. */
describe('what staff and patients see of an offer', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await buildTestApp();
  });

  afterEach(async () => {
    await t.close();
  });

  const asPatient = (id: number) => t.bearer(t.patient(id));
  const asStaff = (id = 1) => t.bearer(t.staff(id));

  // Patient 5 has no recorded preference, so they can only be waiting as a legacy entry (BR-019).
  async function join(patientId: number): Promise<number> {
    if (patientId === 5) return t.addLegacyEntry(patientId);
    const res = await request(t.app).post('/waitlist').set('Authorization', asPatient(patientId));
    return res.body.entry.id;
  }
  const release = (body: object = { startsAt: SLOT }) => request(t.app).post('/offers').set('Authorization', asStaff()).send(body);
  const pass = (offerId: number) => request(t.app).post(`/offers/${offerId}/pass`).set('Authorization', asStaff());
  const accept = (offerId: number, patientId: number) => request(t.app).post(`/offers/${offerId}/accept`).set('Authorization', asPatient(patientId));
  const decline = (offerId: number, patientId: number) => request(t.app).post(`/offers/${offerId}/decline`).set('Authorization', asPatient(patientId));
  const staffView = async () => (await request(t.app).get('/waitlist').set('Authorization', asStaff()).expect(200)).body as StaffWaitlistResponse;
  const myView = async (patientId: number) => (await request(t.app).get('/me/waitlist').set('Authorization', asPatient(patientId)).expect(200)).body as MyWaitlistResponse;

  const statuses = async () => (await t.db('waitlist_entries').orderBy('id')).map((e) => e.status);

  describe('staff see contact preference and which offers need a call (4.1)', () => {
    it('shows each entry\'s contact preference, keeping "not recorded" distinct from telephone', async () => {
      await join(1);
      await join(4);
      await join(5);

      const view = await staffView();

      expect(view.entries.map((e) => [e.patientName, e.contactPreference])).toEqual([
        ['Maria Gómez', 'in_app'],
        ['Carlos Mendoza', 'telephone'],
        ['Ana Torres', null],
      ]);
    });

    it('flags an offer held by a telephone patient as requiring a call', async () => {
      await join(4);
      await join(1);
      await release();

      const { offer } = await staffView();

      expect(offer).toMatchObject({ requiresCall: true, slotStartsAt: SLOT });
    });

    it('flags an offer held by a not-recorded patient as requiring a call', async () => {
      await join(5);
      await join(1);
      await release();

      expect((await staffView()).offer).toMatchObject({ requiresCall: true });
    });

    it('does not flag an offer held by an in-app patient', async () => {
      await join(1);
      await join(4);
      await release();

      expect((await staffView()).offer).toMatchObject({ requiresCall: false });
    });

    it('carries when the offer was made, so the time outstanding can be shown', async () => {
      await join(4);
      const released = await release();

      const { offer } = await staffView();
      const row = await t.db('slot_offers').where({ id: released.body.offer.id }).first();

      expect(offer?.createdAt).toBe(row.created_at);
      expect(new Date(offer?.createdAt ?? '').toISOString()).toBe(offer?.createdAt);
    });

    it('moves the flag and the clock to the next patient after a pass-on', async () => {
      await join(4);
      await join(1);
      const first = await release();
      const before = (await staffView()).offer;

      await pass(first.body.offer.id);
      const after = (await staffView()).offer;

      expect(before).toMatchObject({ requiresCall: true });
      expect(after).toMatchObject({ requiresCall: false });
      expect(after?.id).not.toBe(before?.id);
      expect((after?.createdAt ?? '') > (before?.createdAt ?? '')).toBe(true);
    });

    it('has no offer, and so no flag, when nothing is outstanding', async () => {
      await join(4);

      expect((await staffView()).offer).toBeNull();
    });

    it('still names the holder on their row', async () => {
      const holder = await join(4);
      await join(1);
      await release();

      const view = await staffView();

      expect(view.offer?.entryId).toBe(holder);
      expect(view.entries.find((e) => e.id === holder)).toMatchObject({ holdsOffer: true, status: 'notified', contactPreference: 'telephone' });
    });
  });

  describe('the in-app banner is only for in-app patients (4.2)', () => {
    it('gives an in-app holder the banner data, the in-app channel and holdsOffer', async () => {
      await join(1);
      await join(4);
      await release();

      const { entry } = await myView(1);

      expect(entry).toMatchObject({
        status: 'notified',
        holdsOffer: true,
        responseChannel: 'in_app',
        offer: { slotStartsAt: SLOT, specialistName: 'Dr. Elena Ruiz' },
      });
    });

    it.each([
      ['a telephone patient', 4],
      ['a patient with no recorded preference', 5],
    ])('gives %s no banner, but says they hold the offer and that staff answer for them', async (_label, patientId) => {
      await join(patientId);
      await join(1);
      await release();

      const { entry } = await myView(patientId);

      expect(entry).toMatchObject({ status: 'notified', offer: null, holdsOffer: true, responseChannel: 'staff' });
    });

    it('keeps the position in the response for every preference, because only the screens hide it', async () => {
      await join(4);
      await join(5);
      await join(1);
      await release();

      expect((await myView(4)).entry?.position).toBe(1);
      expect((await myView(5)).entry?.position).toBe(2);
      expect((await myView(1)).entry?.position).toBe(3);
    });

    it('gives a patient without an offer no banner and holdsOffer false, with their own channel', async () => {
      await join(1);
      await join(2);
      await join(4);
      await release();

      expect((await myView(2)).entry).toMatchObject({ offer: null, holdsOffer: false, responseChannel: 'in_app' });
      expect((await myView(4)).entry).toMatchObject({ offer: null, holdsOffer: false, responseChannel: 'staff' });
    });

    it('gives a waiting patient their channel even when no offer exists', async () => {
      await join(5);

      expect((await myView(5)).entry).toMatchObject({ status: 'waiting', offer: null, holdsOffer: false, responseChannel: 'staff' });
    });

    it('stops showing the banner once the offer moves on', async () => {
      await join(1);
      await join(2);
      const first = await release();
      await pass(first.body.offer.id);

      expect((await myView(1)).entry).toMatchObject({ status: 'waiting', offer: null, holdsOffer: false });
      expect((await myView(2)).entry).toMatchObject({ status: 'notified', holdsOffer: true, offer: { slotStartsAt: SLOT } });
    });
  });

  describe('unseen and stale in-app offers (4.3)', () => {
    it('keeps an unanswered in-app offer outstanding however often the patient or staff look', async () => {
      await join(1);
      await join(2);
      const released = await release();
      const before = (await staffView()).offer;

      for (let i = 0; i < 5; i += 1) {
        await myView(1);
        await staffView();
      }
      const after = (await staffView()).offer;

      expect(after).toEqual(before);
      expect(await t.db('slot_offers').where({ id: released.body.offer.id }).first()).toMatchObject({ status: 'outstanding', resolved_at: null });
      expect((await myView(1)).entry).toMatchObject({ status: 'notified', holdsOffer: true });
    });

    it('lets staff pass on an in-app offer the patient never saw', async () => {
      await join(1);
      await join(2);
      const first = await release();

      const res = await pass(first.body.offer.id);

      expect(res.status).toBe(200);
      expect((await staffView()).offer).toMatchObject({ entryId: res.body.offer.entryId });
    });

    it.each([
      ['accepts', accept],
      ['declines', decline],
    ])('tells an in-app patient who %s after a pass-on that the offer is no longer available, and changes nothing', async (_label, respond) => {
      await join(1);
      await join(2);
      const first = await release();
      const passed = await pass(first.body.offer.id);
      const stateBefore = { statuses: await statuses(), audit: await t.db('audit_log').count({ n: '*' }).first() };

      const res = await respond(first.body.offer.id, 1);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('offer_not_available');
      expect(await statuses()).toEqual(stateBefore.statuses);
      expect(await t.db('audit_log').count({ n: '*' }).first()).toEqual(stateBefore.audit);
      expect(await t.db('slot_offers').where({ id: passed.body.offer.id }).first()).toMatchObject({ status: 'outstanding' });
      expect(await t.db('slots').first()).toMatchObject({ status: 'offered' });
    });

    it('shows the patient the current state afterwards: waiting, no banner', async () => {
      await join(1);
      await join(2);
      const first = await release();
      await pass(first.body.offer.id);
      await accept(first.body.offer.id, 1);

      expect((await myView(1)).entry).toMatchObject({ status: 'waiting', offer: null, holdsOffer: false });
    });
  });
});

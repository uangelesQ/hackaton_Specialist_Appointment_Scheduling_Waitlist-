import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { StaffWaitlistResponse } from '@waitlist/shared';
import { buildTestApp, type TestApp } from '../test/testApp.js';

const SLOT_A = '2026-10-02T10:30:00.000Z';
const SLOT_B = '2026-10-09T10:30:00.000Z';

/** Patients 1, 2 and 3 are in-app, so they answer offers themselves. */
describe('offer targeting', () => {
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
  const release = (body: object = { startsAt: SLOT_A }) => request(t.app).post('/offers').set('Authorization', asStaff()).send(body);
  const accept = (offerId: number, patientId: number) => request(t.app).post(`/offers/${offerId}/accept`).set('Authorization', asPatient(patientId));
  const decline = (offerId: number, patientId: number) => request(t.app).post(`/offers/${offerId}/decline`).set('Authorization', asPatient(patientId));
  const pass = (offerId: number) => request(t.app).post(`/offers/${offerId}/pass`).set('Authorization', asStaff());
  const staffView = async () => (await request(t.app).get('/waitlist').set('Authorization', asStaff()).expect(200)).body as StaffWaitlistResponse;
  const myView = async (patientId: number) =>
    (await request(t.app).get('/me/waitlist').set('Authorization', asPatient(patientId)).expect(200)).body;

  const entryRow = (id: number) => t.db('waitlist_entries').where({ id }).first();
  const slotRows = () => t.db('slots').orderBy('id');
  const offerCount = async () => Number((await t.db('slot_offers').count({ n: '*' }).first())?.n);
  const statuses = async () => (await t.db('waitlist_entries').orderBy('id')).map((e) => e.status);

  describe('next in line skips patients who declined or were passed over (2.1)', () => {
    it('skips a patient who declined that slot', async () => {
      await join(1);
      const e2 = await join(2);
      const first = await release();
      await decline(first.body.offer.id, 1);

      const again = await release({});

      expect(again.body.offer.entryId).toBe(e2);
    });

    it('skips a patient who was passed over for that slot', async () => {
      await join(1);
      await join(2);
      const e3 = await join(3);
      const first = await release();
      const toTwo = await pass(first.body.offer.id);
      await decline(toTwo.body.offer.id, 2);

      // Patient 1 (passed over) and patient 2 (declined) are both skipped, so it goes to 3,
      // even though 1 is first in line and waiting.
      const again = await release({});

      expect(again.status).toBe(201);
      expect(again.body.offer.entryId).toBe(e3);
    });

    it('keeps both eligible for a different slot, at their existing positions', async () => {
      const e1 = await join(1);
      const e2 = await join(2);
      await join(3);
      const first = await release({ startsAt: SLOT_A });
      const toTwo = await pass(first.body.offer.id);
      await decline(toTwo.body.offer.id, 2);
      const toThree = await release({});
      await accept(toThree.body.offer.id, 3);

      const next = await release({ startsAt: SLOT_B });

      expect(next.status).toBe(201);
      expect(next.body.offer.entryId).toBe(e1);
      expect(next.body.offer.slotStartsAt).toBe(SLOT_B);

      await decline(next.body.offer.id, 1);
      const afterDecline = await release({});
      expect(afterDecline.body.offer.entryId).toBe(e2);
    });

    it('does not change anyone else\'s position', async () => {
      await join(1);
      await join(2);
      await join(3);
      await release();

      expect((await myView(2)).entry.position).toBe(2);
      expect((await myView(3)).entry.position).toBe(3);
    });
  });

  describe('pass-on moves the offer to the next patient in line (2.2)', () => {
    it('offers the same slot to the next patient and returns the holder to waiting at the same position', async () => {
      const e1 = await join(1);
      const e2 = await join(2);
      await join(3);
      const first = await release();

      const res = await pass(first.body.offer.id);

      expect(res.status).toBe(200);
      expect(res.body.offer).toMatchObject({ entryId: e2, slotId: first.body.offer.slotId, slotStartsAt: SLOT_A });
      expect(res.body.offer.id).not.toBe(first.body.offer.id);
      expect(await entryRow(e1)).toMatchObject({ status: 'waiting' });
      expect((await myView(1)).entry).toMatchObject({ status: 'waiting', position: 1, offer: null });
      expect(await statuses()).toEqual(['waiting', 'notified', 'waiting']);
      expect(await t.db('slot_offers').where({ id: first.body.offer.id }).first()).toMatchObject({ status: 'passed_on' });
    });

    it('keeps the slot with staff and raises no offer when nobody else is eligible', async () => {
      const e1 = await join(1);
      const first = await release();

      const res = await pass(first.body.offer.id);

      expect(res.body.offer).toBeNull();
      expect(await entryRow(e1)).toMatchObject({ status: 'waiting' });
      expect(await offerCount()).toBe(1);
      expect(await slotRows()).toEqual([expect.objectContaining({ id: first.body.offer.slotId, status: 'open', starts_at: SLOT_A })]);
    });

    it('does not offer the slot to a patient ahead of the holder who declined it', async () => {
      await join(1);
      await join(2);
      const first = await release();
      await decline(first.body.offer.id, 1);
      const toTwo = await release({});

      const res = await pass(toTwo.body.offer.id);

      expect(res.body.offer).toBeNull();
      expect(await statuses()).toEqual(['waiting', 'waiting']);
    });

    it('does not offer the slot back to the holder it was just passed from', async () => {
      await join(1);
      await join(2);
      const first = await release();
      const toTwo = await pass(first.body.offer.id);

      const res = await pass(toTwo.body.offer.id);

      expect(res.body.offer).toBeNull();
    });
  });

  describe('release when nobody is eligible (2.3)', () => {
    it('treats passed-over like declined: no release, with the reason shown to staff', async () => {
      await join(1);
      await join(2);
      const first = await release();
      const toTwo = await pass(first.body.offer.id);
      await pass(toTwo.body.offer.id);

      const view = await staffView();

      expect(view.release).toEqual({ available: false, reason: 'all_waiting_declined', openSlotStartsAt: SLOT_A });
    });

    it('treats a mix of declined and passed-over the same way', async () => {
      await join(1);
      await join(2);
      const first = await release();
      const toTwo = await pass(first.body.offer.id);
      await decline(toTwo.body.offer.id, 2);

      expect((await staffView()).release).toMatchObject({ available: false, reason: 'all_waiting_declined' });
    });

    it('rejects a release with no_eligible_patient and creates no offer', async () => {
      await join(1);
      await join(2);
      const first = await release();
      const toTwo = await pass(first.body.offer.id);
      await pass(toTwo.body.offer.id);
      const offersBefore = await offerCount();

      const res = await release({});

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('no_eligible_patient');
      expect(await offerCount()).toBe(offersBefore);
      expect(await statuses()).toEqual(['waiting', 'waiting']);
    });

    it('offers release again once a new patient joins', async () => {
      await join(1);
      const first = await release();
      await pass(first.body.offer.id);
      expect((await staffView()).release.available).toBe(false);

      const e3 = await join(3);

      expect((await staffView()).release).toEqual({ available: true, reason: null, openSlotStartsAt: SLOT_A });
      const res = await release({});
      expect(res.body.offer.entryId).toBe(e3);
    });
  });

  describe('a booked slot cannot be released again (2.4)', () => {
    async function bookSlotA() {
      await join(1);
      await join(2);
      const first = await release({ startsAt: SLOT_A });
      await accept(first.body.offer.id, 1);
      return first;
    }

    it('marks the slot booked once accepted', async () => {
      const first = await bookSlotA();

      expect(await t.db('slots').where({ id: first.body.offer.slotId }).first()).toMatchObject({ status: 'booked', starts_at: SLOT_A });
    });

    it('rejects a release at the same date and time with slot_already_booked, creating nothing', async () => {
      await bookSlotA();
      const slotsBefore = (await slotRows()).length;
      const offersBefore = await offerCount();

      const res = await release({ startsAt: SLOT_A });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('slot_already_booked');
      expect((await slotRows()).length).toBe(slotsBefore);
      expect(await offerCount()).toBe(offersBefore);
      expect(await statuses()).toEqual(['booked', 'waiting']);
    });

    it.each([
      ['without milliseconds', '2026-10-02T10:30:00Z'],
      ['with extra precision', '2026-10-02T10:30:00.0000Z'],
    ])('recognises the same instant written %s', async (_label, startsAt) => {
      await bookSlotA();

      const res = await release({ startsAt });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('slot_already_booked');
    });

    it('still lets staff release a different time after one is booked', async () => {
      await bookSlotA();

      const res = await release({ startsAt: SLOT_B });

      expect(res.status).toBe(201);
      expect(res.body.offer.slotStartsAt).toBe(SLOT_B);
    });

    it('stores a new slot as a canonical instant', async () => {
      await join(1);

      await release({ startsAt: '2026-10-02T10:30:00Z' }).expect(201);

      expect((await slotRows())[0]?.starts_at).toBe(SLOT_A);
    });

    it('does not offer a booked slot as the returned slot', async () => {
      await bookSlotA();

      const view = await staffView();

      expect(view.release.openSlotStartsAt).toBeNull();
    });

    it('gives a returned slot back with exactly the date and time it had', async () => {
      await join(1);
      await join(2);
      const first = await release({ startsAt: SLOT_A });
      await decline(first.body.offer.id, 1);

      const again = await release({});

      expect(again.body.offer.slotId).toBe(first.body.offer.slotId);
      expect(again.body.offer.slotStartsAt).toBe(SLOT_A);
      expect((await slotRows())).toHaveLength(1);
    });

    it('keeps the returned slot\'s time after a pass-on with nobody left', async () => {
      await join(1);
      const first = await release({ startsAt: SLOT_A });
      await pass(first.body.offer.id);

      expect((await staffView()).release.openSlotStartsAt).toBe(SLOT_A);
    });
  });
});

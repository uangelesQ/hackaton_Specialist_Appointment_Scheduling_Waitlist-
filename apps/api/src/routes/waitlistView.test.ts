import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildTestApp, type TestApp } from '../test/testApp.js';

describe('waitlist visibility', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await buildTestApp();
  });

  afterEach(async () => {
    await t.close();
  });

  const join = (patientId: number) =>
    request(t.app).post('/waitlist').set('Authorization', t.bearer(t.patient(patientId)));
  const leave = (entryId: number, token: string) =>
    request(t.app).delete(`/waitlist/${entryId}`).set('Authorization', t.bearer(token));
  const myWaitlist = (patientId: number) =>
    request(t.app).get('/me/waitlist').set('Authorization', t.bearer(t.patient(patientId)));
  const staffList = () => request(t.app).get('/waitlist').set('Authorization', t.bearer(t.staff(1)));

  /** Puts an outstanding offer on an entry directly; the release endpoint comes later. */
  async function giveOffer(entryId: number) {
    await t.db('waitlist_entries').where({ id: entryId }).update({ status: 'notified' });
    await t.db('slots').insert({ starts_at: '2026-10-02T10:30:00.000Z', status: 'offered' });
    await t.db('slot_offers').insert({
      slot_id: 1,
      entry_id: entryId,
      status: 'outstanding',
      created_at: '2026-10-01T09:30:00.000Z',
      released_by: 1,
    });
  }

  describe('patient views own position (4.2)', () => {
    it('shows the position as a number with the join date and no total', async () => {
      const first = await join(1);
      await join(2);

      const res = await myWaitlist(2);

      expect(res.status).toBe(200);
      expect(res.body.entry).toMatchObject({ status: 'waiting', position: 2, joinedAt: expect.any(String), offer: null });
      expect(typeof res.body.entry.position).toBe('number');
      expect(res.body.entry.joinedAt > first.body.entry.joinedAt).toBe(true);
      expect(JSON.stringify(res.body)).not.toMatch(/total|count/i);
    });

    it('reflects changes made after the first look', async () => {
      const first = await join(1);
      await join(2);
      expect((await myWaitlist(2)).body.entry.position).toBe(2);

      await leave(first.body.entry.id, t.patient(1));
      expect((await myWaitlist(2)).body.entry.position).toBe(1);

      await join(3);
      expect((await myWaitlist(2)).body.entry.position).toBe(1);
      expect((await myWaitlist(3)).body.entry.position).toBe(2);
    });

    it('says the patient is not on the waitlist when they have no active entry', async () => {
      const res = await myWaitlist(1);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ entry: null });
    });

    it('treats a removed entry as not on the waitlist', async () => {
      const { body } = await join(1);
      await leave(body.entry.id, t.patient(1));

      expect((await myWaitlist(1)).body).toEqual({ entry: null });
    });

    it("never returns another patient's entry, even when asked for it", async () => {
      await join(1);
      await join(2);

      const res = await request(t.app)
        .get('/me/waitlist?patientId=1')
        .set('Authorization', t.bearer(t.patient(2)));

      expect(res.body.entry.position).toBe(2);
      expect(res.body.entry.patientId).toBeUndefined();
    });

    it('returns only the holder their outstanding offer, with slot time and specialist', async () => {
      const first = await join(1);
      await join(2);
      await giveOffer(first.body.entry.id);

      const holder = await myWaitlist(1);
      expect(holder.body.entry).toMatchObject({
        status: 'notified',
        position: 1,
        offer: { slotStartsAt: '2026-10-02T10:30:00.000Z', specialistName: 'Dr. Elena Ruiz' },
      });

      const other = await myWaitlist(2);
      expect(other.body.entry.offer).toBeNull();
      expect(other.body.entry.position).toBe(2);
    });

    it('denies staff, who have no entry of their own', async () => {
      const res = await request(t.app).get('/me/waitlist').set('Authorization', t.bearer(t.staff(1)));
      expect(res.status).toBe(403);
    });

    it('denies an unauthenticated request', async () => {
      const res = await request(t.app).get('/me/waitlist');
      expect(res.status).toBe(401);
    });
  });

  describe('staff views the waitlist (4.3)', () => {
    it('lists active entries in position order with identity and status', async () => {
      await join(3);
      await join(1);
      await request(t.app).post('/waitlist/patients/2').set('Authorization', t.bearer(t.staff(1)));

      const res = await staffList();

      expect(res.status).toBe(200);
      expect(res.body.entries).toEqual([
        expect.objectContaining({ position: 1, patientId: 3, patientName: 'Chloe Nguyen', status: 'waiting' }),
        expect.objectContaining({ position: 2, patientId: 1, patientName: 'Ana Torres', status: 'waiting' }),
        expect.objectContaining({ position: 3, patientId: 2, patientName: 'Ben Carter', status: 'waiting' }),
      ]);
      expect(res.body.entries[0].joinedAt).toEqual(expect.any(String));
      expect(res.body.offer).toBeNull();
    });

    it('leaves out closed entries and closes the gaps in position', async () => {
      const a = await join(1);
      const b = await join(2);
      await join(3);
      await leave(a.body.entry.id, t.patient(1));
      await t.db('waitlist_entries').where({ id: b.body.entry.id }).update({ status: 'booked' });

      const res = await staffList();

      expect(res.body.entries).toHaveLength(1);
      expect(res.body.entries[0]).toMatchObject({ patientId: 3, position: 1 });
    });

    it('returns an empty list when nobody is waiting', async () => {
      const res = await staffList();

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        entries: [],
        offer: null,
        release: { available: false, reason: 'no_waiting_patients', openSlotStartsAt: null },
      });
    });

    it('shows which patient holds the outstanding offer', async () => {
      await join(1);
      const second = await join(2);
      await giveOffer(second.body.entry.id);

      const res = await staffList();

      expect(res.body.offer).toEqual({
        id: 1,
        entryId: second.body.entry.id,
        slotStartsAt: '2026-10-02T10:30:00.000Z',
      });
      expect(res.body.entries.map((e: { status: string; holdsOffer: boolean }) => [e.status, e.holdsOffer])).toEqual([
        ['waiting', false],
        ['notified', true],
      ]);
    });

    it('denies a patient the full list', async () => {
      await join(1);
      const res = await request(t.app).get('/waitlist').set('Authorization', t.bearer(t.patient(1)));

      expect(res.status).toBe(403);
      expect(JSON.stringify(res.body)).not.toMatch(/Ana|Torres/);
    });

    it('denies an unauthenticated request', async () => {
      const res = await request(t.app).get('/waitlist');
      expect(res.status).toBe(401);
    });
  });
});

import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildTestApp, type TestApp } from '../test/testApp.js';

const SLOT = '2026-10-02T10:30:00.000Z';

describe('slot offers', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await buildTestApp();
  });

  afterEach(async () => {
    await t.close();
  });

  // --- helpers -------------------------------------------------------------
  const asPatient = (id: number) => t.bearer(t.patient(id));
  const asStaff = (id = 1) => t.bearer(t.staff(id));

  /** Joins a patient and returns their entry id. */
  async function join(patientId: number): Promise<number> {
    const res = await request(t.app).post('/waitlist').set('Authorization', asPatient(patientId));
    return res.body.entry.id;
  }
  const release = (body: object = { startsAt: SLOT }, staffId = 1) =>
    request(t.app).post('/offers').set('Authorization', asStaff(staffId)).send(body);
  const accept = (offerId: number, patientId: number) =>
    request(t.app).post(`/offers/${offerId}/accept`).set('Authorization', asPatient(patientId));
  const decline = (offerId: number, patientId: number) =>
    request(t.app).post(`/offers/${offerId}/decline`).set('Authorization', asPatient(patientId));
  const pass = (offerId: number, staffId = 1) =>
    request(t.app).post(`/offers/${offerId}/pass`).set('Authorization', asStaff(staffId));
  const leave = (entryId: number, token: string) =>
    request(t.app).delete(`/waitlist/${entryId}`).set('Authorization', t.bearer(token));
  const staffList = () => request(t.app).get('/waitlist').set('Authorization', asStaff());
  const myWaitlist = (patientId: number) =>
    request(t.app).get('/me/waitlist').set('Authorization', asPatient(patientId));

  const entryRow = (id: number) => t.db('waitlist_entries').where({ id }).first();
  const offerRow = (id: number) => t.db('slot_offers').where({ id }).first();
  const slotRow = (id: number) => t.db('slots').where({ id }).first();
  const statuses = async () => (await t.db('waitlist_entries').orderBy('id')).map((e) => e.status);
  const count = async (table: string) => Number((await t.db(table).count({ n: '*' }).first())?.n);
  const audit = () => t.db('audit_log').orderBy('id');
  const actions = async () => (await audit()).map((a) => a.action);

  /** Entry/offer/slot never disagree: each notified entry holds exactly the one outstanding offer. */
  async function expectConsistent() {
    const notified = await t.db('waitlist_entries').where({ status: 'notified' });
    const outstanding = await t.db('slot_offers').where({ status: 'outstanding' });
    expect(notified.length).toBe(outstanding.length);
    if (outstanding[0]) {
      expect(notified[0].id).toBe(outstanding[0].entry_id);
      expect((await slotRow(outstanding[0].slot_id)).status).toBe('offered');
    }
  }

  // --- 5.1 release ---------------------------------------------------------
  describe('staff releases a slot (5.1)', () => {
    it('offers the slot to the lowest-position waiting patient', async () => {
      const e1 = await join(1);
      await join(2);

      const res = await release();

      expect(res.status).toBe(201);
      expect(res.body.offer).toMatchObject({ entryId: e1, slotStartsAt: SLOT });
      expect((await entryRow(e1)).status).toBe('notified');
      expect(await statuses()).toEqual(['notified', 'waiting']);
      expect(await offerRow(res.body.offer.id)).toMatchObject({ status: 'outstanding', entry_id: e1, released_by: 1 });
      expect(await slotRow(res.body.offer.slotId)).toMatchObject({ starts_at: SLOT, status: 'offered' });
    });

    it('offers to position 1 even when that entry was added by staff', async () => {
      await request(t.app).post('/waitlist/patients/3').set('Authorization', asStaff());
      await join(1);

      const res = await release();

      expect((await entryRow(res.body.offer.entryId)).patient_id).toBe(3);
    });

    it('shows the holder the banner and nobody else', async () => {
      await join(1);
      await join(2);
      await release();

      const holder = await myWaitlist(1);
      expect(holder.body.entry).toMatchObject({
        status: 'notified',
        position: 1,
        offer: { slotStartsAt: SLOT, specialistName: 'Dr. Elena Ruiz' },
      });
      expect((await myWaitlist(2)).body.entry.offer).toBeNull();
    });

    it('keeps the notified patient at their position', async () => {
      await join(1);
      await join(2);
      await release();

      expect((await myWaitlist(1)).body.entry.position).toBe(1);
      expect((await myWaitlist(2)).body.entry.position).toBe(2);
    });

    it('is rejected when nobody is waiting, and creates no slot or offer', async () => {
      const res = await release();

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('no_eligible_patient');
      expect(await count('slots')).toBe(0);
      expect(await count('slot_offers')).toBe(0);
    });

    it('is rejected while an offer is outstanding', async () => {
      await join(1);
      await join(2);
      await release();

      const again = await release({ startsAt: '2026-10-03T09:00:00.000Z' });

      expect(again.status).toBe(409);
      expect(again.body.error).toBe('offer_outstanding');
      expect(await count('slot_offers')).toBe(1);
      expect(await statuses()).toEqual(['notified', 'waiting']);
    });

    it('creates exactly one offer when two staff release at the same moment', async () => {
      await join(1);
      await join(2);

      const [a, b] = await Promise.all([release({ startsAt: SLOT }, 1), release({ startsAt: SLOT }, 2)]);

      expect([a.status, b.status].sort()).toEqual([201, 409]);
      expect(await count('slot_offers')).toBe(1);
      expect(await statuses()).toEqual(['notified', 'waiting']);
    });

    it('needs a slot date and time when there is no returned slot', async () => {
      await join(1);

      const missing = await release({});
      const invalid = await release({ startsAt: 'next thursday' });

      expect(missing.status).toBe(400);
      expect(invalid.status).toBe(400);
      expect(await statuses()).toEqual(['waiting']);
    });

    it('is audited with the staff member, the slot and the time', async () => {
      const e1 = await join(1);
      const res = await release({ startsAt: SLOT }, 2);

      const row = (await audit()).find((a) => a.action === 'slot_released');
      expect(row).toMatchObject({ actor_type: 'staff', actor_id: 2, slot_id: res.body.offer.slotId, entry_id: e1 });
      expect(row.at).toEqual(expect.any(String));
    });

    it('leaves nobody notified and no offer behind when it fails part-way', async () => {
      await join(1);
      await t.db.schema.dropTable('audit_log');

      const res = await release();

      expect(res.status).toBe(500);
      expect(await statuses()).toEqual(['waiting']);
      expect(await count('slot_offers')).toBe(0);
      expect(await count('slots')).toBe(0);
    });

    it('is staff-only and needs a token', async () => {
      await join(1);

      const patient = await request(t.app).post('/offers').set('Authorization', asPatient(1)).send({ startsAt: SLOT });
      const anonymous = await request(t.app).post('/offers').send({ startsAt: SLOT });

      expect(patient.status).toBe(403);
      expect(anonymous.status).toBe(401);
      expect(await count('slot_offers')).toBe(0);
    });
  });

  describe('what the staff view offers (5.1, 5.2)', () => {
    it('offers release when someone is waiting and no offer is outstanding', async () => {
      await join(1);

      const res = await staffList();

      expect(res.body.release).toEqual({ available: true, reason: null, openSlotStartsAt: null });
    });

    it('offers no release when nobody is waiting', async () => {
      const res = await staffList();

      expect(res.body.release).toEqual({ available: false, reason: 'no_waiting_patients', openSlotStartsAt: null });
    });

    it('offers no release while an offer is outstanding', async () => {
      await join(1);
      await release();

      const res = await staffList();

      expect(res.body.release).toMatchObject({ available: false, reason: 'offer_outstanding' });
    });
  });

  // --- 5.2 returned slots --------------------------------------------------
  describe('returned slots (5.2)', () => {
    it('keeps a declined slot open and releases it again with the same date and time', async () => {
      await join(1);
      await join(2);
      const first = await release();
      await decline(first.body.offer.id, 1);

      expect(await slotRow(first.body.offer.slotId)).toMatchObject({ status: 'open', starts_at: SLOT });
      expect((await staffList()).body.release).toEqual({ available: true, reason: null, openSlotStartsAt: SLOT });

      const again = await release({});

      expect(again.status).toBe(201);
      expect(again.body.offer.slotId).toBe(first.body.offer.slotId);
      expect(again.body.offer.slotStartsAt).toBe(SLOT);
    });

    it('ignores a different date and time while a returned slot is open', async () => {
      await join(1);
      await join(2);
      const first = await release();
      await decline(first.body.offer.id, 1);

      const again = await release({ startsAt: '2026-12-24T08:00:00.000Z' });

      expect(again.body.offer.slotStartsAt).toBe(SLOT);
      expect(await count('slots')).toBe(1);
    });

    it('skips the patient who declined that slot', async () => {
      await join(1);
      const e2 = await join(2);
      const first = await release();
      await decline(first.body.offer.id, 1);

      const again = await release({});

      expect(again.body.offer.entryId).toBe(e2);
      expect(await statuses()).toEqual(['waiting', 'notified']);
    });

    it('offers no release when every waiting patient has declined the returned slot', async () => {
      await join(1);
      await join(2);
      const first = await release();
      await decline(first.body.offer.id, 1);
      const second = await release({});
      await decline(second.body.offer.id, 2);

      const blocked = await release({});
      const view = await staffList();

      expect(blocked.status).toBe(409);
      expect(blocked.body.error).toBe('no_eligible_patient');
      expect(view.body.release).toEqual({ available: false, reason: 'all_waiting_declined', openSlotStartsAt: SLOT });
      expect(await slotRow(first.body.offer.slotId)).toMatchObject({ status: 'open' });
    });

    it('offers the returned slot to a patient who joined after the others declined', async () => {
      await join(1);
      const first = await release();
      await decline(first.body.offer.id, 1);
      const e3 = await join(3);

      const again = await release({});

      expect(again.body.offer.entryId).toBe(e3);
    });

    it('keeps a decliner eligible for a future slot', async () => {
      const e1 = await join(1);
      await join(2);
      const first = await release();
      await decline(first.body.offer.id, 1);
      const second = await release({});
      await accept(second.body.offer.id, 2);

      const next = await release({ startsAt: '2026-10-09T10:30:00.000Z' });

      expect(next.status).toBe(201);
      expect(next.body.offer.entryId).toBe(e1);
    });
  });

  // --- 5.3 accept ----------------------------------------------------------
  describe('patient accepts (5.3)', () => {
    it('books the slot, closes the entry as booked, and moves later entries up', async () => {
      const e1 = await join(1);
      await join(2);
      await join(3);
      const { body } = await release();

      const res = await accept(body.offer.id, 1);

      expect(res.status).toBe(200);
      expect(res.body.booking).toEqual({
        slotId: body.offer.slotId,
        slotStartsAt: SLOT,
        specialistName: 'Dr. Elena Ruiz',
      });
      expect(await entryRow(e1)).toMatchObject({ status: 'booked' });
      expect((await entryRow(e1)).closed_at).not.toBeNull();
      expect(await offerRow(body.offer.id)).toMatchObject({ status: 'accepted' });
      expect(await slotRow(body.offer.slotId)).toMatchObject({ status: 'booked' });
      expect((await myWaitlist(2)).body.entry.position).toBe(1);
      expect((await myWaitlist(3)).body.entry.position).toBe(2);
      expect((await myWaitlist(1)).body.entry).toBeNull();
      expect((await staffList()).body.offer).toBeNull();
    });

    it('rejects a patient who does not hold the offer and changes nothing', async () => {
      await join(1);
      await join(2);
      const { body } = await release();

      const res = await accept(body.offer.id, 2);

      expect(res.status).toBe(403);
      expect(await offerRow(body.offer.id)).toMatchObject({ status: 'outstanding' });
      expect(await statuses()).toEqual(['notified', 'waiting']);
    });

    it('tells the holder the offer is no longer available once it is answered', async () => {
      await join(1);
      const { body } = await release();
      await accept(body.offer.id, 1);

      const again = await accept(body.offer.id, 1);

      expect(again.status).toBe(409);
      expect(again.body.error).toBe('offer_not_available');
    });

    it('tells a former holder the offer is no longer available after a pass-on', async () => {
      await join(1);
      await join(2);
      const { body } = await release();
      await pass(body.offer.id);

      const res = await accept(body.offer.id, 1);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('offer_not_available');
      expect(await statuses()).toEqual(['waiting', 'notified']);
    });

    it('returns 404 for an unknown offer, 403 for staff and 401 without a token', async () => {
      await join(1);
      const { body } = await release();

      expect((await accept(99, 1)).status).toBe(404);
      expect(
        (await request(t.app).post(`/offers/${body.offer.id}/accept`).set('Authorization', asStaff())).status,
      ).toBe(403);
      expect((await request(t.app).post(`/offers/${body.offer.id}/accept`)).status).toBe(401);
      expect(await offerRow(body.offer.id)).toMatchObject({ status: 'outstanding' });
    });
  });

  // --- 5.4 decline ---------------------------------------------------------
  describe('patient declines (5.4)', () => {
    it('keeps the entry waiting at the same position and notifies nobody else', async () => {
      const e1 = await join(1);
      await join(2);
      await join(3);
      const { body } = await release();

      const res = await decline(body.offer.id, 1);

      expect(res.status).toBe(200);
      expect(res.body.entry).toEqual({ id: e1, status: 'waiting', position: 1 });
      expect(await offerRow(body.offer.id)).toMatchObject({ status: 'declined' });
      expect(await statuses()).toEqual(['waiting', 'waiting', 'waiting']);
      expect(await count('slot_offers')).toBe(1);
      expect((await staffList()).body.offer).toBeNull();
      expect((await myWaitlist(2)).body.entry.offer).toBeNull();
    });

    it('rejects a patient who does not hold the offer', async () => {
      await join(1);
      await join(2);
      const { body } = await release();

      const res = await decline(body.offer.id, 2);

      expect(res.status).toBe(403);
      expect(await offerRow(body.offer.id)).toMatchObject({ status: 'outstanding' });
    });

    it('rejects a second answer to the same offer', async () => {
      await join(1);
      const { body } = await release();
      await decline(body.offer.id, 1);

      const again = await decline(body.offer.id, 1);

      expect(again.status).toBe(409);
      expect(again.body.error).toBe('offer_not_available');
    });
  });

  // --- 5.5 pass-on ---------------------------------------------------------
  describe('staff passes an offer on (5.5)', () => {
    it('returns the holder to waiting and notifies the next eligible patient for the same slot', async () => {
      const e1 = await join(1);
      const e2 = await join(2);
      await join(3);
      const { body } = await release();

      const res = await pass(body.offer.id, 2);

      expect(res.status).toBe(200);
      expect(res.body.offer).toMatchObject({ entryId: e2, slotId: body.offer.slotId, slotStartsAt: SLOT });
      expect(await entryRow(e1)).toMatchObject({ status: 'waiting' });
      expect(await offerRow(body.offer.id)).toMatchObject({ status: 'passed_on' });
      expect(await statuses()).toEqual(['waiting', 'notified', 'waiting']);
      expect((await myWaitlist(1)).body.entry.position).toBe(1);
      expect((await myWaitlist(2)).body.entry.offer).toMatchObject({ slotStartsAt: SLOT });
      await expectConsistent();
    });

    it('only looks behind the holder, and raises no new offer when nobody is behind', async () => {
      await join(1);
      await join(2);
      const first = await release();
      const second = await pass(first.body.offer.id);

      const last = await pass(second.body.offer.id);

      expect(last.status).toBe(200);
      expect(last.body.offer).toBeNull();
      expect(await statuses()).toEqual(['waiting', 'waiting']);
      expect(await slotRow(first.body.offer.slotId)).toMatchObject({ status: 'open' });
      expect((await staffList()).body.release.available).toBe(true);
    });

    it('returns the only patient to waiting with no new offer', async () => {
      const e1 = await join(1);
      const { body } = await release();

      const res = await pass(body.offer.id);

      expect(res.body.offer).toBeNull();
      expect(await entryRow(e1)).toMatchObject({ status: 'waiting' });
      expect(await count('slot_offers')).toBe(1);
      expect(await slotRow(body.offer.slotId)).toMatchObject({ status: 'open' });
    });

    it('skips a patient behind the holder who declined this slot', async () => {
      await join(1);
      const e2 = await join(2);
      const e3 = await join(3);
      const first = await release();
      const toTwo = await pass(first.body.offer.id);
      expect(toTwo.body.offer.entryId).toBe(e2);
      await decline(toTwo.body.offer.id, 2);
      const again = await release({});
      expect(again.body.offer.entryId).not.toBe(e2);

      const res = await pass(again.body.offer.id);

      expect(res.body.offer.entryId).toBe(e3);
    });

    it('is audited with the staff member, the slot and the time', async () => {
      const e1 = await join(1);
      await join(2);
      const { body } = await release();
      await pass(body.offer.id, 2);

      const row = (await audit()).find((a) => a.action === 'offer_passed_on');
      expect(row).toMatchObject({ actor_type: 'staff', actor_id: 2, slot_id: body.offer.slotId, entry_id: e1 });
      expect(row.at).toEqual(expect.any(String));
    });

    it('lets exactly one of a simultaneous accept and pass-on succeed', async () => {
      await join(1);
      await join(2);
      const { body } = await release();

      const [a, b] = await Promise.all([accept(body.offer.id, 1), pass(body.offer.id)]);

      expect([a.status, b.status].sort()).toEqual([200, 409]);
      await expectConsistent();
    });

    it('is staff-only, needs a token, and rejects an offer that is no longer outstanding', async () => {
      await join(1);
      await join(2);
      const { body } = await release();

      expect((await request(t.app).post(`/offers/${body.offer.id}/pass`).set('Authorization', asPatient(1))).status).toBe(403);
      expect((await request(t.app).post(`/offers/${body.offer.id}/pass`)).status).toBe(401);
      expect((await pass(99)).status).toBe(404);

      await decline(body.offer.id, 1);
      const late = await pass(body.offer.id);
      expect(late.status).toBe(409);
      expect(late.body.error).toBe('offer_not_available');
    });
  });

  // --- 5.6 removal closes the offer ---------------------------------------
  describe('removing the offer holder (5.6)', () => {
    it.each([
      ['the patient', (id: number) => t.patient(id)],
      ['staff', () => t.staff(1)],
    ])('closes the offer and returns the slot when %s removes the holder', async (_who, token) => {
      const e1 = await join(1);
      await join(2);
      const { body } = await release();

      const res = await leave(e1, token(1));

      expect(res.status).toBe(200);
      expect(await entryRow(e1)).toMatchObject({ status: 'removed' });
      expect(await offerRow(body.offer.id)).toMatchObject({ status: 'closed' });
      expect(await slotRow(body.offer.slotId)).toMatchObject({ status: 'open', starts_at: SLOT });
      expect(await statuses()).toEqual(['removed', 'waiting']);
      expect(await count('slot_offers')).toBe(1);
    });

    it('lets staff release the returned slot again with the same date and time', async () => {
      const e1 = await join(1);
      const e2 = await join(2);
      const first = await release();
      await leave(e1, t.staff(1));

      const again = await release({});

      expect(again.status).toBe(201);
      expect(again.body.offer).toMatchObject({ slotId: first.body.offer.slotId, slotStartsAt: SLOT, entryId: e2 });
    });

    it('leaves the outstanding offer alone when someone else is removed', async () => {
      await join(1);
      const e2 = await join(2);
      const { body } = await release();

      await leave(e2, t.patient(2));

      expect(await offerRow(body.offer.id)).toMatchObject({ status: 'outstanding' });
      expect(await statuses()).toEqual(['notified', 'removed']);
      await expectConsistent();
    });
  });

  // --- 5.7 audit and atomicity --------------------------------------------
  describe('audit and atomic transitions (5.7)', () => {
    it('records release, decline, accept, pass-on and closure with actor, slot and time', async () => {
      const e1 = await join(1);
      await join(2);
      await join(3);
      const first = await release({ startsAt: SLOT }, 1);
      await decline(first.body.offer.id, 1);
      const second = await release({}, 2);
      const third = await pass(second.body.offer.id, 1);
      await accept(third.body.offer.id, 3);
      await release({ startsAt: '2026-10-09T10:30:00.000Z' }, 2);
      await leave(e1, t.patient(1));

      const rows = (await audit()).filter((a) => a.action !== 'entry_created');
      expect(rows.map((r) => [r.action, r.actor_type, r.actor_id])).toEqual([
        ['slot_released', 'staff', 1],
        ['offer_declined', 'patient', 1],
        ['slot_released', 'staff', 2],
        ['offer_passed_on', 'staff', 1],
        ['offer_accepted', 'patient', 3],
        ['slot_released', 'staff', 2],
        ['entry_removed', 'patient', 1],
        ['offer_closed', 'patient', 1],
      ]);
      for (const row of rows) {
        expect(row.at).toEqual(expect.any(String));
        if (row.action !== 'entry_removed') expect(row.slot_id).not.toBeNull();
      }
    });

    describe.each([
      ['accept', (offerId: number) => accept(offerId, 1)],
      ['decline', (offerId: number) => decline(offerId, 1)],
      ['pass-on', (offerId: number) => pass(offerId)],
    ])('when the audit record cannot be written during %s', (_name, act) => {
      it('leaves entry, offer and slot exactly as they were', async () => {
        const e1 = await join(1);
        await join(2);
        const { body } = await release();
        await t.db.schema.dropTable('audit_log');

        const res = await act(body.offer.id);

        expect(res.status).toBe(500);
        expect(await entryRow(e1)).toMatchObject({ status: 'notified', closed_at: null });
        expect(await offerRow(body.offer.id)).toMatchObject({ status: 'outstanding', resolved_at: null });
        expect(await slotRow(body.offer.slotId)).toMatchObject({ status: 'offered' });
        expect(await statuses()).toEqual(['notified', 'waiting']);
        expect(await count('slot_offers')).toBe(1);
        await expectConsistent();
      });
    });

    it('leaves the holder, offer and slot untouched when removal of the holder fails to audit', async () => {
      const e1 = await join(1);
      const { body } = await release();
      await t.db.schema.dropTable('audit_log');

      const res = await leave(e1, t.patient(1));

      expect(res.status).toBe(500);
      expect(await entryRow(e1)).toMatchObject({ status: 'notified' });
      expect(await offerRow(body.offer.id)).toMatchObject({ status: 'outstanding' });
      expect(await slotRow(body.offer.slotId)).toMatchObject({ status: 'offered' });
    });

    it('writes no audit record for a rejected answer', async () => {
      await join(1);
      await join(2);
      const { body } = await release();
      const before = await actions();

      await accept(body.offer.id, 2);
      await decline(99, 1);
      await release({});

      expect(await actions()).toEqual(before);
    });
  });
});

import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type {
  AcceptResponse,
  DeclineResponse,
  JoinResponse,
  LoginResponse,
  MyWaitlistResponse,
  ReleaseResponse,
  StaffWaitlistResponse,
} from '@waitlist/shared';
import { buildTestApp, type TestApp } from '../test/testApp.js';

const SLOT = '2026-10-02T10:30:00.000Z';

/**
 * One story from first join to booked slot, driven only through the public HTTP API and the
 * demo sign-in, the same calls the web app makes. Unit and route tests cover each rule; this
 * proves the pieces work together.
 */
describe('waitlist end to end (7.1)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await buildTestApp();
  });

  afterEach(async () => {
    await t.close();
  });

  async function signIn(role: 'patient' | 'staff', id: number): Promise<string> {
    const res = await request(t.app).post('/demo/login').send({ role, id }).expect(200);
    return `Bearer ${(res.body as LoginResponse).token}`;
  }

  it('takes two patients from joining to one of them booking a slot', async () => {
    const ana = await signIn('patient', 1);
    const ben = await signIn('patient', 2);
    const staff = await signIn('staff', 1);

    const get = async <T>(path: string, auth: string) => (await request(t.app).get(path).set('Authorization', auth).expect(200)).body as T;
    const post = (path: string, auth: string, body?: object) => request(t.app).post(path).set('Authorization', auth).send(body ?? {});

    // 1. Two patients join, in order, with no phone call.
    const anaJoin = (await post('/waitlist', ana).expect(201)).body as JoinResponse;
    const benJoin = (await post('/waitlist', ben).expect(201)).body as JoinResponse;
    expect(anaJoin.entry.position).toBe(1);
    expect(benJoin.entry.position).toBe(2);

    // 2. Staff see both, in position order, and may release a slot.
    const before = await get<StaffWaitlistResponse>('/waitlist', staff);
    expect(before.entries.map((e) => [e.position, e.patientName, e.status])).toEqual([
      [1, 'Ana Torres', 'waiting'],
      [2, 'Ben Carter', 'waiting'],
    ]);
    expect(before.release).toMatchObject({ available: true, openSlotStartsAt: null });

    // 3. Staff release a slot: position 1 is notified, and release is blocked until it is answered.
    const released = (await post('/offers', staff, { startsAt: SLOT }).expect(201)).body as ReleaseResponse;
    expect(released.offer).toMatchObject({ entryId: anaJoin.entry.id, slotStartsAt: SLOT });
    expect((await get<StaffWaitlistResponse>('/waitlist', staff)).release).toMatchObject({
      available: false,
      reason: 'offer_outstanding',
    });

    // 4. Ana sees the banner for the slot, still at position 1. Ben sees none.
    const anaView = await get<MyWaitlistResponse>('/me/waitlist', ana);
    expect(anaView.entry).toMatchObject({
      status: 'notified',
      position: 1,
      offer: { id: released.offer.id, slotStartsAt: SLOT, specialistName: 'Dr. Elena Ruiz' },
    });
    expect((await get<MyWaitlistResponse>('/me/waitlist', ben)).entry?.offer).toBeNull();

    // 5. Ana declines: she keeps position 1, Ben is not notified, and the slot goes back to staff.
    const declined = (await post(`/offers/${released.offer.id}/decline`, ana).expect(200)).body as DeclineResponse;
    expect(declined.entry).toEqual({ id: anaJoin.entry.id, status: 'waiting', position: 1 });
    const afterDecline = await get<StaffWaitlistResponse>('/waitlist', staff);
    expect(afterDecline.entries.map((e) => [e.position, e.status])).toEqual([
      [1, 'waiting'],
      [2, 'waiting'],
    ]);
    expect(afterDecline.release).toEqual({ available: true, reason: null, openSlotStartsAt: SLOT });

    // 6. Staff release the same slot again: Ana declined it, so it goes to Ben.
    const releasedAgain = (await post('/offers', staff).expect(201)).body as ReleaseResponse;
    expect(releasedAgain.offer).toMatchObject({ entryId: benJoin.entry.id, slotId: released.offer.slotId, slotStartsAt: SLOT });
    expect((await get<MyWaitlistResponse>('/me/waitlist', ana)).entry).toMatchObject({ status: 'waiting', position: 1, offer: null });

    // 7. Ben accepts: the slot is booked for him.
    const booked = (await post(`/offers/${releasedAgain.offer.id}/accept`, ben).expect(200)).body as AcceptResponse;
    expect(booked.booking).toEqual({ slotId: released.offer.slotId, slotStartsAt: SLOT, specialistName: 'Dr. Elena Ruiz' });

    // 8. The booked entry has left the list; Ana is still first; nothing is outstanding.
    const after = await get<StaffWaitlistResponse>('/waitlist', staff);
    expect(after.entries.map((e) => [e.position, e.patientName, e.status])).toEqual([[1, 'Ana Torres', 'waiting']]);
    expect(after.offer).toBeNull();
    expect((await get<MyWaitlistResponse>('/me/waitlist', ben)).entry).toBeNull();
    expect((await get<MyWaitlistResponse>('/me/waitlist', ana)).entry?.position).toBe(1);

    // 9. Every step is attributed to whoever did it.
    const audit = await t.db('audit_log').orderBy('id');
    expect(audit.map((a) => [a.action, a.actor_type, a.actor_id])).toEqual([
      ['entry_created', 'patient', 1],
      ['entry_created', 'patient', 2],
      ['slot_released', 'staff', 1],
      ['offer_declined', 'patient', 1],
      ['slot_released', 'staff', 1],
      ['offer_accepted', 'patient', 2],
    ]);
    expect(await t.db('slots').first()).toMatchObject({ starts_at: SLOT, status: 'booked' });
  });
});

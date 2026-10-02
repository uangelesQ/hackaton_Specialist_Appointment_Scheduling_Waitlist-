import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type {
  AcceptResponse,
  DeclineResponse,
  JoinResponse,
  LoginResponse,
  MyWaitlistResponse,
  PassOnResponse,
  ReleaseResponse,
  StaffWaitlistResponse,
} from '@waitlist/shared';
import { seedDemoWaitlist } from '../db/seed.js';
import { buildTestApp, type TestApp } from '../test/testApp.js';

const SLOT_A = '2026-10-02T10:30:00.000Z';
const SLOT_B = '2026-10-09T10:30:00.000Z';

/**
 * The V3 demo script (docs/prototype-walkthroughV3.md), driven only through the public API and the
 * demo sign-in, as the web app does. It starts where `npm run seed` leaves the demo: Carlos
 * (telephone) and Ana (no recorded preference) already waiting.
 */
describe('telephone path end to end (6.2)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await buildTestApp();
    // Seed on the app's own clock: mixing the real clock with the test clock would reorder the line.
    await seedDemoWaitlist(t.db, t.clock);
  });

  afterEach(async () => {
    await t.close();
  });

  async function signIn(role: 'patient' | 'staff', id: number): Promise<string> {
    const res = await request(t.app).post('/demo/login').send({ role, id }).expect(200);
    return `Bearer ${(res.body as LoginResponse).token}`;
  }

  it('follows the walkthrough from the registry to a booked slot', async () => {
    const maria = await signIn('patient', 1);
    const carlos = await signIn('patient', 4);
    const staff = await signIn('staff', 1);

    const get = async <T>(path: string, auth: string) => (await request(t.app).get(path).set('Authorization', auth).expect(200)).body as T;
    const post = (path: string, auth: string, body?: object) => request(t.app).post(path).set('Authorization', auth).send(body ?? {});
    const staffView = () => get<StaffWaitlistResponse>('/waitlist', staff);
    const table = async () => (await staffView()).entries.map((e) => [e.position, e.patientName, e.status]);

    // Act 1: the registry. Carlos and Ana are already waiting; Maria joins herself.
    expect(await table()).toEqual([
      [1, 'Carlos Mendoza', 'waiting'],
      [2, 'Ana Torres', 'waiting'],
    ]);
    expect((await post('/waitlist', maria).expect(201)).body as JoinResponse).toMatchObject({ created: true });

    // Staff add Jorge, who phoned in, and he is tagged Telephone. Sofía is not registered: rejected, nothing created.
    await post('/waitlist/patients/6', staff).expect(201);
    const sofia = await post('/waitlist/patients/7', staff);
    expect(sofia.status).toBe(404);
    expect(sofia.body.error).toBe('patient_not_found');
    const view = await staffView();
    expect(view.entries.map((e) => [e.patientName, e.contactPreference])).toEqual([
      ['Carlos Mendoza', 'telephone'],
      ['Ana Torres', null],
      ['Maria Gómez', 'in_app'],
      ['Jorge Ramírez', 'telephone'],
    ]);
    expect(await t.db('patients').where({ full_name: 'Sofía Reyes' }).first()).toBeUndefined();

    // Act 2, beat 1: a slot opens and goes to whoever is next. Carlos is flagged "requires a call".
    const first = (await post('/offers', staff, { startsAt: SLOT_A }).expect(201)).body as ReleaseResponse;
    const offered = await staffView();
    expect(first.offer.entryId).toBe(offered.entries[0]?.id);
    expect(offered.offer).toMatchObject({ requiresCall: true, entryId: first.offer.entryId });
    expect(offered.entries[0]).toMatchObject({ patientName: 'Carlos Mendoza', status: 'notified', holdsOffer: true });
    // No banner anywhere for him, and he cannot answer in the app.
    expect((await get<MyWaitlistResponse>('/me/waitlist', carlos)).entry).toMatchObject({ offer: null, holdsOffer: true, responseChannel: 'staff' });
    expect((await post(`/offers/${first.offer.id}/accept`, carlos)).body.error).toBe('response_by_staff');

    // Staff call him; he says no. The offer closes and does NOT cascade to the next person.
    const declined = (await post(`/offers/${first.offer.id}/record-decline`, staff).expect(200)).body as DeclineResponse;
    expect(declined.entry).toMatchObject({ status: 'waiting', position: 1 });
    expect((await staffView()).offer).toBeNull();
    expect(await table()).toEqual([
      [1, 'Carlos Mendoza', 'waiting'],
      [2, 'Ana Torres', 'waiting'],
      [3, 'Maria Gómez', 'waiting'],
      [4, 'Jorge Ramírez', 'waiting'],
    ]);
    expect((await staffView()).release).toEqual({ available: true, reason: null, openSlotStartsAt: SLOT_A });

    // Act 2, beat 2: staff release it again. Ana is next, Carlos is skipped, and Ana is flagged too.
    const second = (await post('/offers', staff).expect(201)).body as ReleaseResponse;
    const anaOffer = await staffView();
    expect(second.offer).toMatchObject({ slotId: first.offer.slotId, slotStartsAt: SLOT_A });
    expect(anaOffer.entries.find((e) => e.holdsOffer)).toMatchObject({ patientName: 'Ana Torres', contactPreference: null });
    expect(anaOffer.offer?.requiresCall).toBe(true);

    // Staff cannot reach Ana: pass on. This one moves straight to the next person, who is Maria.
    const passed = (await post(`/offers/${second.offer.id}/pass`, staff).expect(200)).body as PassOnResponse;
    expect(passed.offer?.slotStartsAt).toBe(SLOT_A);
    const mariaOffer = await staffView();
    expect(mariaOffer.entries.find((e) => e.holdsOffer)).toMatchObject({ patientName: 'Maria Gómez', status: 'notified' });
    expect(mariaOffer.offer?.requiresCall).toBe(false);

    // Act 3: Maria gets the banner, the only moment a patient acts for themselves, and accepts.
    const banner = (await get<MyWaitlistResponse>('/me/waitlist', maria)).entry;
    expect(banner).toMatchObject({ status: 'notified', holdsOffer: true, responseChannel: 'in_app', offer: { slotStartsAt: SLOT_A, specialistName: 'Dr. Elena Ruiz' } });
    const booked = (await post(`/offers/${banner?.offer?.id}/accept`, maria).expect(200)).body as AcceptResponse;
    expect(booked.booking).toMatchObject({ slotStartsAt: SLOT_A, specialistName: 'Dr. Elena Ruiz' });

    // Maria is booked and gone from the list; Carlos and Ana are back at the top, nobody renumbered by hand.
    const after = await staffView();
    expect(after.offer).toBeNull();
    expect(after.entries.map((e) => [e.position, e.patientName, e.status])).toEqual([
      [1, 'Carlos Mendoza', 'waiting'],
      [2, 'Ana Torres', 'waiting'],
      [3, 'Jorge Ramírez', 'waiting'],
    ]);
    expect((await get<MyWaitlistResponse>('/me/waitlist', maria)).entry).toBeNull();

    // The slot is taken: it cannot be released again, however the time is written.
    expect(await t.db('slots').where({ id: first.offer.slotId }).first()).toMatchObject({ status: 'booked', starts_at: SLOT_A });
    for (const startsAt of [SLOT_A, '2026-10-02T10:30:00Z']) {
      const again = await post('/offers', staff, { startsAt });
      expect(again.status).toBe(409);
      expect(again.body.error).toBe('slot_already_booked');
    }

    // Carlos and Ana are not re-offered that slot, but they stay eligible for the next one, in order.
    const next = (await post('/offers', staff, { startsAt: SLOT_B }).expect(201)).body as ReleaseResponse;
    expect((await staffView()).entries.find((e) => e.holdsOffer)).toMatchObject({ patientName: 'Carlos Mendoza' });
    expect(next.offer.slotStartsAt).toBe(SLOT_B);

    // Every step is on the record, and staff-entered responses are distinguishable from the patient's own.
    const audit = (await t.db('audit_log').orderBy('id')).filter((a) => a.action !== 'entry_created');
    expect(audit.map((a) => [a.action, a.actor_type, a.actor_id])).toEqual([
      ['slot_released', 'staff', 1],
      ['offer_declined_by_staff', 'staff', 1],
      ['slot_released', 'staff', 1],
      ['offer_passed_on', 'staff', 1],
      ['offer_accepted', 'patient', 1],
      ['slot_released', 'staff', 1],
    ]);
  });
});

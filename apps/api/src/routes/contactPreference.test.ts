import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildTestApp, type TestApp } from '../test/testApp.js';

/** A patient sets and changes their own contact preference (US-012, US-013, BR-015). */
describe('PUT /me/contact-preference (2.1)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await buildTestApp();
  });

  afterEach(async () => {
    await t.close();
  });

  const put = (token: string, body: unknown) =>
    request(t.app).put('/me/contact-preference').set('Authorization', t.bearer(token)).send(body as object);
  const preferenceOf = async (id: number) => (await t.db('patients').where({ id }).first()).contact_preference;

  it('lets a patient with none set a first preference', async () => {
    const res = await put(t.patient(5), { contactPreference: 'in_app' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ contactPreference: 'in_app' });
    expect(await preferenceOf(5)).toBe('in_app');
  });

  it('lets a patient change their preference to the other option', async () => {
    const res = await put(t.patient(1), { contactPreference: 'telephone' });

    expect(res.status).toBe(200);
    expect(await preferenceOf(1)).toBe('telephone');
  });

  it("leaves a waiting patient's entry status and position unchanged", async () => {
    await request(t.app).post('/waitlist').set('Authorization', t.bearer(t.patient(1))).expect(201);
    await request(t.app).post('/waitlist').set('Authorization', t.bearer(t.patient(2))).expect(201);
    const before = await t.db('waitlist_entries').orderBy('id');

    await put(t.patient(2), { contactPreference: 'telephone' }).expect(200);

    expect(await t.db('waitlist_entries').orderBy('id')).toEqual(before);
    const mine = await request(t.app).get('/me/waitlist').set('Authorization', t.bearer(t.patient(2)));
    expect(mine.body.entry).toMatchObject({ status: 'waiting', position: 2 });
  });

  it('lets a patient with a booked entry, or with no entry, set it without creating or changing any entry', async () => {
    await t.db('waitlist_entries').insert({
      patient_id: 1,
      status: 'booked',
      joined_at: '2026-10-01T09:00:00.000Z',
      created_by_type: 'patient',
      created_by_id: 1,
    });
    const before = await t.db('waitlist_entries');

    await put(t.patient(1), { contactPreference: 'telephone' }).expect(200);
    await put(t.patient(3), { contactPreference: 'telephone' }).expect(200);

    expect(await t.db('waitlist_entries')).toEqual(before);
    expect(await preferenceOf(1)).toBe('telephone');
    expect(await preferenceOf(3)).toBe('telephone');
  });

  it("only ever changes the signed-in patient's own record", async () => {
    const before = (await t.db('patients').orderBy('id')).map((p) => p.contact_preference);

    await put(t.patient(2), { contactPreference: 'telephone', id: 1, patientId: 1 }).expect(200);

    const after = (await t.db('patients').orderBy('id')).map((p) => p.contact_preference);
    expect(after.filter((v, i) => v !== before[i])).toHaveLength(1);
    expect(await preferenceOf(1)).toBe('in_app');
    expect(await preferenceOf(2)).toBe('telephone');
  });

  it.each([{ contactPreference: 'sms' }, { contactPreference: '' }, { contactPreference: null }, {}, { contactPreference: 'IN_APP' }])(
    'rejects %j with 400 and changes nothing',
    async (body) => {
      const res = await put(t.patient(1), body);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'invalid_request' });
      expect(await preferenceOf(1)).toBe('in_app');
    },
  );

  it('answers 403 to a staff member and changes nothing', async () => {
    const res = await put(t.staff(1), { contactPreference: 'telephone' });

    expect(res.status).toBe(403);
    expect(await preferenceOf(1)).toBe('in_app');
  });

  it('answers 401 without a token', async () => {
    const res = await request(t.app).put('/me/contact-preference').send({ contactPreference: 'telephone' });

    expect(res.status).toBe(401);
  });

  it('audits the change with the actor and the previous and new values', async () => {
    await put(t.patient(1), { contactPreference: 'telephone' }).expect(200);

    expect(await t.db('audit_log')).toEqual([
      expect.objectContaining({
        action: 'contact_preference_set',
        actor_type: 'patient',
        actor_id: 1,
        patient_id: 1,
        previous_value: 'in_app',
        new_value: 'telephone',
      }),
    ]);
  });
});

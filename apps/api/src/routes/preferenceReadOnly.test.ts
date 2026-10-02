import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildTestApp, type TestApp } from '../test/testApp.js';

/**
 * A preference is written only through PUT /me/contact-preference (the patient) and by staff adding a
 * caller who has none. Every other route stays unrouted, and nobody can name another patient (BR-011, BR-015).
 */
describe('no other way to change the contact preference (2.2)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await buildTestApp();
  });

  afterEach(async () => {
    await t.close();
  });

  const preferences = async () =>
    (await t.db('patients').orderBy('id').select('id', 'contact_preference')).map((p) => [p.id, p.contact_preference]);

  const attempts: [string, string][] = [
    ['PATCH', '/patients/4'],
    ['PUT', '/patients/4'],
    ['PATCH', '/patients/4/contact-preference'],
    ['PUT', '/patients/4/contact-preference'],
    ['POST', '/patients/4/contact-preference'],
    ['PATCH', '/me'],
    ['PUT', '/me'],
    ['PATCH', '/me/contact-preference'],
    ['POST', '/me/contact-preference'],
    ['POST', '/patients'],
  ];

  describe.each([
    ['a patient', (id: number) => t.patient(id), 1],
    ['a staff member', (id: number) => t.staff(id), 1],
  ] as const)('when %s tries', (_who, token, id) => {
    it.each(attempts)('%s %s is not an endpoint and changes nothing', async (method, path) => {
      const before = await preferences();

      const verb = method.toLowerCase() as 'patch' | 'put' | 'post';
      const res = await request(t.app)[verb](path)
        .set('Authorization', t.bearer(token(id)))
        .send({ contactPreference: 'telephone', contact_preference: 'telephone' });

      expect(res.status).toBe(404);
      expect(await preferences()).toEqual(before);
    });
  });

  it('ignores a preference sent in the body of a release', async () => {
    await request(t.app).post('/waitlist').set('Authorization', t.bearer(t.patient(1))).expect(201);
    const before = await preferences();

    await request(t.app)
      .post('/offers')
      .set('Authorization', t.bearer(t.staff(1)))
      .send({ startsAt: '2026-10-02T10:30:00.000Z', contactPreference: 'telephone' })
      .expect(201);

    expect(await preferences()).toEqual(before);
  });

  it('ignores a preference sent in the body when a patient who already has one joins', async () => {
    const before = await preferences();

    await request(t.app)
      .post('/waitlist')
      .set('Authorization', t.bearer(t.patient(4)))
      .send({ contactPreference: 'in_app' })
      .expect(201);

    expect(await preferences()).toEqual(before);
  });
});

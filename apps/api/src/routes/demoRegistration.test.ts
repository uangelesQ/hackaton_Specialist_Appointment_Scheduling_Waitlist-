import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { buildTestApp, type TestApp } from '../test/testApp.js';

/** The demo-only registration step (PS-001 v2.5 Appendix A). */
describe('demo registration', () => {
  let t: TestApp;

  afterEach(async () => {
    await t.close();
  });

  const register = (body: unknown) => request(t.app).post('/demo/register').send(body as object);
  const patientCount = async () => Number((await t.db('patients').count({ n: '*' }).first())?.n);

  describe('registers and signs in (5.1)', () => {
    it('creates the patient with the chosen preference and signs them in', async () => {
      t = await buildTestApp();

      const res = await register({ name: 'Lucía Fernández', contactPreference: 'telephone' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        user: { role: 'patient', name: 'Lucía Fernández' },
        specialist: { name: 'Dr. Elena Ruiz', clinic: 'Cardiology' },
      });
      const row = await t.db('patients').where({ full_name: 'Lucía Fernández' }).first();
      expect(row).toMatchObject({ id: res.body.user.id, contact_preference: 'telephone' });
    });

    it('returns a token that works on patient routes and shows the preference', async () => {
      t = await buildTestApp();
      const res = await register({ name: 'Lucía Fernández', contactPreference: 'in_app' });

      const mine = await request(t.app).get('/me/waitlist').set('Authorization', `Bearer ${res.body.token}`);

      expect(mine.status).toBe(200);
      expect(mine.body).toEqual({ contactPreference: 'in_app', entry: null });
    });

    it('lets the new patient join without being asked to choose', async () => {
      t = await buildTestApp();
      const res = await register({ name: 'Lucía Fernández', contactPreference: 'in_app' });

      const join = await request(t.app).post('/waitlist').set('Authorization', `Bearer ${res.body.token}`);

      expect(join.status).toBe(201);
    });

    it('trims the name and audits the first choice with the new patient as actor', async () => {
      t = await buildTestApp();

      const res = await register({ name: '  Lucía Fernández  ', contactPreference: 'telephone' });

      expect(res.body.user.name).toBe('Lucía Fernández');
      expect(await t.db('audit_log')).toEqual([
        expect.objectContaining({
          action: 'contact_preference_set',
          actor_type: 'patient',
          actor_id: res.body.user.id,
          patient_id: res.body.user.id,
          previous_value: null,
          new_value: 'telephone',
        }),
      ]);
    });

    it('lists the new patient for sign-in', async () => {
      t = await buildTestApp();
      await register({ name: 'Lucía Fernández', contactPreference: 'in_app' });

      const users = await request(t.app).get('/demo/users');

      expect(users.body.patients.map((p: { name: string }) => p.name)).toContain('Lucía Fernández');
    });

    it.each([
      ['no name', { contactPreference: 'in_app' }, 'name_required'],
      ['an empty name', { name: '', contactPreference: 'in_app' }, 'name_required'],
      ['a whitespace-only name', { name: '   ', contactPreference: 'in_app' }, 'name_required'],
      ['no preference', { name: 'Lucía Fernández' }, 'preference_required'],
      ['a null preference', { name: 'Lucía Fernández', contactPreference: null }, 'preference_required'],
    ])('creates nothing and says what is missing for %s', async (_label, body, code) => {
      t = await buildTestApp();

      const res = await register(body);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: code });
      expect(await patientCount()).toBe(6);
    });

    it.each([{ name: 'Lucía Fernández', contactPreference: 'sms' }, { name: 42, contactPreference: 'in_app' }, { name: 'x'.repeat(201), contactPreference: 'in_app' }])(
      'rejects an invalid request %j and creates nothing',
      async (body) => {
        t = await buildTestApp();

        const res = await register(body);

        expect(res.status).toBe(400);
        expect(await patientCount()).toBe(6);
      },
    );
  });

  describe('refuses a name already in use (5.2)', () => {
    it.each([
      ['the same name', 'Maria Gómez'],
      ['a different letter case', 'MARIA GÓMEZ'],
      ['a different letter case without accents', 'maria gómez'],
      ['surrounding spaces', '  Maria Gómez '],
    ])('refuses %s and tells the person to sign in instead', async (_label, name) => {
      t = await buildTestApp();

      const res = await register({ name, contactPreference: 'telephone' });

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ error: 'name_already_registered' });
      expect(await patientCount()).toBe(6);
      expect(await t.db('audit_log')).toHaveLength(0);
    });

    it('refuses the name of a patient registered through this step', async () => {
      t = await buildTestApp();
      await register({ name: 'Lucía Fernández', contactPreference: 'in_app' }).expect(201);

      const again = await register({ name: 'lucía fernández', contactPreference: 'telephone' });

      expect(again.status).toBe(409);
      expect(await patientCount()).toBe(7);
    });

    it('creates exactly one patient when two registrations with the same name arrive together', async () => {
      t = await buildTestApp();

      const results = await Promise.all([
        register({ name: 'Lucia Fernandez', contactPreference: 'in_app' }),
        register({ name: 'LUCIA FERNANDEZ', contactPreference: 'telephone' }),
      ]);

      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
      expect(await patientCount()).toBe(7);
    });
  });

  describe('only in the demonstration environment (5.3)', () => {
    it('is not mounted when demo login is off, so it is rejected like every other demo route, and creates nothing', async () => {
      t = await buildTestApp({ demoLogin: false });

      const res = await register({ name: 'Lucía Fernández', contactPreference: 'in_app' });

      // Same as demo login: with the router unmounted the request falls through to authentication.
      expect(res.status).toBe(401);
      expect(await patientCount()).toBe(6);
    });
  });
});

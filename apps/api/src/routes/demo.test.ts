import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { buildTestApp, type TestApp } from '../test/testApp.js';

describe('demo login and patient lookup', () => {
  let t: TestApp;

  afterEach(async () => {
    await t.close();
  });

  describe('demo login (2.4)', () => {
    it('lists the seeded patients and staff without needing a token', async () => {
      t = await buildTestApp();

      const res = await request(t.app).get('/demo/users');

      expect(res.status).toBe(200);
      expect(res.body.patients).toHaveLength(5);
      expect(res.body.patients[0]).toEqual({ id: 1, name: 'Ana Torres' });
      expect(res.body.staff).toEqual([
        { id: 1, name: 'Sam Patel' },
        { id: 2, name: 'Maria Gomez' },
      ]);
    });

    it('signs a patient in with a token that works on patient routes', async () => {
      t = await buildTestApp();

      const login = await request(t.app).post('/demo/login').send({ role: 'patient', id: 2 });

      expect(login.status).toBe(200);
      expect(login.body).toMatchObject({
        user: { role: 'patient', id: 2, name: 'Ben Carter' },
        specialist: { name: 'Dr. Elena Ruiz', clinic: 'Dermatology' },
      });
      const me = await request(t.app).get('/me/waitlist').set('Authorization', `Bearer ${login.body.token}`);
      expect(me.status).toBe(200);
    });

    it('signs staff in with a token that works on staff routes and not on patient routes', async () => {
      t = await buildTestApp();

      const login = await request(t.app).post('/demo/login').send({ role: 'staff', id: 1 });

      expect(login.body.user).toEqual({ role: 'staff', id: 1, name: 'Sam Patel' });
      const header = `Bearer ${login.body.token}`;
      expect((await request(t.app).get('/waitlist').set('Authorization', header)).status).toBe(200);
      expect((await request(t.app).get('/me/waitlist').set('Authorization', header)).status).toBe(403);
    });

    it('rejects a user that is not in the records', async () => {
      t = await buildTestApp();

      const patient = await request(t.app).post('/demo/login').send({ role: 'patient', id: 99 });
      const staff = await request(t.app).post('/demo/login').send({ role: 'staff', id: 99 });

      expect(patient.status).toBe(401);
      expect(staff.status).toBe(401);
      expect(patient.body.token).toBeUndefined();
    });

    it('rejects a malformed request', async () => {
      t = await buildTestApp();

      expect((await request(t.app).post('/demo/login').send({ role: 'admin', id: 1 })).status).toBe(400);
      expect((await request(t.app).post('/demo/login').send({ role: 'patient' })).status).toBe(400);
      expect((await request(t.app).post('/demo/login').send({})).status).toBe(400);
    });

    it('does not exist when demo login is disabled', async () => {
      t = await buildTestApp({ demoLogin: false });

      expect((await request(t.app).get('/demo/users')).status).toBe(401);
      expect((await request(t.app).post('/demo/login').send({ role: 'staff', id: 1 })).status).toBe(401);
    });
  });

  describe('patient lookup for staff (2.5)', () => {
    it('lists registered patients and whether each is already on the waitlist', async () => {
      t = await buildTestApp();
      await request(t.app).post('/waitlist').set('Authorization', t.bearer(t.patient(2)));

      const res = await request(t.app).get('/patients').set('Authorization', t.bearer(t.staff(1)));

      expect(res.status).toBe(200);
      expect(res.body.patients).toHaveLength(5);
      expect(res.body.patients[1]).toEqual({ id: 2, name: 'Ben Carter', onWaitlist: true });
      expect(res.body.patients[0]).toEqual({ id: 1, name: 'Ana Torres', onWaitlist: false });
    });

    it('stops counting a patient as on the waitlist once they are removed', async () => {
      t = await buildTestApp();
      const joined = await request(t.app).post('/waitlist').set('Authorization', t.bearer(t.patient(2)));
      await request(t.app).delete(`/waitlist/${joined.body.entry.id}`).set('Authorization', t.bearer(t.staff(1)));

      const res = await request(t.app).get('/patients').set('Authorization', t.bearer(t.staff(1)));

      expect(res.body.patients[1].onWaitlist).toBe(false);
    });

    it('is denied to patients and to anonymous callers', async () => {
      t = await buildTestApp();

      const patient = await request(t.app).get('/patients').set('Authorization', t.bearer(t.patient(1)));
      const anonymous = await request(t.app).get('/patients');

      expect(patient.status).toBe(403);
      expect(JSON.stringify(patient.body)).not.toMatch(/Ana|Torres/);
      expect(anonymous.status).toBe(401);
    });
  });
});

import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildTestApp, type TestApp } from '../test/testApp.js';

/** A patient with no recorded preference must have one before an entry is created (US-012, US-006, BR-014 – BR-016). */
describe('the preference gate on joining and adding', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await buildTestApp();
  });

  afterEach(async () => {
    await t.close();
  });

  // Patient 5 (Ana Torres) has no recorded preference.
  const join = (patientId: number) => request(t.app).post('/waitlist').set('Authorization', t.bearer(t.patient(patientId)));
  const choose = (patientId: number, value: string) =>
    request(t.app).put('/me/contact-preference').set('Authorization', t.bearer(t.patient(patientId))).send({ contactPreference: value });
  const staffAdd = (patientId: number, body?: object, staffId = 1) =>
    request(t.app)
      .post(`/waitlist/patients/${patientId}`)
      .set('Authorization', t.bearer(t.staff(staffId)))
      .send(body ?? {});
  const entries = () => t.db('waitlist_entries');
  const audits = () => t.db('audit_log').orderBy('id');
  const preferenceOf = async (id: number) => (await t.db('patients').where({ id }).first()).contact_preference;

  describe('a patient joins (3.1)', () => {
    it('is refused with preference_required and nothing is created or audited', async () => {
      const res = await join(5);

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ error: 'preference_required' });
      expect(await entries()).toHaveLength(0);
      expect(await audits()).toHaveLength(0);
    });

    it('joins after choosing, and is not asked again', async () => {
      await choose(5, 'telephone').expect(200);

      const res = await join(5);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ created: true, entry: { patientId: 5, status: 'waiting' } });
    });

    it('joins as before when a preference is already recorded', async () => {
      expect((await join(4)).status).toBe(201);
    });

    it('gives a waiting legacy patient with no preference their existing entry back', async () => {
      await t.db('waitlist_entries').insert({
        patient_id: 5,
        status: 'waiting',
        joined_at: '2026-10-01T09:00:00.000Z',
        created_by_type: 'staff',
        created_by_id: 1,
      });

      const res = await join(5);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ created: false, entry: { patientId: 5, status: 'waiting' } });
      expect(await preferenceOf(5)).toBeNull();
    });
  });

  describe('staff add a caller (3.2)', () => {
    it('records the preference with the entry and audits the staff member', async () => {
      const res = await staffAdd(5, { contactPreference: 'telephone' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ created: true, entry: { patientId: 5, status: 'waiting' } });
      expect(await preferenceOf(5)).toBe('telephone');
      const [created] = await entries();
      expect(await audits()).toEqual([
        expect.objectContaining({
          action: 'contact_preference_set',
          actor_type: 'staff',
          actor_id: 1,
          patient_id: 5,
          entry_id: created.id,
          previous_value: null,
          new_value: 'telephone',
        }),
        expect.objectContaining({ action: 'entry_created', actor_type: 'staff', entry_id: created.id }),
      ]);
    });

    it('is refused with preference_required when none is supplied, and nothing is created', async () => {
      const res = await staffAdd(5);

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ error: 'preference_required' });
      expect(await entries()).toHaveLength(0);
      expect(await preferenceOf(5)).toBeNull();
    });

    it('is refused with preference_already_recorded when the caller has one, and changes nothing', async () => {
      const res = await staffAdd(4, { contactPreference: 'in_app' });

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ error: 'preference_already_recorded' });
      expect(await entries()).toHaveLength(0);
      expect(await preferenceOf(4)).toBe('telephone');
    });

    it('adds a caller who has a preference when none is supplied', async () => {
      expect((await staffAdd(4)).status).toBe(201);
    });

    it('returns the existing entry and records nothing when the caller already has an active entry, even if a preference is supplied', async () => {
      await join(1).expect(201);
      const before = await audits();

      const res = await staffAdd(1, { contactPreference: 'telephone' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ created: false });
      expect(await preferenceOf(1)).toBe('in_app');
      expect(await audits()).toEqual(before);
    });

    it('does not record a preference for a waiting legacy patient with none', async () => {
      await t.db('waitlist_entries').insert({
        patient_id: 5,
        status: 'waiting',
        joined_at: '2026-10-01T09:00:00.000Z',
        created_by_type: 'staff',
        created_by_id: 1,
      });

      const res = await staffAdd(5, { contactPreference: 'in_app' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ created: false });
      expect(await preferenceOf(5)).toBeNull();
      expect(await audits()).toHaveLength(0);
    });

    it('rejects an invalid preference with 400 and changes nothing', async () => {
      const res = await staffAdd(5, { contactPreference: 'sms' });

      expect(res.status).toBe(400);
      expect(await preferenceOf(5)).toBeNull();
      expect(await entries()).toHaveLength(0);
    });

    it('still answers 404 for an unknown patient', async () => {
      expect((await staffAdd(99, { contactPreference: 'in_app' })).status).toBe(404);
    });

    it('rolls the preference back when creating the entry fails', async () => {
      // The audit insert fails after the preference was written, so the whole add must undo it.
      await t.db.raw(`CREATE TRIGGER fail_entry_audit BEFORE INSERT ON audit_log WHEN NEW.action = 'entry_created'
                      BEGIN SELECT RAISE(ABORT, 'boom'); END`);

      const res = await staffAdd(5, { contactPreference: 'in_app' });

      expect(res.status).toBe(500);
      expect(await preferenceOf(5)).toBeNull();
      expect(await entries()).toHaveLength(0);
      expect(await audits()).toHaveLength(0);
    });
  });

  describe('a saved preference survives a failed join (3.3)', () => {
    it('keeps the preference when staff add the patient at the same moment, and a retry never asks again', async () => {
      await choose(5, 'in_app').expect(200);
      // A staff add wins the race: the patient's join then finds the entry and creates nothing.
      await staffAdd(5).expect(201);

      const retry = await join(5);

      expect(retry.status).toBe(200);
      expect(retry.body).toMatchObject({ created: false });
      expect(await preferenceOf(5)).toBe('in_app');
    });

    it('keeps the preference when the join itself errors after the choice was saved', async () => {
      await choose(5, 'telephone').expect(200);
      await t.db.raw(`CREATE TRIGGER fail_join BEFORE INSERT ON waitlist_entries BEGIN SELECT RAISE(ABORT, 'boom'); END`);

      const failed = await join(5);
      expect(failed.status).toBe(500);
      expect(await preferenceOf(5)).toBe('telephone');

      await t.db.raw('DROP TRIGGER fail_join');
      const retry = await join(5);
      expect(retry.status).toBe(201);
    });
  });
});

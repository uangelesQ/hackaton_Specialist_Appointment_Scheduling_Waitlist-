import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Knex } from 'knex';
import type { StaffWaitlistResponse } from '@waitlist/shared';
import { buildTestApp } from '../test/testApp.js';
import { createDb } from './connection.js';
import { migrateLatest } from './migrate.js';
import { seedDatabase, seedDemoWaitlist } from './seed.js';

describe('seed', () => {
  let db: Knex;

  beforeEach(async () => {
    db = createDb(':memory:');
    await migrateLatest(db);
  });

  afterEach(async () => {
    await db.destroy();
  });

  const count = async (table: string, where: object = {}) => Number((await db(table).where(where).count({ n: '*' }).first())?.n);

  describe('people (1.3)', () => {
    it('sets up the Cardiology specialist, six patients and the staff', async () => {
      await seedDatabase(db);

      expect(await db('specialist').select('name', 'clinic')).toEqual([{ name: 'Dr. Elena Ruiz', clinic: 'Cardiology' }]);
      expect(await count('patients')).toBe(6);
      expect(await count('staff')).toBeGreaterThanOrEqual(1);
    });

    it('seeds the V3 cast with all three preference values', async () => {
      await seedDatabase(db);

      const patients = await db('patients').orderBy('id').select('id', 'full_name', 'contact_preference');
      expect(patients).toEqual([
        { id: 1, full_name: 'Maria Gómez', contact_preference: 'in_app' },
        { id: 2, full_name: 'Ben Carter', contact_preference: 'in_app' },
        { id: 3, full_name: 'Chloe Nguyen', contact_preference: 'in_app' },
        { id: 4, full_name: 'Carlos Mendoza', contact_preference: 'telephone' },
        { id: 5, full_name: 'Ana Torres', contact_preference: null },
        { id: 6, full_name: 'Jorge Ramírez', contact_preference: 'telephone' },
      ]);
    });

    it('does not seed Sofía Reyes, who is deliberately not registered', async () => {
      await seedDatabase(db);

      expect(await count('patients', { full_name: 'Sofía Reyes' })).toBe(0);
    });

    it('ties every staff member to the specialist', async () => {
      await seedDatabase(db);

      const specialist = await db('specialist').first();
      const staff = await db('staff');

      expect(staff.every((s) => s.specialist_id === specialist.id)).toBe(true);
    });

    it('is idempotent when run twice', async () => {
      await seedDatabase(db);
      await seedDatabase(db);

      expect(await count('patients')).toBe(6);
      expect(await count('specialist')).toBe(1);
    });

    it('updates a patient who already exists, so re-seeding an old database fixes their preference', async () => {
      await seedDatabase(db);
      await db('patients').where({ id: 4 }).update({ contact_preference: null, full_name: 'Old Name' });

      await seedDatabase(db);

      expect(await db('patients').where({ id: 4 }).first()).toMatchObject({ full_name: 'Carlos Mendoza', contact_preference: 'telephone' });
    });

    it('leaves the waitlist empty', async () => {
      await seedDatabase(db);

      expect(await count('waitlist_entries')).toBe(0);
    });
  });

  describe('demo waitlist (1.4)', () => {
    beforeEach(async () => {
      await seedDatabase(db);
    });

    it('puts Carlos and then Ana on the waitlist, waiting, added by staff', async () => {
      await seedDemoWaitlist(db);

      const entries = await db('waitlist_entries').orderBy('id');
      expect(entries.map((e) => [e.patient_id, e.status, e.created_by_type, e.created_by_id])).toEqual([
        [4, 'waiting', 'staff', 1],
        [5, 'waiting', 'staff', 1],
      ]);
      expect(entries[0].joined_at <= entries[1].joined_at).toBe(true);
    });

    it('audits both additions to the staff member', async () => {
      await seedDemoWaitlist(db);

      const audit = await db('audit_log').orderBy('id');
      expect(audit.map((a) => [a.action, a.actor_type, a.actor_id])).toEqual([
        ['entry_created', 'staff', 1],
        ['entry_created', 'staff', 1],
      ]);
    });

    it('is safe to run twice', async () => {
      await seedDemoWaitlist(db);
      await seedDemoWaitlist(db);

      expect(await count('waitlist_entries')).toBe(2);
      expect(await count('audit_log')).toBe(2);
    });

    it('does not add anyone who is already waiting', async () => {
      await db('waitlist_entries').insert({
        patient_id: 5,
        status: 'notified',
        joined_at: '2026-10-01T08:00:00.000Z',
        created_by_type: 'patient',
        created_by_id: 5,
      });

      await seedDemoWaitlist(db);

      expect(await count('waitlist_entries', { patient_id: 5 })).toBe(1);
      expect(await count('waitlist_entries', { patient_id: 4 })).toBe(1);
    });
  });
});

describe('demo waitlist as staff see it (1.4)', () => {
  it('shows Carlos at position 1 and Ana at position 2', async () => {
    const t = await buildTestApp();
    try {
      await seedDemoWaitlist(t.db);

      const res = await request(t.app).get('/waitlist').set('Authorization', t.bearer(t.staff(1))).expect(200);
      const view = res.body as StaffWaitlistResponse;

      expect(view.entries.map((e) => [e.position, e.patientName, e.status])).toEqual([
        [1, 'Carlos Mendoza', 'waiting'],
        [2, 'Ana Torres', 'waiting'],
      ]);
    } finally {
      await t.close();
    }
  });
});

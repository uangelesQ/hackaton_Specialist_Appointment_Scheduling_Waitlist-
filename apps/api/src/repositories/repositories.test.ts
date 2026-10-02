import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Knex } from 'knex';
import { createDb } from '../db/connection.js';
import { migrateLatest } from '../db/migrate.js';
import { seedDatabase } from '../db/seed.js';
import { createRepositories, withTransaction } from './index.js';

describe('repositories', () => {
  let db: Knex;
  let tick: number;
  // Deterministic clock: each call is one minute later than the last.
  const clock = () => new Date(Date.UTC(2026, 9, 1, 9, tick++)).toISOString();

  beforeEach(async () => {
    tick = 0;
    db = createDb(':memory:');
    await migrateLatest(db);
    await seedDatabase(db);
  });

  afterEach(async () => {
    await db.destroy();
  });

  describe('patients (1.2)', () => {
    const setPreference = (id: number, value: string | null) => db('patients').where({ id }).update({ contact_preference: value });

    it.each([
      ['in_app', 'in_app'],
      ['telephone', 'telephone'],
      [null, null],
    ])('reads preference %j as %j', async (stored, expected) => {
      await setPreference(1, stored);
      expect(await createRepositories(db, clock).patients.preferenceOf(1)).toBe(expected);
    });

    it('returns undefined for a patient that does not exist, which is different from not recorded', async () => {
      expect(await createRepositories(db, clock).patients.preferenceOf(99)).toBeUndefined();
    });

    it('includes the preference on a patient record and on the list', async () => {
      await setPreference(2, 'telephone');
      const { patients } = createRepositories(db, clock);

      expect(await patients.findById(2)).toMatchObject({ id: 2, contactPreference: 'telephone' });
      expect((await patients.list()).find((p) => p.id === 2)?.contactPreference).toBe('telephone');
    });
  });

  describe('entries', () => {
    it('creates a waiting entry with the creator and join time', async () => {
      const { entries } = createRepositories(db, clock);
      const created = await entries.create({ patientId: 1, createdByType: 'staff', createdById: 2 });

      expect(created).toMatchObject({
        patientId: 1,
        status: 'waiting',
        closedAt: null,
        createdByType: 'staff',
        createdById: 2,
      });
      expect(await entries.findById(created.id)).toEqual(created);
    });

    it('finds the active entry for a patient and ignores closed ones', async () => {
      const { entries } = createRepositories(db, clock);
      const first = await entries.create({ patientId: 1, createdByType: 'patient', createdById: 1 });
      await entries.transition(first.id, ['waiting'], 'removed');
      expect(await entries.findActiveByPatient(1)).toBeUndefined();

      const second = await entries.create({ patientId: 1, createdByType: 'patient', createdById: 1 });
      expect((await entries.findActiveByPatient(1))?.id).toBe(second.id);
    });

    it('lists active entries in join order and leaves out closed ones', async () => {
      const { entries } = createRepositories(db, clock);
      const a = await entries.create({ patientId: 3, createdByType: 'patient', createdById: 3 });
      const b = await entries.create({ patientId: 1, createdByType: 'patient', createdById: 1 });
      const c = await entries.create({ patientId: 2, createdByType: 'staff', createdById: 1 });
      await entries.transition(b.id, ['waiting'], 'removed');

      expect((await entries.listActive()).map((e) => e.id)).toEqual([a.id, c.id]);
    });

    it('breaks join-time ties by id', async () => {
      const { entries } = createRepositories(db, () => '2026-10-01T09:00:00.000Z');
      const a = await entries.create({ patientId: 1, createdByType: 'patient', createdById: 1 });
      const b = await entries.create({ patientId: 2, createdByType: 'patient', createdById: 2 });

      expect((await entries.listActive()).map((e) => e.id)).toEqual([a.id, b.id]);
    });

    it('transitions only from an allowed status and stamps closed_at when closing', async () => {
      const { entries } = createRepositories(db, clock);
      const e = await entries.create({ patientId: 1, createdByType: 'patient', createdById: 1 });

      expect(await entries.transition(e.id, ['waiting'], 'notified')).toBe(true);
      expect(await entries.transition(e.id, ['waiting'], 'removed')).toBe(false);
      expect((await entries.findById(e.id))?.status).toBe('notified');
      expect((await entries.findById(e.id))?.closedAt).toBeNull();

      expect(await entries.transition(e.id, ['notified'], 'booked')).toBe(true);
      expect((await entries.findById(e.id))?.closedAt).not.toBeNull();
    });
  });

  describe('slots', () => {
    it('creates an open slot and updates its status', async () => {
      const { slots } = createRepositories(db, clock);
      const slot = await slots.create('2026-10-02T10:30:00.000Z');
      expect(slot).toMatchObject({ startsAt: '2026-10-02T10:30:00.000Z', status: 'open' });

      await slots.setStatus(slot.id, 'offered');
      expect((await slots.findById(slot.id))?.status).toBe('offered');
    });
  });

  describe('offers', () => {
    async function setup() {
      const repos = createRepositories(db, clock);
      const entry = await repos.entries.create({ patientId: 1, createdByType: 'patient', createdById: 1 });
      const slot = await repos.slots.create('2026-10-02T10:30:00.000Z');
      return { repos, entry, slot };
    }

    it('creates an outstanding offer and finds it', async () => {
      const { repos, entry, slot } = await setup();
      const offer = await repos.offers.create({ slotId: slot.id, entryId: entry.id, releasedBy: 1 });

      expect(offer).toMatchObject({ status: 'outstanding', resolvedAt: null, releasedBy: 1 });
      expect((await repos.offers.findOutstanding())?.id).toBe(offer.id);
    });

    it('resolves an outstanding offer once; a second resolve loses', async () => {
      const { repos, entry, slot } = await setup();
      const offer = await repos.offers.create({ slotId: slot.id, entryId: entry.id, releasedBy: 1 });

      expect(await repos.offers.resolveIfOutstanding(offer.id, 'accepted')).toBe(true);
      expect(await repos.offers.resolveIfOutstanding(offer.id, 'passed_on')).toBe(false);

      const stored = await repos.offers.findById(offer.id);
      expect(stored?.status).toBe('accepted');
      expect(stored?.resolvedAt).not.toBeNull();
      expect(await repos.offers.findOutstanding()).toBeUndefined();
    });
  });

  describe('offers: excludedPatientIds (2.1)', () => {
    async function setup() {
      const repos = createRepositories(db, clock);
      const slotA = await repos.slots.create('2026-10-02T10:30:00.000Z');
      const slotB = await repos.slots.create('2026-10-09T10:30:00.000Z');
      const entry = (patientId: number) => repos.entries.create({ patientId, createdByType: 'patient', createdById: patientId });
      const e1 = await entry(1);
      const e2 = await entry(2);
      const e3 = await entry(3);
      return { repos, slotA, slotB, e1, e2, e3 };
    }

    // Offers are inserted directly so several can exist for one slot, as they do over time.
    const offer = (slotId: number, entryId: number, status: string) =>
      db('slot_offers').insert({ slot_id: slotId, entry_id: entryId, status, created_at: '2026-10-01T09:00:00.000Z', released_by: 1 });

    it('includes patients who declined and patients who were passed over', async () => {
      const { repos, slotA, e1, e2 } = await setup();
      await offer(slotA.id, e1.id, 'declined');
      await offer(slotA.id, e2.id, 'passed_on');

      expect((await repos.offers.excludedPatientIds(slotA.id)).sort()).toEqual([1, 2]);
    });

    it('leaves out outstanding, accepted and closed offers', async () => {
      const { repos, slotA, e1, e2, e3 } = await setup();
      await offer(slotA.id, e1.id, 'accepted');
      await offer(slotA.id, e2.id, 'closed');
      await offer(slotA.id, e3.id, 'outstanding');

      expect(await repos.offers.excludedPatientIds(slotA.id)).toEqual([]);
    });

    it('is specific to the slot', async () => {
      const { repos, slotA, slotB, e1 } = await setup();
      await offer(slotA.id, e1.id, 'declined');

      expect(await repos.offers.excludedPatientIds(slotA.id)).toEqual([1]);
      expect(await repos.offers.excludedPatientIds(slotB.id)).toEqual([]);
    });

    it('follows the patient, not the entry, so rejoining does not make them eligible again', async () => {
      const { repos, slotA, e1 } = await setup();
      await offer(slotA.id, e1.id, 'passed_on');
      await repos.entries.transition(e1.id, ['waiting'], 'removed');
      await repos.entries.create({ patientId: 1, createdByType: 'patient', createdById: 1 });

      expect(await repos.offers.excludedPatientIds(slotA.id)).toEqual([1]);
    });

    it('lists a patient once however many offers excluded them', async () => {
      const { repos, slotA, e1 } = await setup();
      await offer(slotA.id, e1.id, 'declined');
      await offer(slotA.id, e1.id, 'passed_on');

      expect(await repos.offers.excludedPatientIds(slotA.id)).toEqual([1]);
    });
  });

  describe('audit', () => {
    it('records who did what and when', async () => {
      const { audit } = createRepositories(db, clock);
      await audit.record({ action: 'entry_removed', entryId: null, actorType: 'patient', actorId: 1 });

      const [row] = await audit.list();
      expect(row).toMatchObject({ action: 'entry_removed', actorType: 'patient', actorId: 1 });
      expect(row?.at).toBeTruthy();
    });
  });

  describe('withTransaction', () => {
    it('commits every write when the callback succeeds', async () => {
      const result = await withTransaction(
        db,
        async ({ entries, audit }) => {
          const entry = await entries.create({ patientId: 1, createdByType: 'patient', createdById: 1 });
          await audit.record({ action: 'entry_created', entryId: entry.id, actorType: 'patient', actorId: 1 });
          return entry.id;
        },
        clock,
      );

      const { entries, audit } = createRepositories(db, clock);
      expect(await entries.findById(result)).toBeDefined();
      expect(await audit.list()).toHaveLength(1);
    });

    it('rolls back the entry and the audit record together when the callback throws', async () => {
      await expect(
        withTransaction(
          db,
          async ({ entries, audit }) => {
            const entry = await entries.create({ patientId: 1, createdByType: 'patient', createdById: 1 });
            await audit.record({ action: 'entry_created', entryId: entry.id, actorType: 'patient', actorId: 1 });
            throw new Error('boom');
          },
          clock,
        ),
      ).rejects.toThrow('boom');

      const { entries, audit } = createRepositories(db, clock);
      expect(await entries.listActive()).toHaveLength(0);
      expect(await audit.list()).toHaveLength(0);
    });
  });
});

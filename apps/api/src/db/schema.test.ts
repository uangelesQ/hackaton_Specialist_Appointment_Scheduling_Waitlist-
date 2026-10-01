import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Knex } from 'knex';
import { createDb } from './connection.js';
import { migrateLatest } from './migrate.js';
import { seedDatabase } from './seed.js';

const NOW = '2026-10-01T09:00:00.000Z';

function entry(patientId: number, status = 'waiting') {
  return { patient_id: patientId, status, joined_at: NOW, created_by_type: 'patient', created_by_id: patientId };
}

describe('waitlist schema', () => {
  let db: Knex;

  beforeEach(async () => {
    db = createDb(':memory:');
    await migrateLatest(db);
    await seedDatabase(db);
  });

  afterEach(async () => {
    await db.destroy();
  });

  describe('waitlist_entries', () => {
    it('rejects a second active entry for the same patient', async () => {
      await db('waitlist_entries').insert(entry(1));
      await expect(db('waitlist_entries').insert(entry(1))).rejects.toThrow(/UNIQUE/i);
    });

    it('rejects a second active entry when the first is notified', async () => {
      await db('waitlist_entries').insert(entry(1, 'notified'));
      await expect(db('waitlist_entries').insert(entry(1))).rejects.toThrow(/UNIQUE/i);
    });

    it.each(['removed', 'booked'])('allows a new active entry after the previous one is %s', async (closed) => {
      await db('waitlist_entries').insert(entry(1, closed));
      await expect(db('waitlist_entries').insert(entry(1))).resolves.toBeDefined();
    });

    it('allows active entries for different patients', async () => {
      await db('waitlist_entries').insert(entry(1));
      await expect(db('waitlist_entries').insert(entry(2))).resolves.toBeDefined();
    });

    it('rejects an unknown status', async () => {
      await expect(db('waitlist_entries').insert(entry(1, 'pending'))).rejects.toThrow(/CHECK/i);
    });
  });

  describe('slot_offers', () => {
    async function offer(slotId: number, entryId: number, status = 'outstanding') {
      return db('slot_offers').insert({
        slot_id: slotId,
        entry_id: entryId,
        status,
        created_at: NOW,
        released_by: 1,
      });
    }

    beforeEach(async () => {
      await db('waitlist_entries').insert([entry(1), entry(2)]);
      await db('slots').insert({ starts_at: '2026-10-02T10:30:00.000Z', status: 'open' });
    });

    it('rejects a second outstanding offer', async () => {
      await offer(1, 1);
      await expect(offer(1, 2)).rejects.toThrow(/UNIQUE/i);
    });

    it('allows a new outstanding offer once the previous one is resolved', async () => {
      await offer(1, 1, 'declined');
      await expect(offer(1, 2)).resolves.toBeDefined();
    });

    it('allows several resolved offers for the same slot', async () => {
      await offer(1, 1, 'declined');
      await expect(offer(1, 2, 'passed_on')).resolves.toBeDefined();
    });

    it('rejects an unknown offer status', async () => {
      await expect(offer(1, 1, 'maybe')).rejects.toThrow(/CHECK/i);
    });
  });

  describe('audit_log', () => {
    it('stores actor, action and time', async () => {
      await db('audit_log').insert({ action: 'entry_created', actor_type: 'staff', actor_id: 1, at: NOW });
      const rows = await db('audit_log');
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ action: 'entry_created', actor_type: 'staff', actor_id: 1, at: NOW });
    });

    it('rejects an unknown actor type', async () => {
      await expect(
        db('audit_log').insert({ action: 'entry_created', actor_type: 'robot', actor_id: 1, at: NOW }),
      ).rejects.toThrow(/CHECK/i);
    });
  });
});

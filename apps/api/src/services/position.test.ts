import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Knex } from 'knex';
import { createDb } from '../db/connection.js';
import { migrateLatest } from '../db/migrate.js';
import { seedDatabase } from '../db/seed.js';
import { createRepositories, type Repositories } from '../repositories/index.js';
import { assignPositions } from './position.js';

describe('waitlist position', () => {
  let db: Knex;
  let repos: Repositories;
  let tick: number;

  beforeEach(async () => {
    tick = 0;
    db = createDb(':memory:');
    await migrateLatest(db);
    await seedDatabase(db);
    repos = createRepositories(db, () => new Date(Date.UTC(2026, 9, 1, 9, tick++)).toISOString());
  });

  afterEach(async () => {
    await db.destroy();
  });

  const add = (patientId: number, by: 'patient' | 'staff' = 'patient') =>
    repos.entries.create({ patientId, createdByType: by, createdById: 1 });
  const position = async (entryId: number) => {
    const entry = await repos.entries.findById(entryId);
    return entry && repos.entries.positionOf(entry);
  };

  it('ranks the earlier join first', async () => {
    const a = await add(1);
    const b = await add(2);

    expect(await position(a.id)).toBe(1);
    expect(await position(b.id)).toBe(2);
  });

  it("orders a staff-added entry by the time staff created it, not by who created it", async () => {
    const a = await add(1);
    const staffAdded = await add(2, 'staff');
    const c = await add(3);

    expect(await position(a.id)).toBe(1);
    expect(await position(staffAdded.id)).toBe(2);
    expect(await position(c.id)).toBe(3);
  });

  it('breaks ties on join time by id', async () => {
    const same = createRepositories(db, () => '2026-10-01T09:00:00.000Z');
    const a = await same.entries.create({ patientId: 1, createdByType: 'patient', createdById: 1 });
    const b = await same.entries.create({ patientId: 2, createdByType: 'patient', createdById: 2 });

    expect(await position(a.id)).toBe(1);
    expect(await position(b.id)).toBe(2);
  });

  it('keeps a position unchanged when an entry becomes notified and when it goes back to waiting', async () => {
    const a = await add(1);
    const b = await add(2);

    await repos.entries.transition(a.id, ['waiting'], 'notified');
    expect(await position(a.id)).toBe(1);
    expect(await position(b.id)).toBe(2);

    await repos.entries.transition(a.id, ['notified'], 'waiting');
    expect(await position(a.id)).toBe(1);
    expect(await position(b.id)).toBe(2);
  });

  it.each(['booked', 'removed'] as const)('moves later entries up by one when an earlier entry closes as %s', async (closed) => {
    const a = await add(1);
    const b = await add(2);
    const c = await add(3);

    await repos.entries.transition(a.id, ['waiting'], closed);

    expect(await position(b.id)).toBe(1);
    expect(await position(c.id)).toBe(2);
  });

  it('does not move earlier entries when a later entry closes', async () => {
    const a = await add(1);
    const b = await add(2);
    const c = await add(3);

    await repos.entries.transition(c.id, ['waiting'], 'removed');

    expect(await position(a.id)).toBe(1);
    expect(await position(b.id)).toBe(2);
  });

  it('gives a rejoining patient the back of the line', async () => {
    const a = await add(1);
    const b = await add(2);
    await repos.entries.transition(a.id, ['waiting'], 'removed');
    const rejoined = await add(1);

    expect(await position(b.id)).toBe(1);
    expect(await position(rejoined.id)).toBe(2);
  });

  it('assigns the same positions to an ordered list as the per-entry query', async () => {
    const a = await add(1);
    const b = await add(2, 'staff');
    const c = await add(3);
    const d = await add(4);
    await repos.entries.transition(b.id, ['waiting'], 'booked');
    await repos.entries.transition(c.id, ['waiting'], 'notified');

    const listed = assignPositions(await repos.entries.listActive());

    expect(listed.map((e) => e.id)).toEqual([a.id, c.id, d.id]);
    for (const entry of listed) {
      expect(entry.position).toBe(await position(entry.id));
    }
    expect(listed.map((e) => e.position)).toEqual([1, 2, 3]);
  });
});

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Knex } from 'knex';
import { createDb } from './connection.js';
import { migrateLatest } from './migrate.js';
import { seedDatabase } from './seed.js';

describe('seed', () => {
  let db: Knex;

  beforeEach(async () => {
    db = createDb(':memory:');
    await migrateLatest(db);
  });

  afterEach(async () => {
    await db.destroy();
  });

  it('populates one specialist, patients and staff', async () => {
    await seedDatabase(db);

    const specialists = await db('specialist').count({ n: '*' }).first();
    const patients = await db('patients').count({ n: '*' }).first();
    const staff = await db('staff').count({ n: '*' }).first();

    expect(Number(specialists?.n)).toBe(1);
    expect(Number(patients?.n)).toBeGreaterThanOrEqual(4);
    expect(Number(staff?.n)).toBeGreaterThanOrEqual(1);
  });

  it('ties every staff member to the specialist', async () => {
    await seedDatabase(db);

    const specialist = await db('specialist').first();
    const staff = await db('staff');

    expect(staff.every((s) => s.specialist_id === specialist.id)).toBe(true);
  });

  it('is idempotent when run twice', async () => {
    await seedDatabase(db);
    const first = Number((await db('patients').count({ n: '*' }).first())?.n);

    await seedDatabase(db);
    const second = Number((await db('patients').count({ n: '*' }).first())?.n);

    expect(second).toBe(first);
  });
});

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Knex } from 'knex';
import { createDb } from '../db/connection.js';
import { migrateLatest } from '../db/migrate.js';
import { seedDatabase } from '../db/seed.js';
import { createRepositories } from '../repositories/index.js';
import { preferenceService } from './preference.js';

describe('preferenceService.set (1.3)', () => {
  let db: Knex;
  let tick: number;
  const clock = () => new Date(Date.UTC(2026, 9, 1, 9, tick++)).toISOString();
  const patient = { type: 'patient', id: 5 } as const;

  beforeEach(async () => {
    tick = 0;
    db = createDb(':memory:');
    await migrateLatest(db);
    await seedDatabase(db);
  });

  afterEach(async () => {
    await db.destroy();
  });

  const audit = () => createRepositories(db, clock).audit.list();

  it('audits a first choice with no previous value', async () => {
    const result = await preferenceService(db, clock).set(5, 'in_app', patient);

    expect(result).toBe('in_app');
    expect(await audit()).toEqual([
      expect.objectContaining({
        action: 'contact_preference_set',
        actorType: 'patient',
        actorId: 5,
        patientId: 5,
        previousValue: null,
        newValue: 'in_app',
      }),
    ]);
  });

  it('audits a change with both values', async () => {
    const service = preferenceService(db, clock);
    await service.set(5, 'in_app', patient);
    await service.set(5, 'telephone', patient);

    const rows = await audit();
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({ previousValue: 'in_app', newValue: 'telephone' });
  });

  it('writes nothing and audits nothing when the value is unchanged', async () => {
    const service = preferenceService(db, clock);
    await service.set(5, 'in_app', patient);
    await service.set(5, 'in_app', patient);

    expect(await audit()).toHaveLength(1);
  });

  it('records the entry when one is given, for a staff-recorded choice', async () => {
    const entry = await createRepositories(db, clock).entries.create({ patientId: 5, createdByType: 'staff', createdById: 1 });
    await preferenceService(db, clock).set(5, 'telephone', { type: 'staff', id: 1 }, entry.id);

    expect((await audit())[0]).toMatchObject({ actorType: 'staff', actorId: 1, entryId: entry.id, patientId: 5 });
  });

  it('rolls the preference and the audit row back together when the surrounding work fails', async () => {
    const service = preferenceService(db, clock);
    await expect(
      db.transaction(async (trx) => {
        await service.setIn(createRepositories(trx, clock), 5, 'in_app', patient);
        throw new Error('later step failed');
      }),
    ).rejects.toThrow('later step failed');

    expect(await createRepositories(db, clock).patients.preferenceOf(5)).toBeNull();
    expect(await audit()).toHaveLength(0);
  });

  it('answers 404 for a patient that does not exist', async () => {
    await expect(preferenceService(db, clock).set(99, 'in_app', patient)).rejects.toMatchObject({ status: 404 });
  });
});

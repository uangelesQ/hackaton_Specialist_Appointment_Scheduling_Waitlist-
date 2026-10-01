import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildTestApp, type TestApp } from '../test/testApp.js';

describe('waitlist membership', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await buildTestApp();
  });

  afterEach(async () => {
    await t.db.destroy();
  });

  const join = (patientId: number) =>
    request(t.app).post('/waitlist').set('Authorization', t.bearer(t.patient(patientId)));
  const staffAdd = (patientId: number | string, staffId = 1) =>
    request(t.app).post(`/waitlist/patients/${patientId}`).set('Authorization', t.bearer(t.staff(staffId)));
  const leave = (entryId: number | string, token: string) =>
    request(t.app).delete(`/waitlist/${entryId}`).set('Authorization', t.bearer(token));
  const entryCount = async () => Number((await t.db('waitlist_entries').count({ n: '*' }).first())?.n);

  describe('patient joins (3.1)', () => {
    it('creates a waiting entry and confirms it with the position', async () => {
      const res = await join(1);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        created: true,
        entry: { patientId: 1, status: 'waiting', position: 1 },
      });
      expect(res.body.entry.id).toEqual(expect.any(Number));
      expect(res.body.entry.joinedAt).toEqual(expect.any(String));

      const row = await t.db('waitlist_entries').first();
      expect(row).toMatchObject({ patient_id: 1, status: 'waiting', created_by_type: 'patient', created_by_id: 1 });
    });

    it('places later joiners behind earlier ones', async () => {
      await join(1);
      const second = await join(2);
      expect(second.body.entry.position).toBe(2);
    });

    it('rejects a person who is not a registered patient and creates nothing', async () => {
      const res = await join(99);

      expect(res.status).toBe(403);
      expect(await entryCount()).toBe(0);
    });

    it('rejects staff using the patient join', async () => {
      const res = await request(t.app).post('/waitlist').set('Authorization', t.bearer(t.staff(1)));
      expect(res.status).toBe(403);
      expect(await entryCount()).toBe(0);
    });

    it('rejects an unauthenticated request', async () => {
      const res = await request(t.app).post('/waitlist');
      expect(res.status).toBe(401);
      expect(await entryCount()).toBe(0);
    });
  });

  describe('duplicates and rejoin (3.2)', () => {
    it('returns the existing entry and position for a repeated self-join', async () => {
      const first = await join(1);
      await join(2);
      const again = await join(1);

      expect(again.status).toBe(200);
      expect(again.body.created).toBe(false);
      expect(again.body.entry).toEqual(first.body.entry);
      expect(await entryCount()).toBe(2);
    });

    it('returns the existing entry for a staff add of a patient already on the list', async () => {
      const first = await join(1);
      const res = await staffAdd(1);

      expect(res.status).toBe(200);
      expect(res.body.created).toBe(false);
      expect(res.body.entry).toEqual(first.body.entry);
      expect(await entryCount()).toBe(1);
    });

    it('creates only one entry when the same patient joins twice at once', async () => {
      const [a, b] = await Promise.all([join(1), join(1)]);

      expect([a.status, b.status].sort()).toEqual([200, 201]);
      expect(a.body.entry.id).toBe(b.body.entry.id);
      expect(await entryCount()).toBe(1);
    });

    it.each(['removed', 'booked'])('lets a patient rejoin after the entry was %s, with a new join time', async (closed) => {
      const first = await join(1);
      await t.db('waitlist_entries').where({ id: first.body.entry.id }).update({ status: closed });

      const again = await join(1);

      expect(again.status).toBe(201);
      expect(again.body.created).toBe(true);
      expect(again.body.entry.id).not.toBe(first.body.entry.id);
      expect(again.body.entry.joinedAt > first.body.entry.joinedAt).toBe(true);
      expect(again.body.entry.position).toBe(1);
    });
  });

  describe('staff adds a patient (3.3)', () => {
    it('creates a waiting entry attributed to the staff member', async () => {
      const res = await staffAdd(2, 2);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ created: true, entry: { patientId: 2, status: 'waiting', position: 1 } });
      const row = await t.db('waitlist_entries').first();
      expect(row).toMatchObject({ patient_id: 2, status: 'waiting', created_by_type: 'staff', created_by_id: 2 });
    });

    it('orders the entry by the time staff created it', async () => {
      await join(1);
      const added = await staffAdd(3);
      expect(added.body.entry.position).toBe(2);
    });

    it('behaves like a self-joined entry: the patient joining again sees it, and can leave it', async () => {
      const added = await staffAdd(2);

      const again = await join(2);
      expect(again.body.created).toBe(false);
      expect(again.body.entry.id).toBe(added.body.entry.id);

      const res = await leave(added.body.entry.id, t.patient(2));
      expect(res.status).toBe(200);
    });

    it('returns 404 for a patient who does not exist', async () => {
      const res = await staffAdd(99);
      expect(res.status).toBe(404);
      expect(await entryCount()).toBe(0);
    });

    it('rejects a malformed patient id', async () => {
      const res = await staffAdd('abc');
      expect(res.status).toBe(400);
    });

    it('rejects a patient calling the staff add', async () => {
      const res = await request(t.app)
        .post('/waitlist/patients/2')
        .set('Authorization', t.bearer(t.patient(1)));
      expect(res.status).toBe(403);
      expect(await entryCount()).toBe(0);
    });

    it('rejects an unauthenticated request', async () => {
      const res = await request(t.app).post('/waitlist/patients/2');
      expect(res.status).toBe(401);
    });
  });

  describe('leave and remove (3.4)', () => {
    it('lets a patient remove their own entry', async () => {
      const { body } = await join(1);
      const res = await leave(body.entry.id, t.patient(1));

      expect(res.status).toBe(200);
      expect(res.body.entry).toEqual({ id: body.entry.id, status: 'removed' });
      const row = await t.db('waitlist_entries').where({ id: body.entry.id }).first();
      expect(row.status).toBe('removed');
      expect(row.closed_at).not.toBeNull();
    });

    it('lets staff remove any entry', async () => {
      const { body } = await join(2);
      const res = await leave(body.entry.id, t.staff(1));

      expect(res.status).toBe(200);
      expect((await t.db('waitlist_entries').where({ id: body.entry.id }).first()).status).toBe('removed');
    });

    it('moves everyone behind a removed entry up one position', async () => {
      const first = await join(1);
      await join(2);
      const third = await join(3);
      expect(third.body.entry.position).toBe(3);

      await leave(first.body.entry.id, t.patient(1));

      const again = await join(3);
      expect(again.body.entry.position).toBe(2);
    });

    it("rejects a patient removing another patient's entry and leaves it unchanged", async () => {
      const { body } = await join(2);
      const res = await leave(body.entry.id, t.patient(1));

      expect(res.status).toBe(403);
      expect((await t.db('waitlist_entries').where({ id: body.entry.id }).first()).status).toBe('waiting');
    });

    it('rejects an unauthenticated removal', async () => {
      const { body } = await join(1);
      const res = await request(t.app).delete(`/waitlist/${body.entry.id}`);

      expect(res.status).toBe(401);
      expect((await t.db('waitlist_entries').where({ id: body.entry.id }).first()).status).toBe('waiting');
    });

    it('returns 404 for an entry that does not exist', async () => {
      const res = await leave(99, t.staff(1));
      expect(res.status).toBe(404);
    });

    it('changes nothing and says the entry is not active when it is already closed', async () => {
      const { body } = await join(1);
      await leave(body.entry.id, t.patient(1));
      const closedAt = (await t.db('waitlist_entries').where({ id: body.entry.id }).first()).closed_at;
      const auditBefore = await t.db('audit_log').count({ n: '*' }).first();

      const res = await leave(body.entry.id, t.staff(1));

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('entry_not_active');
      expect((await t.db('waitlist_entries').where({ id: body.entry.id }).first()).closed_at).toBe(closedAt);
      expect(await t.db('audit_log').count({ n: '*' }).first()).toEqual(auditBefore);
    });

    it('also treats a booked entry as not active', async () => {
      const { body } = await join(1);
      await t.db('waitlist_entries').where({ id: body.entry.id }).update({ status: 'booked' });

      const res = await leave(body.entry.id, t.staff(1));

      expect(res.status).toBe(409);
      expect((await t.db('waitlist_entries').where({ id: body.entry.id }).first()).status).toBe('booked');
    });
  });

  describe('audit (3.5)', () => {
    const audit = () => t.db('audit_log').orderBy('id');

    it('attributes a self-join to the patient', async () => {
      const { body } = await join(1);

      expect(await audit()).toEqual([
        expect.objectContaining({
          action: 'entry_created',
          entry_id: body.entry.id,
          actor_type: 'patient',
          actor_id: 1,
          at: expect.any(String),
        }),
      ]);
    });

    it('attributes a staff add to the named staff member, not the patient', async () => {
      const { body } = await staffAdd(2, 2);

      expect(await audit()).toEqual([
        expect.objectContaining({ action: 'entry_created', entry_id: body.entry.id, actor_type: 'staff', actor_id: 2 }),
      ]);
    });

    it('attributes a self-removal to the patient', async () => {
      const { body } = await join(1);
      await leave(body.entry.id, t.patient(1));

      const rows = await audit();
      expect(rows).toHaveLength(2);
      expect(rows[1]).toMatchObject({ action: 'entry_removed', entry_id: body.entry.id, actor_type: 'patient', actor_id: 1 });
      expect(rows[1].at).toEqual(expect.any(String));
    });

    it('attributes a staff removal to the staff member', async () => {
      const { body } = await join(1);
      await leave(body.entry.id, t.staff(2));

      const rows = await audit();
      expect(rows[1]).toMatchObject({ action: 'entry_removed', entry_id: body.entry.id, actor_type: 'staff', actor_id: 2 });
    });

    it('writes no audit record for a duplicate join or a rejected removal', async () => {
      const { body } = await join(1);
      await join(1);
      await staffAdd(1);
      await leave(body.entry.id, t.patient(2));

      expect(await audit()).toHaveLength(1);
    });

    it('rolls the entry back when the audit record cannot be written', async () => {
      await t.db.schema.dropTable('audit_log');

      const res = await join(1);

      expect(res.status).toBe(500);
      expect(await entryCount()).toBe(0);
    });

    it('keeps the entry open when the audit record for its removal cannot be written', async () => {
      const { body } = await join(1);
      await t.db.schema.dropTable('audit_log');

      const res = await leave(body.entry.id, t.patient(1));

      expect(res.status).toBe(500);
      expect((await t.db('waitlist_entries').where({ id: body.entry.id }).first()).status).toBe('waiting');
    });
  });
});

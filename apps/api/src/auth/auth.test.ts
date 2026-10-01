import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { authenticate, requireEntryAccess, requireRole, signToken } from './auth.js';

const SECRET = 'test-secret';

// Entry 10 belongs to patient 1, entry 20 to patient 2.
const OWNERS: Record<number, number> = { 10: 1, 20: 2 };

function buildApp() {
  const app = express();
  app.use(authenticate(SECRET));

  app.get('/staff-only', requireRole('staff'), (_req, res) => {
    res.json({ ok: true });
  });

  app.get(
    '/entries/:entryId',
    requireEntryAccess(async (req) => {
      const patientId = OWNERS[Number(req.params.entryId)];
      return patientId === undefined ? undefined : { patientId };
    }),
    (req, res) => {
      res.json({ entryId: Number(req.params.entryId) });
    },
  );

  return app;
}

const patientToken = (id: number) => signToken({ role: 'patient', id }, SECRET);
const staffToken = (id: number) => signToken({ role: 'staff', id }, SECRET);

describe('authenticate', () => {
  it('returns 401 when the token is missing', async () => {
    const res = await request(buildApp()).get('/staff-only');
    expect(res.status).toBe(401);
  });

  it('returns 401 for a malformed authorization header', async () => {
    const res = await request(buildApp()).get('/staff-only').set('Authorization', 'Token abc');
    expect(res.status).toBe(401);
  });

  it('returns 401 for a token signed with another secret', async () => {
    const forged = signToken({ role: 'staff', id: 1 }, 'other-secret');
    const res = await request(buildApp()).get('/staff-only').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  it('returns 401 for an expired token', async () => {
    const expired = signToken({ role: 'staff', id: 1 }, SECRET, { expiresInSeconds: -10 });
    const res = await request(buildApp()).get('/staff-only').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  it('returns 401 for a token with an unknown role', async () => {
    const odd = signToken({ role: 'admin' as never, id: 1 }, SECRET);
    const res = await request(buildApp()).get('/staff-only').set('Authorization', `Bearer ${odd}`);
    expect(res.status).toBe(401);
  });
});

describe('requireRole', () => {
  it('returns 403 when a patient calls a staff route', async () => {
    const res = await request(buildApp()).get('/staff-only').set('Authorization', `Bearer ${patientToken(1)}`);
    expect(res.status).toBe(403);
  });

  it('lets staff through', async () => {
    const res = await request(buildApp()).get('/staff-only').set('Authorization', `Bearer ${staffToken(1)}`);
    expect(res.status).toBe(200);
  });
});

describe('requireEntryAccess', () => {
  it('lets a patient reach their own entry', async () => {
    const res = await request(buildApp()).get('/entries/10').set('Authorization', `Bearer ${patientToken(1)}`);
    expect(res.status).toBe(200);
  });

  it("returns 403 when a patient reaches another patient's entry", async () => {
    const res = await request(buildApp()).get('/entries/20').set('Authorization', `Bearer ${patientToken(1)}`);
    expect(res.status).toBe(403);
  });

  it('lets staff reach any entry', async () => {
    const res = await request(buildApp()).get('/entries/20').set('Authorization', `Bearer ${staffToken(1)}`);
    expect(res.status).toBe(200);
  });

  it('returns 404 when the entry does not exist', async () => {
    const res = await request(buildApp()).get('/entries/99').set('Authorization', `Bearer ${staffToken(1)}`);
    expect(res.status).toBe(404);
  });

  it('returns 401 without a token', async () => {
    const res = await request(buildApp()).get('/entries/10');
    expect(res.status).toBe(401);
  });
});

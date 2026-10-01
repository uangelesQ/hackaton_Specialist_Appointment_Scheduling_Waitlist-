import { Router } from 'express';
import type { Knex } from 'knex';
import { z } from 'zod';
import type { DemoUsersResponse, LoginResponse } from '@waitlist/shared';
import { signToken } from '../auth/auth.js';
import { HttpError } from '../http/errors.js';
import { createRepositories } from '../repositories/index.js';

const loginBody = z.object({ role: z.enum(['patient', 'staff']), id: z.number().int().positive() });

/**
 * DEMO ONLY. Signs in as any seeded patient or staff member, with no password, so the MVP can be
 * used without an identity provider. Mounted only when demo login is enabled; a real identity
 * provider replaces this router and nothing else.
 */
export function demoRouter(db: Knex, jwtSecret: string): Router {
  const router = Router();

  router.get('/users', async (_req, res) => {
    const repos = createRepositories(db);
    const body: DemoUsersResponse = {
      patients: (await repos.patients.list()).map((p) => ({ id: p.id, name: p.fullName })),
      staff: (await repos.staff.list()).map((s) => ({ id: s.id, name: s.fullName })),
    };
    res.json(body);
  });

  router.post('/login', async (req, res) => {
    const { role, id } = loginBody.parse(req.body ?? {});
    const repos = createRepositories(db);

    const user = role === 'patient' ? await repos.patients.findById(id) : await repos.staff.findById(id);
    if (!user) throw new HttpError(401, 'unknown_user');

    const specialist = await repos.specialist.get();
    const body: LoginResponse = {
      token: signToken({ role, id }, jwtSecret),
      user: { role, id, name: user.fullName },
      specialist: { name: specialist.name, clinic: specialist.clinic },
    };
    res.json(body);
  });

  return router;
}

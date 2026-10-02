import { Router } from 'express';
import type { Knex } from 'knex';
import { z } from 'zod';
import type { DemoUsersResponse, LoginResponse } from '@waitlist/shared';
import { signToken } from '../auth/auth.js';
import { CONTACT_PREFERENCES } from '@waitlist/shared';
import { HttpError } from '../http/errors.js';
import { createRepositories, type Clock } from '../repositories/index.js';
import { demoRegistrationService } from '../services/demoRegistration.js';

const loginBody = z.object({ role: z.enum(['patient', 'staff']), id: z.number().int().positive() });
const MAX_NAME_LENGTH = 200;
// Missing fields get their own error so the screen can say what is missing; anything else malformed is a plain 400.
const registerBody = z.object({
  name: z.string().max(MAX_NAME_LENGTH).optional(),
  contactPreference: z.enum(CONTACT_PREFERENCES).nullish(),
});

/**
 * DEMO ONLY. Signs in as any seeded patient or staff member, with no password, so the MVP can be
 * used without an identity provider. Mounted only when demo login is enabled; a real identity
 * provider replaces this router and nothing else.
 */
export function demoRouter(db: Knex, jwtSecret: string, clock?: Clock): Router {
  const router = Router();
  const registration = demoRegistrationService(db, clock);

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

  /**
   * Registers a new patient and signs them in. A stand-in for hospital registration, available only
   * where demo login is (PS-001 v2.5 Appendix A).
   */
  router.post('/register', async (req, res) => {
    const { name, contactPreference } = registerBody.parse(req.body ?? {});
    if (!name?.trim()) throw new HttpError(400, 'name_required');
    if (!contactPreference) throw new HttpError(400, 'preference_required');

    const patient = await registration.register(name, contactPreference);
    const specialist = await createRepositories(db).specialist.get();
    const body: LoginResponse = {
      token: signToken({ role: 'patient', id: patient.id }, jwtSecret),
      user: { role: 'patient', id: patient.id, name: patient.fullName },
      specialist: { name: specialist.name, clinic: specialist.clinic },
    };
    res.status(201).json(body);
  });

  return router;
}

import { Router } from 'express';
import type { Knex } from 'knex';
import type { PatientsResponse } from '@waitlist/shared';
import { requireRole } from '../auth/auth.js';
import { createRepositories } from '../repositories/index.js';

export function patientsRouter(db: Knex): Router {
  const router = Router();

  /** Registered patients, so staff can pick one to add. Staff only: this is personal data. */
  router.get('/patients', requireRole('staff'), async (_req, res) => {
    const repos = createRepositories(db);
    const onWaitlist = new Set((await repos.entries.listActive()).map((e) => e.patientId));
    const body: PatientsResponse = {
      patients: (await repos.patients.list()).map((p) => ({ id: p.id, name: p.fullName, onWaitlist: onWaitlist.has(p.id) })),
    };
    res.json(body);
  });

  return router;
}

import { Router } from 'express';
import type { Knex } from 'knex';
import { requireRole } from '../auth/auth.js';
import type { Clock } from '../repositories/index.js';
import { waitlistViewService } from '../services/waitlistView.js';

export function waitlistViewRouter(db: Knex, clock?: Clock): Router {
  const router = Router();
  const views = waitlistViewService(db, clock);

  // The patient is identified only by their token, so there is no way to ask for someone else's entry.
  router.get('/me/waitlist', requireRole('patient'), async (req, res) => {
    const patientId = req.auth?.id;
    if (patientId === undefined) throw new Error('Missing auth context');
    res.json(await views.forPatient(patientId));
  });

  router.get('/waitlist', requireRole('staff'), async (_req, res) => {
    res.json(await views.forStaff());
  });

  return router;
}

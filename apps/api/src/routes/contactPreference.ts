import { Router } from 'express';
import type { Knex } from 'knex';
import { z } from 'zod';
import { CONTACT_PREFERENCES, type SetContactPreferenceResponse } from '@waitlist/shared';
import { requireRole } from '../auth/auth.js';
import type { Clock } from '../repositories/index.js';
import { preferenceService } from '../services/preference.js';

const body = z.object({ contactPreference: z.enum(CONTACT_PREFERENCES) });

export function contactPreferenceRouter(db: Knex, clock?: Clock): Router {
  const router = Router();
  const service = preferenceService(db, clock);

  /**
   * A patient sets or changes their own preference. The patient is identified only by their token,
   * so there is no way to name someone else's record (BR-011, BR-015).
   */
  router.put('/me/contact-preference', requireRole('patient'), async (req, res) => {
    if (!req.auth) throw new Error('Missing auth context');
    const { contactPreference } = body.parse(req.body ?? {});
    const saved = await service.set(req.auth.id, contactPreference, { type: 'patient', id: req.auth.id });
    const response: SetContactPreferenceResponse = { contactPreference: saved };
    res.json(response);
  });

  return router;
}

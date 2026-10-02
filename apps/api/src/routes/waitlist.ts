import { Router } from 'express';
import type { Knex } from 'knex';
import { z } from 'zod';
import { CONTACT_PREFERENCES } from '@waitlist/shared';
import { requireEntryAccess, requireRole } from '../auth/auth.js';
import { createRepositories, type Clock } from '../repositories/index.js';
import { waitlistService, type Actor } from '../services/waitlist.js';

const idParam = z.coerce.number().int().positive();
/** Staff may record the preference of a caller who has none. A patient joining sends no body. */
const addBody = z.object({ contactPreference: z.enum(CONTACT_PREFERENCES).optional() });

function actorOf(auth: { role: Actor['type']; id: number } | undefined): Actor {
  // Routes below are behind `authenticate`, so `auth` is always set.
  if (!auth) throw new Error('Missing auth context');
  return { type: auth.role, id: auth.id };
}

export function waitlistRouter(db: Knex, clock?: Clock): Router {
  const router = Router();
  const service = waitlistService(db, clock);

  router.post('/waitlist', requireRole('patient'), async (req, res) => {
    const actor = actorOf(req.auth);
    const result = await service.join(actor.id, actor);
    res.status(result.created ? 201 : 200).json(result);
  });

  router.post('/waitlist/patients/:patientId', requireRole('staff'), async (req, res) => {
    const patientId = idParam.parse(req.params.patientId);
    const { contactPreference } = addBody.parse(req.body ?? {});
    const result = await service.join(patientId, actorOf(req.auth), contactPreference);
    res.status(result.created ? 201 : 200).json(result);
  });

  router.delete(
    '/waitlist/:entryId',
    requireEntryAccess(async (req) => {
      const entry = await createRepositories(db).entries.findById(idParam.parse(req.params.entryId));
      return entry && { patientId: entry.patientId };
    }),
    async (req, res) => {
      const entry = await service.remove(idParam.parse(req.params.entryId), actorOf(req.auth));
      res.json({ entry });
    },
  );

  return router;
}

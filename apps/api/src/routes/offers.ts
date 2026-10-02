import { Router } from 'express';
import type { Knex } from 'knex';
import { z } from 'zod';
import { requireRole } from '../auth/auth.js';
import type { Clock } from '../repositories/index.js';
import { offerService } from '../services/offers.js';
import type { Actor } from '../services/waitlist.js';

const idParam = z.coerce.number().int().positive();
const releaseBody = z.object({ startsAt: z.iso.datetime().optional() });

function actorOf(auth: { role: Actor['type']; id: number } | undefined): Actor {
  // Routes below are behind `authenticate`, so `auth` is always set.
  if (!auth) throw new Error('Missing auth context');
  return { type: auth.role, id: auth.id };
}

export function offersRouter(db: Knex, clock?: Clock): Router {
  const router = Router();
  const offers = offerService(db, clock);

  router.post('/offers', requireRole('staff'), async (req, res) => {
    const { startsAt } = releaseBody.parse(req.body ?? {});
    res.status(201).json({ offer: await offers.release(actorOf(req.auth), startsAt) });
  });

  router.post('/offers/:offerId/accept', requireRole('patient'), async (req, res) => {
    res.json(await offers.accept(idParam.parse(req.params.offerId), actorOf(req.auth)));
  });

  router.post('/offers/:offerId/decline', requireRole('patient'), async (req, res) => {
    res.json(await offers.decline(idParam.parse(req.params.offerId), actorOf(req.auth)));
  });

  // Staff record the outcome of a call to a patient who answers by telephone (or has no recorded preference).
  router.post('/offers/:offerId/record-accept', requireRole('staff'), async (req, res) => {
    res.json(await offers.recordAccept(idParam.parse(req.params.offerId), actorOf(req.auth)));
  });

  router.post('/offers/:offerId/record-decline', requireRole('staff'), async (req, res) => {
    res.json(await offers.recordDecline(idParam.parse(req.params.offerId), actorOf(req.auth)));
  });

  router.post('/offers/:offerId/pass', requireRole('staff'), async (req, res) => {
    res.json(await offers.passOn(idParam.parse(req.params.offerId), actorOf(req.auth)));
  });

  return router;
}

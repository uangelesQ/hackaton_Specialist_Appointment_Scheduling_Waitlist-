import express from 'express';
import type { Knex } from 'knex';
import { authenticate } from './auth/auth.js';
import { errorHandler } from './http/errors.js';
import type { Clock } from './repositories/index.js';
import { contactPreferenceRouter } from './routes/contactPreference.js';
import { demoRouter } from './routes/demo.js';
import { offersRouter } from './routes/offers.js';
import { patientsRouter } from './routes/patients.js';
import { waitlistRouter } from './routes/waitlist.js';
import { waitlistViewRouter } from './routes/waitlistView.js';

export interface AppDeps {
  db: Knex;
  jwtSecret: string;
  clock?: Clock;
  /** Enables passwordless sign-in as any seeded user. Demo only; leave off anywhere real. */
  demoLogin?: boolean;
}

export function createApp({ db, jwtSecret, clock, demoLogin = false }: AppDeps) {
  const app = express();
  app.use(express.json());

  // Public routes must be mounted above `authenticate`.
  if (demoLogin) app.use('/demo', demoRouter(db, jwtSecret, clock));

  // Every route below requires a valid token.
  app.use(authenticate(jwtSecret));
  app.use(waitlistRouter(db, clock));
  app.use(waitlistViewRouter(db, clock));
  app.use(offersRouter(db, clock));
  app.use(patientsRouter(db));
  app.use(contactPreferenceRouter(db, clock));

  app.use(errorHandler);
  return app;
}

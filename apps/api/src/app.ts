import express from 'express';
import type { Knex } from 'knex';
import { authenticate } from './auth/auth.js';
import { errorHandler } from './http/errors.js';
import type { Clock } from './repositories/index.js';
import { waitlistRouter } from './routes/waitlist.js';

export interface AppDeps {
  db: Knex;
  jwtSecret: string;
  clock?: Clock;
}

export function createApp({ db, jwtSecret, clock }: AppDeps) {
  const app = express();
  app.use(express.json());

  // Every route below requires a valid token. Public routes (login) must be mounted above this line.
  app.use(authenticate(jwtSecret));
  app.use(waitlistRouter(db, clock));

  app.use(errorHandler);
  return app;
}

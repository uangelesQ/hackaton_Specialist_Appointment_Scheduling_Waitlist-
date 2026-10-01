import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ROLES, type Role } from '@waitlist/shared';

export interface AuthContext {
  role: Role;
  id: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

const DEFAULT_TTL_SECONDS = 8 * 60 * 60;

export function signToken(
  { role, id }: AuthContext,
  secret: string,
  options: { expiresInSeconds?: number } = {},
): string {
  return jwt.sign({ role }, secret, {
    algorithm: 'HS256',
    subject: String(id),
    expiresIn: options.expiresInSeconds ?? DEFAULT_TTL_SECONDS,
  });
}

function readAuth(header: string | undefined, secret: string): AuthContext | undefined {
  const [scheme, token] = header?.split(' ') ?? [];
  if (scheme !== 'Bearer' || !token) return undefined;
  try {
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
    if (typeof payload === 'string') return undefined;
    const id = Number(payload.sub);
    const role = payload.role as Role;
    if (!Number.isInteger(id) || !ROLES.includes(role)) return undefined;
    return { role, id };
  } catch {
    return undefined;
  }
}

/** Rejects any request without a valid bearer token and attaches `req.auth`. */
export function authenticate(secret: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = readAuth(req.header('authorization'), secret);
    if (!auth) {
      res.status(401).json({ error: 'unauthenticated' });
      return;
    }
    req.auth = auth;
    next();
  };
}

export function requireRole(role: Role): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.auth?.role !== role) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    next();
  };
}

/**
 * Patients may only reach an entry that belongs to them; staff may reach any entry.
 * The loader returns the entry's owner, or undefined when the entry does not exist.
 */
export function requireEntryAccess(
  loadEntry: (req: Request) => Promise<{ patientId: number } | undefined>,
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entry = await loadEntry(req);
      if (!entry) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      if (req.auth?.role === 'patient' && req.auth.id !== entry.patientId) {
        res.status(403).json({ error: 'forbidden' });
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

/** An expected failure with the status and machine-readable code to send back. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.code });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'invalid_request' });
    return;
  }
  // Log only the error type: messages from the database layer can echo query values.
  console.error('Unhandled error', err instanceof Error ? err.name : typeof err);
  res.status(500).json({ error: 'internal' });
};

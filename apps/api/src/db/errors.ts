/** True when a database error is a UNIQUE constraint violation (SQLite). */
export function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const { code, message } = err as { code?: unknown; message?: unknown };
  return (
    code === 'SQLITE_CONSTRAINT_UNIQUE' || (typeof message === 'string' && message.includes('UNIQUE constraint failed'))
  );
}

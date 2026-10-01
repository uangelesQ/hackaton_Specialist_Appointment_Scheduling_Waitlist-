/**
 * Numbers an already-ordered list of active entries 1..N. The list must come from
 * `entries.listActive()` (FIFO by join time, then id), which is the same order
 * `entries.positionOf()` ranks by, so the two always agree.
 */
export function assignPositions<T>(ordered: readonly T[]): (T & { position: number })[] {
  return ordered.map((entry, index) => ({ ...entry, position: index + 1 }));
}

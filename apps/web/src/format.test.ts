import { describe, expect, it } from 'vitest';
import { formatElapsed, formatJoinDate, formatSlot } from './format';

const MIN = 60_000;

describe('formatElapsed', () => {
  it.each([
    [0, 'less than a minute'],
    [59_999, 'less than a minute'],
    [1 * MIN, '1 min'],
    [12 * MIN, '12 min'],
    [59 * MIN, '59 min'],
    [60 * MIN, '1 h'],
    [61 * MIN, '1 h 1 min'],
    [150 * MIN, '2 h 30 min'],
    [26 * 60 * MIN, '26 h'],
  ])('formats %i ms as %s', (ms, expected) => {
    expect(formatElapsed(ms)).toBe(expected);
  });

  it('treats a negative duration, from clock skew between server and browser, as no time at all', () => {
    expect(formatElapsed(-5 * MIN)).toBe('less than a minute');
  });
});

describe('dates', () => {
  it('formats a join date', () => {
    expect(formatJoinDate('2026-10-01T09:00:00.000Z')).toBe('Oct 1');
  });

  it('formats a slot with a plain space before AM', () => {
    expect(formatSlot('2026-10-02T10:30:00.000Z')).toBe('Friday, Oct 2 · 10:30 AM');
  });
});

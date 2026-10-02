const dayMonth = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' });
const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

/** "Oct 1" */
export function formatJoinDate(iso: string): string {
  return dayMonth.format(new Date(iso));
}

/** "Thursday, Oct 2 · 10:30 AM", in the viewer's time zone. */
export function formatSlot(iso: string): string {
  const date = new Date(iso);
  // Recent ICU versions put a narrow no-break space before AM/PM; use a plain space everywhere.
  return `${weekday.format(date)}, ${dayMonth.format(date)} · ${time.format(date)}`.replace(/\s/g, ' ');
}

/** "less than a minute", "12 min", "1 h 5 min": how long something has been going on. */
export function formatElapsed(ms: number): string {
  const minutes = Math.floor(Math.max(0, ms) / 60_000);
  if (minutes < 1) return 'less than a minute';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export const ENTRY_STATUSES = ['waiting', 'notified', 'booked', 'removed'] as const;
export type EntryStatus = (typeof ENTRY_STATUSES)[number];

export const ROLES = ['patient', 'staff'] as const;
export type Role = (typeof ROLES)[number];

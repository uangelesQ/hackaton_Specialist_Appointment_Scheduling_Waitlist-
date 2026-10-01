import type { EntryStatus, Role } from '@waitlist/shared';

export type ActorType = Role;
export type SlotStatus = 'open' | 'offered' | 'booked';
export type OfferStatus = 'outstanding' | 'accepted' | 'declined' | 'passed_on' | 'closed';
export type ResolvedOfferStatus = Exclude<OfferStatus, 'outstanding'>;

export interface EntryRecord {
  id: number;
  patientId: number;
  status: EntryStatus;
  joinedAt: string;
  closedAt: string | null;
  createdByType: ActorType;
  createdById: number;
}

export interface SlotRecord {
  id: number;
  startsAt: string;
  status: SlotStatus;
}

export interface OfferRecord {
  id: number;
  slotId: number;
  entryId: number;
  status: OfferStatus;
  createdAt: string;
  resolvedAt: string | null;
  releasedBy: number;
}

export interface AuditRecord {
  id: number;
  action: string;
  entryId: number | null;
  slotId: number | null;
  actorType: ActorType;
  actorId: number;
  at: string;
}

export type Clock = () => string;

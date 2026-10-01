export const ENTRY_STATUSES = ['waiting', 'notified', 'booked', 'removed'] as const;
export type EntryStatus = (typeof ENTRY_STATUSES)[number];

export const ROLES = ['patient', 'staff'] as const;
export type Role = (typeof ROLES)[number];

// --- API contract: response bodies shared by the API and the web app ---

export interface EntryView {
  id: number;
  patientId: number;
  status: EntryStatus;
  position: number;
  joinedAt: string;
}

/** `created` is false when the patient was already on the waitlist and nothing was created. */
export interface JoinResponse {
  entry: EntryView;
  created: boolean;
}

export interface OfferBanner {
  id: number;
  slotStartsAt: string;
  specialistName: string;
}

export interface MyEntryView {
  id: number;
  status: EntryStatus;
  position: number;
  joinedAt: string;
  offer: OfferBanner | null;
}

export interface MyWaitlistResponse {
  entry: MyEntryView | null;
}

export interface StaffEntryView {
  id: number;
  patientId: number;
  patientName: string;
  status: EntryStatus;
  position: number;
  joinedAt: string;
  holdsOffer: boolean;
}

export type ReleaseBlockReason = 'offer_outstanding' | 'no_waiting_patients' | 'all_waiting_declined';

export interface ReleaseState {
  available: boolean;
  reason: ReleaseBlockReason | null;
  /** Date and time of a returned slot that will be reused; null when staff must enter one. */
  openSlotStartsAt: string | null;
}

export interface StaffWaitlistResponse {
  entries: StaffEntryView[];
  offer: { id: number; entryId: number; slotStartsAt: string } | null;
  release: ReleaseState;
}

export interface OfferView {
  id: number;
  slotId: number;
  slotStartsAt: string;
  entryId: number;
}

export interface ReleaseResponse {
  offer: OfferView;
}

export interface PassOnResponse {
  offer: OfferView | null;
}

export interface AcceptResponse {
  entry: { id: number; status: EntryStatus };
  booking: { slotId: number; slotStartsAt: string; specialistName: string };
}

export interface DeclineResponse {
  entry: { id: number; status: EntryStatus; position: number };
}

export interface RemoveResponse {
  entry: { id: number; status: EntryStatus };
}

export interface PatientSummary {
  id: number;
  name: string;
  onWaitlist: boolean;
}

export interface PatientsResponse {
  patients: PatientSummary[];
}

// Demo login only: lists the seeded users and signs in as one of them.
export interface UserSummary {
  id: number;
  name: string;
}

export interface DemoUsersResponse {
  patients: UserSummary[];
  staff: UserSummary[];
}

export interface LoginResponse {
  token: string;
  user: { role: Role; id: number; name: string };
  specialist: { name: string; clinic: string };
}

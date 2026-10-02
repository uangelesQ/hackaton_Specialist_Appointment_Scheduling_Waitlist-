export const ENTRY_STATUSES = ['waiting', 'notified', 'booked', 'removed'] as const;
export type EntryStatus = (typeof ENTRY_STATUSES)[number];

export const ROLES = ['patient', 'staff'] as const;
export type Role = (typeof ROLES)[number];

/** How a patient asked to be reached. A patient with no recorded preference has `null`. */
export const CONTACT_PREFERENCES = ['in_app', 'telephone'] as const;
export type ContactPreference = (typeof CONTACT_PREFERENCES)[number];

/** Who answers an offer for a patient: the patient in the app, or staff on their behalf. */
export type ResponseChannel = 'in_app' | 'staff';

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
  /** Kept in the response although this iteration's screens do not show it. */
  position: number;
  joinedAt: string;
  /** The banner data. Only an in-app holder of the outstanding offer gets it; everyone else gets null. */
  offer: OfferBanner | null;
  /** True for whoever holds the outstanding offer, whatever their channel. */
  holdsOffer: boolean;
  /** Who answers offers for this patient: themselves in the app, or staff on their behalf. */
  responseChannel: ResponseChannel;
}

export interface MyWaitlistResponse {
  /** The patient's own contact preference; null means not recorded. Present whether or not they have an entry. */
  contactPreference: ContactPreference | null;
  entry: MyEntryView | null;
}

export interface SetContactPreferenceResponse {
  contactPreference: ContactPreference;
}

/** Request bodies. Staff send a preference only when adding a caller who has none. */
export interface SetContactPreferenceRequest {
  contactPreference: ContactPreference;
}

export interface AddPatientRequest {
  contactPreference?: ContactPreference;
}

/** Demo registration only. */
export interface RegisterRequest {
  name: string;
  contactPreference: ContactPreference;
}

export interface StaffEntryView {
  id: number;
  patientId: number;
  patientName: string;
  /** How the patient asked to be reached; null means not recorded. */
  contactPreference: ContactPreference | null;
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
  offer: {
    id: number;
    entryId: number;
    slotStartsAt: string;
    /** The holder is reached by telephone (or has no recorded preference), so staff must call. */
    requiresCall: boolean;
    /** When the offer was made, so the screen can show how long it has been outstanding. */
    createdAt: string;
  } | null;
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
  /** How the patient asked to be reached; null means not recorded. */
  contactPreference: ContactPreference | null;
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

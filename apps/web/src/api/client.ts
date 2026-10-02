import type {
  AcceptResponse,
  DeclineResponse,
  DemoUsersResponse,
  JoinResponse,
  LoginResponse,
  MyWaitlistResponse,
  PassOnResponse,
  PatientsResponse,
  ReleaseResponse,
  RemoveResponse,
  Role,
  StaffWaitlistResponse,
} from '@waitlist/shared';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

/** Everything the screens can ask of the API. Tests replace this with a fake. */
export interface ApiClient {
  demoUsers(): Promise<DemoUsersResponse>;
  login(role: Role, id: number): Promise<LoginResponse>;
  myWaitlist(): Promise<MyWaitlistResponse>;
  join(): Promise<JoinResponse>;
  removeEntry(entryId: number): Promise<RemoveResponse>;
  accept(offerId: number): Promise<AcceptResponse>;
  decline(offerId: number): Promise<DeclineResponse>;
  /** Staff record that a patient they reached by telephone accepted or declined. */
  recordAccept(offerId: number): Promise<AcceptResponse>;
  recordDecline(offerId: number): Promise<DeclineResponse>;
  staffWaitlist(): Promise<StaffWaitlistResponse>;
  patients(): Promise<PatientsResponse>;
  addPatient(patientId: number): Promise<JoinResponse>;
  release(startsAt?: string): Promise<ReleaseResponse>;
  pass(offerId: number): Promise<PassOnResponse>;
}

/**
 * @param onUnauthorized called when the API rejects the token the app was holding (an expired
 *   session), so the app can sign out. Not called when there was no token, e.g. a failed sign-in.
 */
export function createApiClient(
  baseUrl: string,
  getToken: () => string | null,
  onUnauthorized: () => void,
  fetchImpl: typeof fetch = (...args) => fetch(...args),
): ApiClient {
  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const res = await fetchImpl(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const payload: unknown = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401 && token) onUnauthorized();
      const code = (payload as { error?: string }).error ?? 'unknown';
      throw new ApiError(res.status, code);
    }
    return payload as T;
  }

  return {
    demoUsers: () => request('GET', '/demo/users'),
    login: (role, id) => request('POST', '/demo/login', { role, id }),
    myWaitlist: () => request('GET', '/me/waitlist'),
    join: () => request('POST', '/waitlist'),
    removeEntry: (entryId) => request('DELETE', `/waitlist/${entryId}`),
    accept: (offerId) => request('POST', `/offers/${offerId}/accept`),
    decline: (offerId) => request('POST', `/offers/${offerId}/decline`),
    recordAccept: (offerId) => request('POST', `/offers/${offerId}/record-accept`),
    recordDecline: (offerId) => request('POST', `/offers/${offerId}/record-decline`),
    staffWaitlist: () => request('GET', '/waitlist'),
    patients: () => request('GET', '/patients'),
    addPatient: (patientId) => request('POST', `/waitlist/patients/${patientId}`),
    release: (startsAt) => request('POST', '/offers', startsAt ? { startsAt } : {}),
    pass: (offerId) => request('POST', `/offers/${offerId}/pass`),
  };
}

/** A short, friendly message for the failures a user can actually act on. */
export function describeError(err: unknown): string {
  const code = err instanceof ApiError ? err.code : '';
  switch (code) {
    case 'offer_not_available':
      return 'This offer is no longer available.';
    case 'offer_outstanding':
      return 'An offer is already waiting for an answer.';
    case 'no_eligible_patient':
      return 'There is no eligible patient to offer this slot to.';
    case 'entry_not_active':
      return 'That patient is no longer on the waitlist.';
    case 'not_registered':
      return 'You are not registered as a patient, so you cannot join the waitlist.';
    case 'response_by_staff':
      return 'Staff will record your answer for you, so it cannot be given in the app.';
    case 'patient_responds_in_app':
      return 'This patient answers in the app, so staff cannot record a response for them.';
    case 'slot_already_booked':
      return 'That slot is already booked. Choose a different date and time.';
    case 'patient_not_found':
      return 'That person is not registered in hospital records. They must register before joining the waitlist.';
    case 'forbidden':
      return 'You are not allowed to do that.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

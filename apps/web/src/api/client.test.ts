import { describe, expect, it, vi } from 'vitest';
import { ApiError, createApiClient, describeError } from './client';

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('api client', () => {
  it('calls the right path with the bearer token and returns the body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { entry: null }));
    const client = createApiClient('/api', () => 'tok', vi.fn(), fetchMock);

    const result = await client.myWaitlist();

    expect(result).toEqual({ entry: null });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/me/waitlist');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });

  it('sends no authorization header when signed out', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { patients: [], staff: [] }));
    const client = createApiClient('/api', () => null, vi.fn(), fetchMock);

    await client.demoUsers();

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('posts JSON bodies', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, { offer: { id: 1 } }));
    const client = createApiClient('/api', () => 'tok', vi.fn(), fetchMock);

    await client.release('2026-10-02T10:30:00.000Z');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/offers');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ startsAt: '2026-10-02T10:30:00.000Z' });
  });

  it('uses the expected paths for each action', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(200, {})));
    const client = createApiClient('/api', () => 'tok', vi.fn(), fetchMock);

    await client.join();
    await client.addPatient(4);
    await client.removeEntry(7);
    await client.accept(3);
    await client.decline(3);
    await client.recordAccept(3);
    await client.recordDecline(3);
    await client.pass(3);
    await client.staffWaitlist();
    await client.patients();

    expect(fetchMock.mock.calls.map(([url, init]) => `${(init as RequestInit).method} ${url}`)).toEqual([
      'POST /api/waitlist',
      'POST /api/waitlist/patients/4',
      'DELETE /api/waitlist/7',
      'POST /api/offers/3/accept',
      'POST /api/offers/3/decline',
      'POST /api/offers/3/record-accept',
      'POST /api/offers/3/record-decline',
      'POST /api/offers/3/pass',
      'GET /api/waitlist',
      'GET /api/patients',
    ]);
  });

  it('throws an ApiError carrying the status and code', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(409, { error: 'offer_not_available' }));
    const client = createApiClient('/api', () => 'tok', vi.fn(), fetchMock);

    const failure = await client.accept(1).catch((err: unknown) => err);

    expect(failure).toBeInstanceOf(ApiError);
    expect(failure).toMatchObject({ status: 409, code: 'offer_not_available' });
  });

  it('signals when the token is no longer accepted', async () => {
    const onUnauthorized = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401, { error: 'unauthenticated' }));
    const client = createApiClient('/api', () => 'tok', onUnauthorized, fetchMock);

    await expect(client.myWaitlist()).rejects.toBeInstanceOf(ApiError);

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not treat a failed sign-in as an expired session', async () => {
    const onUnauthorized = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401, { error: 'unknown_user' }));
    const client = createApiClient('/api', () => null, onUnauthorized, fetchMock);

    await expect(client.login('patient', 99)).rejects.toMatchObject({ code: 'unknown_user' });

    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});

describe('describeError', () => {
  const message = (code: string) => describeError(new ApiError(409, code));

  it.each([
    ['response_by_staff', /staff/i],
    ['patient_responds_in_app', /in the app/i],
    ['slot_already_booked', /already booked/i],
    ['patient_not_found', /not registered/i],
    ['offer_not_available', /no longer available/i],
    ['offer_outstanding', /already waiting/i],
    ['no_eligible_patient', /no eligible patient/i],
    ['entry_not_active', /no longer on the waitlist/i],
  ])('explains %s in words a user can act on', (code, expected) => {
    expect(message(code)).toMatch(expected);
  });

  it('never shows the raw error code', () => {
    for (const code of ['response_by_staff', 'patient_responds_in_app', 'slot_already_booked', 'patient_not_found']) {
      expect(message(code)).not.toContain('_');
    }
  });

  it('falls back to a generic message for anything unexpected', () => {
    expect(message('something_new')).toBe('Something went wrong. Please try again.');
    expect(describeError(new Error('network down'))).toBe('Something went wrong. Please try again.');
  });
});

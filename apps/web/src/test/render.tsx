import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { vi, type Mock } from 'vitest';
import type { MyEntryView, StaffEntryView, StaffWaitlistResponse } from '@waitlist/shared';
import { ApiProvider } from '../api/ApiContext';
import type { ApiClient } from '../api/client';
import { SessionProvider, type Session } from '../session';

export type FakeApi = { [K in keyof ApiClient]: Mock<ApiClient[K]> };

const METHODS: (keyof ApiClient)[] = [
  'demoUsers',
  'login',
  'myWaitlist',
  'join',
  'removeEntry',
  'accept',
  'decline',
  'recordAccept',
  'recordDecline',
  'staffWaitlist',
  'patients',
  'addPatient',
  'release',
  'pass',
];

/** Every method rejects until a test says what it returns, so a missing mock fails loudly. */
export function createFakeApi(): FakeApi {
  const api: Record<string, Mock> = {};
  for (const name of METHODS) {
    api[name] = vi.fn(() => Promise.reject(new Error(`api.${name} was called but not mocked`)));
  }
  return api as unknown as FakeApi;
}

export function renderWithProviders(ui: ReactNode, options: { api?: FakeApi; session?: Session | null } = {}) {
  const api = options.api ?? createFakeApi();
  if (options.session) sessionStorage.setItem('waitlist-session', JSON.stringify(options.session));

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <ApiProvider client={api as unknown as ApiClient}>
        <SessionProvider>{ui}</SessionProvider>
      </ApiProvider>
    </QueryClientProvider>,
  );
  return { api };
}

// --- fixtures ---------------------------------------------------------------

export const SPECIALIST = { name: 'Dr. Elena Ruiz', clinic: 'Cardiology' };

export const patientSession: Session = {
  token: 'patient-token',
  user: { role: 'patient', id: 1, name: 'Maria Gómez' },
  specialist: SPECIALIST,
};

export const staffSession: Session = {
  token: 'staff-token',
  user: { role: 'staff', id: 1, name: 'Sam Patel' },
  specialist: SPECIALIST,
};

export const SLOT = '2026-10-02T10:30:00.000Z';

export const myEntry = (overrides: Partial<MyEntryView> = {}): MyEntryView => ({
  id: 10,
  status: 'waiting',
  position: 2,
  joinedAt: '2026-10-01T09:00:00.000Z',
  offer: null,
  responseChannel: 'in_app',
  ...overrides,
  // A banner implies the patient holds the offer; callers can still set it explicitly.
  holdsOffer: overrides.holdsOffer ?? overrides.offer != null,
});

export const staffEntry = (overrides: Partial<StaffEntryView> & { id: number }): StaffEntryView => ({
  patientId: overrides.id,
  patientName: `Patient ${overrides.id}`,
  contactPreference: 'in_app',
  status: 'waiting',
  position: 1,
  joinedAt: '2026-10-01T09:00:00.000Z',
  holdsOffer: false,
  ...overrides,
});

export const staffOffer = (
  overrides: Partial<NonNullable<StaffWaitlistResponse['offer']>> & { id: number; entryId: number },
): NonNullable<StaffWaitlistResponse['offer']> => ({
  slotStartsAt: SLOT,
  requiresCall: false,
  createdAt: '2026-10-01T09:30:00.000Z',
  ...overrides,
});

export const staffView = (overrides: Partial<StaffWaitlistResponse> = {}): StaffWaitlistResponse => ({
  entries: [],
  offer: null,
  release: { available: false, reason: 'no_waiting_patients', openSlotStartsAt: null },
  ...overrides,
});

import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from './api/client';
import { App } from './App';
import {
  createFakeApi,
  patientSession,
  renderWithProviders,
  staffSession,
  staffView,
  type FakeApi,
} from './test/render';

const USERS = {
  patients: [
    { id: 1, name: 'Ana Torres' },
    { id: 2, name: 'Ben Carter' },
  ],
  staff: [{ id: 1, name: 'Sam Patel' }],
};

describe('sign-in and role routing (6.2)', () => {
  let api: FakeApi;

  beforeEach(() => {
    api = createFakeApi();
    api.demoUsers.mockResolvedValue(USERS);
    api.myWaitlist.mockResolvedValue({ entry: null });
    api.staffWaitlist.mockResolvedValue(staffView());
    api.patients.mockResolvedValue({ patients: [] });
  });

  it('asks a signed-out visitor to choose who to sign in as', async () => {
    renderWithProviders(<App />, { api });

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Ana Torres' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ben Carter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sam Patel' })).toBeInTheDocument();
    expect(screen.queryByText("You're not on the waitlist yet")).not.toBeInTheDocument();
  });

  it('lands a patient on the patient view', async () => {
    api.login.mockResolvedValue({ ...patientSession, token: 'abc' });
    renderWithProviders(<App />, { api });

    fireEvent.click(await screen.findByRole('button', { name: 'Ana Torres' }));

    await waitFor(() => expect(api.login).toHaveBeenCalledWith('patient', 1));
    expect(await screen.findByText("You're not on the waitlist yet")).toBeInTheDocument();
    expect(api.staffWaitlist).not.toHaveBeenCalled();
  });

  it('lands staff on the staff view', async () => {
    api.login.mockResolvedValue({ ...staffSession, token: 'abc' });
    renderWithProviders(<App />, { api });

    fireEvent.click(await screen.findByRole('button', { name: 'Sam Patel' }));

    await waitFor(() => expect(api.login).toHaveBeenCalledWith('staff', 1));
    expect(await screen.findByText('No patients are currently waiting.')).toBeInTheDocument();
    expect(api.myWaitlist).not.toHaveBeenCalled();
  });

  it('keeps a signed-in patient on their landing view and shows who and where', async () => {
    renderWithProviders(<App />, { api, session: patientSession });

    expect(await screen.findByText("You're not on the waitlist yet")).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dr. Elena Ruiz' })).toBeInTheDocument();
    expect(screen.getByText(/Dermatology/)).toBeInTheDocument();
    expect(screen.getByText(/Ana Torres/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Sign in' })).not.toBeInTheDocument();
  });

  it('keeps signed-in staff on the staff view', async () => {
    renderWithProviders(<App />, { api, session: staffSession });

    expect(await screen.findByText('No patients are currently waiting.')).toBeInTheDocument();
    expect(screen.getByText(/Sam Patel/)).toBeInTheDocument();
  });

  it('signs out and returns to the sign-in screen', async () => {
    renderWithProviders(<App />, { api, session: patientSession });
    await screen.findByText("You're not on the waitlist yet");

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(sessionStorage.getItem('waitlist-session')).toBeNull();
  });

  it('shows an error when sign-in fails and stays signed out', async () => {
    api.login.mockRejectedValue(new ApiError(401, 'unknown_user'));
    renderWithProviders(<App />, { api });

    fireEvent.click(await screen.findByRole('button', { name: 'Ana Torres' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows an error when the list of users cannot be loaded', async () => {
    api.demoUsers.mockRejectedValue(new ApiError(404, 'unknown'));
    renderWithProviders(<App />, { api });

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});

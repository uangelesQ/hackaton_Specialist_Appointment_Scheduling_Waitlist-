import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from '../api/client';
import { App } from '../App';
import { createFakeApi, patientSession, renderWithProviders, type FakeApi } from '../test/render';

const USERS = { patients: [{ id: 1, name: 'Maria Gómez' }], staff: [{ id: 1, name: 'Ricardo Salazar' }] };

/** The demo registration step on the sign-in screen (PS-001 v2.5 Appendix A). */
describe('demo registration on the sign-in screen (9.1)', () => {
  let api: FakeApi;

  beforeEach(() => {
    api = createFakeApi();
    api.demoUsers.mockResolvedValue(USERS);
    api.myWaitlist.mockResolvedValue({ contactPreference: 'telephone', entry: null });
  });

  const show = () => renderWithProviders(<App />, { api });
  const nameField = () => screen.getByLabelText('Name');
  const register = () => fireEvent.click(screen.getByRole('button', { name: 'Register' }));

  it('shows a registration form under the sign-in options', async () => {
    show();

    expect(await screen.findByRole('button', { name: 'Maria Gómez' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Register (demo)' })).toBeInTheDocument();
    expect(nameField()).toBeInTheDocument();
    expect(screen.getAllByRole('radio').map((r) => (r as HTMLInputElement).value)).toEqual(['in_app', 'telephone']);
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
  });

  it('registers with a name and a preference, signs in as the new patient and lands on the patient view', async () => {
    api.register.mockResolvedValue({ ...patientSession, token: 'new', user: { role: 'patient', id: 7, name: 'Lucía Fernández' } });
    show();

    await screen.findByRole('heading', { name: 'Register (demo)' });
    fireEvent.change(nameField(), { target: { value: '  Lucía Fernández ' } });
    fireEvent.click(screen.getByRole('radio', { name: /Telephone/ }));
    register();

    await waitFor(() => expect(api.register).toHaveBeenCalledWith('Lucía Fernández', 'telephone'));
    expect(await screen.findByText("You're not on the waitlist yet")).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Register (demo)' })).not.toBeInTheDocument();
  });

  it.each([
    ['no name', '', null, /enter a name/i],
    ['a name of only spaces', '   ', 'in_app', /enter a name/i],
    ['no preference', 'Lucía Fernández', null, /choose in-app or telephone/i],
  ] as const)('creates nothing and says what is missing for %s', async (_label, name, preference, message) => {
    show();

    await screen.findByRole('heading', { name: 'Register (demo)' });
    fireEvent.change(nameField(), { target: { value: name } });
    if (preference) fireEvent.click(screen.getByRole('radio', { name: preference === 'in_app' ? /In-app/ : /Telephone/ }));
    register();

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(api.register).not.toHaveBeenCalled();
  });

  it('refuses a name already in use and says they can sign in as that patient instead', async () => {
    api.register.mockRejectedValue(new ApiError(409, 'name_already_registered'));
    show();

    await screen.findByRole('heading', { name: 'Register (demo)' });
    fireEvent.change(nameField(), { target: { value: 'Maria Gómez' } });
    fireEvent.click(screen.getByRole('radio', { name: /In-app/ }));
    register();

    expect(await screen.findByRole('alert')).toHaveTextContent(/already registered.*sign in as that patient instead/i);
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Maria Gómez' })).toBeInTheDocument();
  });

  it('is not shown once someone is signed in', async () => {
    renderWithProviders(<App />, { api, session: patientSession });

    expect(await screen.findByText("You're not on the waitlist yet")).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Register (demo)' })).not.toBeInTheDocument();
  });
});

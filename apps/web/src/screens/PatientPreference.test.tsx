import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from '../api/client';
import { createFakeApi, myEntry, patientSession, renderWithProviders, SLOT, type FakeApi } from '../test/render';
import { PatientView } from './PatientView';

const offer = { id: 5, slotStartsAt: SLOT, specialistName: 'Dr. Elena Ruiz' };
const heldInApp = () => myEntry({ status: 'notified', position: 1, offer });
const heldByStaff = () => myEntry({ status: 'notified', position: 1, offer: null, holdsOffer: true, responseChannel: 'staff' });
const joined = { created: true, entry: { id: 10, patientId: 1, status: 'waiting' as const, position: 2, joinedAt: '2026-10-01T09:00:00.000Z' } };

describe('patient contact preference (7)', () => {
  let api: FakeApi;

  beforeEach(() => {
    api = createFakeApi();
  });

  const show = () => renderWithProviders(<PatientView />, { api, session: patientSession });
  const card = async () => within(await screen.findByRole('heading', { name: 'How we contact you' }).then((h) => h.closest('section') as HTMLElement));

  describe('the preference card (7.1)', () => {
    it.each([
      ['in_app', 'In-app', 'Change'],
      ['telephone', 'Telephone', 'Change'],
      [null, 'Not chosen yet', 'Choose'],
    ] as const)('shows %s as "%s" with a "%s" control, even with no entry', async (preference, label, control) => {
      api.myWaitlist.mockResolvedValue({ contactPreference: preference, entry: null });
      show();

      const c = await card();

      expect(c.getByText(label)).toBeInTheDocument();
      expect(c.getByRole('button', { name: control })).toBeInTheDocument();
    });

    it('is shown alongside an entry', async () => {
      api.myWaitlist.mockResolvedValue({ contactPreference: 'telephone', entry: myEntry() });
      show();

      expect((await card()).getByText('Telephone')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: "You're on the waitlist" })).toBeInTheDocument();
    });

    it('changes the preference, saves it and shows the new value', async () => {
      api.myWaitlist.mockResolvedValueOnce({ contactPreference: 'in_app', entry: null }).mockResolvedValue({ contactPreference: 'telephone', entry: null });
      api.setContactPreference.mockResolvedValue({ contactPreference: 'telephone' });
      show();

      fireEvent.click((await card()).getByRole('button', { name: 'Change' }));
      expect(screen.getByRole('radio', { name: /In-app/ })).toBeChecked();
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
      fireEvent.click(screen.getByRole('radio', { name: /Telephone/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(api.setContactPreference).toHaveBeenCalledWith('telephone'));
      expect((await card()).getByText('Telephone')).toBeInTheDocument();
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();
      expect(api.join).not.toHaveBeenCalled();
    });

    it('leaves the entry status unchanged after a save', async () => {
      api.myWaitlist.mockResolvedValue({ contactPreference: 'in_app', entry: myEntry() });
      api.setContactPreference.mockResolvedValue({ contactPreference: 'telephone' });
      show();

      fireEvent.click((await card()).getByRole('button', { name: 'Change' }));
      fireEvent.click(screen.getByRole('radio', { name: /Telephone/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(api.setContactPreference).toHaveBeenCalled());
      expect(await screen.findByRole('heading', { name: "You're on the waitlist" })).toBeInTheDocument();
    });

    it('sets a first preference for a waiting patient who has none', async () => {
      api.myWaitlist.mockResolvedValueOnce({ contactPreference: null, entry: myEntry() }).mockResolvedValue({ contactPreference: 'in_app', entry: myEntry() });
      api.setContactPreference.mockResolvedValue({ contactPreference: 'in_app' });
      show();

      fireEvent.click((await card()).getByRole('button', { name: 'Choose' }));
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
      fireEvent.click(screen.getByRole('radio', { name: /In-app/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(api.setContactPreference).toHaveBeenCalledWith('in_app'));
      expect((await card()).getByText('In-app')).toBeInTheDocument();
    });

    it('tells the patient it was not saved and keeps showing the previous value', async () => {
      api.myWaitlist.mockResolvedValue({ contactPreference: 'in_app', entry: null });
      api.setContactPreference.mockRejectedValue(new ApiError(500, 'internal'));
      show();

      fireEvent.click((await card()).getByRole('button', { name: 'Change' }));
      fireEvent.click(screen.getByRole('radio', { name: /Telephone/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(/not saved/i);
      expect((await card()).getByText('In-app')).toBeInTheDocument();
    });

    it('does nothing when the change is cancelled', async () => {
      api.myWaitlist.mockResolvedValue({ contactPreference: 'in_app', entry: null });
      show();

      fireEvent.click((await card()).getByRole('button', { name: 'Change' }));
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(api.setContactPreference).not.toHaveBeenCalled();
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    });

    it('shows no history of earlier values', async () => {
      api.myWaitlist.mockResolvedValue({ contactPreference: 'telephone', entry: null });
      show();

      await card();

      expect(document.body.textContent).not.toMatch(/previous|history|earlier|changed from/i);
    });
  });

  describe('choosing before joining (7.2)', () => {
    it('asks a patient with no preference to choose, describing each option, before anything is created', async () => {
      api.myWaitlist.mockResolvedValue({ contactPreference: null, entry: null });
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Join waitlist' }));

      expect(screen.getAllByRole('radio')).toHaveLength(2);
      expect(screen.getByText(/offers appear in the app/i)).toBeInTheDocument();
      expect(screen.getByText(/staff will call you/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Confirm and join' })).toBeDisabled();
      expect(api.setContactPreference).not.toHaveBeenCalled();
      expect(api.join).not.toHaveBeenCalled();
    });

    it('saves the choice, joins, and confirms both', async () => {
      api.myWaitlist.mockResolvedValueOnce({ contactPreference: null, entry: null }).mockResolvedValue({ contactPreference: 'telephone', entry: myEntry() });
      api.setContactPreference.mockResolvedValue({ contactPreference: 'telephone' });
      api.join.mockResolvedValue(joined);
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Join waitlist' }));
      fireEvent.click(screen.getByRole('radio', { name: /Telephone/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Confirm and join' }));

      await waitFor(() => expect(api.join).toHaveBeenCalledTimes(1));
      expect(api.setContactPreference).toHaveBeenCalledWith('telephone');
      expect(await screen.findByText(/preference saved.*telephone.*on the waitlist/i)).toBeInTheDocument();
      expect(await screen.findByRole('heading', { name: "You're on the waitlist" })).toBeInTheDocument();
    });

    it('saves and joins in that order', async () => {
      const order: string[] = [];
      api.myWaitlist.mockResolvedValue({ contactPreference: null, entry: null });
      api.setContactPreference.mockImplementation(async (v) => {
        order.push('save');
        return { contactPreference: v };
      });
      api.join.mockImplementation(async () => {
        order.push('join');
        return joined;
      });
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Join waitlist' }));
      fireEvent.click(screen.getByRole('radio', { name: /In-app/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Confirm and join' }));

      await waitFor(() => expect(order).toEqual(['save', 'join']));
    });

    it('saves nothing and creates nothing when the patient leaves without choosing', async () => {
      api.myWaitlist.mockResolvedValue({ contactPreference: null, entry: null });
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Join waitlist' }));
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(api.setContactPreference).not.toHaveBeenCalled();
      expect(api.join).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Join waitlist' })).toBeInTheDocument();
      expect(screen.queryAllByRole('radio')).toHaveLength(0);
    });

    it('does not join when the choice cannot be saved', async () => {
      api.myWaitlist.mockResolvedValue({ contactPreference: null, entry: null });
      api.setContactPreference.mockRejectedValue(new ApiError(500, 'internal'));
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Join waitlist' }));
      fireEvent.click(screen.getByRole('radio', { name: /In-app/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Confirm and join' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(/not saved/i);
      expect(api.join).not.toHaveBeenCalled();
    });

    it('says the patient has not joined when the join fails after the choice was saved, and a retry does not ask again', async () => {
      api.myWaitlist.mockResolvedValueOnce({ contactPreference: null, entry: null }).mockResolvedValue({ contactPreference: 'in_app', entry: null });
      api.setContactPreference.mockResolvedValue({ contactPreference: 'in_app' });
      api.join.mockRejectedValueOnce(new ApiError(500, 'internal')).mockResolvedValue(joined);
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Join waitlist' }));
      fireEvent.click(screen.getByRole('radio', { name: /In-app/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Confirm and join' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(/have not joined/i);
      expect(screen.getByRole('alert')).toHaveTextContent(/saved/i);

      fireEvent.click(await screen.findByRole('button', { name: 'Join waitlist' }));

      await waitFor(() => expect(api.join).toHaveBeenCalledTimes(2));
      expect(screen.queryAllByRole('radio')).toHaveLength(0);
      expect(api.setContactPreference).toHaveBeenCalledTimes(1);
    });

    it('joins straight away when a preference is already recorded', async () => {
      api.myWaitlist.mockResolvedValue({ contactPreference: 'telephone', entry: null });
      api.join.mockResolvedValue(joined);
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Join waitlist' }));

      await waitFor(() => expect(api.join).toHaveBeenCalledTimes(1));
      expect(screen.queryAllByRole('radio')).toHaveLength(0);
      expect(api.setContactPreference).not.toHaveBeenCalled();
    });
  });

  describe('the offer follows a change of preference (7.3)', () => {
    it('removes the banner and says staff will contact the patient after a switch to telephone', async () => {
      api.myWaitlist.mockResolvedValueOnce({ contactPreference: 'in_app', entry: heldInApp() }).mockResolvedValue({ contactPreference: 'telephone', entry: heldByStaff() });
      api.setContactPreference.mockResolvedValue({ contactPreference: 'telephone' });
      show();
      expect(await screen.findByText('A slot just opened for you')).toBeInTheDocument();

      fireEvent.click((await card()).getByRole('button', { name: 'Change' }));
      fireEvent.click(screen.getByRole('radio', { name: /Telephone/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(await screen.findByText(/member of our team will contact you/i)).toBeInTheDocument();
      expect(screen.queryByText('A slot just opened for you')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Decline' })).not.toBeInTheDocument();
    });

    it('shows the banner with accept and decline after a switch to in-app', async () => {
      api.myWaitlist.mockResolvedValueOnce({ contactPreference: 'telephone', entry: heldByStaff() }).mockResolvedValue({ contactPreference: 'in_app', entry: heldInApp() });
      api.setContactPreference.mockResolvedValue({ contactPreference: 'in_app' });
      show();
      expect(await screen.findByText(/member of our team will contact you/i)).toBeInTheDocument();

      fireEvent.click((await card()).getByRole('button', { name: 'Change' }));
      fireEvent.click(screen.getByRole('radio', { name: /In-app/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(await screen.findByText('A slot just opened for you')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();
    });

    it('closes the confirmation and shows the current state when confirming after a switch to telephone elsewhere', async () => {
      api.myWaitlist.mockResolvedValueOnce({ contactPreference: 'in_app', entry: heldInApp() }).mockResolvedValue({ contactPreference: 'telephone', entry: heldByStaff() });
      api.accept.mockRejectedValue(new ApiError(403, 'response_by_staff'));
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Accept' }));
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirm' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(/staff will record your answer/i);
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(await screen.findByText(/member of our team will contact you/i)).toBeInTheDocument();
      expect(screen.queryByText('A slot just opened for you')).not.toBeInTheDocument();
    });
  });
});

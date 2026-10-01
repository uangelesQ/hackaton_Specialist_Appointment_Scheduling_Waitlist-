import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from '../api/client';
import {
  createFakeApi,
  myEntry,
  patientSession,
  renderWithProviders,
  SLOT,
  type FakeApi,
} from '../test/render';
import { PatientView } from './PatientView';

const SLOT_TEXT = 'Friday, Oct 2 · 10:30 AM';
const offer = { id: 5, slotStartsAt: SLOT, specialistName: 'Dr. Elena Ruiz' };

describe('patient waitlist view', () => {
  let api: FakeApi;

  beforeEach(() => {
    api = createFakeApi();
  });

  const show = () => renderWithProviders(<PatientView />, { api, session: patientSession });

  describe('join, position and leave (6.3)', () => {
    it('invites a patient who is not on the waitlist to join', async () => {
      api.myWaitlist.mockResolvedValue({ entry: null });
      show();

      expect(await screen.findByText("You're not on the waitlist yet")).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Join waitlist' })).toBeInTheDocument();
      expect(screen.queryByText('Your place in line')).not.toBeInTheDocument();
    });

    it('joins, then shows the new position', async () => {
      api.myWaitlist.mockResolvedValueOnce({ entry: null }).mockResolvedValue({ entry: myEntry({ position: 3 }) });
      api.join.mockResolvedValue({
        created: true,
        entry: { id: 10, patientId: 1, status: 'waiting', position: 3, joinedAt: '2026-10-01T09:00:00.000Z' },
      });
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Join waitlist' }));

      await waitFor(() => expect(api.join).toHaveBeenCalledTimes(1));
      expect(await screen.findByText('#3')).toBeInTheDocument();
      expect(screen.queryByText("You're not on the waitlist yet")).not.toBeInTheDocument();
    });

    it('shows the position as #N with the label, specialist and join date, and no total', async () => {
      api.myWaitlist.mockResolvedValue({ entry: myEntry({ position: 2 }) });
      show();

      expect(await screen.findByText('#2')).toBeInTheDocument();
      expect(screen.getByText('Your place in line')).toBeInTheDocument();
      expect(screen.getByText('Waiting for Dr. Elena Ruiz · Dermatology')).toBeInTheDocument();
      expect(screen.getByText('Joined', { selector: '.meta-item .k' })).toBeInTheDocument();
      expect(screen.getByText('Oct 1')).toBeInTheDocument();
      expect(screen.queryByText(/\bof\s+\d+\b/)).not.toBeInTheDocument();
      expect(screen.queryByText(/total/i)).not.toBeInTheDocument();
    });

    it('shows the existing position when a join finds the patient already on the list', async () => {
      api.myWaitlist.mockResolvedValueOnce({ entry: null }).mockResolvedValue({ entry: myEntry({ position: 2 }) });
      api.join.mockResolvedValue({
        created: false,
        entry: { id: 10, patientId: 1, status: 'waiting', position: 2, joinedAt: '2026-10-01T09:00:00.000Z' },
      });
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Join waitlist' }));

      expect(await screen.findByText(/already on the waitlist/i)).toBeInTheDocument();
      expect(await screen.findByText('#2')).toBeInTheDocument();
    });

    it('asks before leaving, and leaving removes the entry and returns to the empty state', async () => {
      api.myWaitlist.mockResolvedValueOnce({ entry: myEntry() }).mockResolvedValue({ entry: null });
      api.removeEntry.mockResolvedValue({ entry: { id: 10, status: 'removed' } });
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Leave waitlist' }));
      const dialog = screen.getByRole('dialog', { name: 'Leave the waitlist?' });
      expect(api.removeEntry).not.toHaveBeenCalled();

      fireEvent.click(within(dialog).getByRole('button', { name: 'Leave' }));

      await waitFor(() => expect(api.removeEntry).toHaveBeenCalledWith(10));
      expect(await screen.findByText("You're not on the waitlist yet")).toBeInTheDocument();
    });

    it('keeps the entry when the patient changes their mind about leaving', async () => {
      api.myWaitlist.mockResolvedValue({ entry: myEntry() });
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Leave waitlist' }));
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Stay on waitlist' }));

      expect(api.removeEntry).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
    });

    it('explains why a join was refused', async () => {
      api.myWaitlist.mockResolvedValue({ entry: null });
      api.join.mockRejectedValue(new ApiError(403, 'not_registered'));
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Join waitlist' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('not registered');
      expect(screen.getByText("You're not on the waitlist yet")).toBeInTheDocument();
    });

    it('shows an error when the waitlist cannot be loaded', async () => {
      api.myWaitlist.mockRejectedValue(new ApiError(500, 'internal'));
      show();

      expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    });

    it('shows an error when leaving fails and keeps the entry', async () => {
      api.myWaitlist.mockResolvedValue({ entry: myEntry() });
      api.removeEntry.mockRejectedValue(new ApiError(409, 'entry_not_active'));
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Leave waitlist' }));
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Leave' }));

      expect(await screen.findByRole('alert')).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('offer banner, accept and decline (6.4)', () => {
    const holding = () => myEntry({ status: 'notified', position: 1, offer });

    it('shows the banner and slot card to the offer holder, with their position unchanged', async () => {
      api.myWaitlist.mockResolvedValue({ entry: holding() });
      show();

      expect(await screen.findByRole('status')).toHaveTextContent('A slot just opened for you');
      expect(screen.getByText(SLOT_TEXT)).toBeInTheDocument();
      expect(screen.getByText('With Dr. Elena Ruiz')).toBeInTheDocument();
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();
    });

    it('shows no banner and no booking actions to a patient without an offer', async () => {
      api.myWaitlist.mockResolvedValue({ entry: myEntry() });
      show();

      await screen.findByText('#2');
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Decline' })).not.toBeInTheDocument();
    });

    it('asks to confirm first, restating the slot date, time and specialist', async () => {
      api.myWaitlist.mockResolvedValue({ entry: holding() });
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Accept' }));

      const dialog = screen.getByRole('dialog', { name: 'Book this appointment?' });
      expect(dialog).toHaveTextContent(SLOT_TEXT);
      expect(dialog).toHaveTextContent('Dr. Elena Ruiz');
      expect(api.accept).not.toHaveBeenCalled();
    });

    it('makes no API call and keeps the offer when the patient goes back', async () => {
      api.myWaitlist.mockResolvedValue({ entry: holding() });
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Accept' }));
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));

      expect(api.accept).not.toHaveBeenCalled();
      expect(api.decline).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
      expect(screen.getByText(SLOT_TEXT)).toBeInTheDocument();
    });

    it('books the slot on confirm and shows the booked confirmation', async () => {
      api.myWaitlist.mockResolvedValueOnce({ entry: holding() }).mockResolvedValue({ entry: null });
      api.accept.mockResolvedValue({
        entry: { id: 10, status: 'booked' },
        booking: { slotId: 1, slotStartsAt: SLOT, specialistName: 'Dr. Elena Ruiz' },
      });
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Accept' }));
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirm' }));

      await waitFor(() => expect(api.accept).toHaveBeenCalledWith(5));
      expect(await screen.findByRole('heading', { name: "You're booked" })).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`${SLOT_TEXT}.*Dr\\. Elena Ruiz`))).toBeInTheDocument();
      expect(screen.getByText('Contact the office')).toBeInTheDocument();
      expect(screen.queryByText('Your place in line')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
    });

    it('declines, keeps the same position and removes the banner', async () => {
      api.myWaitlist
        .mockResolvedValueOnce({ entry: holding() })
        .mockResolvedValue({ entry: myEntry({ status: 'waiting', position: 1 }) });
      api.decline.mockResolvedValue({ entry: { id: 10, status: 'waiting', position: 1 } });
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Decline' }));

      await waitFor(() => expect(api.decline).toHaveBeenCalledWith(5));
      await screen.findByText("We'll notify you here the moment a slot opens.", { exact: false });
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
    });

    it('says so when the offer is no longer available', async () => {
      api.myWaitlist
        .mockResolvedValueOnce({ entry: holding() })
        .mockResolvedValue({ entry: myEntry({ status: 'waiting', position: 1 }) });
      api.accept.mockRejectedValue(new ApiError(409, 'offer_not_available'));
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Accept' }));
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirm' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('This offer is no longer available.');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: "You're booked" })).not.toBeInTheDocument();
    });

    it('shows an error when declining fails', async () => {
      api.myWaitlist.mockResolvedValue({ entry: holding() });
      api.decline.mockRejectedValue(new ApiError(500, 'internal'));
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Decline' }));

      expect(await screen.findByRole('alert')).toBeInTheDocument();
    });
  });
});

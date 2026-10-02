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

/** An offer held by a patient staff must call: no banner data, but they do hold it. */
const heldByStaffChannel = () => myEntry({ status: 'notified', position: 1, offer: null, holdsOffer: true, responseChannel: 'staff' });
const heldInApp = () => myEntry({ status: 'notified', position: 1, offer });

describe('patient waitlist view', () => {
  let api: FakeApi;

  beforeEach(() => {
    api = createFakeApi();
  });

  const show = () => renderWithProviders(<PatientView />, { api, session: patientSession });
  const stepper = (label: string) => screen.getByText(label, { selector: '.step .label' }).parentElement;

  describe('joining, and a status instead of a queue position (5.1)', () => {
    it('invites a patient who is not on the waitlist to join', async () => {
      api.myWaitlist.mockResolvedValue({ entry: null });
      show();

      expect(await screen.findByText("You're not on the waitlist yet")).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Join waitlist' })).toBeInTheDocument();
    });

    it('joins, then shows the waiting status', async () => {
      api.myWaitlist.mockResolvedValueOnce({ entry: null }).mockResolvedValue({ entry: myEntry() });
      api.join.mockResolvedValue({
        created: true,
        entry: { id: 10, patientId: 1, status: 'waiting', position: 2, joinedAt: '2026-10-01T09:00:00.000Z' },
      });
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Join waitlist' }));

      await waitFor(() => expect(api.join).toHaveBeenCalledTimes(1));
      expect(await screen.findByRole('heading', { name: "You're on the waitlist" })).toBeInTheDocument();
      expect(screen.queryByText("You're not on the waitlist yet")).not.toBeInTheDocument();
    });

    it('shows a waiting patient the four-step status, the join date and what to expect', async () => {
      api.myWaitlist.mockResolvedValue({ entry: myEntry({ position: 7 }) });
      show();

      await screen.findByRole('heading', { name: "You're on the waitlist" });
      expect(['Joined', 'Waiting', 'Notified', 'Booked'].map((l) => stepper(l)?.className)).toEqual([
        expect.stringContaining('done'),
        expect.stringContaining('current'),
        expect.not.stringMatching(/done|current/),
        expect.not.stringMatching(/done|current/),
      ]);
      expect(screen.getByText("We'll notify you here the moment a slot opens.", { exact: false })).toBeInTheDocument();
      expect(screen.getByText('Joined', { selector: '.meta-item .k' })).toBeInTheDocument();
      expect(screen.getByText('Oct 1')).toBeInTheDocument();
    });

    it.each([
      ['waiting', myEntry({ position: 7 })],
      ['notified with an in-app offer', myEntry({ status: 'notified', position: 7, offer })],
      ['notified and answered by staff', myEntry({ status: 'notified', position: 7, offer: null, holdsOffer: true, responseChannel: 'staff' })],
    ])('shows no queue position, no count and no leave control when %s', async (_label, entry) => {
      api.myWaitlist.mockResolvedValue({ entry });
      show();

      await screen.findByRole('heading', { name: "You're on the waitlist" });
      expect(document.body.textContent).not.toMatch(/#\d/);
      expect(document.body.textContent).not.toMatch(/\b7\b/);
      expect(screen.queryByText(/your place in line/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/\bof\s+\d+\b/)).not.toBeInTheDocument();
      expect(screen.queryByText(/total/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/patients (waiting|ahead)/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /leave/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('moves the status to Notified when the entry becomes notified', async () => {
      api.myWaitlist.mockResolvedValue({ entry: heldInApp() });
      show();

      await screen.findByRole('status');
      expect(stepper('Waiting')?.className).toContain('done');
      expect(stepper('Notified')?.className).toContain('current');
    });

    it('tells a booked patient the slot and how to change it, with no leave control', async () => {
      api.myWaitlist.mockResolvedValueOnce({ entry: heldInApp() }).mockResolvedValue({ entry: null });
      api.accept.mockResolvedValue({
        entry: { id: 10, status: 'booked' },
        booking: { slotId: 1, slotStartsAt: SLOT, specialistName: 'Dr. Elena Ruiz' },
      });
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Accept' }));
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirm' }));

      expect(await screen.findByRole('heading', { name: "You're booked" })).toBeInTheDocument();
      expect(stepper('Booked')?.className).toContain('current');
      expect(screen.getByText(new RegExp(`${SLOT_TEXT}.*Dr\\. Elena Ruiz`))).toBeInTheDocument();
      expect(screen.getByText('Contact the office')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /leave/i })).not.toBeInTheDocument();
      expect(document.body.textContent).not.toMatch(/#\d/);
    });

    it('shows the existing waiting status when a join finds the patient already on the list', async () => {
      api.myWaitlist.mockResolvedValueOnce({ entry: null }).mockResolvedValue({ entry: myEntry() });
      api.join.mockResolvedValue({
        created: false,
        entry: { id: 10, patientId: 1, status: 'waiting', position: 2, joinedAt: '2026-10-01T09:00:00.000Z' },
      });
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Join waitlist' }));

      expect(await screen.findByText(/already on the waitlist/i)).toBeInTheDocument();
      expect(await screen.findByRole('heading', { name: "You're on the waitlist" })).toBeInTheDocument();
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
  });

  describe('the banner is for in-app patients only (5.2)', () => {
    it('shows an in-app holder the banner, the slot, accept and decline, and what happens if unanswered', async () => {
      api.myWaitlist.mockResolvedValue({ entry: heldInApp() });
      show();

      expect(await screen.findByRole('status')).toHaveTextContent('A slot just opened for you');
      expect(screen.getByText(SLOT_TEXT)).toBeInTheDocument();
      expect(screen.getByText('With Dr. Elena Ruiz')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();
      expect(screen.getByText("If this offer isn't answered")).toBeInTheDocument();
      expect(screen.getByText('Staff can pass it to the next patient')).toBeInTheDocument();
    });

    it('does not show an in-app holder the neutral notice meant for patients staff call', async () => {
      api.myWaitlist.mockResolvedValue({ entry: heldInApp() });
      show();

      await screen.findByRole('status');
      expect(screen.queryByText(/team will contact you/i)).not.toBeInTheDocument();
    });

    it.each([
      ['a telephone patient'],
      ['a patient with no recorded preference'],
    ])('shows %s no banner and no accept or decline, only a notice that the team will contact them', async () => {
      api.myWaitlist.mockResolvedValue({ entry: heldByStaffChannel() });
      show();

      expect(await screen.findByText(/team will contact you/i)).toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Decline' })).not.toBeInTheDocument();
      expect(screen.queryByText(SLOT_TEXT)).not.toBeInTheDocument();
      expect(stepper('Notified')?.className).toContain('current');
    });

    it('shows no notice and no banner to a patient staff call who is only waiting', async () => {
      api.myWaitlist.mockResolvedValue({ entry: myEntry({ responseChannel: 'staff' }) });
      show();

      await screen.findByRole('heading', { name: "You're on the waitlist" });
      expect(screen.queryByText(/team will contact you/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('shows no banner and no actions to an in-app patient who does not hold the offer', async () => {
      api.myWaitlist.mockResolvedValue({ entry: myEntry() });
      show();

      await screen.findByRole('heading', { name: "You're on the waitlist" });
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Decline' })).not.toBeInTheDocument();
    });
  });

  describe('answering an offer in the app', () => {
    it('asks to confirm first, restating the slot date, time and specialist', async () => {
      api.myWaitlist.mockResolvedValue({ entry: heldInApp() });
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Accept' }));

      const dialog = screen.getByRole('dialog', { name: 'Book this appointment?' });
      expect(dialog).toHaveTextContent(SLOT_TEXT);
      expect(dialog).toHaveTextContent('Dr. Elena Ruiz');
      expect(api.accept).not.toHaveBeenCalled();
    });

    it('makes no API call and keeps the offer when the patient goes back', async () => {
      api.myWaitlist.mockResolvedValue({ entry: heldInApp() });
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Accept' }));
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));

      expect(api.accept).not.toHaveBeenCalled();
      expect(api.decline).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    });

    it('declines and goes back to waiting with no banner', async () => {
      api.myWaitlist.mockResolvedValueOnce({ entry: heldInApp() }).mockResolvedValue({ entry: myEntry({ position: 1 }) });
      api.decline.mockResolvedValue({ entry: { id: 10, status: 'waiting', position: 1 } });
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Decline' }));

      await waitFor(() => expect(api.decline).toHaveBeenCalledWith(5));
      await screen.findByText("We'll notify you here the moment a slot opens.", { exact: false });
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
    });

    it('says so when the offer is no longer available', async () => {
      api.myWaitlist
        .mockResolvedValueOnce({ entry: heldInApp() })
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
      api.myWaitlist.mockResolvedValue({ entry: heldInApp() });
      api.decline.mockRejectedValue(new ApiError(500, 'internal'));
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Decline' }));

      expect(await screen.findByRole('alert')).toBeInTheDocument();
    });
  });

  describe('steps to respond (5.7)', () => {
    it('lets an in-app patient accept in two actions after the offer is shown: Accept, then Confirm', async () => {
      api.myWaitlist.mockResolvedValueOnce({ entry: heldInApp() }).mockResolvedValue({ entry: null });
      api.accept.mockResolvedValue({
        entry: { id: 10, status: 'booked' },
        booking: { slotId: 1, slotStartsAt: SLOT, specialistName: 'Dr. Elena Ruiz' },
      });
      show();
      await screen.findByRole('status');

      let actions = 0;
      const act = (element: HTMLElement) => {
        actions += 1;
        fireEvent.click(element);
      };
      act(screen.getByRole('button', { name: 'Accept' }));
      expect(api.accept).not.toHaveBeenCalled();
      act(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirm' }));

      await waitFor(() => expect(api.accept).toHaveBeenCalledWith(5));
      expect(await screen.findByRole('heading', { name: "You're booked" })).toBeInTheDocument();
      expect(actions).toBe(2);
    });

    it('lets an in-app patient decline in one action', async () => {
      api.myWaitlist.mockResolvedValueOnce({ entry: heldInApp() }).mockResolvedValue({ entry: myEntry({ position: 1 }) });
      api.decline.mockResolvedValue({ entry: { id: 10, status: 'waiting', position: 1 } });
      show();
      await screen.findByRole('status');

      fireEvent.click(screen.getByRole('button', { name: 'Decline' }));

      await waitFor(() => expect(api.decline).toHaveBeenCalledWith(5));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});

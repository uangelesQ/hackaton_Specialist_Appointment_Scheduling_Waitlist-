import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from '../api/client';
import {
  createFakeApi,
  renderWithProviders,
  SLOT,
  staffEntry,
  staffSession,
  staffView,
  type FakeApi,
} from '../test/render';
import { StaffView } from './StaffView';

const SLOT_TEXT = 'Friday, Oct 2 · 10:30 AM';

const ana = staffEntry({ id: 1, patientName: 'Ana Torres', position: 1, joinedAt: '2026-10-01T09:00:00.000Z' });
const ben = staffEntry({ id: 2, patientName: 'Ben Carter', position: 2, joinedAt: '2026-10-01T09:05:00.000Z' });
const chloe = staffEntry({ id: 3, patientName: 'Chloe Nguyen', position: 3, joinedAt: '2026-10-02T09:00:00.000Z' });

const canRelease = { available: true, reason: null, openSlotStartsAt: null } as const;

describe('staff waitlist view', () => {
  let api: FakeApi;

  beforeEach(() => {
    api = createFakeApi();
    api.patients.mockResolvedValue({ patients: [] });
  });

  const show = () => renderWithProviders(<StaffView />, { api, session: staffSession });
  const rows = () => screen.getAllByRole('row').slice(1);

  describe('table, add and remove (6.5)', () => {
    it('lists active entries in position order with patient, status and join date', async () => {
      api.staffWaitlist.mockResolvedValue(staffView({ entries: [ana, ben, chloe], release: canRelease }));
      show();

      await screen.findByText('Ana Torres');
      expect(rows()).toHaveLength(3);
      expect(within(rows()[0]!).getByText('1')).toBeInTheDocument();
      expect(within(rows()[0]!).getByText('Ana Torres')).toBeInTheDocument();
      expect(within(rows()[0]!).getByText('Waiting')).toBeInTheDocument();
      expect(within(rows()[0]!).getByText('Oct 1')).toBeInTheDocument();
      expect(within(rows()[2]!).getByText('Chloe Nguyen')).toBeInTheDocument();
      expect(within(rows()[2]!).getByText('Oct 2')).toBeInTheDocument();
    });

    it('shows a notified entry with the notified status', async () => {
      api.staffWaitlist.mockResolvedValue(
        staffView({
          entries: [{ ...ana, status: 'notified', holdsOffer: true }, ben],
          offer: { id: 5, entryId: 1, slotStartsAt: SLOT },
        }),
      );
      show();

      await screen.findByRole('table');
      expect(within(rows()[0]!).getByText('Notified')).toBeInTheDocument();
      expect(within(rows()[1]!).getByText('Waiting')).toBeInTheDocument();
    });

    it('states that nobody is waiting and offers no release action when the list is empty', async () => {
      api.staffWaitlist.mockResolvedValue(staffView());
      show();

      expect(await screen.findByText('No patients are currently waiting.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Release slot' })).not.toBeInTheDocument();
      expect(screen.queryByRole('row')).not.toBeInTheDocument();
    });

    it('removes an entry after confirmation and renumbers the positions that follow', async () => {
      api.staffWaitlist
        .mockResolvedValueOnce(staffView({ entries: [ana, ben, chloe], release: canRelease }))
        .mockResolvedValue(
          staffView({
            entries: [{ ...ben, position: 1 }, { ...chloe, position: 2 }],
            release: canRelease,
          }),
        );
      api.removeEntry.mockResolvedValue({ entry: { id: 1, status: 'removed' } });
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Remove Ana Torres' }));
      const dialog = screen.getByRole('dialog', { name: 'Remove Ana Torres?' });
      expect(api.removeEntry).not.toHaveBeenCalled();
      fireEvent.click(within(dialog).getByRole('button', { name: 'Remove' }));

      await waitFor(() => expect(api.removeEntry).toHaveBeenCalledWith(1));
      await screen.findByText('Chloe Nguyen');
      expect(screen.queryByText('Ana Torres')).not.toBeInTheDocument();
      expect(rows()).toHaveLength(2);
      expect(within(rows()[0]!).getByText('1')).toBeInTheDocument();
      expect(within(rows()[0]!).getByText('Ben Carter')).toBeInTheDocument();
      expect(within(rows()[1]!).getByText('2')).toBeInTheDocument();
    });

    it('keeps the entry when staff change their mind', async () => {
      api.staffWaitlist.mockResolvedValue(staffView({ entries: [ana], release: canRelease }));
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Remove Ana Torres' }));
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));

      expect(api.removeEntry).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByText('Ana Torres')).toBeInTheDocument();
    });

    it('says so when the entry was already closed', async () => {
      api.staffWaitlist.mockResolvedValue(staffView({ entries: [ana], release: canRelease }));
      api.removeEntry.mockRejectedValue(new ApiError(409, 'entry_not_active'));
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Remove Ana Torres' }));
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('no longer on the waitlist');
    });

    it('offers only patients who are not already on the waitlist, and adds the one chosen', async () => {
      api.patients.mockResolvedValue({
        patients: [
          { id: 1, name: 'Ana Torres', onWaitlist: true },
          { id: 4, name: 'David Okafor', onWaitlist: false },
          { id: 5, name: 'Eva Lindqvist', onWaitlist: false },
        ],
      });
      api.staffWaitlist
        .mockResolvedValueOnce(staffView({ entries: [ana], release: canRelease }))
        .mockResolvedValue(
          staffView({
            entries: [ana, staffEntry({ id: 9, patientId: 4, patientName: 'David Okafor', position: 2 })],
            release: canRelease,
          }),
        );
      api.addPatient.mockResolvedValue({
        created: true,
        entry: { id: 9, patientId: 4, status: 'waiting', position: 2, joinedAt: '2026-10-02T09:00:00.000Z' },
      });
      show();

      const select = await screen.findByLabelText('Patient to add');
      await screen.findByRole('option', { name: 'David Okafor' });
      const options = within(select).getAllByRole('option').map((o) => o.textContent);
      expect(options).toEqual(['Choose a patient', 'David Okafor', 'Eva Lindqvist']);
      expect(screen.getByRole('button', { name: 'Add to waitlist' })).toBeDisabled();

      fireEvent.change(select, { target: { value: '4' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add to waitlist' }));

      await waitFor(() => expect(api.addPatient).toHaveBeenCalledWith(4));
      expect(await screen.findByRole('cell', { name: 'David Okafor' })).toBeInTheDocument();
      expect(rows()).toHaveLength(2);
    });

    it('shows an error when adding fails', async () => {
      api.patients.mockResolvedValue({ patients: [{ id: 4, name: 'David Okafor', onWaitlist: false }] });
      api.staffWaitlist.mockResolvedValue(staffView({ release: canRelease }));
      api.addPatient.mockRejectedValue(new ApiError(404, 'patient_not_found'));
      show();

      const select = await screen.findByLabelText('Patient to add');
      await screen.findByRole('option', { name: 'David Okafor' });
      fireEvent.change(select, { target: { value: '4' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add to waitlist' }));

      expect(await screen.findByRole('alert')).toBeInTheDocument();
    });
  });

  describe('release and pass-on (6.6)', () => {
    it('asks for the slot date and time when there is no returned slot, and releases it', async () => {
      api.staffWaitlist
        .mockResolvedValueOnce(staffView({ entries: [ana, ben], release: canRelease }))
        .mockResolvedValue(
          staffView({
            entries: [{ ...ana, status: 'notified', holdsOffer: true }, ben],
            offer: { id: 5, entryId: 1, slotStartsAt: SLOT },
            release: { available: false, reason: 'offer_outstanding', openSlotStartsAt: null },
          }),
        );
      api.release.mockResolvedValue({ offer: { id: 5, slotId: 1, slotStartsAt: SLOT, entryId: 1 } });
      show();

      const release = await screen.findByRole('button', { name: 'Release slot' });
      expect(release).toBeDisabled();

      fireEvent.change(screen.getByLabelText('Slot date and time'), { target: { value: '2026-10-02T10:30' } });
      expect(release).toBeEnabled();
      fireEvent.click(release);

      await waitFor(() => expect(api.release).toHaveBeenCalledWith(SLOT));
      expect(await screen.findByText(/Waiting on/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Release slot' })).not.toBeInTheDocument();
    });

    it('reuses a returned slot: shows its date and time, asks for none, and releases it', async () => {
      api.staffWaitlist.mockResolvedValue(
        staffView({
          entries: [ana],
          release: { available: true, reason: null, openSlotStartsAt: SLOT },
        }),
      );
      api.release.mockResolvedValue({ offer: { id: 6, slotId: 1, slotStartsAt: SLOT, entryId: 1 } });
      show();

      expect(await screen.findByText(SLOT_TEXT)).toBeInTheDocument();
      expect(screen.queryByLabelText('Slot date and time')).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Release slot' }));

      await waitFor(() => expect(api.release).toHaveBeenCalledWith(undefined));
    });

    it('hides release while an offer is outstanding, shows who holds it, and passes it on', async () => {
      api.staffWaitlist
        .mockResolvedValueOnce(
          staffView({
            entries: [{ ...ana, status: 'notified', holdsOffer: true }, ben],
            offer: { id: 5, entryId: 1, slotStartsAt: SLOT },
            release: { available: false, reason: 'offer_outstanding', openSlotStartsAt: null },
          }),
        )
        .mockResolvedValue(
          staffView({
            entries: [ana, { ...ben, status: 'notified', holdsOffer: true }],
            offer: { id: 7, entryId: 2, slotStartsAt: SLOT },
            release: { available: false, reason: 'offer_outstanding', openSlotStartsAt: null },
          }),
        );
      api.pass.mockResolvedValue({ offer: { id: 7, slotId: 1, slotStartsAt: SLOT, entryId: 2 } });
      show();

      const control = (await screen.findByText(/Waiting on/)).closest('.control-row') as HTMLElement;
      expect(control).toHaveTextContent('Ana Torres');
      expect(control).toHaveTextContent(SLOT_TEXT);
      expect(screen.queryByRole('button', { name: 'Release slot' })).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Slot date and time')).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'No response — offer to next patient' }));

      await waitFor(() => expect(api.pass).toHaveBeenCalledWith(5));
      await screen.findByText('Ben Carter', { selector: 'b' });
    });

    it('offers no release when nobody is waiting', async () => {
      api.staffWaitlist.mockResolvedValue(staffView());
      show();

      expect(await screen.findByText('No patients are currently waiting.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Release slot' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /offer to next patient/ })).not.toBeInTheDocument();
    });

    it('offers no release when every waiting patient has declined the returned slot', async () => {
      api.staffWaitlist.mockResolvedValue(
        staffView({
          entries: [ana, ben],
          release: { available: false, reason: 'all_waiting_declined', openSlotStartsAt: SLOT },
        }),
      );
      show();

      expect(await screen.findByText(/already declined/)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(SLOT_TEXT))).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Release slot' })).not.toBeInTheDocument();
    });

    it('explains a refused release and keeps the control', async () => {
      api.staffWaitlist.mockResolvedValue(
        staffView({ entries: [ana], release: { available: true, reason: null, openSlotStartsAt: SLOT } }),
      );
      api.release.mockRejectedValue(new ApiError(409, 'offer_outstanding'));
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'Release slot' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('already waiting');
      expect(screen.getByRole('button', { name: 'Release slot' })).toBeInTheDocument();
    });

    it('explains a refused pass-on', async () => {
      api.staffWaitlist.mockResolvedValue(
        staffView({
          entries: [{ ...ana, status: 'notified', holdsOffer: true }],
          offer: { id: 5, entryId: 1, slotStartsAt: SLOT },
          release: { available: false, reason: 'offer_outstanding', openSlotStartsAt: null },
        }),
      );
      api.pass.mockRejectedValue(new ApiError(409, 'offer_not_available'));
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'No response — offer to next patient' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('no longer available');
    });
  });
});

import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from '../api/client';
import {
  createFakeApi,
  renderWithProviders,
  SLOT,
  staffEntry,
  staffOffer,
  staffSession,
  staffView,
  type FakeApi,
} from '../test/render';
import { StaffView } from './StaffView';

const SLOT_TEXT = 'Friday, Oct 2 · 10:30 AM';
// 12 minutes after the fixture offer was made (09:30), so "outstanding for 12 min".
const NOW = Date.parse('2026-10-01T09:42:00.000Z');

const carlos = staffEntry({ id: 1, patientId: 4, patientName: 'Carlos Mendoza', contactPreference: 'telephone', position: 1 });
const ana = staffEntry({ id: 2, patientId: 5, patientName: 'Ana Torres', contactPreference: null, position: 2 });
const maria = staffEntry({ id: 3, patientId: 1, patientName: 'Maria Gómez', contactPreference: 'in_app', position: 3 });

const canRelease = { available: true, reason: null, openSlotStartsAt: null } as const;
const blocked = { available: false, reason: 'offer_outstanding', openSlotStartsAt: null } as const;

/** A waitlist where `holder` holds the outstanding offer. */
function withOffer(holder: ReturnType<typeof staffEntry>, others: ReturnType<typeof staffEntry>[], requiresCall: boolean) {
  return staffView({
    entries: [{ ...holder, status: 'notified', holdsOffer: true }, ...others],
    offer: staffOffer({ id: 5, entryId: holder.id, requiresCall }),
    release: blocked,
  });
}

describe('staff waitlist view', () => {
  let api: FakeApi;

  beforeEach(() => {
    api = createFakeApi();
    api.patients.mockResolvedValue({ patients: [] });
  });

  const show = () => renderWithProviders(<StaffView now={() => NOW} />, { api, session: staffSession });
  const rows = () => screen.getAllByRole('row').slice(1);
  const controlRow = async () => (await screen.findByText(/Waiting on/)).closest('.control-row') as HTMLElement;

  describe('the table (5.4)', () => {
    it('has the columns #, Patient, Contact preference and Status, and no Joined column', async () => {
      api.staffWaitlist.mockResolvedValue(staffView({ entries: [carlos, ana, maria], release: canRelease }));
      show();

      await screen.findByRole('table');
      expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['#', 'Patient', 'Contact preference', 'Status']);
    });

    it('shows each active entry in position order with its position, name, preference and status', async () => {
      api.staffWaitlist.mockResolvedValue(staffView({ entries: [carlos, ana, maria], release: canRelease }));
      show();

      await screen.findByRole('table');
      expect(rows()).toHaveLength(3);
      expect(within(rows()[0]!).getByText('1')).toBeInTheDocument();
      expect(within(rows()[0]!).getByText('Carlos Mendoza')).toBeInTheDocument();
      expect(within(rows()[0]!).getByText('Telephone')).toBeInTheDocument();
      expect(within(rows()[0]!).getByText('Waiting')).toBeInTheDocument();
      expect(within(rows()[2]!).getByText('Maria Gómez')).toBeInTheDocument();
    });

    it('shows the three contact preferences, with "not recorded" distinct from telephone', async () => {
      api.staffWaitlist.mockResolvedValue(staffView({ entries: [carlos, ana, maria], release: canRelease }));
      show();

      await screen.findByRole('table');
      expect(within(rows()[0]!).getByText('Telephone')).toBeInTheDocument();
      expect(within(rows()[1]!).getByText('Not recorded')).toBeInTheDocument();
      expect(within(rows()[1]!).queryByText('Telephone')).not.toBeInTheDocument();
      expect(within(rows()[2]!).getByText('In-app')).toBeInTheDocument();
    });

    it('shows a notified entry with the Notified status', async () => {
      api.staffWaitlist.mockResolvedValue(withOffer(carlos, [ana], true));
      show();

      await screen.findByRole('table');
      expect(within(rows()[0]!).getByText('Notified')).toBeInTheDocument();
      expect(within(rows()[1]!).getByText('Waiting')).toBeInTheDocument();
    });

    it.each([
      ['a telephone holder', carlos],
      ['a not-recorded holder', ana],
    ])('flags %s with "Requires a call", and nobody else', async (_label, holder) => {
      api.staffWaitlist.mockResolvedValue(withOffer(holder, [carlos, ana, maria].filter((e) => e.id !== holder.id), true));
      show();

      await screen.findByRole('table');
      expect(screen.getAllByText('Requires a call')).toHaveLength(1);
      expect(within(rows()[0]!).getByText('Requires a call')).toBeInTheDocument();
    });

    it('does not flag an in-app holder', async () => {
      api.staffWaitlist.mockResolvedValue(withOffer(maria, [carlos, ana], false));
      show();

      await screen.findByRole('table');
      expect(screen.queryByText('Requires a call')).not.toBeInTheDocument();
    });

    it('has no Remove control and no join dates in this iteration', async () => {
      api.staffWaitlist.mockResolvedValue(staffView({ entries: [carlos, ana, maria], release: canRelease }));
      show();

      await screen.findByRole('table');
      expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
      expect(screen.queryByText('Joined')).not.toBeInTheDocument();
      expect(screen.queryByText('Oct 1')).not.toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('does not list a booked entry, even if one were returned', async () => {
      api.staffWaitlist.mockResolvedValue(
        staffView({ entries: [staffEntry({ id: 9, patientName: 'Booked Person', status: 'booked', position: 1 }), { ...ana, position: 1 }], release: canRelease }),
      );
      show();

      await screen.findByRole('table');
      expect(rows()).toHaveLength(1);
      expect(screen.queryByText('Booked Person')).not.toBeInTheDocument();
    });

    it('states that nobody is waiting and offers no release action when the list is empty', async () => {
      api.staffWaitlist.mockResolvedValue(staffView());
      show();

      expect(await screen.findByText('No patients are currently waiting.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Release slot' })).not.toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('shows an error when the waitlist cannot be loaded', async () => {
      api.staffWaitlist.mockRejectedValue(new ApiError(500, 'internal'));
      show();

      expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    });
  });

  describe('the slot control follows the holder (5.5)', () => {
    it.each([
      ['a telephone holder', carlos],
      ['a not-recorded holder', ana],
    ])('for %s: says a call is required, how long it has been outstanding, and offers the three actions', async (_label, holder) => {
      api.staffWaitlist.mockResolvedValue(withOffer(holder, [maria], true));
      show();

      const control = await controlRow();
      expect(control).toHaveTextContent(`Waiting on ${holder.patientName}'s response — requires a call.`);
      expect(control).toHaveTextContent('Outstanding for 12 min');
      expect(control).toHaveTextContent(SLOT_TEXT);
      expect(within(control).getByRole('button', { name: 'They accepted' })).toBeInTheDocument();
      expect(within(control).getByRole('button', { name: 'They declined' })).toBeInTheDocument();
      expect(within(control).getByRole('button', { name: "Couldn't reach them — pass to next" })).toBeInTheDocument();
    });

    it('for an in-app holder: no call flag, and only the pass-on action', async () => {
      api.staffWaitlist.mockResolvedValue(withOffer(maria, [carlos], false));
      show();

      const control = await controlRow();
      expect(control).toHaveTextContent("Waiting on Maria Gómez's response.");
      expect(control).not.toHaveTextContent('requires a call');
      expect(within(control).getByRole('button', { name: "Couldn't reach them — pass to next" })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'They accepted' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'They declined' })).not.toBeInTheDocument();
    });

    it('records an acceptance in one click, with no confirmation step', async () => {
      api.staffWaitlist.mockResolvedValueOnce(withOffer(carlos, [ana], true)).mockResolvedValue(staffView({ entries: [{ ...ana, position: 1 }], release: canRelease }));
      api.recordAccept.mockResolvedValue({
        entry: { id: 1, status: 'booked' },
        booking: { slotId: 1, slotStartsAt: SLOT, specialistName: 'Dr. Elena Ruiz' },
      });
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'They accepted' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      await waitFor(() => expect(api.recordAccept).toHaveBeenCalledWith(5));
      expect(api.recordDecline).not.toHaveBeenCalled();
      await waitFor(() => expect(screen.queryByText('Carlos Mendoza')).not.toBeInTheDocument());
      expect(screen.queryByText(/Waiting on/)).not.toBeInTheDocument();
    });

    it('records a decline in one click and offers the returned slot for release again', async () => {
      api.staffWaitlist
        .mockResolvedValueOnce(withOffer(carlos, [ana], true))
        .mockResolvedValue(staffView({ entries: [carlos, ana], release: { available: true, reason: null, openSlotStartsAt: SLOT } }));
      api.recordDecline.mockResolvedValue({ entry: { id: 1, status: 'waiting', position: 1 } });
      show();

      fireEvent.click(await screen.findByRole('button', { name: 'They declined' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      await waitFor(() => expect(api.recordDecline).toHaveBeenCalledWith(5));
      expect(api.recordAccept).not.toHaveBeenCalled();
      expect(await screen.findByText(/A returned slot is ready to release/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Release slot' })).toBeInTheDocument();
    });

    it("passes the offer on with \"Couldn't reach them — pass to next\", for any holder", async () => {
      api.staffWaitlist
        .mockResolvedValueOnce(withOffer(maria, [carlos], false))
        .mockResolvedValue(withOffer(carlos, [maria], true));
      api.pass.mockResolvedValue({ offer: { id: 6, slotId: 1, slotStartsAt: SLOT, entryId: 1 } });
      show();

      fireEvent.click(await screen.findByRole('button', { name: "Couldn't reach them — pass to next" }));

      await waitFor(() => expect(api.pass).toHaveBeenCalledWith(5));
      await waitFor(() => expect(screen.getByText(/Carlos Mendoza/, { selector: 'b' })).toBeInTheDocument());
    });

    it.each([
      ['They accepted', 'recordAccept'],
      ['They declined', 'recordDecline'],
    ] as const)('says so when the offer is no longer available after "%s"', async (label, method) => {
      api.staffWaitlist.mockResolvedValue(withOffer(carlos, [ana], true));
      api[method].mockRejectedValue(new ApiError(409, 'offer_not_available'));
      show();

      fireEvent.click(await screen.findByRole('button', { name: label }));

      expect(await screen.findByRole('alert')).toHaveTextContent('This offer is no longer available.');
    });

    it('explains a refused pass-on', async () => {
      api.staffWaitlist.mockResolvedValue(withOffer(carlos, [ana], true));
      api.pass.mockRejectedValue(new ApiError(409, 'offer_not_available'));
      show();

      fireEvent.click(await screen.findByRole('button', { name: "Couldn't reach them — pass to next" }));

      expect(await screen.findByRole('alert')).toHaveTextContent('no longer available');
    });

    it('says no eligible patient remains, and offers no release or any other action, when nobody is eligible', async () => {
      api.staffWaitlist.mockResolvedValue(
        staffView({ entries: [carlos, ana], release: { available: false, reason: 'all_waiting_declined', openSlotStartsAt: SLOT } }),
      );
      show();

      expect(await screen.findByText('No eligible patient remains for this slot.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Release slot' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: "Couldn't reach them — pass to next" })).not.toBeInTheDocument();
    });

    it('offers no control at all when nobody is waiting', async () => {
      api.staffWaitlist.mockResolvedValue(staffView());
      show();

      expect(await screen.findByText('No patients are currently waiting.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Release slot' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /pass to next/ })).not.toBeInTheDocument();
    });
  });

  describe('releasing a slot', () => {
    it('asks for the slot date and time when there is no returned slot, and releases it', async () => {
      api.staffWaitlist
        .mockResolvedValueOnce(staffView({ entries: [carlos, ana], release: canRelease }))
        .mockResolvedValue(withOffer(carlos, [ana], true));
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
        staffView({ entries: [ana], release: { available: true, reason: null, openSlotStartsAt: SLOT } }),
      );
      api.release.mockResolvedValue({ offer: { id: 6, slotId: 1, slotStartsAt: SLOT, entryId: 2 } });
      show();

      expect(await screen.findByText(SLOT_TEXT)).toBeInTheDocument();
      expect(screen.queryByLabelText('Slot date and time')).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Release slot' }));

      await waitFor(() => expect(api.release).toHaveBeenCalledWith(undefined));
    });

    it('hides release while an offer is outstanding', async () => {
      api.staffWaitlist.mockResolvedValue(withOffer(carlos, [ana], true));
      show();

      await controlRow();
      expect(screen.queryByRole('button', { name: 'Release slot' })).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Slot date and time')).not.toBeInTheDocument();
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

    it('says when the slot is already booked', async () => {
      api.staffWaitlist.mockResolvedValue(staffView({ entries: [ana], release: canRelease }));
      api.release.mockRejectedValue(new ApiError(409, 'slot_already_booked'));
      show();

      await screen.findByRole('button', { name: 'Release slot' });
      fireEvent.change(screen.getByLabelText('Slot date and time'), { target: { value: '2026-10-02T10:30' } });
      fireEvent.click(screen.getByRole('button', { name: 'Release slot' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('already booked');
    });
  });

  describe('adding a patient on their behalf (5.6)', () => {
    const picker = [
      { id: 4, name: 'Carlos Mendoza', onWaitlist: true, contactPreference: 'telephone' as const },
      { id: 6, name: 'Jorge Ramírez', onWaitlist: false, contactPreference: 'telephone' as const },
      { id: 5, name: 'Ana Torres', onWaitlist: false, contactPreference: null },
      { id: 1, name: 'Maria Gómez', onWaitlist: false, contactPreference: 'in_app' as const },
    ];

    async function pick(name: string) {
      const select = await screen.findByLabelText('Patient to add');
      await screen.findByRole('option', { name });
      const option = within(select).getByRole('option', { name }) as HTMLOptionElement;
      fireEvent.change(select, { target: { value: option.value } });
    }

    /** Picks a caller and adds them; `preference` is chosen first for a caller who has none (US-006). */
    async function choose(name: string, preference?: 'In-app' | 'Telephone') {
      await pick(name);
      if (preference) {
        const select = await screen.findByLabelText('Contact preference');
        fireEvent.change(select, { target: { value: preference === 'In-app' ? 'in_app' : 'telephone' } });
      }
      fireEvent.click(screen.getByRole('button', { name: 'Add to waitlist' }));
    }

    beforeEach(() => {
      api.patients.mockResolvedValue({ patients: picker });
      api.staffWaitlist.mockResolvedValue(staffView({ entries: [carlos], release: canRelease }));
    });

    it('offers only registered patients who are not already waiting', async () => {
      show();

      const select = await screen.findByLabelText('Patient to add');
      await screen.findByRole('option', { name: 'Jorge Ramírez' });
      expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual([
        'Choose a patient',
        'Jorge Ramírez',
        'Ana Torres',
        'Maria Gómez',
      ]);
      expect(screen.getByRole('button', { name: 'Add to waitlist' })).toBeDisabled();
    });

    it('confirms an add and shows the patient\'s contact preference, and lists them', async () => {
      api.addPatient.mockResolvedValue({
        created: true,
        entry: { id: 9, patientId: 6, status: 'waiting', position: 2, joinedAt: '2026-10-02T09:00:00.000Z' },
      });
      api.staffWaitlist
        .mockResolvedValueOnce(staffView({ entries: [carlos], release: canRelease }))
        .mockResolvedValue(
          staffView({ entries: [carlos, staffEntry({ id: 9, patientId: 6, patientName: 'Jorge Ramírez', contactPreference: 'telephone', position: 2 })], release: canRelease }),
        );
      show();

      await choose('Jorge Ramírez');

      await waitFor(() => expect(api.addPatient).toHaveBeenCalledWith(6));
      expect(await screen.findByText('Jorge Ramírez was added to the waitlist. Contact preference: Telephone.')).toBeInTheDocument();
      expect(await screen.findByRole('cell', { name: 'Jorge Ramírez' })).toBeInTheDocument();
    });

    it("shows an in-app caller's preference in the confirmation", async () => {
      api.addPatient.mockResolvedValue({
        created: true,
        entry: { id: 9, patientId: 1, status: 'waiting', position: 2, joinedAt: '2026-10-02T09:00:00.000Z' },
      });
      show();

      await choose('Maria Gómez');

      expect(await screen.findByText('Maria Gómez was added to the waitlist. Contact preference: In-app.')).toBeInTheDocument();
      expect(api.addPatient).toHaveBeenCalledWith(1);
    });

    it('says when the patient is already on the waitlist, and that nothing was added', async () => {
      api.addPatient.mockResolvedValue({
        created: false,
        entry: { id: 1, patientId: 6, status: 'waiting', position: 1, joinedAt: '2026-10-01T09:00:00.000Z' },
      });
      show();

      await choose('Jorge Ramírez');

      expect(await screen.findByText('Jorge Ramírez is already on the waitlist.')).toBeInTheDocument();
      expect(screen.queryByText(/was added to the waitlist/)).not.toBeInTheDocument();
    });

    it('says when the person is not registered in hospital records and must register first', async () => {
      api.addPatient.mockRejectedValue(new ApiError(404, 'patient_not_found'));
      show();

      await choose('Jorge Ramírez');

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Jorge Ramírez is not registered in hospital records. They must register before joining the waitlist.',
      );
      expect(screen.queryByText(/was added to the waitlist/)).not.toBeInTheDocument();
    });

    it('shows a generic error for any other failure', async () => {
      api.addPatient.mockRejectedValue(new ApiError(500, 'internal'));
      show();

      await choose('Jorge Ramírez');

      expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    });

    describe('a caller with no recorded preference (8.1)', () => {
      const added = {
        created: true,
        entry: { id: 9, patientId: 5, status: 'waiting' as const, position: 2, joinedAt: '2026-10-02T09:00:00.000Z' },
      };

      it('asks staff to choose in-app or telephone, and keeps Add disabled until one is chosen', async () => {
        show();

        await pick('Ana Torres');

        const select = await screen.findByLabelText('Contact preference');
        expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual([
          'Choose in-app or telephone',
          'In-app',
          'Telephone',
        ]);
        expect(screen.getByRole('button', { name: 'Add to waitlist' })).toBeDisabled();
        expect(api.addPatient).not.toHaveBeenCalled();

        fireEvent.change(select, { target: { value: 'telephone' } });

        expect(screen.getByRole('button', { name: 'Add to waitlist' })).toBeEnabled();
      });

      it('sends the choice with the add and shows the recorded preference in the confirmation', async () => {
        api.addPatient.mockResolvedValue(added);
        show();

        await choose('Ana Torres', 'Telephone');

        await waitFor(() => expect(api.addPatient).toHaveBeenCalledWith(5, 'telephone'));
        expect(await screen.findByText('Ana Torres was added to the waitlist. Contact preference: Telephone.')).toBeInTheDocument();
      });

      it('shows no preference choice for a caller who already has one, and sends none', async () => {
        api.addPatient.mockResolvedValue({ ...added, entry: { ...added.entry, patientId: 6 } });
        show();

        await pick('Jorge Ramírez');

        expect(screen.queryByLabelText('Contact preference')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add to waitlist' })).toBeEnabled();
        fireEvent.click(screen.getByRole('button', { name: 'Add to waitlist' }));
        await waitFor(() => expect(api.addPatient).toHaveBeenCalledWith(6));
      });

      it('forgets the choice when a different caller is picked', async () => {
        show();

        await pick('Ana Torres');
        fireEvent.change(await screen.findByLabelText('Contact preference'), { target: { value: 'in_app' } });
        await pick('Jorge Ramírez');
        await pick('Ana Torres');

        expect((await screen.findByLabelText('Contact preference')) as HTMLSelectElement).toHaveValue('');
        expect(screen.getByRole('button', { name: 'Add to waitlist' })).toBeDisabled();
      });

      it('explains a refusal because no choice was made', async () => {
        api.addPatient.mockRejectedValue(new ApiError(409, 'preference_required'));
        show();

        await choose('Ana Torres', 'In-app');

        expect(await screen.findByRole('alert')).toHaveTextContent(/choose in-app or telephone/i);
        expect(screen.queryByText(/was added to the waitlist/)).not.toBeInTheDocument();
      });

      it('explains that a preference already recorded cannot be changed from here', async () => {
        api.addPatient.mockRejectedValue(new ApiError(409, 'preference_already_recorded'));
        show();

        await choose('Ana Torres', 'In-app');

        expect(await screen.findByRole('alert')).toHaveTextContent(/already has a contact preference.*only the patient can change it/i);
      });
    });
  });
});

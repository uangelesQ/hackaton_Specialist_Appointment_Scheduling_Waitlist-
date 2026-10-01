import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { StaffEntryView, StaffWaitlistResponse } from '@waitlist/shared';
import { useApi } from '../api/ApiContext';
import { describeError } from '../api/client';
import { formatJoinDate, formatSlot } from '../format';
import { Alert, Button, Card, DataTable, Modal, StatusPill } from '../ui/ui';

const POLL_MS = 10_000;

export function StaffView() {
  const api = useApi();
  const queryClient = useQueryClient();

  const waitlist = useQuery({ queryKey: ['staff', 'waitlist'], queryFn: () => api.staffWaitlist(), refetchInterval: POLL_MS });
  const patients = useQuery({ queryKey: ['patients'], queryFn: () => api.patients() });

  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<StaffEntryView | null>(null);
  const [patientId, setPatientId] = useState('');
  const [slotInput, setSlotInput] = useState('');

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['staff', 'waitlist'] });
    void queryClient.invalidateQueries({ queryKey: ['patients'] });
  };
  const failed = (err: unknown) => {
    setError(describeError(err));
    refresh();
  };
  const succeeded = () => {
    setError(null);
    refresh();
  };

  const remove = useMutation({
    mutationFn: (entryId: number) => api.removeEntry(entryId),
    onSuccess: succeeded,
    onError: failed,
    onSettled: () => setRemoving(null),
  });
  const add = useMutation({
    mutationFn: (id: number) => api.addPatient(id),
    onSuccess: () => {
      setPatientId('');
      succeeded();
    },
    onError: failed,
  });
  const release = useMutation({
    mutationFn: (startsAt: string | undefined) => api.release(startsAt),
    onSuccess: () => {
      setSlotInput('');
      succeeded();
    },
    onError: failed,
  });
  const pass = useMutation({
    mutationFn: (offerId: number) => api.pass(offerId),
    onSuccess: succeeded,
    onError: failed,
  });

  const view = waitlist.data;
  const candidates = (patients.data?.patients ?? []).filter((p) => !p.onWaitlist);

  return (
    <div>
      {waitlist.isError && <Alert>{describeError(waitlist.error)}</Alert>}
      {error && <Alert>{error}</Alert>}

      {view && (
        <SlotControl
          view={view}
          slotInput={slotInput}
          onSlotInput={setSlotInput}
          busy={release.isPending || pass.isPending}
          onRelease={() => release.mutate(view.release.openSlotStartsAt ? undefined : new Date(slotInput).toISOString())}
          onPass={(offerId) => pass.mutate(offerId)}
        />
      )}

      <div className="add-row">
        <select className="field" aria-label="Patient to add" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
          <option value="">Choose a patient</option>
          {candidates.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <Button variant="secondary" disabled={!patientId || add.isPending} onClick={() => add.mutate(Number(patientId))}>
          Add to waitlist
        </Button>
      </div>

      {view && view.entries.length === 0 && (
        <Card tone="empty">
          <p>No patients are currently waiting.</p>
        </Card>
      )}
      {view && view.entries.length > 0 && (
        <DataTable headers={['#', 'Patient', 'Status', 'Joined', '']}>
          {view.entries.map((entry) => (
            <tr key={entry.id}>
              <td className="pos-cell">{entry.position}</td>
              <td>{entry.patientName}</td>
              <td>
                <StatusPill status={entry.status} />
              </td>
              <td>{formatJoinDate(entry.joinedAt)}</td>
              <td>
                <Button variant="secondary" aria-label={`Remove ${entry.patientName}`} onClick={() => setRemoving(entry)}>
                  Remove
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
      <p className="footnote">Positions recalculate automatically as patients are booked or removed — no one re-numbers the list by hand.</p>

      {removing && (
        <Modal
          title={`Remove ${removing.patientName}?`}
          actions={
            <>
              <Button variant="secondary" onClick={() => setRemoving(null)}>
                Cancel
              </Button>
              <Button variant="decline" disabled={remove.isPending} onClick={() => remove.mutate(removing.id)}>
                Remove
              </Button>
            </>
          }
        >
          They will lose their place in line and stop receiving offers.
        </Modal>
      )}
    </div>
  );
}

/** Release a slot, or move an unanswered offer on. Shows nothing when neither is possible. */
function SlotControl({
  view,
  slotInput,
  onSlotInput,
  busy,
  onRelease,
  onPass,
}: {
  view: StaffWaitlistResponse;
  slotInput: string;
  onSlotInput: (value: string) => void;
  busy: boolean;
  onRelease: () => void;
  onPass: (offerId: number) => void;
}) {
  const { offer, release } = view;

  if (offer) {
    const holder = view.entries.find((e) => e.id === offer.entryId);
    return (
      <div className="control-row">
        <div className="control-text">
          Waiting on <b>{holder?.patientName ?? 'a patient'}</b>'s response to the open slot for {formatSlot(offer.slotStartsAt)}.
        </div>
        <Button variant="secondary" disabled={busy} onClick={() => onPass(offer.id)}>
          No response — offer to next patient
        </Button>
      </div>
    );
  }

  if (release.available) {
    return (
      <div className="control-row">
        {release.openSlotStartsAt ? (
          <div className="control-text">
            A returned slot is ready to release: <b>{formatSlot(release.openSlotStartsAt)}</b>.
          </div>
        ) : (
          <div className="control-text">No open offer right now. Enter the slot's date and time.</div>
        )}
        <div className="control-fields">
          {!release.openSlotStartsAt && (
            <input
              className="field"
              type="datetime-local"
              aria-label="Slot date and time"
              value={slotInput}
              onChange={(e) => onSlotInput(e.target.value)}
            />
          )}
          <Button disabled={busy || (!release.openSlotStartsAt && !slotInput)} onClick={onRelease}>
            Release slot
          </Button>
        </div>
      </div>
    );
  }

  if (release.reason === 'all_waiting_declined' && release.openSlotStartsAt) {
    return (
      <div className="control-row">
        <div className="control-text">
          Every waiting patient has already declined the slot for {formatSlot(release.openSlotStartsAt)}. There is nothing to release.
        </div>
      </div>
    );
  }

  return null;
}

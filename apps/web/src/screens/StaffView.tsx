import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { ContactPreference, PatientSummary, StaffWaitlistResponse } from '@waitlist/shared';
import { useApi } from '../api/ApiContext';
import { ApiError, describeError } from '../api/client';
import { formatElapsed, formatSlot } from '../format';
import { Alert, Button, Card, DataTable, PREFERENCE_LABEL, PreferencePill, StatusPill } from '../ui/ui';

const POLL_MS = 10_000;
const CLOCK_TICK_MS = 30_000;

/** The current time, refreshed so "outstanding for N min" keeps moving between data refreshes. */
function useNow(now: () => number): number {
  const [current, setCurrent] = useState(now);
  useEffect(() => {
    const id = setInterval(() => setCurrent(now()), CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, [now]);
  return current;
}

type AddMessage = { type: 'ok' | 'err'; text: string };

/**
 * The staff screen: the waitlist with each patient's contact preference, the slot control that follows
 * whoever holds the offer, and the panel for adding a patient who called in.
 *
 * Removing a patient is not offered in this iteration.
 *
 * @param now injectable clock, so the time an offer has been outstanding can be tested
 */
export function StaffView({ now = Date.now }: { now?: () => number } = {}) {
  const api = useApi();
  const queryClient = useQueryClient();
  const currentTime = useNow(now);

  const waitlist = useQuery({ queryKey: ['staff', 'waitlist'], queryFn: () => api.staffWaitlist(), refetchInterval: POLL_MS });
  const patients = useQuery({ queryKey: ['patients'], queryFn: () => api.patients() });

  const [error, setError] = useState<string | null>(null);
  const [addMessage, setAddMessage] = useState<AddMessage | null>(null);
  const [patientId, setPatientId] = useState('');
  // The choice staff record for a caller who has none; always forgotten when another caller is picked.
  const [recorded, setRecorded] = useState<ContactPreference | ''>('');
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

  const add = useMutation({
    // A preference is sent only for a caller who has none recorded (US-006, BR-016).
    mutationFn: ({ patient, preference }: { patient: PatientSummary; preference?: ContactPreference }) =>
      preference ? api.addPatient(patient.id, preference) : api.addPatient(patient.id),
    onSuccess: (result, { patient, preference }) => {
      setError(null);
      setPatientId('');
      setRecorded('');
      setAddMessage(
        result.created
          ? {
              type: 'ok',
              text: `${patient.name} was added to the waitlist. Contact preference: ${preferenceLabel(preference ?? patient.contactPreference)}.`,
            }
          : { type: 'ok', text: `${patient.name} is already on the waitlist.` },
      );
      refresh();
    },
    onError: (err, { patient }) => {
      const notRegistered = err instanceof ApiError && err.code === 'patient_not_found';
      setAddMessage({
        type: 'err',
        text: notRegistered
          ? `${patient.name} is not registered in hospital records. They must register before joining the waitlist.`
          : describeError(err),
      });
      refresh();
    },
  });
  const release = useMutation({
    mutationFn: (startsAt: string | undefined) => api.release(startsAt),
    onSuccess: () => {
      setSlotInput('');
      succeeded();
    },
    onError: failed,
  });
  const recordAccept = useMutation({ mutationFn: (offerId: number) => api.recordAccept(offerId), onSuccess: succeeded, onError: failed });
  const recordDecline = useMutation({ mutationFn: (offerId: number) => api.recordDecline(offerId), onSuccess: succeeded, onError: failed });
  const pass = useMutation({ mutationFn: (offerId: number) => api.pass(offerId), onSuccess: succeeded, onError: failed });

  const view = waitlist.data;
  // Booked and removed entries are not part of the waitlist; the API already leaves them out.
  const entries = (view?.entries ?? []).filter((e) => e.status === 'waiting' || e.status === 'notified');
  const candidates = (patients.data?.patients ?? []).filter((p) => !p.onWaitlist);
  const chosen = candidates.find((p) => String(p.id) === patientId);
  const needsPreference = chosen !== undefined && chosen.contactPreference === null;
  const busy = release.isPending || pass.isPending || recordAccept.isPending || recordDecline.isPending;

  return (
    <div>
      {waitlist.isError && <Alert>{describeError(waitlist.error)}</Alert>}
      {error && <Alert>{error}</Alert>}

      {view && (
        <SlotControl
          view={view}
          now={currentTime}
          slotInput={slotInput}
          onSlotInput={setSlotInput}
          busy={busy}
          onRelease={() => release.mutate(view.release.openSlotStartsAt ? undefined : new Date(slotInput).toISOString())}
          onRecordAccept={(offerId) => recordAccept.mutate(offerId)}
          onRecordDecline={(offerId) => recordDecline.mutate(offerId)}
          onPass={(offerId) => pass.mutate(offerId)}
        />
      )}

      <div className="add-panel">
        <span className="add-label">Add a patient on their behalf:</span>
        <select className="field" aria-label="Patient to add" value={patientId} onChange={(e) => {
            setPatientId(e.target.value);
            setRecorded('');
          }}
        >
          <option value="">Choose a patient</option>
          {candidates.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {needsPreference && (
          <select
            className="field"
            aria-label="Contact preference"
            value={recorded}
            onChange={(e) => setRecorded(e.target.value as ContactPreference | '')}
          >
            <option value="">Choose in-app or telephone</option>
            <option value="in_app">{PREFERENCE_LABEL.in_app}</option>
            <option value="telephone">{PREFERENCE_LABEL.telephone}</option>
          </select>
        )}
        <Button
          small
          variant="secondary"
          disabled={!chosen || add.isPending || (needsPreference && recorded === '')}
          onClick={() => chosen && add.mutate({ patient: chosen, preference: needsPreference && recorded !== '' ? recorded : undefined })}
        >
          Add to waitlist
        </Button>
      </div>
      {addMessage?.type === 'ok' && (
        <div className="add-msg ok" role="status">
          {addMessage.text}
        </div>
      )}
      {addMessage?.type === 'err' && <Alert>{addMessage.text}</Alert>}

      {view && entries.length === 0 && (
        <Card tone="empty">
          <p>No patients are currently waiting.</p>
        </Card>
      )}
      {view && entries.length > 0 && (
        <DataTable headers={['#', 'Patient', 'Contact preference', 'Status']}>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="pos-cell">{entry.position}</td>
              <td>{entry.patientName}</td>
              <td>
                <PreferencePill preference={entry.contactPreference} />
              </td>
              <td>
                <StatusPill status={entry.status} />
                {entry.holdsOffer && view.offer?.requiresCall && <div className="call-flag">Requires a call</div>}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
      <p className="footnote">Positions recalculate automatically as patients are booked — no one re-numbers the list by hand.</p>
    </div>
  );
}

function preferenceLabel(preference: ContactPreference | null): string {
  return preference ? PREFERENCE_LABEL[preference] : 'Not recorded';
}

/**
 * What staff can do about the slot right now: release one, follow up an outstanding offer (recording a
 * telephone patient's answer or passing it on), or nothing when no patient is eligible.
 */
function SlotControl({
  view,
  now,
  slotInput,
  onSlotInput,
  busy,
  onRelease,
  onRecordAccept,
  onRecordDecline,
  onPass,
}: {
  view: StaffWaitlistResponse;
  now: number;
  slotInput: string;
  onSlotInput: (value: string) => void;
  busy: boolean;
  onRelease: () => void;
  onRecordAccept: (offerId: number) => void;
  onRecordDecline: (offerId: number) => void;
  onPass: (offerId: number) => void;
}) {
  const { offer, release } = view;

  if (offer) {
    const holder = view.entries.find((e) => e.id === offer.entryId);
    return (
      <div className="control-row">
        <div>
          <div className="control-text">
            Waiting on <b>{holder?.patientName ?? 'a patient'}</b>'s response{offer.requiresCall ? ' — requires a call' : ''}.
          </div>
          <div className="control-sub">
            Slot: {formatSlot(offer.slotStartsAt)} · Outstanding for {formatElapsed(now - Date.parse(offer.createdAt))}
          </div>
        </div>
        <div className="control-fields">
          {offer.requiresCall && (
            <>
              <Button small disabled={busy} onClick={() => onRecordAccept(offer.id)}>
                They accepted
              </Button>
              <Button small variant="decline" disabled={busy} onClick={() => onRecordDecline(offer.id)}>
                They declined
              </Button>
            </>
          )}
          <Button small variant="secondary" disabled={busy} onClick={() => onPass(offer.id)}>
            Couldn't reach them — pass to next
          </Button>
        </div>
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

  if (release.reason === 'all_waiting_declined') {
    return (
      <div className="control-row">
        <div>
          <div className="control-text">No eligible patient remains for this slot.</div>
          {release.openSlotStartsAt && <div className="control-sub">Slot: {formatSlot(release.openSlotStartsAt)}</div>}
        </div>
      </div>
    );
  }

  return null;
}

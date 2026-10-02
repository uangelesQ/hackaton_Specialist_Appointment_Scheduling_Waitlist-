import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { AcceptResponse, ContactPreference, MyEntryView } from '@waitlist/shared';
import { useApi } from '../api/ApiContext';
import { describeError } from '../api/client';
import { formatJoinDate, formatSlot } from '../format';
import { useSession } from '../session';
import { Alert, Banner, Button, Card, MetaRow, Modal, PREFERENCE_LABEL, PreferenceChoice, SlotCard, Stepper } from '../ui/ui';

const POLL_MS = 10_000;
const STEP_FOR_STATUS = { waiting: 1, notified: 2, booked: 3, removed: 0 } as const;

type Booking = AcceptResponse['booking'];

/**
 * The patient's screen: where they stand as a status (Joined, Waiting, Notified, Booked), never as a
 * queue position or a count. Leaving the waitlist is not offered in this iteration.
 */
export function PatientView() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { session } = useSession();
  const specialistName = session?.specialist.name ?? 'the specialist';

  const waitlist = useQuery({ queryKey: ['me', 'waitlist'], queryFn: () => api.myWaitlist(), refetchInterval: POLL_MS });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['me', 'waitlist'] });

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [confirmingAccept, setConfirmingAccept] = useState(false);
  // Asking a patient with no preference to choose, before the join continues (US-012).
  const [choosing, setChoosing] = useState(false);
  const [choice, setChoice] = useState<ContactPreference | null>(null);

  const failed = (err: unknown) => {
    setError(describeError(err));
    void refresh();
  };

  const join = useMutation({
    mutationFn: () => api.join(),
    onSuccess: (result) => {
      setError(null);
      setBooking(null);
      setNotice(result.created ? null : "You're already on the waitlist.");
      void refresh();
    },
    onError: failed,
  });

  const savePreference = useMutation({ mutationFn: (value: ContactPreference) => api.setContactPreference(value) });
  // Separate from `join` so that a failure after the choice was saved can say so (US-012).
  const joinAfterChoice = useMutation({ mutationFn: () => api.join() });

  /** Saves the choice, then joins. Two requests, so a failed join leaves the saved preference in place. */
  async function confirmChoiceAndJoin(value: ContactPreference) {
    setError(null);
    try {
      await savePreference.mutateAsync(value);
    } catch {
      setError('Your contact preference was not saved, and you have not joined the waitlist. Please try again.');
      return;
    }
    setChoosing(false);
    setChoice(null);
    await refresh();
    try {
      await joinAfterChoice.mutateAsync();
      setBooking(null);
      setNotice(`Contact preference saved: ${PREFERENCE_LABEL[value]}. You're on the waitlist.`);
    } catch (err) {
      setError(`You have not joined the waitlist. Your contact preference was saved, so you won't be asked again. ${describeError(err)}`);
    }
    void refresh();
  }

  const accept = useMutation({
    mutationFn: (offerId: number) => api.accept(offerId),
    onSuccess: (result) => {
      setError(null);
      setNotice(null);
      setBooking(result.booking);
      void refresh();
    },
    onError: failed,
    onSettled: () => setConfirmingAccept(false),
  });

  const decline = useMutation({
    mutationFn: (offerId: number) => api.decline(offerId),
    onSuccess: () => {
      setError(null);
      void refresh();
    },
    onError: failed,
  });

  const entry = waitlist.data?.entry ?? null;
  const preference = waitlist.data?.contactPreference ?? null;

  return (
    <div>
      {waitlist.isError && <Alert>{describeError(waitlist.error)}</Alert>}
      {error && <Alert>{error}</Alert>}
      {notice && <div className="notice">{notice}</div>}

      {booking && <BookedCard booking={booking} />}
      {!booking && waitlist.isPending && <p className="footnote">Loading…</p>}
      {!booking && waitlist.data && !entry && (
        <Card tone="empty" title="You're not on the waitlist yet">
          <p>Join {specialistName}'s waitlist and you'll see your status here — no need to call the office.</p>
          {choosing ? (
            <div>
              <p>Choose how you would like to be contacted when a slot opens.</p>
              <PreferenceChoice name="join-preference" value={choice} onChange={setChoice} />
              <div className="pref-actions">
                <Button
                  disabled={choice === null || savePreference.isPending || joinAfterChoice.isPending}
                  onClick={() => choice && void confirmChoiceAndJoin(choice)}
                >
                  Confirm and join
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setChoosing(false);
                    setChoice(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button disabled={join.isPending} onClick={() => (preference === null ? setChoosing(true) : join.mutate())}>
              Join waitlist
            </Button>
          )}
        </Card>
      )}
      {entry && (
        <EntryCard
          entry={entry}
          busy={accept.isPending || decline.isPending}
          onAccept={() => setConfirmingAccept(true)}
          onDecline={(offerId) => decline.mutate(offerId)}
        />
      )}

      {waitlist.data && (
        <PreferenceCard
          preference={preference}
          save={(value) => api.setContactPreference(value)}
          onSaved={() => {
            setError(null);
            void refresh();
          }}
        />
      )}

      {confirmingAccept && entry?.offer && (
        <Modal
          title="Book this appointment?"
          actions={
            <>
              <Button variant="secondary" onClick={() => setConfirmingAccept(false)}>
                Cancel
              </Button>
              <Button disabled={accept.isPending} onClick={() => entry.offer && accept.mutate(entry.offer.id)}>
                Confirm
              </Button>
            </>
          }
        >
          {formatSlot(entry.offer.slotStartsAt)} with {entry.offer.specialistName}. You're confirming this slot.
        </Modal>
      )}
    </div>
  );
}

/**
 * The patient's own contact preference, with a way to set or change it whenever they are signed in (US-013).
 * Only the current value is shown, never a history of earlier ones.
 */
function PreferenceCard({
  preference,
  save,
  onSaved,
}: {
  preference: ContactPreference | null;
  save: (value: ContactPreference) => Promise<unknown>;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [choice, setChoice] = useState<ContactPreference | null>(null);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  const start = () => {
    setChoice(preference);
    setFailed(false);
    setEditing(true);
  };

  async function submit() {
    if (!choice) return;
    setSaving(true);
    try {
      await save(choice);
      setEditing(false);
      onSaved();
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="How we contact you">
      {!editing && (
        <div className="pref-current">
          <span>{preference ? PREFERENCE_LABEL[preference] : 'Not chosen yet'}</span>
          <Button small variant="secondary" onClick={start}>
            {preference ? 'Change' : 'Choose'}
          </Button>
        </div>
      )}
      {editing && (
        <div>
          <PreferenceChoice name="preference" value={choice} onChange={setChoice} disabled={saving} />
          {failed && <Alert>Your contact preference was not saved. Please try again.</Alert>}
          <div className="pref-actions">
            <Button small disabled={saving || choice === null || choice === preference} onClick={() => void submit()}>
              Save
            </Button>
            <Button small variant="secondary" disabled={saving} onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function EntryCard({
  entry,
  busy,
  onAccept,
  onDecline,
}: {
  entry: MyEntryView;
  busy: boolean;
  onAccept: () => void;
  onDecline: (offerId: number) => void;
}) {
  const { offer } = entry;
  // The patient holds an offer but staff answer for them: no banner and no actions, just a notice.
  const answeredByStaff = entry.holdsOffer && !offer;

  return (
    <>
      {offer && <Banner>A slot just opened for you</Banner>}
      <Card title="You're on the waitlist">
        <Stepper current={STEP_FOR_STATUS[entry.status]} />
        {!offer && !answeredByStaff && <p>We'll notify you here the moment a slot opens. No need to call to check in.</p>}
        {answeredByStaff && <p>A slot has opened for you. A member of our team will contact you about it.</p>}
        {offer && (
          <SlotCard when={formatSlot(offer.slotStartsAt)} who={`With ${offer.specialistName}`}>
            <Button variant="decline" disabled={busy} onClick={() => onDecline(offer.id)}>
              Decline
            </Button>
            <Button disabled={busy} onClick={onAccept}>
              Accept
            </Button>
          </SlotCard>
        )}
        <MetaRow
          items={[
            { label: 'Joined', value: formatJoinDate(entry.joinedAt) },
            offer
              ? { label: "If this offer isn't answered", value: 'Staff can pass it to the next patient' }
              : { label: 'Notifications', value: 'Check here — no need to call' },
          ]}
        />
      </Card>
    </>
  );
}

function BookedCard({ booking }: { booking: Booking }) {
  return (
    <Card tone="confirm" title="You're booked">
      <Stepper current={3} />
      <p>
        {formatSlot(booking.slotStartsAt)} with {booking.specialistName}. See you then — no call needed to confirm.
      </p>
      <MetaRow items={[{ label: 'Need to change this?', value: 'Contact the office' }]} />
    </Card>
  );
}

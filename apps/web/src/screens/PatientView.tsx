import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { AcceptResponse, MyEntryView } from '@waitlist/shared';
import { useApi } from '../api/ApiContext';
import { describeError } from '../api/client';
import { formatJoinDate, formatSlot } from '../format';
import { useSession } from '../session';
import { Alert, Banner, Button, Card, MetaRow, Modal, SlotCard, Stepper } from '../ui/ui';

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
          <Button disabled={join.isPending} onClick={() => join.mutate()}>
            Join waitlist
          </Button>
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

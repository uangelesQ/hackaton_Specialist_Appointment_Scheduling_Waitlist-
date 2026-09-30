# Proposal

## Why

High-demand specialist appointments are waitlisted manually by staff and communicated by phone. Patients cannot see their position, and staff spend significant time on coordination calls. A digital waitlist where staff release an open slot, the next patient is notified in-app, and that patient can accept or decline, removes the phone dependency in both directions (PS-001 v0.4, MVP).

## What Changes

- Patients can join the waitlist, see their position as "#N", and leave (US-001, US-002, US-007).
- Staff can view the waitlist, add a patient on their behalf, and remove a patient (US-004, US-005, US-006).
- Staff release an open slot; the patient at position 1 with status `waiting` is notified with an in-app banner (US-009, US-003).
- The notified patient can accept (with a confirm step) or decline. Accepting books the slot and closes the entry; declining keeps the entry and position and returns the slot to staff (US-008, BR-005).
- Staff can pass an unanswered offer to the next patient manually; there is no timer (US-010).
- One outstanding offer at a time (BR-007). Entries move through `waiting`, `notified`, `booked` and `removed`, and positions close up automatically when an entry closes (BR-008). Removing a patient who holds an offer closes the offer (BR-009).
- Every creation, removal, release, accept, decline and pass-on records who did it and when.
- New greenfield application: TypeScript, Node API, React UI.

Decisions carried from PS-001 v0.4 (resolved there): FIFO by join date, in-app banner only with no notification centre, one active entry per patient per specialist, single specialist in a single clinic, staff-manual reassignment.

Decisions made in this plan where the PS is silent (to be confirmed by the Product Owner):
- Staff enter the slot date and time when releasing. A slot returned by a decline, pass-on or removal stays open with the same date and time and is released again by staff.
- If every waiting patient has already declined the current slot, no release action is offered and the slot stays open.
- After a pass-on, "the next patient" is the next waiting patient behind the passed patient in FIFO order who has not declined that slot.
- Compliance framework: still open; baseline controls follow the PS working assumption (waitlist data is PII, a patient sees only their own record, staff see only the specialist they administer).

UI reference: `docs/waitlist-prototype_V2.html` (layout and styling). Where V2 differs from the PS, the PS wins: declining does not cascade automatically, and closed (booked/removed) entries are not shown in the staff table. Patient leave, staff add and staff remove are not in V2; they are built in its style, pending UX wireframes.

Out of scope: automated timer or cascade, self-service slot browsing, staff-confirmed booking, doctor-initiated schedule changes, out-of-app notification channels, handling of cancellations (they happen outside this feature), multi-specialist support.

## Capabilities

### New Capabilities
- `waitlist-membership`: joining, leaving, staff add/remove, one active entry per patient, the entry status model, and audit attribution.
- `waitlist-visibility`: patient view of own position as "#N" and staff view of the waitlist with status and outstanding offer, with FIFO ordering over active entries.
- `slot-offers`: staff release of a slot, the in-app banner for the notified patient, accept (with confirm) and decline, staff pass-on, returned slots, and one outstanding offer at a time.

### Modified Capabilities

None. `openspec/specs/` is empty.

## Impact

- New code: Node/TypeScript API, persistence for patients, the specialist, waitlist entries, slot offers and audit records, and a React UI for patients and staff.
- Assumes existing patient registration records; there is no application code in the repo today, so a seeded patient, specialist and staff store is needed.
- No external services: no booking-system integration, no email or SMS.

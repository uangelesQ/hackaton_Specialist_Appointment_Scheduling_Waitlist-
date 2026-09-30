# Proposal

## Why

High-demand specialist appointments are waitlisted manually by staff and communicated by phone. Patients cannot see their position, and staff spend significant time on coordination calls. A digital waitlist with automatic slot-availability notification removes the phone dependency (PS-001 v0.2, MVP).

## What Changes

- Patients can join a specialist's waitlist, see their position, and leave the waitlist (US-001, US-002, US-007).
- Staff can view a specialist's waitlist, add a patient on their behalf, and remove a patient (US-004, US-006, US-005).
- When a patient cancels a booked appointment, a slot-availability event is raised and every patient with an active entry for that specialist is notified (US-003, BR-001).
- Sending a notification does not change entry status; entries stay active until removed (BR-003).
- Every entry creation and removal records who performed it and when (Auditability).
- New greenfield application: TypeScript, Node API, React UI.

Decisions taken for this proposal to resolve PS-001 Open Decisions (to be confirmed by the Product Owner):
- **Ordering:** FIFO by join time. Staff-added entries are ordered by the time staff created them.
- **Channel:** in-app/portal notification only, behind a channel interface so email/SMS can be added later.
- **Multi-entry (BR-004):** one active entry per patient per specialist. A patient may be on several specialists' waitlists. A duplicate join is rejected.
- **Compliance framework:** still open. Treated as a design constraint (access control, audit trail, no PII in logs) without naming a framework.

Out of scope: slot claim/booking, response windows, cascading the offer to the next patient (deferred Slot Claim & Booking Confirmation spec).

## Capabilities

### New Capabilities
- `waitlist-membership`: joining, leaving, staff add/remove, one active entry per patient per specialist, and audit attribution of entry creation and removal.
- `waitlist-visibility`: patient view of own position and staff view of a specialist's full waitlist, with FIFO ordering over active entries.
- `slot-availability-notification`: raising a slot-availability event on appointment cancellation and notifying all active entries in-app, without altering entry status.

### Modified Capabilities

None. `openspec/specs/` is empty.

## Impact

- New code: Node/TypeScript API, persistence for patients, specialists, waitlist entries, notifications and audit records, and a React UI for patients and staff.
- Assumes existing patient registration records; there is no application code in the repo today, so a patient/specialist stub is needed.
- The cancellation event source (the booking system) is not part of this repo; the MVP exposes an endpoint/hook that simulates it.
- No external services: no email/SMS provider.

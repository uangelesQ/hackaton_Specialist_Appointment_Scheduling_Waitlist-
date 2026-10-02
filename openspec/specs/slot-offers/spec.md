# slot-offers Specification

## Purpose

Defines how staff release an open slot to the waitlist, how the next patient is notified in-app and responds, and how staff move an unanswered offer on, so slots are filled without phone calls.

## Requirements

### Requirement: Staff releases an open slot
The system SHALL let scheduling staff release an open slot, identified by a date and time they enter, to the waitlist. On release, the next patient in line, as defined in `offer-targeting`, SHALL change to `notified` and an offer for that slot SHALL be outstanding with that patient. No slot SHALL be offered without this staff action (US-009, BR-005).

#### Scenario: Release offers the slot to the next patient in line
- **WHEN** at least one eligible patient is `waiting`, no offer is outstanding, and staff release a slot
- **THEN** the next patient in line becomes `notified` and holds an outstanding offer for that slot date and time

#### Scenario: No waiting patients
- **WHEN** no patient has status `waiting`
- **THEN** no release action is offered and the view states that no patients are waiting

#### Scenario: Release is audited
- **WHEN** staff release a slot
- **THEN** the audit record identifies the staff member, the slot and the time

### Requirement: One outstanding offer at a time
The system SHALL allow at most one outstanding offer at any time. While an offer is outstanding, no release action SHALL be available and any attempt to release SHALL be rejected, including concurrent attempts.

#### Scenario: Release blocked while offer outstanding
- **WHEN** an offer is outstanding and a staff member views the waitlist
- **THEN** no release action is offered

#### Scenario: Concurrent releases
- **WHEN** two staff release slots at the same moment
- **THEN** exactly one offer is created and the other request is rejected

### Requirement: Notified patient sees an in-app banner
The system SHALL show a patient whose contact preference is `in_app` and who holds the outstanding offer an in-app banner on their waitlist view announcing the open slot, with its date, time and specialist (US-003, BR-001). A patient whose preference is `telephone` or not recorded is not shown the banner (see `contact-preference`). There SHALL be no persistent notification list; a patient not viewing the application sees the offer the next time they open it, and the offer remains outstanding until answered, passed on or closed.

#### Scenario: Banner shown to an in-app offer holder
- **WHEN** an `in_app` patient with an outstanding offer opens their waitlist view
- **THEN** a banner announces the open slot and shows the slot date, time and specialist

#### Scenario: Other patients see no banner
- **WHEN** a patient who does not hold the outstanding offer, or whose preference is not `in_app`, opens their waitlist view
- **THEN** no offer banner is shown

#### Scenario: Offer persists until next visit
- **WHEN** an `in_app` patient is notified while not viewing the application and opens it later
- **THEN** the banner and offer are shown, provided the offer is still outstanding

#### Scenario: Notification does not change position
- **WHEN** a patient is notified
- **THEN** their entry remains active at its existing position

### Requirement: Patient accepts an offer with confirmation
The system SHALL, when a patient whose contact preference is `in_app` chooses to accept, first show a confirmation step restating the slot date, time and specialist with options to confirm or go back. On confirm the booking SHALL be completed for that slot and the entry SHALL become `booked`. On go back nothing SHALL change and the offer SHALL remain outstanding and answerable (US-008, BR-005). A patient whose preference is `telephone` or not recorded does not respond in the app; staff record their response (see `telephone-offer-response`).

#### Scenario: Confirm acceptance
- **WHEN** a patient with an outstanding offer accepts and then confirms
- **THEN** the slot is booked for the patient, the entry becomes `booked`, entries behind it move up one position, and no offer is outstanding

#### Scenario: Go back from confirmation
- **WHEN** a patient accepts and then goes back from the confirmation step
- **THEN** no booking is made and the offer is still outstanding

#### Scenario: Acceptance is audited
- **WHEN** a patient confirms an offer
- **THEN** the audit record identifies the patient, the slot and the time

#### Scenario: Only the offer holder can respond
- **WHEN** a patient who does not hold the outstanding offer tries to accept or decline it
- **THEN** the system rejects the request and nothing changes

#### Scenario: Offer no longer outstanding
- **WHEN** a patient tries to answer an offer that has been passed on, closed or already answered
- **THEN** the system rejects the request and tells the patient the offer is no longer available

### Requirement: Patient declines an offer
The system SHALL, when a patient whose contact preference is `in_app` declines, close that offer, return the entry to `waiting` at its existing position, and return the slot to staff to release again. The patient SHALL NOT be offered the same slot again but SHALL stay eligible for any future slot. The system SHALL NOT notify the next patient automatically (US-008, BR-005).

#### Scenario: Decline keeps position
- **WHEN** a patient with an outstanding offer declines
- **THEN** the offer is closed, the entry is `waiting` at the same position, and no other patient is notified

#### Scenario: Declined slot skips the decliner
- **WHEN** staff release a slot that patient P previously declined
- **THEN** the offer goes to the lowest-position waiting patient who has not declined that slot, and not to P

#### Scenario: Decline is audited
- **WHEN** a patient declines
- **THEN** the audit record identifies the patient, the slot and the time

#### Scenario: Every waiting patient has declined
- **WHEN** all patients with status `waiting` have declined the returned slot
- **THEN** no release action is offered for that slot and it stays open

### Requirement: Staff passes an unanswered offer to the next patient
The system SHALL let staff pass an outstanding offer on. The holder SHALL return to `waiting` at their existing position and SHALL be passed over for that slot, and the next patient in line, as defined in `offer-targeting`, SHALL become `notified` with an outstanding offer for the same slot (US-010, BR-005). If there is no such patient, the holder SHALL return to `waiting`, no new offer SHALL be raised, and the slot SHALL return to staff to release again.

#### Scenario: Pass offer to next patient
- **WHEN** patient P holds an offer and staff pass it on, and another eligible patient is waiting
- **THEN** P is `waiting` at the same position, P is passed over for that slot, and the next patient in line is `notified` for the same slot

#### Scenario: Only patient on the waitlist
- **WHEN** P holds an offer, is the only eligible patient, and staff pass it on
- **THEN** P returns to `waiting` and no new offer is raised

#### Scenario: Pass-on is audited
- **WHEN** staff pass an offer on
- **THEN** the audit record identifies the staff member, the slot and the time

### Requirement: Closing an offer by removal returns the slot
The system SHALL close an outstanding offer when its holder is removed by themselves or by staff. The slot SHALL return to staff to release again, with the same date and time. The remaining entries SHALL NOT be notified automatically.

#### Scenario: Holder removed
- **WHEN** the holder of an outstanding offer is removed
- **THEN** the offer is closed, no other patient is notified, and staff can release the slot again

### Requirement: Offers are reliable and auditable
The system SHALL persist each offer before reporting the release as successful, SHALL record each offer outcome (accepted, declined, passed on, closed by removal), and SHALL make release, accept, decline, pass-on and removal atomic so entry status and offer state never disagree.

#### Scenario: Failure during release
- **WHEN** a release fails part-way
- **THEN** no patient is left `notified` without an outstanding offer and no offer exists without a `notified` holder

#### Scenario: Simultaneous response and pass-on
- **WHEN** a patient accepts and staff pass the same offer on at the same moment
- **THEN** exactly one of the actions succeeds and the other is rejected

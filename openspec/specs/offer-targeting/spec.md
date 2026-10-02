# offer-targeting Specification

## Purpose

Defines which patient a released slot is offered to and when a slot may be released, so the same slot is never offered twice to a patient who declined or was passed over, and a booked slot is never offered again.

## Requirements

### Requirement: A released slot goes to the next patient in line
The system SHALL offer a released slot to the patient who is *next in line*: the patient with the lowest position whose entry is `waiting` and who has not declined, and has not been passed over for, that slot. Only that patient SHALL receive the offer, and every other patient's position SHALL be unchanged (US-009 AC1, US-003 AC5, BR-005, BR-006).

#### Scenario: Offer goes to the lowest-position eligible patient
- **WHEN** staff release a slot, no offer is outstanding, and several patients are `waiting`
- **THEN** the lowest-position eligible patient becomes `notified` and holds the outstanding offer

#### Scenario: Declined patient is skipped
- **WHEN** staff release a slot that the patient at the lowest position previously declined
- **THEN** that patient is not eligible and the slot is offered to the next patient in line

#### Scenario: Other patients are unaffected
- **WHEN** a slot is offered to one patient
- **THEN** every other patient receives no offer and keeps their position

### Requirement: A passed-over patient is not offered the same slot again
The system SHALL, when staff pass an unanswered offer on, return the holder to `waiting` at their existing position, make that holder ineligible for that slot, and offer the slot to the next patient in line. The holder SHALL NOT be offered that same slot again, though they remain eligible for later slots (US-010 AC1, BR-005).

#### Scenario: Pass-on moves the offer to the next patient
- **WHEN** staff pass on an offer and another eligible patient is waiting
- **THEN** the holder returns to `waiting` at their existing position and the next patient in line becomes `notified` for the same slot

#### Scenario: Passed-over patient is skipped on later release
- **WHEN** a slot was passed on from a patient and staff later release that slot again
- **THEN** that patient is not offered it

#### Scenario: Passed-over patient keeps their place for later slots
- **WHEN** a patient was passed over for one slot and staff release a different slot
- **THEN** that patient is eligible for it at their existing position

### Requirement: Slot returns to staff when no patient is eligible
The system SHALL leave the slot open and with staff when no patient is eligible, whether after a pass-on, a decline, or a release, and SHALL NOT raise a new offer. Staff SHALL be told no eligible patient remains, and the release action SHALL NOT be offered while no patient is eligible (US-009 AC4, US-010 AC2, BR-005).

#### Scenario: Only patient is passed over
- **WHEN** staff pass on the offer held by the only waiting patient
- **THEN** the patient returns to `waiting`, no new offer is raised, and the slot stays with staff

#### Scenario: Every waiting patient declined or was passed over
- **WHEN** every waiting patient has declined or been passed over for the open slot
- **THEN** no release action is offered and staff are told no eligible patient remains

#### Scenario: Release with nobody eligible is rejected
- **WHEN** staff attempt to release a slot and no patient is eligible
- **THEN** the request is rejected and no offer is created

### Requirement: A booked slot cannot be released again
The system SHALL treat a slot as identified by its date and time, SHALL mark a slot taken when its booking is completed, and SHALL reject any release of a slot whose date and time match a booked slot (US-009 AC3, BR-013).

#### Scenario: Release of a booked slot is rejected
- **WHEN** staff attempt to release a slot with the same date and time as a booked slot
- **THEN** the request is rejected, staff are told the slot is already booked, and no offer is created

#### Scenario: Slot is taken once booked
- **WHEN** a patient or staff accept an offer for a slot
- **THEN** the slot is marked taken and cannot be offered to another patient

#### Scenario: Returned slot keeps its identity
- **WHEN** a slot is returned to staff by a decline, pass-on or removal of the holder and staff release it again
- **THEN** it is offered with the same date and time

### Requirement: One outstanding offer at a time is preserved
The system SHALL continue to allow at most one outstanding offer, and no release SHALL be available while an offer is outstanding (BR-007).

#### Scenario: Release blocked while an offer is outstanding
- **WHEN** an offer is outstanding and staff attempt to release a slot
- **THEN** the request is rejected and the staff view offers no release action

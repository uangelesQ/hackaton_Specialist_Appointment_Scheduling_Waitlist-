# Spec Delta

## Purpose

Lets scheduling staff record the accept or decline of a patient they reached by telephone, so patients without digital access are represented in the same waitlist record and an offered slot is never left stuck.

## ADDED Requirements

### Requirement: Staff record a telephone patient's acceptance
The system SHALL let a staff member record that a patient with preference `telephone` or not recorded, who holds the outstanding offer, accepted it. Recording SHALL complete the booking for that slot, close the entry as `booked`, and mark the slot taken, with the same effect as the patient's own acceptance (US-011 AC1, BR-010, BR-013).

#### Scenario: Staff record an acceptance
- **WHEN** a staff member records that a telephone patient holding the outstanding offer accepted
- **THEN** the slot is booked for the patient, the entry becomes `booked`, entries behind it move up one position, and no offer is outstanding

#### Scenario: Acceptance for a not-recorded patient
- **WHEN** a staff member records an acceptance for a patient with no recorded preference who holds the outstanding offer
- **THEN** the booking is completed exactly as for a telephone patient

### Requirement: Staff record a telephone patient's decline
The system SHALL let a staff member record that a patient with preference `telephone` or not recorded, who holds the outstanding offer, declined it. Recording SHALL close the offer, keep the entry active at its existing position, return the slot to staff to release again, and notify no other patient (US-011 AC2, BR-005, BR-010).

#### Scenario: Staff record a decline
- **WHEN** a staff member records that a telephone patient holding the outstanding offer declined
- **THEN** the offer closes, the entry returns to `waiting` at its existing position, the slot returns to staff, and nobody else is notified

#### Scenario: Declined slot is not offered to the same patient again
- **WHEN** staff release the returned slot after a recorded decline
- **THEN** the patient who declined is not offered that slot

### Requirement: Unreachable patient uses pass-on
When a telephone patient could not be reached, staff SHALL use the existing pass-on action and the system SHALL apply it unchanged (US-011 AC3, US-010).

#### Scenario: Pass-on for an unreachable telephone patient
- **WHEN** staff pass on the offer held by a telephone patient they could not reach
- **THEN** the pass-on behaves as for any unanswered offer

### Requirement: Recording is not available for in-app patients
The system SHALL reject a staff attempt to record an accept or decline for a patient whose preference is `in_app`, and the staff view SHALL NOT offer those actions for such a patient (US-011 AC4, BR-001).

#### Scenario: Staff try to record for an in-app patient
- **WHEN** a staff member attempts to record a response for a patient whose preference is `in_app`
- **THEN** the request is rejected and the offer and entry are unchanged

#### Scenario: No record actions for in-app patients
- **WHEN** a staff member views an outstanding offer held by an `in_app` patient
- **THEN** no record-accept or record-decline action is shown

### Requirement: In-app response is refused for non-in-app patients
The system SHALL reject an in-app accept or decline from a patient whose preference is `telephone` or not recorded, so each patient has exactly one response channel (US-008 AC7, BR-001).

#### Scenario: Telephone patient attempts to accept in the app
- **WHEN** a patient with preference `telephone` submits an in-app accept for their outstanding offer
- **THEN** the request is rejected and the offer and entry are unchanged

#### Scenario: Not-recorded patient attempts to decline in the app
- **WHEN** a patient with no recorded preference submits an in-app decline for their outstanding offer
- **THEN** the request is rejected and the offer and entry are unchanged

### Requirement: Staff-recorded responses are attributable and distinguishable
Every response recorded by staff on a patient's behalf SHALL be audited with the staff member's identity, the patient's entry, the slot and the time, and SHALL be distinguishable from a response the patient made themselves (BR-010).

#### Scenario: Recorded accept is audited as staff-entered
- **WHEN** a staff member records an acceptance for a patient
- **THEN** the audit record identifies the staff member and marks the response as recorded on the patient's behalf

#### Scenario: Patient's own response is audited as the patient's
- **WHEN** an `in_app` patient accepts or declines their own offer
- **THEN** the audit record identifies the patient and is not marked as recorded on their behalf

### Requirement: Only one response resolves an offer
The system SHALL apply only the first action recorded against an outstanding offer (accept, decline, pass-on or staff-recorded response). Any later action on that offer SHALL NOT be applied, and the person attempting it SHALL be told the offer is no longer available and shown the current state (BR-012).

#### Scenario: Staff record after the offer was passed on
- **WHEN** staff attempt to record a response for an offer that was already passed on
- **THEN** no change is made and staff are told the offer is no longer available

#### Scenario: Pass-on after a recorded response
- **WHEN** staff attempt to pass on an offer whose response was already recorded
- **THEN** no change is made and staff are shown the recorded response

#### Scenario: Concurrent record and pass-on
- **WHEN** a record-accept and a pass-on arrive for the same offer at the same moment
- **THEN** exactly one is applied and the other is rejected

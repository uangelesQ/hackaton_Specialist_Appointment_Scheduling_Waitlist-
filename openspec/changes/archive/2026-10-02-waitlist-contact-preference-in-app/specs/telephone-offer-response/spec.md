# Delta for telephone-offer-response

## MODIFIED Requirements

### Requirement: Recording is not available for in-app patients
The system SHALL reject a staff attempt to record an accept or decline for a patient whose preference is `in_app`, and the staff view SHALL NOT offer those actions for such a patient. Availability SHALL be decided from the preference at the moment the action is taken, so a patient who has changed to `in_app` since the staff view was loaded is refused, and staff are told the patient now responds in the app (US-011 AC4, BR-001, BR-021).

#### Scenario: Staff try to record for an in-app patient
- **WHEN** a staff member attempts to record a response for a patient whose preference is `in_app`
- **THEN** the request is rejected and the offer and entry are unchanged

#### Scenario: No record actions for in-app patients
- **WHEN** a staff member views an outstanding offer held by an `in_app` patient
- **THEN** no record-accept or record-decline action is shown

#### Scenario: Patient switched to in-app after the staff view loaded
- **WHEN** a patient holding the outstanding offer changes to `in_app` and a staff member then records a response for them
- **THEN** the request is rejected, the offer stays outstanding, and staff are told the patient now responds in the app

### Requirement: In-app response is refused for non-in-app patients
The system SHALL reject an in-app accept or decline from a patient whose preference is `telephone` or not recorded, so each patient has exactly one response channel (US-008 AC7, BR-001). The preference SHALL be read at the moment of the action, so a patient who changed to `telephone` after their confirmation step was shown is refused, no booking is made, the offer stays outstanding, and they are told the current state (BR-021).

#### Scenario: Telephone patient attempts to accept in the app
- **WHEN** a patient with preference `telephone` submits an in-app accept for their outstanding offer
- **THEN** the request is rejected and the offer and entry are unchanged

#### Scenario: Not-recorded patient attempts to decline in the app
- **WHEN** a patient with no recorded preference submits an in-app decline for their outstanding offer
- **THEN** the request is rejected and the offer and entry are unchanged

#### Scenario: Patient switched to telephone after the confirmation step was shown
- **WHEN** a patient is on the confirmation step for their offer, changes to `telephone` in another session, and then confirms
- **THEN** no booking is made, the offer stays outstanding for staff to record, and the patient is told staff will record their response

## ADDED Requirements

### Requirement: A recorded response stands after a later change of preference
The system SHALL leave a response already recorded, by the patient or by staff, unchanged when the patient later changes their contact preference (BR-018).

#### Scenario: Accepted offer then preference change
- **WHEN** a patient whose offer was accepted changes their preference
- **THEN** the booking, the entry status `booked` and the slot are unchanged

#### Scenario: Declined offer then preference change
- **WHEN** a patient whose offer was declined changes their preference
- **THEN** the entry stays `waiting` at its position and the slot is unchanged

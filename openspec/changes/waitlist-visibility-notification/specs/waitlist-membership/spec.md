# Spec Delta

## Purpose

Defines how patients and scheduling staff create and end waitlist entries for the specialist, the lifecycle status of an entry, and who may act, so the waitlist is maintained digitally instead of by phone.

## ADDED Requirements

### Requirement: Entry status model
The system SHALL give every waitlist entry exactly one status: `waiting`, `notified`, `booked` or `removed`. An entry is active when its status is `waiting` or `notified`. `booked` and `removed` are terminal; such entries are closed, excluded from position calculations, and receive no further offers.

#### Scenario: New entry starts as waiting
- **WHEN** an entry is created by a patient or by staff
- **THEN** its status is `waiting`

#### Scenario: Closed entries are not active
- **WHEN** an entry has status `booked` or `removed`
- **THEN** it is not counted as active and does not take part in position numbering

### Requirement: Patient joins the waitlist
The system SHALL allow a registered patient with no active entry to join the specialist's waitlist, creating an entry with status `waiting` and showing the patient a confirmation.

#### Scenario: Successful self-join
- **WHEN** a registered patient with no active entry requests to join the waitlist
- **THEN** an entry with status `waiting` is created and the patient is shown confirmation of having joined

#### Scenario: Unregistered person
- **WHEN** a person who is not a registered patient requests to join
- **THEN** the system rejects the request and creates no entry

### Requirement: One active entry per patient
The system SHALL allow a patient at most one active entry for the specialist. A repeated join, by the patient or by staff, SHALL NOT create a duplicate and SHALL show the existing entry and its position.

#### Scenario: Duplicate self-join
- **WHEN** a patient who already has an active entry requests to join again
- **THEN** no entry is created and the patient is shown their existing position

#### Scenario: Duplicate staff add
- **WHEN** a staff member adds a patient who already has an active entry
- **THEN** no entry is created and the staff member is shown the existing entry and its position

#### Scenario: Rejoin after closing
- **WHEN** a patient whose entry is `removed` or `booked` joins again
- **THEN** a new entry with status `waiting` and a new join time is created

### Requirement: Staff adds a patient on their behalf
The system SHALL allow scheduling staff to add a patient without an active entry. The resulting entry SHALL behave identically to a self-joined entry.

#### Scenario: Staff adds phone-in patient
- **WHEN** a staff member adds a patient with no active entry
- **THEN** an entry with status `waiting` is created, visible to the patient and eligible for offers

### Requirement: Patient removes themselves
The system SHALL allow a patient to remove their own active entry. The entry becomes `removed`, is excluded from position calculations, and every entry behind it moves up one position.

#### Scenario: Patient leaves waitlist
- **WHEN** a patient holding position N chooses to leave the waitlist
- **THEN** the entry becomes `removed`, every entry behind it moves up one position, and the patient receives no further offers

#### Scenario: Patient leaves while holding an offer
- **WHEN** a patient whose entry is `notified` leaves the waitlist
- **THEN** the outstanding offer is closed and the slot returns to staff to release again

#### Scenario: Patient cannot remove another patient's entry
- **WHEN** a patient attempts to remove an entry that belongs to a different patient
- **THEN** the system rejects the request and the entry is unchanged

### Requirement: Staff removes a patient
The system SHALL allow scheduling staff to remove any active entry, with the same effects as patient self-removal. No other party SHALL be able to remove an entry.

#### Scenario: Staff removes entry
- **WHEN** a staff member removes an active entry at position N
- **THEN** the entry becomes `removed`, every entry behind it moves up one position, and the patient receives no further offers

#### Scenario: Staff removes patient holding an offer
- **WHEN** a staff member removes an entry whose status is `notified`
- **THEN** the outstanding offer is closed and the slot returns to staff to release again

#### Scenario: Removing a closed entry
- **WHEN** a staff member attempts to remove an entry that is already `booked` or `removed`
- **THEN** nothing changes and the staff member is told the entry is no longer active

#### Scenario: Unauthorised removal
- **WHEN** a caller who is neither the entry's patient nor a staff member attempts to remove an entry
- **THEN** the system rejects the request and the entry is unchanged

### Requirement: Entry creation and removal are auditable
The system SHALL record, for every entry creation and removal, who performed the action (the patient, or the named staff member) and when.

#### Scenario: Staff-created entry is attributed
- **WHEN** a staff member adds a patient
- **THEN** the audit record identifies that staff member and the time

#### Scenario: Self-removal is attributed
- **WHEN** a patient removes their own entry
- **THEN** the audit record identifies the patient as the actor and the time

### Requirement: Only authorised actors may act
The system SHALL require authentication for all waitlist actions. A patient SHALL only read and change their own entry. Staff actions SHALL require the staff role, and staff SHALL only act on the specialist they administer.

#### Scenario: Unauthenticated request
- **WHEN** a request without valid authentication attempts any waitlist action
- **THEN** the system rejects it and changes nothing

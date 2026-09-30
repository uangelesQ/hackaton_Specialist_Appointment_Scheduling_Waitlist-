# Spec Delta

## Purpose

Defines how patients and scheduling staff create and end waitlist entries for a specialist, including uniqueness and attribution, so the waitlist is maintained digitally instead of by phone.

## ADDED Requirements

### Requirement: Patient joins a specialist's waitlist
The system SHALL allow a registered patient with no active entry for a specialist to join that specialist's waitlist, creating an active entry and showing the patient a confirmation.

#### Scenario: Successful self-join
- **WHEN** a registered patient with no active entry for specialist S requests to join S's waitlist
- **THEN** an active entry is created for the patient and S, and the patient is shown confirmation of having joined

#### Scenario: Unregistered patient
- **WHEN** a person who is not a registered patient requests to join a waitlist
- **THEN** the system rejects the request and creates no entry

### Requirement: One active entry per patient per specialist
The system SHALL allow a patient to hold at most one active waitlist entry for a given specialist, and SHALL allow a patient to hold active entries for different specialists at the same time.

#### Scenario: Duplicate join rejected
- **WHEN** a patient who already has an active entry for specialist S requests to join S's waitlist again, by self-service or via staff
- **THEN** the system rejects the request with a clear message and the existing entry is unchanged

#### Scenario: Entries for different specialists
- **WHEN** a patient with an active entry for specialist S1 joins the waitlist of specialist S2
- **THEN** a second active entry is created and the S1 entry is unaffected

#### Scenario: Rejoin after removal
- **WHEN** a patient whose entry for specialist S is inactive joins S's waitlist again
- **THEN** a new active entry is created with a new join time

### Requirement: Staff adds a patient on their behalf
The system SHALL allow scheduling staff to add a patient without an active entry to a specialist's waitlist. The resulting entry SHALL behave identically to a self-joined entry.

#### Scenario: Staff adds phone-in patient
- **WHEN** a staff member adds a patient with no active entry for specialist S to S's waitlist
- **THEN** an active entry is created, visible to the patient and eligible for slot notifications

### Requirement: Patient removes themselves
The system SHALL allow a patient to remove their own active entry, after which the entry is inactive, excluded from position calculations, and receives no further notifications for that specialist.

#### Scenario: Patient leaves waitlist
- **WHEN** a patient with an active entry for specialist S chooses to leave S's waitlist
- **THEN** the entry becomes inactive, other entries' positions are recalculated without it, and the patient receives no further notifications for S

#### Scenario: Patient cannot remove another patient's entry
- **WHEN** a patient attempts to remove an entry that belongs to a different patient
- **THEN** the system rejects the request and the entry remains active

### Requirement: Staff removes a patient
The system SHALL allow scheduling staff to remove any active entry, with the same effects as patient self-removal. No other party SHALL be able to remove an entry.

#### Scenario: Staff removes entry
- **WHEN** a staff member removes an active entry for specialist S
- **THEN** the entry becomes inactive, is excluded from position calculations, and the patient receives no further notifications for S

#### Scenario: Unauthorised removal
- **WHEN** a caller who is neither the entry's patient nor a staff member attempts to remove an entry
- **THEN** the system rejects the request and the entry remains active

### Requirement: Entry creation and removal are auditable
The system SHALL record, for every entry creation and removal, who performed the action (the patient themselves, or the named staff member) and when.

#### Scenario: Staff-created entry is attributed
- **WHEN** a staff member adds a patient to a waitlist
- **THEN** the audit record identifies that staff member and the time of creation

#### Scenario: Self-removal is attributed
- **WHEN** a patient removes their own entry
- **THEN** the audit record identifies the patient as the actor and the time of removal

### Requirement: Only registered, authorised actors may act
The system SHALL require authentication for all waitlist actions. Patients SHALL only read and change their own entries. Staff actions SHALL require the staff role.

#### Scenario: Unauthenticated request
- **WHEN** a request without valid authentication attempts any waitlist action
- **THEN** the system rejects it and changes nothing

# Delta for waitlist-membership

## MODIFIED Requirements

### Requirement: Patient joins the waitlist
The system SHALL allow a registered patient with no active entry and a recorded contact preference to join the specialist's waitlist, creating an entry with status `waiting` and showing the patient a confirmation. A patient with no recorded preference SHALL be asked to choose first and no entry SHALL be created until one is recorded (US-001, US-012, BR-014).

#### Scenario: Successful self-join
- **WHEN** a registered patient with no active entry and a recorded preference requests to join the waitlist
- **THEN** an entry with status `waiting` is created and the patient is shown confirmation of having joined

#### Scenario: Unregistered person
- **WHEN** a person who is not a registered patient requests to join
- **THEN** the system rejects the request and creates no entry

#### Scenario: No recorded preference
- **WHEN** a registered patient with no recorded preference requests to join
- **THEN** no entry is created and the patient is told a choice is required

#### Scenario: Patient who already has a preference is not asked again
- **WHEN** a patient with a recorded preference requests to join
- **THEN** the entry is created without asking them to choose

### Requirement: Staff adds a patient on their behalf
The system SHALL allow scheduling staff to add a patient without an active entry. The resulting entry SHALL behave identically to a self-joined entry. Adding a caller who has no recorded preference SHALL require staff to record the caller's stated choice, saved with the entry (US-006, BR-014, BR-016).

#### Scenario: Staff adds phone-in patient
- **WHEN** a staff member adds a patient with no active entry and a recorded preference
- **THEN** an entry with status `waiting` is created, visible to the patient and eligible for offers

#### Scenario: Staff adds a caller with no preference and records one
- **WHEN** a staff member adds a patient with no recorded preference and records `in_app`
- **THEN** the preference is saved, the entry is created and the staff view shows the preference

#### Scenario: Staff adds a caller with no preference and records none
- **WHEN** a staff member adds a patient with no recorded preference and records none
- **THEN** no entry is created and the staff member is told a choice is required

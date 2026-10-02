# waitlist-visibility Specification

## Purpose

Defines what patients and scheduling staff can see about the waitlist, including how position is determined, so neither party needs a phone call to learn the current state.

## Requirements

### Requirement: Waitlist position is FIFO by join date
The system SHALL order active entries by join time, earliest first, with no priority or urgency override. Position SHALL be the 1-based rank of an entry among active entries (`waiting` and `notified`). Closed entries SHALL be excluded.

#### Scenario: Earlier join ranks first
- **WHEN** patient A joins before patient B
- **THEN** A's position is lower than B's

#### Scenario: Staff-added entry uses creation time
- **WHEN** a staff member adds a patient
- **THEN** the entry's position is determined by the time staff created it

#### Scenario: Closing an entry moves others up
- **WHEN** an entry ahead of patient B closes as `booked` or `removed`
- **THEN** B's displayed position decreases by one, without any manual renumbering

#### Scenario: Notified entry keeps its position
- **WHEN** a patient's entry changes from `waiting` to `notified`, or back
- **THEN** its position is unchanged

### Requirement: Patient views own position
The system SHALL make a patient's current position available to their own view as a plain number, together with the date they joined, and SHALL NOT include the total number of patients waiting. The position SHALL reflect current state at the time of viewing (US-002, BR-006, BR-008). In this iteration the patient screen shows a status instead of the position (see `waitlist-screens`, "Patient sees their status, not a queue position"), because the product spec defers a patient-facing position.

#### Scenario: Patient's view carries the position
- **WHEN** a patient with an active entry requests their waitlist status
- **THEN** the response includes their position as a number and the date they joined, and no total count

#### Scenario: Position is current
- **WHEN** another entry is added or closed and the patient then views their status
- **THEN** the position in their view reflects that change

#### Scenario: No active entry
- **WHEN** a patient with no active entry views their status
- **THEN** the system shows that they are not on the waitlist and offers to join

### Requirement: Staff views the waitlist
The system SHALL let scheduling staff open the specialist's waitlist and see all active entries, each with the patient's identity, position and status, in position order. Closed entries SHALL NOT be listed.

#### Scenario: Staff opens waitlist
- **WHEN** a staff member opens the waitlist with active entries
- **THEN** all active entries are listed with patient identity, position and status

#### Scenario: Closed entries excluded
- **WHEN** an entry has closed as `booked` or `removed`
- **THEN** it is not in the staff list and not counted in positions

#### Scenario: Empty waitlist
- **WHEN** a staff member opens the waitlist with no active entries
- **THEN** the view states that no patients are waiting and offers no release action

#### Scenario: Outstanding offer is visible
- **WHEN** an offer is outstanding
- **THEN** the staff view shows which patient holds it

### Requirement: Waitlist data is access-controlled
The system SHALL treat waitlist data as personal data. A patient SHALL see only their own record. Staff SHALL see only the specialist they administer. Patient names and other personal details SHALL NOT appear in logs.

#### Scenario: Patient cannot view full list
- **WHEN** a patient requests the full waitlist
- **THEN** the system denies the request

#### Scenario: Patient cannot view another patient's entry
- **WHEN** a patient requests another patient's entry
- **THEN** the system denies the request

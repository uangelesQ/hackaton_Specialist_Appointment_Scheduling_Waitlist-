# Spec Delta

## Purpose

Defines what patients and scheduling staff can see about a specialist's waitlist, including how a patient's position is determined, so neither party needs a phone call to learn the current state.

## ADDED Requirements

### Requirement: Waitlist position is ordered by join time
The system SHALL order active entries for a specialist by join time, earliest first (FIFO). Position SHALL be the 1-based rank of an entry among active entries for that specialist. Inactive entries SHALL be excluded.

#### Scenario: Earlier join ranks first
- **WHEN** patient A joins specialist S's waitlist before patient B
- **THEN** A's position is lower than B's

#### Scenario: Staff-added entry uses creation time
- **WHEN** a staff member adds a patient to S's waitlist
- **THEN** the entry's position is determined by the time staff created it

#### Scenario: Removal moves others up
- **WHEN** an active entry ahead of patient B is removed
- **THEN** B's displayed position decreases by one

### Requirement: Patient views own position
The system SHALL show a patient the current position of each of their active entries, reflecting current state at the time of viewing.

#### Scenario: Patient views position
- **WHEN** a patient with an active entry for specialist S views their waitlist status
- **THEN** their current position for S is displayed

#### Scenario: Position is current
- **WHEN** another entry is added or removed and the patient then views their status
- **THEN** the displayed position reflects that change

#### Scenario: No active entry
- **WHEN** a patient with no active entry for specialist S views their status for S
- **THEN** the system shows that they are not on S's waitlist

### Requirement: Staff views a specialist's waitlist
The system SHALL let scheduling staff open a specialist's waitlist and see all active entries, each with the patient's identity and position, in position order.

#### Scenario: Staff opens waitlist
- **WHEN** a staff member opens the waitlist of a specialist with active entries
- **THEN** all active entries are listed with patient identity and position

#### Scenario: Empty waitlist
- **WHEN** a staff member opens the waitlist of a specialist with no active entries
- **THEN** the system shows an empty waitlist

### Requirement: Waitlist data is access-controlled
The system SHALL NOT reveal other patients' identities or positions to patients. Only staff SHALL see the full waitlist.

#### Scenario: Patient cannot view full list
- **WHEN** a patient requests the full waitlist of a specialist
- **THEN** the system denies the request

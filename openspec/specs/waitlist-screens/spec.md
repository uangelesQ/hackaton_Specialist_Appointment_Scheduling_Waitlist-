# waitlist-screens Specification

## Purpose

Defines what the patient and staff screens show and hide in this iteration, following prototype V3, so the screens match the agreed flow of registry, slot release and acceptance and nothing outside it is presented to users.

## Requirements

### Requirement: Patient sees their status, not a queue position
The patient screen SHALL show the patient's progress as a status (Joined, Waiting, Notified, Booked) with the date they joined, and SHALL NOT show the patient's queue position or the number of patients waiting. A waiting patient SHALL be told they will be notified in the app and need not call (PS-001 v2.4 Section 10, prototype V3).

#### Scenario: Waiting patient sees status without position
- **WHEN** a patient on the waitlist opens their screen
- **THEN** it shows they are waiting and the date they joined, and shows no position number and no count of other patients

#### Scenario: Status follows the entry
- **WHEN** the patient's entry becomes `notified` or `booked`
- **THEN** the screen shows the Notified or Booked status

#### Scenario: Booked patient is told how to change the booking
- **WHEN** a patient's entry is `booked`
- **THEN** the screen shows the slot date, time and specialist and says to contact the office to change it

### Requirement: Patient screen has no leave control
The patient screen SHALL NOT offer a control to leave the waitlist in this iteration (deferred US-007). The leave capability of the API is not removed.

#### Scenario: No leave action
- **WHEN** a patient views their screen in any status
- **THEN** no leave action is shown

### Requirement: Offer banner tells the patient what happens if unanswered
The banner shown to an `in_app` patient holding an offer SHALL announce the slot, show its date, time and specialist with accept and decline actions, and SHALL say that staff can pass an unanswered offer to the next patient (US-003, prototype V3).

#### Scenario: Banner content
- **WHEN** an `in_app` patient holds the outstanding offer
- **THEN** the screen shows the slot date, time and specialist, accept and decline actions, and a note that staff can pass an unanswered offer on

### Requirement: Staff table columns
The staff screen SHALL list active entries in position order with the position, patient name, contact preference and status, and SHALL flag an offer held by a telephone or not-recorded patient as requiring a call. It SHALL NOT show a Joined column or a control to remove an entry in this iteration (deferred US-005). Entries closed as `booked` SHALL NOT be listed (US-004, BR-008).

#### Scenario: Columns shown
- **WHEN** a staff member opens the waitlist with active entries
- **THEN** each row shows position, patient name, contact preference and status, and no join date or remove action

#### Scenario: Call flag on the holder
- **WHEN** the offer holder is a telephone or not-recorded patient
- **THEN** their status shows a "requires a call" flag

#### Scenario: Booked entries are not listed
- **WHEN** an entry has closed as `booked`
- **THEN** it is not listed and every entry behind it moves up one position

#### Scenario: Empty waitlist
- **WHEN** no patients are waiting
- **THEN** the screen says no patients are waiting and offers no release action

### Requirement: Staff controls follow the holder's contact preference
The staff screen SHALL, while an offer is outstanding, show whose response it is waiting on and, for a telephone or not-recorded holder, say a call is required and offer actions to record that the patient accepted or declined. For every holder it SHALL offer a pass-on action for an unreachable or unresponsive patient. When no offer is outstanding and an eligible patient exists, it SHALL offer a release action. When no patient is eligible for the slot, it SHALL say so and offer no release action (US-009, US-010, US-011).

#### Scenario: Telephone holder
- **WHEN** an offer is outstanding with a telephone or not-recorded patient
- **THEN** the screen says it is waiting on that patient and requires a call, and offers record-accepted, record-declined and pass-on actions

#### Scenario: In-app holder
- **WHEN** an offer is outstanding with an `in_app` patient
- **THEN** the screen says it is waiting on that patient and offers only the pass-on action

#### Scenario: Nobody eligible
- **WHEN** no offer is outstanding and no patient is eligible for the slot
- **THEN** the screen states that no eligible patient remains and offers no release action

### Requirement: Staff add outcomes are explained
When staff add a patient on their behalf, the staff screen SHALL confirm a successful add and show the patient's contact preference, SHALL say when the patient is already on the waitlist, and SHALL say when the person is not registered in hospital records and must register first, in which case nothing is created (US-006, prototype V3).

#### Scenario: Registered patient added
- **WHEN** staff add a registered patient who is not on the waitlist
- **THEN** the patient appears on the waitlist with their contact preference and staff see a confirmation

#### Scenario: Already on the waitlist
- **WHEN** staff add a patient who already has an active entry
- **THEN** no entry is created and staff are told the patient is already on the waitlist

#### Scenario: Not registered
- **WHEN** staff try to add a person who is not registered in hospital records
- **THEN** no entry and no patient record is created and staff are told the person must register before joining the waitlist

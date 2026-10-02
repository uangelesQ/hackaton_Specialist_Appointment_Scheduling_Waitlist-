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
When staff add a patient on their behalf, the staff screen SHALL confirm a successful add and show the patient's contact preference, SHALL say when the patient is already on the waitlist, and SHALL say when the person is not registered in hospital records and must register first, in which case nothing is created. When the chosen caller has no recorded preference, the screen SHALL require staff to choose in-app or telephone before the add can be completed, SHALL NOT offer that choice for a caller who already has a preference, and SHALL say when the add was refused because no choice was made (US-006, BR-014, BR-016, prototype V3).

#### Scenario: Registered patient added
- **WHEN** staff add a registered patient who is not on the waitlist
- **THEN** the patient appears on the waitlist with their contact preference and staff see a confirmation

#### Scenario: Already on the waitlist
- **WHEN** staff add a patient who already has an active entry
- **THEN** no entry is created and staff are told the patient is already on the waitlist

#### Scenario: Not registered
- **WHEN** staff try to add a person who is not registered in hospital records
- **THEN** no entry and no patient record is created and staff are told the person must register before joining the waitlist

#### Scenario: Caller with no preference
- **WHEN** staff choose a caller whose preference is not recorded
- **THEN** the screen asks staff to choose in-app or telephone, the add cannot be completed until one is chosen, and the confirmation shows the preference recorded

#### Scenario: Caller who already has a preference
- **WHEN** staff choose a caller who has a recorded preference
- **THEN** no preference choice is shown and the preference cannot be changed from the add panel

### Requirement: A patient sees and changes their contact preference
The patient screen SHALL show the patient's current contact preference ("In-app", "Telephone" or "Not chosen yet") and a way to change it, available whenever the patient is signed in, including with a booked entry or no entry. After a save it SHALL show the new preference. It SHALL NOT show any history of earlier values (US-013, BR-015, BR-018, PS Section 10).

#### Scenario: Preference shown
- **WHEN** a signed-in patient opens their screen
- **THEN** their current contact preference, or that none is chosen yet, is shown with a control to change it

#### Scenario: Change confirmed
- **WHEN** a patient changes their preference and confirms
- **THEN** the screen shows the new preference and the entry status shown is unchanged

#### Scenario: Change fails
- **WHEN** the change cannot be saved
- **THEN** the patient is told it was not saved and the previous preference is still shown

#### Scenario: No history shown
- **WHEN** a patient has changed their preference more than once
- **THEN** the screen shows only the current preference

### Requirement: A patient with no preference chooses before joining
When a patient with no recorded preference asks to join, the patient screen SHALL ask them to choose in-app or telephone before the join continues, describing each option (in-app: offers appear in the application; telephone: staff will call them). It SHALL show confirmation of both the preference saved and that they are on the waitlist. If they leave without choosing, nothing SHALL be saved and no entry created. If joining fails after the preference was saved, the screen SHALL say they have not joined, keep the saved preference, and not ask them to choose again on retry (US-012, BR-014, BR-015).

#### Scenario: Choice asked before joining
- **WHEN** a patient with no recorded preference chooses to join
- **THEN** the screen asks them to choose in-app or telephone, describes each option, and shows no entry yet

#### Scenario: Chosen and joined
- **WHEN** the patient chooses an option and confirms
- **THEN** the preference is saved, an entry is created, and the screen confirms both

#### Scenario: Left without choosing
- **WHEN** the patient leaves the choice without choosing
- **THEN** no preference is saved and no entry is created

#### Scenario: Join fails after the choice was saved
- **WHEN** the preference is saved but the join does not create an entry
- **THEN** the screen says they have not joined and a retry does not ask them to choose again

#### Scenario: Patient who already has a preference
- **WHEN** a patient with a recorded preference chooses to join
- **THEN** they are not asked to choose

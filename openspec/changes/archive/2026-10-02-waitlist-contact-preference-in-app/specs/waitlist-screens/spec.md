# Delta for waitlist-screens

## MODIFIED Requirements

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

## ADDED Requirements

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

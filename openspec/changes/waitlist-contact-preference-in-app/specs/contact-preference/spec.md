# Delta for contact-preference

## RENAMED Requirements

- FROM: `### Requirement: Patient has a read-only contact preference`
- TO: `### Requirement: Patient has a contact preference`

## MODIFIED Requirements

### Requirement: Patient has a contact preference
The system SHALL hold, for each patient, a contact preference of `in_app`, `telephone`, or not recorded. The preference MAY be captured by hospital registration outside this feature, and the system SHALL read it. Within this feature the preference MAY be written only as the other requirements of this capability allow. Where both hospital registration and this feature write it, the most recent write applies (BR-020). A patient with no recorded preference who already holds an active entry SHALL be treated as `telephone` for every rule in this feature until they choose one (BR-001, BR-019).

#### Scenario: Preference is read from the patient record
- **WHEN** an offer is made to a patient
- **THEN** the channel is decided from the preference held on that patient's record at that moment

#### Scenario: Not recorded is treated as telephone
- **WHEN** an offer is made to a patient whose preference is not recorded and who was already waiting
- **THEN** the offer is handled exactly as for a `telephone` patient, and staff see the preference as "not recorded"

#### Scenario: Most recent write applies
- **WHEN** the preference on a patient record is written twice by different writers
- **THEN** the value of the later write is the one held and used

#### Scenario: Preference cannot be changed here
- **WHEN** any caller other than the patient it belongs to, or staff adding a patient who has none, attempts to set a patient's preference
- **THEN** the request is rejected and the preference is unchanged

### Requirement: Staff see contact preference and which offers need a call
The system SHALL show staff each active entry's contact preference, and for the entry holding the outstanding offer SHALL show whether that patient requires a telephone call (preference `telephone` or not recorded). The staff view SHALL also show how long the outstanding offer has been outstanding (US-003, US-004, US-010).

#### Scenario: Preference shown for each entry
- **WHEN** a staff member opens the waitlist
- **THEN** each active entry shows the patient's contact preference as "In-app", "Telephone" or "Not recorded"

#### Scenario: Offer to a telephone patient is flagged
- **WHEN** an offer is outstanding with a patient whose preference is `telephone`
- **THEN** the staff view marks the offer as requiring a call

#### Scenario: Offer to a not-recorded patient is flagged
- **WHEN** an offer is outstanding with a patient whose preference is not recorded
- **THEN** the staff view marks the offer as requiring a call

#### Scenario: Offer to an in-app patient is not flagged
- **WHEN** an offer is outstanding with a patient whose preference is `in_app`
- **THEN** the staff view does not mark the offer as requiring a call

#### Scenario: Time outstanding is shown
- **WHEN** an offer is outstanding and a staff member views the waitlist
- **THEN** the view shows how long the offer has been outstanding

#### Scenario: Flag follows a change of preference
- **WHEN** the holder of the outstanding offer changes their preference and the staff view is next read
- **THEN** the call flag matches the new preference

### Requirement: In-app banner only for in-app patients
The system SHALL show the in-app offer banner, with accept and decline actions, only to a patient whose preference is `in_app` and who holds the outstanding offer. A patient whose preference is `telephone` or not recorded SHALL NOT be shown the banner or any accept or decline action, and SHALL see a notice that staff will contact them (US-003 AC1 and AC2, US-008, BR-001, BR-017).

#### Scenario: In-app patient sees the banner
- **WHEN** a patient with preference `in_app` holds the outstanding offer and opens their waitlist view
- **THEN** a banner shows the slot date, time and specialist with accept and decline actions

#### Scenario: Telephone patient sees no banner
- **WHEN** a patient with preference `telephone` holds the outstanding offer and opens their waitlist view
- **THEN** no banner and no accept or decline action are shown, and a notice says staff will contact them

#### Scenario: Not-recorded patient sees no banner
- **WHEN** a patient with no recorded preference holds the outstanding offer and opens their waitlist view
- **THEN** no banner and no accept or decline action are shown, and a notice says staff will contact them

#### Scenario: Position is unaffected by preference
- **WHEN** a patient of any preference is offered a slot
- **THEN** their entry remains active at its existing position

#### Scenario: Banner follows a change of preference
- **WHEN** a patient holding the outstanding offer changes their preference and their view is next read
- **THEN** the banner is shown only if the new preference is `in_app`

## ADDED Requirements

### Requirement: A patient sets or changes their own contact preference
The system SHALL let a signed-in patient set or change their own contact preference to `in_app` or `telephone` at any time, including when their entry is booked or they have no entry. Saving it SHALL NOT create, close or move any entry, and SHALL NOT change the position or status of an existing entry (US-013, BR-015, BR-018). A patient SHALL NOT be able to set or change another patient's preference (BR-011, BR-015).

#### Scenario: Patient sets a first preference while waiting
- **WHEN** a patient who is waiting with no recorded preference chooses `in_app` and confirms
- **THEN** the preference is saved, the entry's status and position are unchanged, and later offers reach them in the app

#### Scenario: Patient changes the preference
- **WHEN** a patient with a recorded preference changes it to the other option and confirms
- **THEN** the new preference is saved and returned to them

#### Scenario: Patient with a booked entry or no entry
- **WHEN** a patient whose entry is booked, or who has no entry, sets their preference
- **THEN** it is saved, no entry is created or changed, and it applies the next time they join

#### Scenario: Patient cannot change another patient's preference
- **WHEN** a patient attempts to set a preference for a different patient
- **THEN** the request is rejected and nothing changes

#### Scenario: An unrecognised value is refused
- **WHEN** a patient submits a preference other than `in_app` or `telephone`
- **THEN** the request is rejected and the preference is unchanged

### Requirement: A change of preference takes effect on a held offer at once
The system SHALL apply a change of contact preference to an outstanding offer the patient holds, with no restart, withdrawal or reassignment of the offer (BR-017, BR-007). The channel SHALL be decided from the preference at the moment of each view and each action, and the change SHALL be visible within the time set for a newly released offer. A response already recorded SHALL NOT be affected by a later change (BR-018).

#### Scenario: In-app to telephone while holding an offer
- **WHEN** a patient holding the outstanding offer changes from `in_app` to `telephone`
- **THEN** the in-app banner and its accept and decline actions are no longer shown to them, the offer stays outstanding, and staff see it flagged as requiring a call

#### Scenario: Telephone to in-app while holding an offer
- **WHEN** a patient holding the outstanding offer changes from `telephone`, or from not recorded, to `in_app`
- **THEN** the in-app banner with accept and decline is shown to them, the offer stays outstanding, the staff call flag is cleared, and staff can no longer record a response for them

#### Scenario: Offer is not restarted
- **WHEN** a patient changes their preference while holding an offer
- **THEN** the offer keeps its slot, its holder and its original creation time

#### Scenario: Earlier response is unaffected
- **WHEN** a patient whose offer was already accepted or declined changes their preference
- **THEN** the recorded response, the entry status and the slot are unchanged

### Requirement: A patient with no recorded preference must choose before joining
The system SHALL NOT create an entry for a patient who has no recorded preference until one has been recorded, whether the patient joins themselves or staff add them (US-012, US-006, BR-014).

#### Scenario: Self-join without a preference
- **WHEN** a patient with no recorded preference requests to join
- **THEN** no entry is created and the response says a choice is required

#### Scenario: Join after choosing
- **WHEN** a patient with no recorded preference saves a preference and then requests to join
- **THEN** an entry is created as for any patient and they are not asked to choose again

#### Scenario: Preference kept when joining fails
- **WHEN** a patient saves a preference and the join that follows does not create an entry
- **THEN** the saved preference is kept and a later join does not ask them to choose again

### Requirement: Staff record a preference only when adding a caller who has none
The system SHALL let staff supply a contact preference when adding a caller whose preference is not recorded. The preference and the new entry SHALL be saved together or not at all. Staff SHALL NOT be able to change a preference that is already recorded (US-006, BR-014, BR-016).

#### Scenario: Adding a caller who has none
- **WHEN** a staff member adds a caller with no recorded preference and supplies `telephone`
- **THEN** the preference is recorded, the entry is created, and the staff view shows the preference

#### Scenario: No preference supplied
- **WHEN** a staff member adds a caller with no recorded preference and supplies none
- **THEN** no entry is created, the preference stays not recorded, and the response says a choice is required

#### Scenario: Preference already recorded
- **WHEN** a staff member adds a caller who already has a recorded preference and supplies a preference
- **THEN** the request is rejected, nothing is created and the recorded preference is unchanged

#### Scenario: Entry cannot be created
- **WHEN** a staff member supplies a preference for a caller who already has an active entry
- **THEN** no preference is recorded and the existing entry is returned

### Requirement: Every preference change is auditable
The system SHALL record each save of a contact preference with the actor (the patient, or the staff member who recorded it while adding), the time, the previous value (or none) and the new value, in the same transaction as the save. The record SHALL NOT be shown on any screen in this iteration (US-012, US-013, BR-015, BR-016).

#### Scenario: Patient change is audited
- **WHEN** a patient changes their preference from `in_app` to `telephone`
- **THEN** an audit record names that patient as the actor, the time, the previous value `in_app` and the new value `telephone`

#### Scenario: First choice is audited
- **WHEN** a patient with no recorded preference chooses one
- **THEN** the audit record shows no previous value and the chosen value

#### Scenario: Staff-recorded choice is audited
- **WHEN** a staff member records a preference while adding a caller
- **THEN** the audit record names that staff member as the actor and shows no previous value and the recorded value

#### Scenario: Nothing is shown to users
- **WHEN** a patient or staff member views any screen
- **THEN** no history of preference changes is shown

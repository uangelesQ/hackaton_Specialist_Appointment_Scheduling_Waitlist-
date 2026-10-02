# Spec Delta

## Purpose

Defines the contact preference held for each patient, how a missing preference is treated, and how the preference decides what staff and patients see when a slot is offered, so patients are reached through the channel they asked for.

## ADDED Requirements

### Requirement: Patient has a read-only contact preference
The system SHALL hold, for each patient, a contact preference of `in_app`, `telephone`, or not recorded. The preference is captured by hospital registration outside this feature; the system SHALL read it and SHALL NOT let any patient or staff user create or change it. A patient with no recorded preference SHALL be treated as `telephone` for every rule in this feature (BR-001).

#### Scenario: Preference is read from the patient record
- **WHEN** an offer is made to a patient
- **THEN** the channel is decided from the preference held on that patient's record

#### Scenario: Not recorded is treated as telephone
- **WHEN** an offer is made to a patient whose preference is not recorded
- **THEN** the offer is handled exactly as for a `telephone` patient, and staff see the preference as "not recorded"

#### Scenario: Preference cannot be changed here
- **WHEN** a patient or staff member attempts to set a patient's contact preference through this feature
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

### Requirement: In-app banner only for in-app patients
The system SHALL show the in-app offer banner, with accept and decline actions, only to a patient whose preference is `in_app` and who holds the outstanding offer. A patient whose preference is `telephone` or not recorded SHALL NOT be shown the banner or any accept or decline action, and SHALL see a notice that staff will contact them (US-003 AC1 and AC2, US-008, BR-001).

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

### Requirement: An unseen or stale in-app offer is handled
The system SHALL keep an offer outstanding when an `in_app` patient has not seen it, for example because they are offline, and staff SHALL be able to pass it on (US-003, US-010). When an `in_app` patient opens their view after the offer closed, the system SHALL tell them it is no longer available and SHALL NOT apply any action to it (BR-012).

#### Scenario: Offline in-app patient
- **WHEN** an `in_app` patient holds an outstanding offer and does not open the app
- **THEN** the offer stays outstanding, staff can see how long it has been outstanding, and staff may pass it on

#### Scenario: Offer closed before the patient looks
- **WHEN** an `in_app` patient responds to an offer that staff have already passed on
- **THEN** no booking or change is made and the patient is told the offer is no longer available

### Requirement: An offer is visible promptly
The system SHALL make an offer visible in the holder's view, and flagged in the staff view, within 60 seconds of release (PS-001 v2.4 reliability target, still *Proposed* by the Product Owner). The offer view SHALL load within 5 seconds on a throttled 3G connection of about 1.6 Mbps, and a first-time `in_app` user SHALL be able to accept or decline in three steps or fewer from opening the offer (thresholds accepted by the Product Owner).

#### Scenario: Offer visible within 60 seconds
- **WHEN** staff release a slot
- **THEN** the offer appears in the holder's view or staff call flag within 60 seconds without any manual refresh

#### Scenario: Offer view load time
- **WHEN** an `in_app` patient opens their offer view on a throttled 3G profile
- **THEN** the view is usable within 5 seconds

#### Scenario: Steps to respond
- **WHEN** a first-time `in_app` patient responds to an offer
- **THEN** accepting takes no more than three steps from opening the offer and declining takes no more than two

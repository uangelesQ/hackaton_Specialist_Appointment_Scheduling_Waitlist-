# demo-registration Specification

## Purpose
A demonstration-only registration step on the sign-in screen (PS-001 v2.5 Appendix A). It stands in for hospital registration so the whole journey, including choosing a contact preference, can be shown without a hospital registration system. It is not a Product requirement and does not exist when demo login is off.

## Requirements

### Requirement: A person can register in the demonstration environment
When demo login is enabled, the sign-in screen SHALL let a person enter a name, choose in-app or telephone, and register. Registering SHALL create a patient with that name and contact preference and sign them in as that patient. No telephone number is held and no call is placed. The recorded preference SHALL be audited as a first choice by that patient.

#### Scenario: Successful registration
- **WHEN** a person enters a name, chooses a preference and registers
- **THEN** a patient record is created with that name and preference, and they are signed in as that patient

#### Scenario: Registered patient is not asked to choose again
- **WHEN** a patient registered this way requests to join the waitlist
- **THEN** they are not asked to choose a preference

### Requirement: Registration needs a name and a preference
The system SHALL reject a registration with no name or no preference, create no patient, and tell the person what is missing. A name of only whitespace SHALL count as no name.

#### Scenario: Missing name
- **WHEN** a person registers without entering a name
- **THEN** no patient is created and they are told a name is required

#### Scenario: Missing preference
- **WHEN** a person registers without choosing a preference
- **THEN** no patient is created and they are told a choice is required

### Requirement: A name already in use is refused
The system SHALL refuse a registration whose name is already used by a registered patient, comparing without regard to letter case or surrounding spaces, create no patient, and tell the person the name is already registered and that they can sign in as that patient instead. A name is the uniqueness key in the demonstration only; this is not a rule for production identity.

#### Scenario: Duplicate name
- **WHEN** a person registers with the name of an existing patient
- **THEN** no patient is created and they are told the name is already registered and can sign in as that patient

#### Scenario: Different letter case
- **WHEN** a person registers with an existing patient's name in different letter case
- **THEN** it is refused as a duplicate

### Requirement: Registration is unavailable outside the demonstration environment
The registration step and its endpoint SHALL exist only when demo login is enabled by configuration, and demo login SHALL be off by default.

#### Scenario: Demo login off
- **WHEN** demo login is not enabled and a registration is attempted
- **THEN** the endpoint does not exist, no patient is created, and the sign-in screen offers no registration form

#### Scenario: Demo login on
- **WHEN** demo login is enabled
- **THEN** the sign-in screen shows the registration form

# Spec Delta

## Purpose

Defines how patients on a specialist's waitlist are told when a slot opens, so they learn of availability without a staff phone call. Claiming the slot is out of scope.

## ADDED Requirements

### Requirement: Slot becomes available on advance cancellation
The system SHALL raise a slot-availability event for a specialist when a booked appointment for that specialist is cancelled in advance of the appointment time. No other circumstance SHALL raise the event.

#### Scenario: Advance cancellation raises event
- **WHEN** a booked appointment for specialist S is cancelled before its appointment time
- **THEN** a slot-availability event is raised for S and that slot

#### Scenario: Cancellation after appointment time
- **WHEN** a cancellation is recorded for an appointment whose time has already passed
- **THEN** no slot-availability event is raised

### Requirement: Active entries are notified of an available slot
The system SHALL, when a slot-availability event is raised for a specialist, deliver an in-app notification to every patient with an active entry for that specialist. The notification SHALL identify the specialist and the slot time.

#### Scenario: All active entries notified
- **WHEN** a slot-availability event is raised for specialist S with three active entries
- **THEN** each of the three patients receives an in-app notification for S

#### Scenario: Inactive entries not notified
- **WHEN** a slot-availability event is raised for S and a patient's entry for S is inactive
- **THEN** that patient receives no notification

#### Scenario: No active entries
- **WHEN** a slot-availability event is raised for a specialist with no active entries
- **THEN** no notifications are sent and no error occurs

#### Scenario: Patient reads notification
- **WHEN** a notified patient opens the portal
- **THEN** the notification is listed and can be marked as read

### Requirement: Notification does not change entry status
The system SHALL keep an entry active after a notification is sent. An entry SHALL become inactive only when the patient or staff removes it.

#### Scenario: Entry stays active and keeps position
- **WHEN** a patient is notified of a slot for specialist S
- **THEN** their entry for S remains active and their position is unchanged

### Requirement: Notification delivery is reliable and auditable
The system SHALL persist each notification before reporting the event as processed, SHALL NOT create duplicate notifications for the same patient and event on retry, and SHALL record delivery state per notification.

#### Scenario: Retried event does not duplicate
- **WHEN** the same slot-availability event is processed twice
- **THEN** each patient has exactly one notification for that event

#### Scenario: Failure for one patient
- **WHEN** creating one patient's notification fails during an event
- **THEN** the failure is recorded and the other patients' notifications are still delivered

### Requirement: Channels are pluggable
The system SHALL deliver notifications through a channel abstraction whose only MVP implementation is in-app, so additional channels can be added without changing waitlist behavior.

#### Scenario: In-app is the only channel
- **WHEN** a notification is sent in the MVP
- **THEN** it is delivered through the in-app channel and no email or SMS is sent

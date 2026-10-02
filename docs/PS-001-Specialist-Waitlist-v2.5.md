# Product Specification

| Field | Value |
|---|---|
| Product Specification ID | PS-001 |
| Version | 2.5 |
| Status | Draft |
| Product Owner | j.abarca@elsevier.com |
| Date | 2026-10-01 |
| Last Updated | 2026-10-02 |

> **Version note.** v2.0 realigns this Product Specification to the approved Use Case
> (public hospital, eight specialties). Versions 0.1–0.4 were authored against a
> narrower source and described a single private clinic. The Functional Behaviour,
> Business Rules and recorded Product decisions from v0.4 are carried forward; the
> business context, scope and success measures are restated against the approved
> Use Case. Decision history from v0.1–v0.4 is preserved in Section 14.
>
> **v2.1** resolves the findings of the Product Quality Review of v2.0 and records
> the Product Owner's stated assumptions for the digitally reachable cohort. Every
> change is traced in Section 19. Changes marked *Proposed — PO to confirm* are
> drafted defaults, not agreed decisions.
>
> **v2.2** narrows the process to the flow agreed with the team: **registry →
> appointment management / slot release → acceptance of the new appointment.**
> Patient-facing position, patient leaving and staff removal are deferred. The
> changes and their effect on the open review findings are in Section 20.
>
> **v2.3** fixes the open consistency items: one definition of "next in line" and of
> an outstanding offer, aligned across stories, rules and the status model, plus
> cross-section and cross-reference fixes. See Section 21.
>
> **v2.4** applies three Product Owner decisions: a booked slot is marked taken in
> the mocked calendar, a patient sees only their own record, and staff cannot add an
> unregistered caller. See Section 22.
>
> **v2.5** makes the contact preference settable in the application. A patient chooses
> it when they join and can change it at any time; staff record it only when adding a
> caller who has none; a patient with no recorded preference must choose before
> joining. A demonstration registration step is added to the sign-in screen. This
> **reverses** a position confirmed with hospital operations in v2.0 – v2.4 (that this
> Feature reads the preference and does not capture or amend it), so it is *Proposed*
> until hospital operations confirm it. See Section 23.

---

## 1. Delivery Context

**Parent Use Case (Epic)**

| Field | Value |
|---|---|
| Use Case | Specialist Appointment Scheduling Modernization |
| Business Objective | Improve access to specialist appointments across the hospital's eight specialties while balancing physician availability, patient demand and operational constraints — and reduce call-centre volume. |

**Current Feature**

| Field | Value |
|---|---|
| Feature | Specialist Waitlist Visibility, Notification & Slot Offer |
| Naming note | The Feature name is carried from the Use Case. Patient-facing visibility (US-002) is deferred, so visibility in this iteration is the staff view only. |
| Description | Patients join a specialist waitlist, are offered an open slot when one is released, and accept or decline it. Staff manage the same waitlist digitally, release open slots, and handle patients who cannot be reached digitally. Patients choose how they want to be contacted and can change that choice. |

**Current Product Iteration:** MVP

**MVP Statement**

The smallest independently valuable capability is a digital waitlist for **one
high-demand specialty**, where patients are registered on the waitlist,
staff release an open slot to the next patient in line, and that patient accepts
or declines the offer. Patients whose recorded contact preference is telephone are
reached by staff, and staff record their response on their behalf, so the waitlist
remains a single accurate record for every patient regardless of digital access.
Every patient who joins the waitlist has a recorded contact preference: a patient chooses
it when they join (or staff record it when adding a caller who has none), and a patient can
set or change it at any time. A patient who was already waiting before a choice was
required keeps their place and is treated as telephone until they choose (BR-019).
Changing a preference after joining (US-013) is a Should: if it is not delivered in this
iteration, patients choose only when they join, and a patient already waiting with none
stays treated as telephone until a later iteration (Section 10).

**Agreed flow:** Registry (registering a new appointment request, which places the
patient on the waitlist) → Appointment management / slot release → Acceptance of the
new appointment. Anything outside this flow is deferred (Section 10).

This is deliberately one specialty, not eight. It proves the waitlist mechanic
end-to-end and can be extended specialty by specialty without re-specification.

**Known Future Product Specifications**

| Feature | Status |
|---|---|
| Slot Claim & Booking Confirmation | Planned — automated cascade and timer handling of unclaimed offers, self-service slot browsing, staff-confirmed booking as an alternative flow |
| Physician Schedule Management | Planned — physicians managing their own availability, blocking time for vacation, conferences and on-call |
| Appointment Prerequisites | Planned — appointments requiring laboratory results or other prerequisites before confirmation |
| Multi-Specialty Waitlist | Planned — extending the waitlist across the remaining specialties |
| Waitlist Self-Service & Removal | Planned — patient-facing position, patient leaving the waitlist, staff removal of a patient |

Further Product Specifications are expected but have not yet been defined.

---

## 2. Overview

**Business Problem**

Patients can only schedule specialist appointments by telephone or in person.
Cardiology and oncology waiting lists routinely exceed six weeks. Patients have no
way to see where they stand and no way to be told when capacity opens, so they call
the hospital to find out — generating call-centre volume that hospital leadership
wants to reduce by 40%.

**Product Summary**

A digital waitlist for one high-demand specialty. Patients join the waitlist and are
offered an open slot when staff release one. Patients reachable digitally
are notified in the application; patients whose contact preference is telephone are
called by staff, who record the response on their behalf. Either way the waitlist
holds one accurate record. A patient chooses how they want to be contacted when they
join and can change that choice at any time.

**Expected Business Outcome**

Patients receive slot offers without initiating a call. Staff stop maintaining the waitlist manually and stop calling patients purely
to communicate status.

**Business Value**

- **Access:** patients are told when capacity opens, without calling to ask.
- **Operational efficiency:** calls asking whether capacity has opened are removed for digitally
  reachable patients; offer calls to telephone-preference patients become
  system-prompted rather than manually tracked.
- **Operational accuracy:** one shared record replaces informal manual tracking,
  reducing lost patients and double-offers.

---

## 3. Business Context

**Current Situation**

The hospital operates eight medical specialties. Appointment scheduling is
telephone or in person only. Waitlists are maintained manually by scheduling staff,
and position or availability updates reach patients only through individual calls.
Physicians manage their own schedules and follow differing availability rules.
Some appointments cannot be confirmed until laboratory results or other
prerequisites are available. The hospital serves a significant low-income
population, and not all patients have access to a smartphone or reliable internet.

**Desired Future State**

For the pilot specialty, slot offers reach patients without them
initiating contact — in-app where possible, by a
staff call where that is the patient's recorded preference. Staff work from one
shared digital waitlist rather than personal notes.

**Business Process Context**

Sits at the front of the specialist appointment booking process. This Feature covers
waitlist registry, slot release, slot offer and the patient's response to that offer.
It does not cover physician schedule management, appointment prerequisites, or the
automated handling of unclaimed offers.

**Primary Business Actors**

| Actor | Description |
|---|---|
| Patient (digitally reachable) | Registered patient whose recorded contact preference is in-app and who has an internet connection of at least 3G speed (about 1.6 Mbps down) |
| Patient (telephone preference) | Registered patient whose recorded contact preference is telephone, or who has no recorded preference and was already waiting before a choice was required (BR-001, BR-019); typically without smartphone or reliable internet |
| Scheduling Staff | Hospital scheduling and call-centre staff managing the specialty waitlist |

**Primary Stakeholders**

Hospital leadership (sponsor of the call-volume objective), scheduling and
call-centre operations, specialty clinical leads.

---

## 4. Business Value

**Business Objectives Supported**

- Reduce call-centre volume, the objective stated by hospital leadership.
- Improve access to specialist appointments for a long-waiting patient population.
- Replace manual waitlist tracking with a shared operational record.

**Expected Benefits**

- Fewer inbound calls asking whether capacity has opened, for digitally reachable patients.
- Outbound offer calls become prompted and tracked rather than manually coordinated.
- Reduced risk of lost patients, double offers and inaccurate position information.
- Fewer offers lost to a stale or wrong contact channel, because patients keep their own preference current.

**Success Measures:** See Section 11.

---

## 5. Scope

**In Scope**

- Patient joining the pilot specialty's waitlist digitally.
- Patient being notified when a slot is released to them.
- Patient accepting or declining the slot offered to them.
- Staff viewing the digital waitlist, including each patient's contact preference.
- Staff adding a patient to the waitlist on their behalf.
- Staff releasing an open slot to the waitlist.
- Staff passing an unanswered offer to the next patient.
- Staff recording a telephone-preference patient's accept or decline on their behalf.
- A patient choosing their contact preference when they join, and changing it at any time (US-012, US-013).
- Staff recording a patient's stated contact preference when adding a caller who has none (US-006).

**Out of Scope**

- The remaining seven specialties — this iteration covers one pilot specialty.
- Physician schedule management, including blocking availability for vacation,
  conferences or on-call, and differing per-physician availability rules.
- Appointment prerequisites such as laboratory results gating confirmation.
- Automated timer-based expiry and automatic cascade of an unclaimed offer.
- Self-service browsing or booking of open slots independent of queue position.
- Automated out-of-app messaging (SMS, email, automated voice).
- The cancellation transaction itself — see Assumptions.
- Patient-facing display of waitlist position (US-002).
- A patient leaving the waitlist (US-007) and staff removing a patient (US-005).
- The telephone call to a telephone-preference patient. It is an ordinary appointment call made outside the system; this Feature flags the offer and records the outcome (US-011).
- Hospital patient registration itself. The demonstration registration step (Appendix A) is a stand-in for it, not a replacement and not part of the Product scope.
- Capturing the contact details used for the telephone call (Section 14).
- Staff changing a contact preference that is already recorded (Section 10).
- Contact options other than in-app and telephone.

**Assumptions**

- Patients using this Feature are already registered in the hospital's patient
  records. Registration is outside this Feature. The demonstration registration step
  (Appendix A) is the only exception and is not a Product requirement.
- **Digitally reachable cohort.** Patients served by the in-app path (US-001, US-003,
  US-008) are registered, hold a recorded in-app contact preference, and have
  an internet connection of at least 3G speed (about 1.6 Mbps down). These assumptions
  apply to that cohort only; the specification does not assume them for every
  patient. A patient who does not meet them is served by the telephone path (BR-001,
  US-011). A patient with an in-app preference who is offline when an offer is made
  is handled as an unanswered offer (US-003, US-010).
- **Booking is completed** has the meaning given in BR-013.
- **Contact preference** is held on the patient record as in-app or telephone, or is
  not yet recorded. Staff normally capture it during a patient's first registration —
  the patient is asked how they wish to be reached about appointment booking.
  *(Confirmed with hospital operations.)*
- **Contact preference in this Feature (new in v2.5).** This Feature also lets the
  patient choose their preference when none is recorded and change it at any time
  (US-012, US-013), and lets staff record a caller's stated choice when adding a
  patient who has none (US-006). *(Product Owner decision in v2.5. Hospital
  operations confirmed the earlier position that this Feature reads the preference and
  does not capture or amend it; they have not yet confirmed this change — Section 14.)*
- **Which write applies.** The patient record holds one contact preference. Where
  hospital registration and this Feature both write it, the most recent write applies
  (BR-020). *(Interim rule — Product Owner decision in v2.5.)*
- **Telephone numbers.** Staff obtain the number to call a telephone-preference patient
  from hospital records, outside this Feature, which neither captures nor shows it.
  *(Interim assumption — to be confirmed with hospital operations, Section 14.)*
- **Demonstration registration.** Hospital registration remains outside this Feature.
  For demonstration only, the sign-in screen offers a registration step that creates a
  patient who chooses in-app or telephone and is signed in (Appendix A). It is not a
  production requirement.
- **Slot:** a bookable appointment time in a specialist's calendar. Slots free up when
  a patient cancels a booked appointment ahead of time. That cancellation happens
  outside this Feature and is neither handled nor recorded here. What this Feature
  acts on is a staff member releasing an already-free slot to the waitlist (US-009).
  No slot reaches a patient without that staff action.
- The pilot specialty is one of the two highest-demand specialties (cardiology or
  oncology); the specific choice is an Open Decision.

**Glossary**

| Term | Meaning |
|---|---|
| Slot | A bookable appointment time in a specialist's calendar, identified by specialist, date and time |
| Outstanding offer | An offer to a patient whose entry is `notified` and that has not been accepted, declined or passed on |
| Eligible patient (for a slot) | A patient whose entry is `waiting` and who has not declined, or been passed over for, that slot |
| Next in line (for a slot) | The eligible patient with the lowest position. This is the only patient a released slot is offered to |
| Contact preference | How a patient asked to be reached about slot offers: in-app or telephone. A patient who has never chosen has none recorded |
| Recorded (preference) | A contact preference is recorded when it is held on the patient record as in-app or telephone |
| Demonstration environment | A setting used to show the whole journey, in which the registration step (Appendix A) is available. The team switches it on or off by configuration, and it is off by default. It is not a production setting |
| Not recorded | A patient with no contact preference on their record. Since v2.5 no new entry can be created for such a patient (BR-014); an entry that was already active is treated as telephone until the patient chooses (BR-001, BR-019) |

**Dependencies**

| Dependency | Description | Status |
|---|---|---|
| Patient registration records | Patients must exist in hospital records before joining a waitlist | Assumed available |
| Contact preference on the patient record | US-003, US-009 and US-011 depend on knowing how each patient wishes to be reached. Staff capture it at first registration (**confirmed** with hospital operations). The patient can also set and change it in this Feature, and staff record it when adding a caller who has none (a Product Owner decision, **not yet confirmed** with hospital operations, Section 14) | Partly confirmed |
| Patient record accepts preference changes | The patient record this Feature reads must be the one it writes the preference to, and the hospital must accept changes made here. The most recent write applies (BR-020). Whether changes are passed back to hospital registration is not decided (Section 14) | Open |
| Telephone numbers in hospital records | Staff obtain the number to call a telephone-preference patient from hospital records, outside this Feature (Section 5) | Assumed available — to be confirmed |
| Specialist calendar | Staff must be able to see that a slot has freed up in order to release it. This Feature marks a booked slot as taken (BR-013); the calendar is mocked this iteration. Staff identify a slot by giving its date and time for the pilot specialist; no list of open slots is held. A slot is identified by the specialist, date and time (glossary) | Assumed available |

**Constraints**

- Delivery window of one week, team of three to four people, approximately ten hours
  per person. This constrains the iteration to one specialty and a single
  end-to-end slice.
- Security and compliance rigour is to remain proportionate to an internal,
  time-boxed exercise using mocked calendar and status data.

---

## 6. Supporting Product Artefacts

**UX Artefacts**

| Artefact | Reference | Owner | Covers |
|---|---|---|---|
| Patient & Staff journey maps | `waitlist-journey-mapsV3.html` | UX | Manual process vs. digital waitlist, five stages per actor |
| Interactive prototype (current) | `waitlist-prototypeV3.html` | UX | Patient and staff views: join, offer, accept/decline, staff release, pass-on, contact preference and the telephone path |
| Interactive prototype (next) | V4 — not yet available | UX | Expected to add the demonstration registration step, choosing and changing a contact preference, and the staff choice when adding a caller who has none |

Wireframes and visual designs are to be delivered later by UX. This Product
Specification does not depend on them.

**UX Alignment Notes**

The earlier notes about prototype V2 (automatic cascade on decline, position display,
no contact preference) are resolved in V3 and are retired. Where prototype V3 and this
Product Specification differ, the Specification is authoritative:

- **Booked entries are listed.** V3's staff table keeps a booked patient listed as
  Booked; US-004 excludes closed entries.
- **Immediate notification on an empty waitlist.** The V3 journey map says a patient who
  joins an empty waitlist is notified at once; Section 10 defers this.
- **Prototype-only elements.** A fixed slot time, a "Reset demo" control and a "(you)"
  label are demonstration devices and are not requirements.
- **Not yet represented in V3.** The demonstration registration step, choosing or
  changing a contact preference, the join gate, and the staff choice when adding a
  caller who has none (US-012, US-013, US-006, Appendix A). A V4 prototype is expected.

---

## 7. Functional Behaviour

**Functional Behaviour Summary**

Patients join the pilot specialty's waitlist and respond to a
slot offer. Staff maintain the same waitlist, release open slots to the next patient
in line, pass on unanswered offers, and act on behalf of patients who are reached by
telephone. Every patient who joins has a recorded contact preference: patients choose it
themselves, staff record it when adding a caller who has none, and a patient can change
it at any time.

**Priority key:** **Must** — the MVP does not deliver its business outcome without it ·
**Should** — materially improves operational fitness, deferrable within the iteration ·
**Could** — desirable, has a workaround · **Deferred** — outside the agreed MVP flow (Section 10).

| Story | Actor | Priority |
|---|---|---|
| US-001 Join the specialty waitlist | Patient | Must |
| US-002 See current waitlist position | Patient | Deferred |
| US-003 Be notified of a slot offer | Patient | Must |
| US-004 View the waitlist | Staff | Must |
| US-008 Accept or decline an offered slot | Patient | Must |
| US-009 Release an open slot to the waitlist | Staff | Must |
| US-010 Pass an unanswered offer to the next patient | Staff | Must |
| US-011 Record a telephone patient's response | Staff | Must |
| US-006 Add a patient to the waitlist on their behalf | Staff | Must |
| US-012 Choose how to be contacted | Patient | Must |
| US-013 Set or change how I am contacted | Patient | Should |
| US-005 Remove a patient from the waitlist | Staff | Deferred |
| US-007 Leave the waitlist | Patient | Deferred |

US-006 is Must because telephone-preference patients, who typically cannot self-join,
reach the waitlist only through staff. Without it US-011 and the single-record
outcome fail. *(Changed from Should in v2.0 — Proposed, PO to confirm.)*

US-012 is Must because BR-001 can only reach a patient through a recorded preference, so
a patient who has none must choose before joining (BR-014). US-013 is Should (the
patient is reachable without it, but a stale preference cannot otherwise be corrected,
and no Must story depends on it; if it drops, the fallback in the MVP Statement and Section 10 applies). *(Priority: Proposed — PO to confirm.)* The demonstration
registration step is not a story and has no priority (Appendix A).

---

### US-001 — Join the specialty waitlist

**Business Actor:** Patient
**Priority:** Must

**As a** patient needing a specialist appointment, **I want** to join the waitlist
digitally, **so that** I do not have to call the hospital to be added.

**Business Outcome:** An active waitlist entry exists for the patient without
consuming call-centre time.

**Acceptance Criteria**
- Given a registered patient with no active entry for the specialty, When they request to join, Then an active entry is created with status `waiting`, placed last in join order, and they are shown confirmation that they are on the waitlist.
- Given a registered patient who already holds an active entry for that specialty, When they request to join again, Then no duplicate entry is created (BR-004) and they are told they are already on the waitlist.
- Given a registered patient with no recorded contact preference, When they request to join, Then US-012 applies and no entry is created until they have chosen a preference (BR-014).

**Business Rules:** BR-004, BR-006, BR-014
**Quality Attributes:** Auditability
**Supporting UX:** Prototype — patient view, join state

---

### US-002 — See current waitlist position

**Business Actor:** Patient
**Priority:** Deferred

Outside the agreed MVP flow. Moved to Section 10; the full story and acceptance criteria are preserved in v2.1.

---

### US-003 — Be notified of a slot offer

**Business Actor:** Patient
**Priority:** Must

**As a** patient on the waitlist, **I want** to be told when a slot is available for
me, **so that** I can take it without waiting for an unprompted phone call.

**Business Outcome:** The patient learns of an available slot through the channel
they asked to be contacted on.

**Acceptance Criteria**
- Given a patient whose recorded contact preference is in-app and who is next in line, When staff release an open slot, Then an in-app banner appears on their waitlist view showing the slot date, time and specialist, with accept and decline actions.
- Given a patient whose recorded contact preference is telephone and who is next in line, When staff release an open slot, Then the offer is flagged in the staff view as requiring a call, and no in-app notification is relied upon (BR-001).
- Given a patient whose contact preference is not recorded (their entry was active before a choice was required, BR-019) and who is next in line, When staff release an open slot, Then the offer is flagged in the staff view as requiring a call, exactly as for a telephone preference (BR-001).
- Given a patient is not next in line, When staff release an open slot, Then they receive no offer and their position is unchanged (BR-005, BR-006, BR-007).
- Given a patient with an in-app preference holds an outstanding offer and has not responded to it (for example, they are offline), When the offer remains unanswered, Then it stays outstanding, staff can see how long it has been outstanding (US-004), and staff may pass it on (US-010).
- Given a patient opens their waitlist view after an offer was made to them, When the offer is still outstanding, Then it is shown with accept and decline actions; when it has since closed, Then they are told it is no longer available (BR-012).

**Business Rules:** BR-001, BR-005, BR-006, BR-007, BR-012, BR-019
**Quality Attributes:** Reliability — an offer is visible on the patient's waitlist view within 60 seconds of release for 99% of offers; Accessibility — patient surface conforms to WCAG 2.1 AA and its offer view loads within 5 seconds on a throttled 3G profile (about 1.6 Mbps down) *(reliability and WCAG level: Proposed — PO to confirm; load time: accepted by the PO)*
**Supporting UX:** Prototype — patient view, notified state

---

### US-004 — View the waitlist

**Business Actor:** Scheduling Staff
**Priority:** Must

**As a** scheduling staff member, **I want** to see the specialty's waitlist, **so
that** I can manage demand without maintaining a manual list.

**Business Outcome:** Staff work from one shared live record instead of personal notes.

**Acceptance Criteria**
- Given the specialty has one or more active entries, When a staff member opens the waitlist, Then they see all active entries in position order with each patient's identity, position, status and contact preference.
- Given an offer is outstanding, When a staff member views the waitlist, Then they see which patient holds it, how long it has been outstanding, and whether that patient requires a telephone call.
- Given the specialty has no active entries, When a staff member opens the waitlist, Then the view states that no patients are waiting and offers no release action.
- Given an entry has closed as `booked`, When a staff member views the waitlist, Then that entry is excluded from the active list and from position numbering (BR-008).
- Given a patient already on the waitlist has no recorded contact preference (BR-019), When a staff member views the waitlist, Then that patient's preference is shown as "not recorded" and they are flagged as requiring a call (BR-001).
- Given a staff member administers a specialty, When they open the waitlist, Then they see only that specialty's entries (BR-011).

**Business Rules:** BR-001, BR-007, BR-008, BR-011, BR-019
**Quality Attributes:** Auditability
**Supporting UX:** Prototype — staff view

---

### US-005 — Remove a patient from the waitlist

**Business Actor:** Scheduling Staff
**Priority:** Deferred

Outside the agreed MVP flow. Moved to Section 10; the full story and acceptance criteria are preserved in v2.1.

---

### US-006 — Add a patient to the waitlist on their behalf

**Business Actor:** Scheduling Staff
**Priority:** Must

**As a** scheduling staff member, **I want** to add a patient to the waitlist on
their behalf, **so that** patients who call or attend in person are captured in the
same digital record.

**Business Outcome:** Telephone and in-person patients appear in the same waitlist as
self-joined patients, with no parallel manual list, and every patient added this way has a
recorded contact preference (the patient's own, or the one staff record for a caller who
has none).

**Acceptance Criteria**
- Given a registered patient without an active entry contacts staff directly, When a staff member adds them, Then an active entry is created with status `waiting`, behaving identically to a self-joined entry for position, offer eligibility and notification.
- Given the patient already holds an active entry for that specialty, When a staff member attempts to add them, Then no duplicate entry is created (BR-004) and staff are shown the existing entry and its position.
- Given a patient whose recorded contact preference is telephone, When a staff member adds them, Then the entry shows that preference on the staff view and is handled per BR-001.
- Given a registered patient who has no recorded contact preference contacts staff directly, When a staff member starts to add them, Then the staff member is asked to record the patient's stated choice of in-app or telephone first, and no entry is created until one is recorded (BR-014, BR-016).
- Given a staff member records the patient's stated choice while adding them, When the add is completed, Then that choice becomes the patient's recorded contact preference, the entry is created, the preference is shown on the staff view, and the recording is attributable to that staff member (BR-016).
- Given a patient already has a recorded contact preference, When a staff member adds them, Then the staff member cannot change that preference and the entry is handled per the recorded preference (BR-016).
- Given the caller is not registered in the hospital's patient records, When a staff member attempts to add them, Then no waitlist entry and no patient record is created, and staff are told the patient must be registered first.

**Business Rules:** BR-001, BR-004, BR-006, BR-011, BR-014, BR-016
**Quality Attributes:** Auditability — entry attributable to the staff member who created it, and a preference recorded by staff attributable to that staff member and timestamped

---

### US-007 — Leave the waitlist

**Business Actor:** Patient
**Priority:** Deferred

Outside the agreed MVP flow. Moved to Section 10; the full story and acceptance criteria are preserved in v2.1.

---

### US-008 — Accept or decline an offered slot

**Business Actor:** Patient
**Priority:** Must

**As a** patient who has been offered a slot, **I want** to accept or decline it,
**so that** I can secure or release the appointment without a phone call.

**Business Outcome:** The offered slot is either booked or returned to staff, without
staff initiating a call.

**Acceptance Criteria**
- Given a patient has been offered a slot, When they choose to accept, Then a confirmation step is shown restating the slot date, time and specialist, with options to confirm or go back.
- Given the confirmation step is shown, When the patient confirms, Then the booking is completed (BR-013) and their entry closes as `booked`.
- Given the confirmation step is shown, When the patient goes back instead, Then no booking is made and the offer remains outstanding and answerable.
- Given a patient has been offered a slot, When they decline, Then the offer closes, their entry remains active at its existing position, and the slot returns to staff to release again (BR-005).
- Given the offer was passed on or otherwise closed before the patient responded, When the patient attempts to accept or decline, Then no booking or change is made and they are told the offer is no longer available (BR-012).
- Given an offer is held by another patient, When a patient attempts to view, accept or decline it, Then access is refused and nothing changes (BR-011).
- Given a patient whose contact preference is telephone or not recorded, When they hold an outstanding offer, Then in-app accept and decline are not available to them and their response is recorded by staff (US-011, BR-001).

- Given a patient is on the confirmation step for an offer and their contact preference has since changed to telephone, When they confirm, Then no booking is made, they are told the current state, and the offer stays outstanding for staff to record the response (BR-021).

**Business Rules:** BR-001, BR-005, BR-011, BR-012, BR-013, BR-019, BR-021
**Quality Attributes:** Auditability — response attributable to the patient and timestamped
**Supporting UX:** Prototype — patient view, offer and confirmation

---

### US-009 — Release an open slot to the waitlist

**Business Actor:** Scheduling Staff
**Priority:** Must

**As a** scheduling staff member, **I want** to release an open slot to the waitlist,
**so that** the next patient in line is offered it without me working out who that is.

**Business Outcome:** An open slot reaches the correct patient without manual
coordination.

**Acceptance Criteria**
- Given staff have given the date and time of an open slot for the specialist, and at least one patient is `waiting` and no offer is outstanding, When the staff member releases it, Then the patient who is next in line moves to status `notified` and is reached through their recorded contact preference (BR-001).
- Given no patient is `waiting`, When a staff member views the waitlist, Then no release action is offered.
- Given a slot has been booked, When a staff member looks for slots to release, Then that slot is marked taken and cannot be released again (BR-013).
- Given an offer is already outstanding, When a staff member views the waitlist, Then no further release action is offered until that offer resolves (BR-007).
- Given a slot was previously declined by, or passed over for, the patient with the lowest position, When a staff member releases that same slot, Then that patient is not eligible and the slot is offered to the next patient in line (BR-005).
- Given every waiting patient has declined or been passed over for that slot, When a staff member releases it, Then no offer is raised, the slot stays with staff, and they are told no eligible patient remains (BR-005).

**Business Rules:** BR-001, BR-003, BR-005, BR-006, BR-007
**Quality Attributes:** Auditability — release attributable to the staff member and timestamped
**Supporting UX:** Prototype — staff view, release control

---

### US-010 — Pass an unanswered offer to the next patient

**Business Actor:** Scheduling Staff
**Priority:** Must

**As a** scheduling staff member, **I want** to pass an unanswered offer on, **so
that** a slot does not sit idle when a patient does not respond.

**Business Outcome:** An unanswered offer moves on by staff judgement, with no
automated timer.

**Acceptance Criteria**
- Given patient P holds status `notified` and has not responded, When a staff member passes the offer on, Then P returns to status `waiting` at their existing position, and the patient who is next in line for that slot (P is not eligible) moves to `notified` and is reached per BR-001. P is not offered that same slot again (BR-005).
- Given P is the only patient on the waitlist, or no other waiting patient is eligible for the slot, When a staff member passes the offer on, Then P returns to `waiting`, no new offer is raised, and the slot stays with staff to release again.
- Given P holds an offer that has not been seen because P is offline, When a staff member passes the offer on, Then it is treated as any other unanswered offer.
- Given P responded before the pass-on was processed, When a staff member attempts to pass the offer on, Then no change is made and the staff member is shown P's response (BR-012).
- Given an offer is outstanding, When a staff member views the waitlist, Then they see which patient holds it and how long it has been outstanding.

**Business Rules:** BR-001, BR-005, BR-006, BR-007, BR-012
**Quality Attributes:** Auditability — reassignment attributable to the staff member and timestamped
**Supporting UX:** Prototype — staff view, no-response control

---

### US-011 — Record a telephone patient's response

**Business Actor:** Scheduling Staff
**Priority:** Must

**As a** scheduling staff member, **I want** to record the response of a patient I
reached by telephone, **so that** the waitlist stays accurate for patients who cannot
answer in the application.

**Business Outcome:** Patients without digital access are represented in the same
waitlist record as everyone else, and their slot is never left stuck.

**Acceptance Criteria**
- Given a telephone-preference patient holds an outstanding offer, When a staff member records that the patient accepted, Then the booking is completed, the entry closes as `booked`, and the action is attributable to that staff member (BR-010).
- Given a telephone-preference patient holds an outstanding offer, When a staff member records that the patient declined, Then the offer closes, the entry remains active at its existing position, and the slot returns to staff to release again (BR-005, BR-010).
- Given a telephone-preference patient could not be reached, When a staff member passes the offer on, Then US-010 applies unchanged.
- Given a patient whose contact preference is in-app, When a staff member attempts to record a response on their behalf, Then the action is not available.
- Given a patient whose contact preference is not recorded and who holds an outstanding offer, When a staff member records a response on their behalf, Then US-011 applies as for a telephone preference (BR-001).
- Given the offer closed before the staff member recorded the response, When the staff member attempts to record it, Then no change is made and they are shown the current state (BR-012).

- Given a patient has changed their contact preference to in-app while holding an outstanding offer, When a staff member attempts to record a response for them, Then no change is made and the staff member is told the patient now responds in the app (BR-021).

**Business Rules:** BR-001, BR-005, BR-010, BR-012, BR-019, BR-021
**Quality Attributes:** Auditability — the response is recorded as staff-entered, distinguishable from a patient's own response

---

### US-012 — Choose how to be contacted

**Business Actor:** Patient
**Priority:** Must

**As a** patient with no recorded contact preference, **I want** to choose whether I am
contacted in the application or by telephone, **so that** I can join the waitlist and be
offered slots in the way that suits me.

**Business Outcome:** Every patient who joins the waitlist has a recorded contact
preference, chosen by the patient, so each offer reaches them through a known channel.

**Acceptance Criteria**
- Given a registered patient with no recorded contact preference and no active entry, When they request to join, Then they are asked to choose in-app or telephone before the join continues, and no entry is created yet (BR-014).
- Given the patient is asked to choose, When the options are shown, Then each is described so the patient knows how they will be reached: in-app means offers appear in the application, and telephone means staff will call them. *(Proposed — PO to confirm.)*
- Given the patient is asked to choose, When they choose an option and confirm, Then the choice is saved as their contact preference, an active entry is created as in US-001, and they are shown confirmation of both the preference saved and that they are on the waitlist.
- Given the patient is asked to choose, When they leave without choosing, Then no preference is saved and no entry is created (BR-014).
- Given a patient who already has a recorded contact preference, When they request to join, Then they are not asked to choose again.
- Given the patient has chosen and confirmed and the preference is saved, When the entry then cannot be created, Then the saved preference is kept, the patient is told they have not joined the waitlist and can try again, and they are not asked to choose a second time (BR-015).
- Given a patient saves a contact preference, When the choice is saved, Then it is attributable to that patient and timestamped.

**Business Rules:** BR-001, BR-014, BR-015
**Quality Attributes:** Auditability — the saved choice attributable to the patient and timestamped
**Supporting UX:** Prototype V4 — pending (Section 6)

---

### US-013 — Set or change how I am contacted

**Business Actor:** Patient
**Priority:** Should *(Proposed — PO to confirm)*

**As a** patient, **I want** to set or change my contact preference at any time,
**so that** offers reach me through the channel I currently use.

**Business Outcome:** A patient's contact preference stays current without involving
staff or the hospital's registration process, including for a patient who was already
waiting before a choice was required.

**Acceptance Criteria**
- Given a patient with a recorded contact preference, When they change it to the other option and confirm, Then the new preference is saved and shown to them (BR-015).
- Given a patient already on the waitlist who has no recorded contact preference (BR-019), When they choose in-app or telephone and confirm, Then the choice is saved as their contact preference, their entry status and position are unchanged, and offers made from that point are reached through it (BR-001, BR-015, BR-018).
- Given a patient on the waitlist changes their contact preference, When the change is saved, Then their entry status and position are unchanged and offers made from that point are reached through the new preference (BR-001, BR-018).
- Given a patient holds an outstanding offer and changes from in-app to telephone, When the change is saved, Then the in-app banner and the accept and decline actions are no longer available to them, the offer stays outstanding, and staff see it flagged as requiring a call (BR-017).
- Given a patient holds an outstanding offer and changes from telephone, or from no recorded preference, to in-app, When the change is saved, Then the in-app banner with accept and decline actions is shown to them within the time set for a newly released offer (Section 9), the offer stays outstanding, and staff can no longer record a response on their behalf (BR-017, US-011).
- Given a patient has changed to in-app, When a staff member attempts to record a response for them, Then no change is made and the staff member is told the patient now responds in the app (BR-021).
- Given a patient is on the confirmation step for an offer in one session and has changed to telephone in another session or on another device, When they confirm in the first, Then no booking is made, they are told the current state, and the offer stays outstanding for staff to record the response (BR-021).
- Given a patient whose entry is booked, or who has no entry, When they set or change their contact preference, Then it is saved as their contact preference, no entry is created or changed, and it applies the next time they join (BR-015, BR-018).
- Given an offer was already accepted or declined, When the patient later changes their contact preference, Then the response already recorded is not affected (BR-018).
- Given a patient attempts to change another patient's contact preference, When they do so, Then the change is refused and nothing changes (BR-011, BR-015).
- Given a patient changes their contact preference, When the change is saved, Then the change is attributable to that patient, timestamped, and records the previous and the new preference. The record is not shown on any screen this iteration.

**Business Rules:** BR-001, BR-011, BR-015, BR-017, BR-018, BR-021
**Quality Attributes:** Auditability — each change attributable to the patient and timestamped; Security — a patient can change only their own preference
**Supporting UX:** Prototype V4 — pending (Section 6)

---

## 8. Cross-cutting Business Rules

| Rule ID | Business Rule |
|---|---|
| BR-001 | A patient offered a slot must be reached through the contact preference held on their patient record. An in-app preference is served by an in-app banner. A telephone preference is served by the offer being flagged to staff for a call; no in-app notification is relied upon for that patient, and in-app accept and decline are not available to them; staff record their response (US-011). The call itself is an ordinary appointment call made outside this Feature, and staff obtain the number from hospital records (Section 5). A patient with no recorded contact preference who already holds an active entry (BR-019) is treated as telephone preference and shown to staff as "not recorded". *(Not-recorded handling for an entry already waiting: Product Owner decision in v2.5; hospital operations to confirm.)* |
| BR-002 | An entry closes when an offer is accepted, whether by the patient or recorded by staff on their behalf. Removal of an entry, by the patient or by staff, is deferred (Section 10). |
| BR-003 | Making a slot offer does not by itself change a waitlist entry's active status. An entry remains active until it is closed by acceptance of an offer. |
| BR-004 | A patient may hold at most one active waitlist entry per specialty. |
| BR-005 | A patient may accept or decline a slot offered to them. Accepting completes the booking. Declining closes only that offer — the entry remains active at its existing position, and staff release the slot onward. A patient who has declined, or been passed over for, a specific slot is not offered that same slot again. Passing an offer on does not change the patient's position. *(Passed-over handling: Proposed — PO to confirm.)* |
| BR-006 | Waitlist position is determined by strict order of joining. There is no priority or clinical-urgency override. |
| BR-007 | At most one slot offer may be outstanding at a time for the specialty. While an offer is outstanding, no further slot may be released until it is accepted, declined, or passed on. |
| BR-008 | When an entry closes (`booked`), every entry behind it moves up one position, preserving join order. Positions are never renumbered by hand. |
| BR-009 | Deferred with the removal stories (Section 10). |
| BR-010 | A response recorded by staff on a patient's behalf carries the same effect as a response made by the patient, and must be attributable to the staff member who recorded it. |
| BR-011 | A patient sees only their own waitlist record. A staff member sees and acts only on the waitlist of the specialty they administer. |
| BR-012 | A slot offer is resolved once. The first action recorded against an outstanding offer (accept, decline or pass-on) takes effect; any later action against that offer is not applied, and the person attempting it is told the offer is no longer available and shown the current state. *(Proposed — PO to confirm.)* |
| BR-013 | "Booking is completed" means, within this Feature: the offered slot is recorded against the patient, the specialist calendar (mocked this iteration) marks the slot as taken so it cannot be released again, the entry closes as `booked`, and the patient or staff member sees a confirmation of the slot date, time and specialist. Any write-back to a real calendar and any further confirmation belong to Slot Claim & Booking Confirmation. *(Slot marked taken: decided by the Product Owner. Remaining wording: Proposed — PO to confirm.)* |
| BR-014 | No waitlist entry may be created for a patient who has no recorded contact preference. A preference of in-app or telephone must be recorded first, by the patient when they join (US-012) or by staff when they add the patient (US-006). *(Product Owner decision in v2.5; hospital operations to confirm.)* |
| BR-015 | Within this Feature, a patient may set or change their own contact preference at any time, and only the patient it belongs to may change a recorded one. Hospital registration remains a separate writer (BR-020). *(Product Owner decision in v2.5; hospital operations to confirm.)* |
| BR-016 | Within this Feature, a staff member may record a patient's contact preference only when adding a patient who has none, and only the choice the patient states. Staff may not change a preference that is already recorded. *(Product Owner decision in v2.5; hospital operations to confirm.)* |
| BR-017 | A change of contact preference applies at once to any offer the patient holds, within the time set for a newly released offer (Section 9), whichever direction the change goes. The offer is not restarted, withdrawn or reassigned because of the change (BR-007). *(Product Owner decision in v2.5; hospital operations to confirm.)* |
| BR-018 | A change of contact preference does not alter the status or position of a waitlist entry, or a response already recorded. *(Proposed — PO to confirm.)* |
| BR-019 | A patient who already holds an active entry and has no recorded contact preference keeps their place and is handled per BR-001 until they choose one. They are not required to choose in order to keep or to receive an offer, and may choose at any time (US-013). *(Product Owner decision in v2.5; hospital operations to confirm.)* |
| BR-020 | The patient record holds one contact preference. Where it is written both by hospital registration and by this Feature, the most recent write applies. The demonstration registration step (Appendix A) is a further writer in the demonstration environment only, and the same rule applies to it. *(Interim rule — Product Owner decision in v2.5; hospital operations to confirm.)* |
| BR-021 | Whether an action on an offer is available is decided by the patient's contact preference at the moment the action is taken. An action that is not available under the current preference is not applied, and the person attempting it is told the current state. *(Product Owner decision in v2.5; hospital operations to confirm.)* |

**Waitlist Entry Status Model**

| Status | Entered when | Left when | Active? | Counts for position? |
|---|---|---|---|---|
| `waiting` | Patient joins (US-001) or staff add them (US-006), in each case once a contact preference is recorded (BR-014), or an offer is declined (US-008, US-011) or passed on (US-010) | Staff release a slot and they are next in line for that slot (US-009) | Yes | Yes |
| `notified` | Staff release a slot to them (US-009), or pass an offer on to them (US-010) | They accept or decline (US-008, US-011), or staff pass the offer on (US-010) | Yes | Yes |
| `booked` | An acceptance is confirmed (US-008) or recorded by staff (US-011) | Terminal | No | No |
| `removed` | Deferred — no story in this iteration moves an entry to `removed` | — | — | — |

"Active", as used in BR-003 and BR-004, means `waiting` or `notified`. A `booked` entry is closed: excluded from position calculations and from further offers.

**Rule Relationships**

BR-001 governs which actor completes the response loop, and therefore determines
whether US-008 or US-011 applies. BR-003 and BR-005 together bound this Feature
against Slot Claim & Booking Confirmation: the patient's response is in scope, the
automated cascade that would follow a decline is not. BR-008 keeps
position order accurate when an entry is booked, which determines who is offered the next slot. BR-012 resolves any conflict
between a patient's response and a staff action on the same offer; BR-013 fixes where
this Feature stops and Slot Claim & Booking Confirmation begins.

BR-014 is the gate that guarantees BR-001 always has a recorded preference to act on for
any new entry; BR-019 is the one transitional exception for entries that pre-date it.
BR-015 and BR-016 together say who may write the preference (the patient at any time;
staff only once, at the point of adding a patient who has none). BR-017 and BR-018 say
what a change does: it applies to a held offer immediately without restarting it, and
leaves position, status and recorded responses alone. BR-021 decides what can be done
to an offer at the moment of action, and BR-012 still resolves two valid actions
arriving together. BR-020 says which write applies when hospital registration and this
Feature both write the preference.

---

## 9. Cross-cutting Quality Attributes

**Universal Quality Attributes**

- **Reliability:** A slot offer must dependably reach the patient it was raised for.
  An offer that silently fails to reach its recipient directly undermines the
  Feature's purpose and returns the patient to the call centre. Proposed target: an offer is visible on
  the patient's waitlist view within 60 seconds of release for 99% of offers. The same
  target applies to the banner appearing after a patient switches to in-app (US-013).
  *(Proposed — PO to confirm.)*
- **Auditability:** Every entry creation, slot release, offer and response
  must be attributable to who performed it and when — including which staff member
  recorded a response on a patient's behalf. This replaces a telephone process where
  accountability was implicit in the call. Every recording or change of a contact
  preference must likewise be attributable to who made it and when, and the source of the
  current value (hospital registration, the patient, or a staff member in this Feature)
  must be identifiable. *(Source: Proposed — PO to confirm.)*
- **Accessibility:** The patient-facing surface is in-app. Given the hospital's
  patient population, the in-app experience must not assume a recent device or fast
  connection, and the telephone path (BR-001) exists as the equivalent route for
  patients the application cannot serve. Proposed target: the patient surface
  conforms to WCAG 2.1 AA and its offer view loads within 5 seconds on a throttled 3G profile
  (about 1.6 Mbps down). *(Load time accepted by the PO; WCAG level: Proposed — PO to confirm.)*
- **Security and Compliance:** Waitlist records contain patient-identifying
  scheduling information. Working position for this iteration is to treat the data
  as personal information — a patient sees only their own record, staff see only the
  specialty they administer (BR-011) — with rigour proportionate to a time-boxed internal
  exercise using mocked calendar data. A contact preference may be changed only by the patient it
  belongs to, or recorded by staff when adding a patient who has none (BR-015,
  BR-016); the demonstration registration step (Appendix A) records the first choice for a
  person it registers. Applicability of a formal healthcare data
  framework is an Open Decision.

**Contextual Quality Attributes**

- **Usability:** Directly patient-facing for a population with mixed digital
  confidence. Proposed expectation: a first-time user accepts or declines an offer in 3 steps or fewer from opening the app, without help. *(Accepted by the PO.)*
- **Data Quality:** The waitlist is the single operational record of demand for the
  specialty; position and status must be correct at the point staff act on them.

---

## 10. Deferred Behaviour

**Deferred Functional Behaviour**

Narrowed in v2.2 to the agreed flow (registry → slot release → acceptance):

- Patient-facing display of waitlist position (US-002), including its Data Quality
  target.
- A patient leaving the waitlist (US-007) and staff removing a patient (US-005),
  together with BR-009 and the `removed` status. Full story text is in v2.1.

- The remaining seven specialties. This iteration covers one pilot specialty.
- Physician schedule management — physicians setting their own availability rules and
  blocking time for vacation, conferences or on-call shifts.
- Appointment prerequisites — appointments that cannot be confirmed until laboratory
  results or other prerequisites are available.
- How far in advance a schedule change may be made.
- Automated timer-based expiry and automatic cascade of unclaimed offers. Staff pass
  offers on manually this iteration (US-010).
- Self-service browsing or booking of open slots independent of queue position.
- Staff-confirmed booking as an alternative to patient self-accept.
- Automated out-of-app messaging — SMS, email or automated voice — for slot offers,
  booking confirmation and schedule changes. Telephone-preference patients are
  served by a staff call this iteration, not by automation.
- Immediate notification when a patient joins an empty waitlist while a slot is
  already open. Considered and deferred — the patient joins at position 1 and staff
  release the slot as normal.
- Staff correcting a contact preference that is already recorded. Only the patient
  changes a recorded preference this iteration (BR-015, BR-016).
- Contact options other than in-app and telephone, and capturing the telephone number
  or other details used to reach a patient.
- If US-013 is not delivered: a patient changing their preference after joining, and a
  patient already waiting with none choosing one. Both move to a later iteration; until
  then patients choose only when they join (US-012) and a patient already waiting with
  none stays treated as telephone (BR-019).
- Showing the history of a patient's contact preference changes (previous and new values,
  who and when) to the patient or to staff. The history is recorded for audit but not
  displayed this iteration; staff see only the current preference.
- Passing a contact preference changed in this Feature back to the hospital's
  registration system.

**Deferred Business Rules**

- Rules governing claim deadlines and automated cascade order — dependent on the
  deferred timer and cascade behaviour.
- Rules governing prerequisite satisfaction before an offer may be made.

**Deferred Quality Attributes**

- Product Owner confirmation of the reliability, accessibility, usability and data
  quality targets proposed in Section 9, recorded as an Outstanding Action in
  Section 16. The targets themselves are in scope; only their agreed values are
  deferred.

**Future Product Specifications**

| Product Specification | Status |
|---|---|
| Slot Claim & Booking Confirmation | Planned |
| Physician Schedule Management | Planned |
| Appointment Prerequisites | Planned |
| Multi-Specialty Waitlist | Planned |
| Waitlist Self-Service & Removal | Planned — patient-facing position, patient leaving, staff removal |

**Deferred Behaviour Rationale**

The approved Use Case spans eight specialties and several operational concerns that
each carry their own business policy. Specifying them here would mean inventing
policy that has not been agreed — particularly around clinical prerequisites and
physician availability, where the hospital's actual rules are not yet documented.
The waitlist mechanic is independently valuable, demonstrable end-to-end, and
extends to further specialties without re-specification.

**Progressive Product Definition Notes**

Deferred behaviour is intentional. This Product Specification is complete for the
agreed MVP — waitlist registry, slot release, slot offer, and patient response across both
contact preferences. Engineering should implement the stories and rules as specified
and should not infer automated cascade, prerequisite checking, physician schedule
management, or multi-specialty behaviour. Those will be defined in future Product
Specifications as Product understanding evolves.

---

## 11. Success Measures

**Business Success Measures**

| Measure | Target | Owner |
|---|---|---|
| Reduction in specialist-scheduling call-centre volume | 40% — stated by hospital leadership, not backed by a formal study (see Risks) | Product Owner |
| Patient-reported visibility of waitlist status | Deferred with US-002 (Section 10) | Product Owner |

**Operational Success Measures**

| Measure | Target | Owner |
|---|---|---|
| Reduction in staff time spent on manual waitlist coordination | TBC | Product Owner |
| Proportion of released slots filled without a staff call | TBC | Product Owner |

**Adoption Measures**

| Measure | Target | Owner |
|---|---|---|
| Proportion of waitlist entries created by patient self-join vs. staff-added | TBC | Product Owner |
| Proportion of waitlisted patients recorded as telephone preference | TBC — establishes the realistic ceiling on call reduction | Product Owner |
| Proportion of waitlisted patients whose contact preference was chosen by the patient in the application, rather than by staff or at hospital registration | TBC | Product Owner |

Targets marked TBC have not been invented and require Product Owner input.

---

## 12. Dependencies

**Business Dependencies**

| Dependency | Description | Status |
|---|---|---|
| Patient registration | Patients must be registered in hospital records before joining a waitlist | Assumed available |
| Contact preference captured at registration | US-003, US-009 and US-011 depend on the patient record stating how each patient wishes to be contacted. Staff ask and save this during the patient's first registration | **Confirmed** |
| Patient may set and change the preference in this Feature | US-012, US-013 and the staff recording in US-006 add a second way to write the preference. Hospital operations have not yet confirmed this. The most recent write applies (BR-020) | Open |
| Telephone numbers in hospital records | Staff obtain the number to call a telephone-preference patient from hospital records, outside this Feature | Assumed available — to be confirmed |
| Specialist calendar visibility | Staff must be able to see that a slot has freed up in order to release it. A booked slot is marked taken (BR-013) | Assumed available |

**Product Dependencies**

None. This Feature is the first in the Use Case and does not depend on another
Product Specification.

**External Dependencies**

The patient record held by hospital registration is shared with this Feature: it is read
for registration and the contact preference, and the contact preference is also written
to it (Section 5). Staff obtain telephone numbers from hospital records outside this
Feature. Mocked calendar and status data are used, per the delivery constraints in
Section 5.

---

## 13. Risks

**Product Risks**

| Risk | Impact | Mitigation |
|---|---|---|
| The 40% call-reduction objective is not backed by a formal study | The Feature may be judged against a target that was never achievable | Recorded as a leadership-stated objective rather than a requirement; adoption measures in Section 11 establish the realistic ceiling |
| Telephone-preference patients still require a staff call for every offer | Call reduction applies only to the digitally reachable cohort, so the 40% may be unreachable in a population with low digital access | Measure the telephone-preference proportion early (Section 11); automated out-of-app channels are the deferred path to closing this |
| A patient's contact preference may be stale — recorded at first registration and not revisited since | A patient may be reached on a channel they no longer use, and the offer goes unanswered | Staff can see the preference on the waitlist (US-004) and the offer can be passed on (US-010); the patient can now change their own preference at any time (US-013). A patient who cannot use the application cannot correct it themselves, and staff may not change a recorded preference (BR-016); staff correction is deferred (Section 10) |
| The preference can be written in this Feature and at hospital registration | Two places can change the same value, so they may disagree and a patient may be reached on the wrong channel | Open decision on which record is authoritative and whether changes are passed back (Section 14). Until decided, the patient record this Feature reads is the one it writes to |
| A patient chooses in-app but cannot use the application, or chooses telephone and staff have no number to call | The offer goes unanswered, or no call can be made, and the slot sits idle | Staff see the preference and the time outstanding (US-004) and pass the offer on (US-010). The interim assumption is that staff find the number in hospital records outside this Feature (Section 5); confirming it is an Open Decision (Section 14) |
| A staff member records a choice the patient did not actually give | The patient is reached on the wrong channel | BR-016 allows only the choice the patient states; the recording is attributable to the staff member (US-006) and the patient can change it (US-013) |
| A patient switches to in-app but cannot use the application | An offer sits unseen after the switch | Staff see the preference and the time outstanding (US-004) and pass the offer on (US-010) |
| A caller who cannot or will not state a preference cannot be added (BR-014) | A phone-in patient is not captured on the waitlist | BR-014 is deliberate; staff ask the caller during the call. Whether an exception is needed is for the Product Owner |
| A patient changes preference while holding an offer (BR-017) | Staff may already be calling when the patient switches to in-app, or the banner appears after staff began a call | The offer stays outstanding. BR-021 decides whether an action is available at the moment it is taken, and the person attempting an action that is no longer available is told the current state (US-013); BR-012 still resolves two valid actions arriving together |
| A patient with an in-app preference is offline or does not see an offer | The offer sits unanswered and the slot is idle | The offer remains visible to staff with time outstanding (US-004) and staff pass it on (US-010); connectivity is assumed only for the digitally reachable cohort (Section 5) |
| No persistent notification centre; a patient who misses the in-app banner has no record of the offer | The offer may go unseen while it remains outstanding | The offer stays visible to staff with time outstanding (US-004) and staff pass it on (US-010); the patient also sees it on their next visit to the waitlist view (US-003) |
| Patients cannot see their own position in this iteration (US-002 deferred) | Status-chasing calls may persist, lowering the achievable call reduction | The call-reduction objective is measured against offer-related calls only; patient-facing position is the first item of Waitlist Self-Service & Removal |
| No removal story in this iteration | An entry that no longer represents real demand stays on the list until its patient is offered a slot and declines, or staff pass it on | Staff pass on (US-010) or the patient declines (US-008, US-011); removal is first in line for the next Product Specification |

**Operational Risks**

| Risk | Impact | Mitigation |
|---|---|---|
| Passing on an unanswered offer depends on staff noticing it; there is no timer or alert | A released slot could sit idle | US-004 and US-010 surface the outstanding offer and how long it has been open; automated prompting is deferred |
| Staff must learn a new process during transition from manual tracking | Slower reduction in manual coordination during rollout | Not yet defined — Product Owner decision |
| Information staff currently hold informally may not be captured in the digital waitlist | Patients could be given inaccurate position or status | US-004 surfaces the full list early so discrepancies are visible during the pilot |

**Delivery Risks**

| Risk | Impact | Mitigation |
|---|---|---|
| One-week window with approximately ten hours per person | Scope cannot absorb growth without losing the end-to-end slice | The MVP is narrowed to registry → slot release → acceptance (Section 1), leaving eight stories in v2.4; v2.5 adds one Must story (US-012) and one Should (US-013), and US-013 is the first to drop if the window is exceeded (the demonstration registration in Appendix A is not Product scope); position display and removal are deferred (Section 10) |
| The demonstration registration step (Appendix A) needs building but is outside this estimate | Engineering effort the estimate does not count, which can squeeze the Must stories | Kept out of Product scope by decision. It is the first item to drop if the window is exceeded, ahead of US-013 |
| BR-001 (and BR-005, BR-013) each combine several policies, and BR-001 is cited by nine stories | A change to one policy means re-reading the whole rule, and Engineering cannot trace or test one policy at a time | Product Owner decision in v2.5: left as is to avoid rewriting v2.4 content. Revisit when these rules next change |

---

## 14. Open Decisions

**Outstanding Product Decisions**

| Decision | Owner | Status |
|---|---|---|
| Which specialty is the pilot — cardiology or oncology | Product Owner | Open — both carry 6+ week waits; choice affects demo data, not behaviour |
| Applicable data security and compliance framework | Product Owner | Open — working position recorded in Section 9, proportionate to a time-boxed internal exercise |
| Whether a slot freed by a same-day non-attendance should enter the waitlist, or only advance cancellations | Product Owner | Open — current position is advance cancellations only (Section 5) |
| Whether hospital operations accept that patients set and change their contact preference in the application, and whether changes are passed back to hospital registration | Product Owner with hospital operations | Open — v2.5 reverses a position confirmed with hospital operations (Section 5). Interim rule: the most recent write applies (BR-020) |
| Where staff obtain the telephone number to call a telephone-preference patient | Product Owner with hospital operations | Interim assumption: from hospital records, outside this Feature (Section 5); to be confirmed |
| Whether staff should be able to correct a stale recorded preference (deferred, Section 10) | Product Owner | Open |

**Resolved Product Decisions**

Carried forward from versions 0.1–0.4, with rationale, so that decision history is
not lost in the realignment to the approved Use Case:

| Decision | Resolution | Rationale |
|---|---|---|
| Waitlist ordering | Strict order of joining, no priority override (BR-006) | Clinical-emergency reordering does not match real clinic behaviour — that risk is a same-day delay, not a waitlist-position issue |
| In-app notification surface | Banner on the patient's waitlist view; no persistent notification centre | No native application in scope; a persistent centre was considered and dropped for this iteration, with the exposure recorded in Risks |
| Unclaimed-offer handling | Staff pass the offer on manually; no timer | Demonstrable without inventing an unvalidated timeout policy |
| Multiple waitlist entries | One active entry per specialty per patient (BR-004) | Simple and sufficient for a single-specialty pilot |
| Position display | Plain position number only; queue length not shown to the patient | Does not over-promise a date, and avoids advertising the size of the backlog. Display itself deferred in v2.2 (Section 10) |
| Booking mechanic | Accept and decline are in MVP scope; cascade and timer deferred | Gives a complete demonstrable loop from joining to securing an appointment |
| Reaching patients without digital access | Staff call them; staff record the response on their behalf (US-011, BR-010) | A waitlist that only reaches connected patients cannot serve the hospital's stated population or its call-reduction objective |
| Booked slot | A booked slot is marked taken in the (mocked) calendar and cannot be released again (BR-013) | Prevents a double offer of the same slot within the MVP; real calendar write-back is deferred to Slot Claim & Booking Confirmation |
| Unregistered caller | Staff cannot add an unregistered caller; nothing is created (US-006) | Patient registration is outside this Feature |
| Telephone call | The call to a telephone-preference patient is an ordinary appointment call outside the system; nothing is built for the call itself. The system flags the offer and records the outcome. In-app accept and decline are not offered to these patients | One response channel per patient removes any conflict between the app and a call |
| Iteration scope | One pilot specialty, hospital-wide business context | Fits the delivery window; extends specialty by specialty without re-specification |
| MVP flow | Registry → appointment management / slot release → acceptance of the new appointment. Position display, leaving and removal deferred | Agreed with the team to narrow the process to the end-to-end slice that delivers the outcome (v2.2) |
| Who sets the contact preference | The patient chooses it in the application and can change it at any time; staff record it only when adding a caller who has none (BR-015, BR-016) | Lets patients keep their preference current while still capturing it for phone-in callers. *(Product Owner decision in v2.5; not yet confirmed with hospital operations.)* |
| A choice before joining | A patient with no recorded preference must choose before they can join, and staff must record one before adding a caller who has none (BR-014) | Every new entry can be reached through a known channel |
| Patients already waiting with no preference | They keep their place and are treated as telephone (BR-019) | Avoids stranding the first patient in line |
| Changing preference during an offer | Allowed; the offer stays outstanding and follows the new preference at once (BR-017) | Nothing is lost or restarted |
| Registration for demonstration | A demonstration-only registration step on the sign-in screen creates a patient who chooses in-app or telephone and is signed in, and refuses a name already in use (Appendix A). It is not a Product requirement. Hospital registration stays outside this Feature | Lets the whole journey be shown without a hospital registration system |
| Which write applies | One contact preference per patient record; where hospital registration and this Feature both write it, the most recent write applies (BR-020) | Simple interim rule that needs no precedence logic. *(Product Owner decision in v2.5; hospital operations to confirm.)* |
| An action during a preference change | Whether an action is available is decided at the moment it is taken; an unavailable action is refused and the person is told the current state (BR-021) | One rule for every in-flight case, with a response already recorded always standing (BR-018) |
| Telephone number source | Staff obtain it from hospital records, outside this Feature (interim assumption) | Keeps number capture out of this iteration. *(To be confirmed with hospital operations.)* |

**Notes**

No outstanding decision blocks a stated Acceptance Criterion, but the hospital operations
confirmation (the hospital operations row in the Outstanding table above) determines whether US-012 and US-013 stand as written.
The pilot specialty
affects demonstration data only. The compliance framework carries a recorded working
position. The non-attendance question would widen the slot-availability trigger in
Section 5 but invalidates nothing already specified.

**Terminology note.** "No-show" is used in two distinct senses across the source
material. The open decision above concerns a patient not attending a booked
appointment, which may free a slot. Separately, earlier material referred to a
patient not responding to an offer — that case is covered by US-010 and is not an
open question.

---

## 15. Traceability

| Product Artefact | Reference |
|---|---|
| Use Case (Epic) | Specialist Appointment Scheduling Modernization |
| Feature | Specialist Waitlist Visibility, Notification & Slot Offer |
| Current Iteration | MVP — one pilot specialty |
| User Stories | US-001, US-003, US-004, US-006, US-008 – US-013 (US-002, US-005, US-007 deferred) |
| Business Rules | BR-001 – BR-021 (BR-009 deferred) |
| Quality Attributes | Reliability, Auditability, Accessibility, Security and Compliance, Usability, Data Quality |
| Supporting Product Artefacts | Journey maps; interactive prototype (Section 6); Demonstration Aids (Appendix A, not Product scope) |

**Related Product Specifications**

| Product Specification | Relationship |
|---|---|
| Slot Claim & Booking Confirmation | Successor — takes over automated offer handling |
| Physician Schedule Management | Sibling — governs how slots come to exist |
| Appointment Prerequisites | Sibling — governs whether an offer may be made |
| Multi-Specialty Waitlist | Successor — extends this Feature beyond the pilot specialty |
| Waitlist Self-Service & Removal | Successor — adds patient-facing position, patient leaving and staff removal |

---

## 16. Product Readiness Assessment

**Delivery Context** ☑ Parent Use Case, Feature, iteration and future Product
Specification context all recorded.

**Business Understanding** ☑ Business problem, value and outcome understood and
traceable to the approved Use Case.

**Functional Behaviour** ☑ Ten User Stories in scope (three deferred), all appropriate to the MVP, all
implementation independent. US-013 carries a Proposed priority.

**Acceptance Criteria** ◻ Partial — all stories carry measurable criteria, but US-001 AC3,
US-006 AC4 – AC6 and US-012 – US-013 stand only if hospital operations confirm the change
(Section 14).

**Business Rules** ◻ Partial — BR-001 – BR-021 defined, with an explicit status model. BR-014 – BR-017 and BR-019 – BR-021 are Product Owner decisions awaiting hospital operations' confirmation; BR-018 is Proposed.

**Quality Attributes** ◻ Partial — measurable targets are now proposed for
reliability, accessibility, usability and data quality, but are not yet confirmed by
the Product Owner.

**Supporting Product Artefacts** ☑ Referenced, with divergences from the prototype
explicitly recorded.

**Deferred Behaviour** ☑ Explicit, with rationale and named successor Product
Specifications.

**Engineering Readiness:** ☑ **Draft** · ☐ Requires Refinement · ☐ Ready with Minor
Refinement · ☐ Engineering Ready

Up to v2.4 the contact preference dependency was confirmed with hospital operations:
staff capture the preference during a patient's first registration, and this Feature
only reads it. v2.5 adds a second way to write it (US-012, US-013, US-006), which
hospital operations have **not** confirmed. The spec is a Draft until they do, and
until the new stories and rules have been reviewed (Section 23).

The Product Quality Review of v2.0 found that the v2.0 self-assessment of Ready with
Minor Refinement was not supported: a Must story depended on a Should story, the
Quality Attributes had no measurable targets, and several behaviours were undefined
(Section 19). v2.1 drafted a resolution for each finding. Through v2.4 the spec stayed
at Requires Refinement until the Product Owner confirmed the items marked *Proposed*;
v2.5 is a Draft because it adds unreviewed behaviour (Section 23).

v2.2 narrows the scope to the agreed flow, which removes the removal-related gaps and
reduces delivery load (Section 20). It does not by itself resolve the remaining open
findings listed there.

**Outstanding Actions**

| Action | Owner | Status |
|---|---|---|
| Choose the pilot specialty | Product Owner | Open — affects demonstration data only |
| Confirm the proposed reliability (99% within 60 seconds) and WCAG 2.1 AA targets (Section 9, US-003); load-time and usability targets are accepted | Product Owner | Open |
| Set the Success Measure targets currently marked TBC | Product Owner | Open |
| Align the prototype with BR-005 — declining must not cascade automatically | UX | Open |
| Confirm US-006 as Must | Product Owner | Open |
| Confirm default handling of a patient with no recorded contact preference (BR-001) | Product Owner | Decided in v2.5 (BR-019); hospital operations to confirm |
| Confirm first-action-wins conflict handling (BR-012) | Product Owner | Open |
| Confirm the remaining BR-013 wording; marking a booked slot as taken is decided | Product Owner | Open |
| Confirm that a passed-over patient is not re-offered the same slot (BR-005) | Product Owner | Open |
| Represent contact preference and the telephone path in the prototype | UX | Done in V3 |
| Add the demonstration registration step, choosing and changing a contact preference, the join gate and the staff choice when adding a caller to the prototype (V4) | UX | Open |
| Confirm with hospital operations that patients may set and change the preference in the application, which record is authoritative, and whether changes are passed back (BR-014 – BR-021, Section 14) | Product Owner | Open |
| Confirm the priority of US-013 (Should) | Product Owner | Open |
| Confirm with hospital operations that staff obtain the telephone number from hospital records (Section 5) | Product Owner | Interim assumption recorded |
| Resolve the remaining Product Quality Review findings (Section 23), re-review v2.5, then update the OpenSpec technical specs and the QA test spec | Product Owner | Open |
| Confirm US-010 (pass-on) stays in the narrowed scope, since without it an unanswered offer blocks release (BR-007) | Product Owner | Open |

---

## 17. Engineering Handoff Notes

*Informative only. This section does not prescribe implementation.*

**Expected business volumes.** The pilot specialty is one of the hospital's highest-
demand services, with waits routinely exceeding six weeks. Physicians manage their
own schedules and availability varies between them; the pilot should not assume a
uniform weekly slot cadence across physicians.

**Operational sequencing.** Slot release is always a staff action. No slot reaches a
patient automatically. The cancellation that frees a slot occurs outside this
Feature.

**Known external context.** Patient registration and the specialist calendar are
existing hospital capabilities this Feature reads from; it also writes the contact
preference to the patient record (BR-015, BR-016, BR-020). Calendar and status data are
mocked for this iteration per the delivery constraints.

**Patient population.** A meaningful proportion of patients will carry a telephone
contact preference. The telephone path is not an edge case to be handled last — it is
a primary path for this population and should be exercised in the demonstration.

**Supporting artefacts.** Prototype V3 demonstrates the digitally reachable path and the
telephone path, with the contact preference shown read-only. It does not yet represent
choosing or changing a preference, the join gate, the staff choice when adding a caller,
or the demonstration registration step; a V4 prototype is expected.

**Demonstration registration.** The registration step on the sign-in screen is for
demonstration only (Appendix A). Hospital registration remains outside this Feature.

---

## 18. Product Specification Completion

**Delivery Context** ☑ Positioned within the wider Use Case; future Product context
recorded.

**Product Definition** ☑ MVP clearly defined; scope appropriate to the delivery
window; deferred behaviour documented.

**Functional Behaviour** ☑ User Stories, Acceptance Criteria and Business Rules
complete for the agreed iteration. Quality Attributes are partial (Section 16).

**Product Quality** ◻ Review findings from v2.0 addressed in draft (Section 19);
Story Navigator standards not yet satisfied until the Product Owner confirms the
Proposed items and the specification is re-reviewed. v2.5 adds two stories and eight
rules that have not yet been reviewed.

**Product Status:** ☑ **Draft** · ☐ In Review · ☐ Requires Refinement · ☐ Engineering
Ready · ☐ Approved

---

## 19. Review Findings & Resolution (v2.0 → v2.1)

*Historical record from an earlier version. Items shown as open here may since have been resolved; the body of this specification and Section 23 are authoritative.*

Source: Product Quality Review of PS-001 v2.0 against the BA Guild's Product Quality
Review standards, together with the Product Owner's stated assumptions. "PO" below
means the Product Owner.

**Product Owner assumptions**

| Assumption | Finding | Resolution in v2.1 |
|---|---|---|
| Patient is registered and prefers in-app notification | Registration was captured. In-app preference could not be a spec-wide assumption: telephone preference is a co-equal primary path (Sections 1, 3 and 17, BR-001, US-011) | Scoped to the digitally reachable cohort in Section 5 and the Actors table. Telephone and not-recorded patients are served by the telephone path |
| Patient has access to an internet connection | Not stated anywhere, and in tension with Sections 3 and 9. An in-app patient who is offline when an offer is made had no defined handling | Scoped to the digitally reachable cohort in Section 5. Offline patient handled as an unanswered offer (US-003, US-010, Section 13 risk) |

**Review findings**

| # | Finding in v2.0 | Resolution in v2.1 | Needs PO confirmation |
|---|---|---|---|
| 1 | Must story US-011 depended on Should story US-006; Section 13 listed US-006 as deferrable | US-006 raised to Must (Section 7, US-006, Section 13) | Yes |
| 2 | Reliability, Accessibility and Usability had no measurable targets; the US-002 "Performance" attribute was a data-correctness statement | Targets proposed in Section 9, US-002 and US-003; US-002 attribute reclassified as Data Quality | Yes |
| 3 | No rule for a missing or unusable contact preference | BR-001 extended: not recorded is treated as telephone and shown to staff; ACs added to US-003, US-004, US-006, US-011 | Yes |
| 4 | "Booking is completed" undefined; boundary with Slot Claim & Booking Confirmation unclear | BR-013 added; referenced from US-008 | Yes |
| 5 | No ACs for stale or conflicting offers | BR-012 added (first action wins); ACs added to US-003, US-005, US-007, US-008, US-010, US-011 | Yes |
| 6 | Pass-on semantics ambiguous: re-offer to the same patient, where the slot goes, "first in line" | BR-005 extended to passed-over patients; US-009 and US-010 ACs updated; status model `waiting` exit reworded | Yes |
| 7 | Staff scoping hidden in Section 9 | BR-011 added; ACs added to US-004; referenced from US-005 and US-006 | No |
| 8 | Status inconsistent: header, Section 16 and Section 18 disagreed, and the self-assessment overstated readiness | Status set to Requires Refinement in the header and Sections 16 and 18 | No |
| 9 | Minor: "banner" wording is UI-prescriptive; Success Measure targets all TBC | Not changed. The banner is a recorded Product decision (Section 14), and Success Measure targets still need PO input (Section 11) | Yes |

**Downstream impact.** The OpenSpec technical specs and the QA test spec
(`docs/qa/test-spec-waitlist-visibility-notification.md`) were written against earlier
versions of this Product Specification. They need review against BR-011 – BR-013, the
US-006 priority change, the extended BR-001 and BR-005, and the new acceptance
criteria before the next implementation or test-automation pass.

---

## 20. Scope Narrowing (v2.1 → v2.2)

*Historical record from an earlier version. Items shown as open here may since have been resolved; the body of this specification and Section 23 are authoritative.*

Agreed flow: **Registry → Appointment management / slot release → Acceptance of the
new appointment.** "Registry" is the process of registering a new appointment
request, which places the patient on the waitlist (a patient joining, or staff adding
them). It is not patient registration in hospital records, which remains outside this
Feature (Section 5).

**Story mapping**

| Flow step | Stories in scope |
|---|---|
| Registry | US-001 Join the specialty waitlist · US-006 Add a patient on their behalf · US-004 View the waitlist |
| Appointment management / slot release | US-009 Release an open slot · US-010 Pass an unanswered offer on |
| Acceptance of the new appointment | US-003 Be notified of a slot offer · US-008 Accept or decline · US-011 Record a telephone patient's response |

**Deferred (Section 10):** US-002 patient-facing position, US-005 staff removal,
US-007 patient leaving, BR-009, and the `removed` status.

**Changes made**

| Area | Change |
|---|---|
| Sections 1–4 | Feature, MVP statement and value text restated around the agreed flow; position visibility removed from the outcome |
| Section 5 | Position display, leaving and removal moved from In Scope to Out of Scope |
| Section 7 | Priority table marks US-002, US-005, US-007 as Deferred; story bodies replaced by stubs; US-001, US-003, US-004, US-008 no longer show or cite position or removal |
| Section 8 | BR-002, BR-003, BR-008, BR-012 and the status model no longer depend on removal; BR-009 deferred; `notified` entry via US-010 recorded |
| Sections 10–15 | Deferred list, new successor spec, success measure, two new risks, delivery risk, resolved decision and traceability updated |
| Section 16 | Story count and Outstanding Actions updated |

"Registry" means registering a new appointment request, which places the patient on
the waitlist (US-001, or US-006 for a patient who contacts staff). It is not patient
registration in hospital records, which remains outside this Feature (Section 5).

**Effect on the open review findings**

| Finding | Effect |
|---|---|
| Feasibility: nine of eleven stories Must | Reduced to eight stories, all Must; three stories, one status and one rule removed |
| A Must story depends on a Should or Could story (removal, US-011) | Resolved — removal is out of scope |
| BR-007 and the status model omit removal; US-007 AC4 cites BR-012 incorrectly | Resolved — removal is out of scope |
| Stale-offer ACs for removal and leaving | Resolved — removal is out of scope |
| "First in line" versus the BR-005 skip rule | **Still open** |
| Slot identity and the BR-013 booking boundary | **Still open** |
| Telephone patient's in-app behaviour; "sufficient connection" undefined | **Still open** |
| Quality targets not fully measurable; Section 10/16/18 tick inconsistencies | **Still open** |
| "Time outstanding (US-004)" cross-reference; BR-011 patient-side AC | **Still open** |

**New consequences of narrowing**

- Without patient-facing position, status-chasing calls may persist. The call-reduction
  objective now rests on offer-related calls only (Section 13).
- Without removal, an entry that no longer represents demand stays until its patient
  declines or staff pass it on (Section 13).
- US-010 is kept because BR-007 allows only one outstanding offer; without pass-on an
  unanswered offer would block release. This is flagged for confirmation (Section 16).

---

## 21. Consistency Fixes (v2.2 → v2.3)

*Historical record from an earlier version. Items shown as open here may since have been resolved; the body of this specification and Section 23 are authoritative.*

| Finding | Fix |
|---|---|
| "First in line" and "position 1" contradicted the BR-005 skip rule and US-010 | Glossary (Section 5) defines *eligible patient* and *next in line*. US-003, US-009, US-010 and the status model now use "next in line" |
| "Outstanding offer" and "same slot" undefined | Both defined in the glossary; a slot is identified by specialist, date and time |
| Status model `notified` entry omitted pass-on | Done in v2.2; the `waiting` exit now also uses "next in line" |
| Section 10 listed the quality targets as deferred while Section 9 proposes them | Section 10 now defers only the Product Owner's confirmed values |
| Section 18 ticked Quality Attributes complete while Section 16 said partial | Section 18 aligned with Section 16 |
| "Time outstanding (US-004)" had no matching criterion in US-004 | Added to US-004 AC2 |
| BR-003 cited by no story | Cited from US-009 |
| BR-005 was Proposed in Section 16 but not marked in Section 8 | Marked *Proposed — PO to confirm* in BR-005 |
| Section 14 referred to a risk for the dropped notification centre that did not exist | Risk added to Section 13 |
| Section 19 "PO confirmation Yes/No" column was ambiguous | Renamed "Needs PO confirmation" |
| "Registry" meaning | Clarified in Section 1 and Section 20 as registering a new appointment request |

**Not changed (decisions or content needed):** whether a telephone-preference patient
can answer in-app; whether the mocked calendar marks a booked slot as taken (BR-013);
measurable thresholds for "sufficient connection", "slow connection" and the usability
expectation; the BR-011 patient-side acceptance criterion; the unregistered-caller
behaviour in US-006.

---

## 22. Decisions Applied (v2.3 → v2.4)

*Historical record from an earlier version. Items shown as open here may since have been resolved; the body of this specification and Section 23 are authoritative.*

| Decision (Product Owner) | Applied in |
|---|---|
| A booked slot is marked taken in the (mocked) calendar and cannot be released again | BR-013, US-009 (new criterion), Dependencies in Sections 5 and 12, Section 14 |
| A patient sees only their own record | US-008 (new criterion for BR-011); BR-011 added to US-008 |
| An unregistered caller is not added and nothing is created | US-006 (new criterion), Section 14 |
| The telephone call is an ordinary call outside the system; nothing is built for it | BR-001, Section 5 (Out of Scope), US-008 (new criterion: no in-app response for telephone or not-recorded patients), Section 14 |
| Thresholds accepted: connection of at least 3G (about 1.6 Mbps down); offer view loads in 5 seconds or less on a throttled 3G profile; a first-time user accepts or declines in 3 steps or fewer | Section 5 (Actors, Assumptions), Section 9, US-003 |

**Reading applied for telephone patients:** each patient has exactly one response channel,
in-app for an in-app preference and a staff-recorded response for telephone or not
recorded. This follows from the call being outside the system and matches the US-011
rule that staff cannot record for an in-app patient. It is easy to reverse if in-app
answering should also be allowed.

**Still open:** the reliability target (99% within 60 seconds) and the WCAG 2.1 AA level
still need Product Owner confirmation (Section 16).

---

## 23. Contact Preference Captured in the App (v2.4 → v2.5)

**What changed and why.** Up to v2.4 the contact preference was read-only here: staff
captured it at hospital registration and this Feature only read it. The Product Owner
asked for patients to set it as part of using the application. The decisions below
change that, and the change is *Proposed* until hospital operations confirm it, because
the earlier position was confirmed with them.

**Decisions applied (Product Owner)**

| Decision | Applied in |
|---|---|
| Patients choose their contact preference in the application and can change it at any time | US-012, US-013, BR-015 |
| Staff record it only when adding a caller who has none; afterwards only the patient changes it | US-006 (new criteria), BR-016 |
| A patient with no recorded preference must choose before joining; staff must record one before adding a caller who has none | US-001, US-006, US-012, BR-014 |
| Patients already waiting with no preference keep their place and are treated as telephone | BR-001, BR-019, US-003, US-004, Section 3 |
| A change while holding an outstanding offer is allowed and the offer follows the new preference at once | US-013, US-003, US-011, BR-017, BR-018 |
| A mock registration step under the sign-in, for demonstration only, takes a name and in-app or telephone, creates a patient and signs them in | Appendix A, Sections 5 and 17 |

**Changes by area**

| Area | Change |
|---|---|
| Sections 1 – 3 | Feature, MVP statement, summary and actors restated for the new behaviour |
| Section 5 | In and Out of Scope, the contact preference assumption (the confirmed baseline is kept and a v2.5 assumption added beside it), a demonstration registration assumption, glossary terms and the dependency rows updated |
| Section 6 | Prototype and journey-map references moved to V3, which the build follows; the V2 alignment notes retired; V4 expected |
| Section 7 | US-012 and US-013 added; US-001, US-003, US-004, US-006 and US-011 criteria updated |
| Section 8 | BR-014 – BR-021 added; BR-001 and the status model updated |
| Sections 9 – 13 | Auditability and Security extended; deferred items, an adoption measure, dependencies and five risks added |
| Section 14 | Open and resolved decisions added for this change |
| Sections 15, 16, 18 | Traceability, readiness and status updated; status set to Draft |

**Consequences to be aware of**

- **Two places can write the preference** (hospital registration and this Feature). The
  interim rule is that the most recent write applies (BR-020), so a later registration
  update can overwrite an in-app choice. Whether changes are passed back is not decided.
- **Only the patient changes a recorded preference.** A patient who chose in-app by
  mistake and cannot use the application cannot be corrected by staff in this iteration.
  Staff can still pass the offer on (US-010). Staff correction is deferred.
- **Telephone preference needs a number to call.** The interim assumption is that staff
  obtain it from hospital records, outside this Feature (Section 5).
- **BR-014 can stop a phone-in caller being added** if they will not state a preference.

**Downstream impact.** The following were written against v2.4 and need review once this
version is agreed: the OpenSpec technical specs (the contact-preference requirement that
the preference is read-only, and the scenario that it cannot be changed, no longer hold),
the QA test spec and Playwright test data (new journeys and a newly registered
patient), prototype V4, and the README.

**Not changed.** No story, rule or target other than those listed above. The pilot
specialty, the compliance framework and the quality targets remain as in v2.4.

**Product Quality Review of v2.5 (applied)**

The review verdict was **Draft**. Four blocking findings were decided by the Product
Owner and applied:

| Finding | Decision applied |
|---|---|
| Hospital registration also writes the preference, so BR-015 and BR-016 read as if they forbid it | BR-015 and BR-016 are scoped to this Feature; BR-020 says the most recent write applies (interim; hospital operations to confirm) |
| A preference change during an offer was handled in two inconsistent ways | BR-021: whether an action is available is decided at the moment it is taken; the change-during-offer criteria moved out of US-003 and US-011 into US-013 |
| Must stories depended on a Should story | US-003 and US-011 no longer contain criteria that exist only because of US-013; the delivery risk now states the story count and that US-013 drops first |
| The telephone path had an undefined input | Interim assumption that staff obtain the number from hospital records, outside this Feature (Section 5, Section 14) |

Also corrected without a decision: stale status and readiness text (Sections 12, 16, 17),
the traceability lists of US-003, US-004 and US-008, a typo in US-003, the value
statement, two glossary terms, the BR-001 not-recorded tag, two missing risks, and the
audit source of a preference.

**Resolved with the Product Owner (review follow-up)**

| Finding | Decision applied |
|---|---|
| A patient already waiting with no recorded preference had no way to choose one | They may set a first preference at any time through US-013, with no prompt and no blocking; BR-015 and BR-019 updated |
| Section 1 said every patient on the waitlist has a recorded preference, contradicting BR-019 | Section 1 now says every patient who *joins* has one, and that a patient already waiting is treated as telephone until they choose |
| US-012 did not say what happens to a saved preference if creating the entry then fails | The preference is kept as the patient's own setting, they are told they have not joined and can retry without choosing again (US-012 AC) |
| US-006 covers two outcomes (adding a patient, and recording a first preference) | Kept as one story, because recording the preference is the first step of adding a caller who has none and the two cannot be delivered separately. The Business Outcome now names both results |
| What "at any time" covers in US-013 for a booked entry or a patient with no entry | Available whenever the patient is signed in. It is the patient's own setting, so it is saved without creating or changing any entry and applies the next time they join |
| US-013 did not say who sees the previous and new values of a change | They are recorded for audit and not shown on any screen this iteration; displaying the history is Deferred Behaviour (Section 10) |
| US-013 is Should and first to drop, yet the MVP statement and BR-019 rely on it (second review) | Product Owner decision: stays Should. The MVP Statement and Section 10 state the fallback if it is not delivered |
| The demonstration registration step (Appendix A) is a build item outside the Section 13 load estimate and a further writer of the preference | Product Owner decision: kept as an explicit non-scope aid. Named as a writer in BR-020 and Section 9, defined by configuration in the glossary, and recorded as a Delivery Risk |
| US-009 did not say how staff identify the slot to release | Staff give the slot's date and time for the pilot specialist, which with the specialist identifies it; no list of open slots is held in this iteration (Section 5 dependency, US-009) |
| BR-001, BR-005 and BR-013 combine several policies (second review) | Product Owner decision: left as is to avoid rewriting v2.4 content; recorded as a Delivery Risk (Section 13) |
| US-014 was a non-production item counted among the in-scope stories, depended on an undefined "demonstration environment" and sign-in, and left duplicate names open | US-014 is removed from the stories and moved to Appendix A, which is not Product scope. A duplicate name is refused. "Demonstration environment" is a glossary term; sign-in is stated as outside the Product scope |

**Still open from the review**

None. Every finding from both reviews is either applied or recorded as a Product Owner decision above. The open items that remain are the assumptions in Section 14 (hospital operations' confirmation, the telephone-number source, the US-013 priority, the pilot specialty and compliance).

**Mechanical fixes from the second review (applied)**

Stale rule ranges and counts corrected (Sections 1, 15, 16, 18, 23); BR-019 and BR-021 added
to US-008 and US-011, with the confirmation-step and staff-recording cases restated there;
"has not seen it" reworded to "has not responded"; BR-017 "immediately" tied to Section 9;
US-013 confirmation-step scenario stated; superseded notes added to Sections 19 – 22; Feature
naming note added; Appendix A name-as-key marked demonstration-only.

---

## Appendix A — Demonstration Aids

*Not part of the Product scope. These items exist only so the whole journey can be shown
without a hospital registration system. They are not Product requirements, are not user
stories, carry no priority and are not counted in Sections 7, 15 or 16. Engineering builds
them from this appendix. Hospital registration remains outside this Feature (Section 5).*

**A1. Demonstration registration step**

A person new to the hospital registers by giving a name and choosing how they want to be
contacted, so they can use the waitlist straight away. It stands in for hospital
registration.

Acceptance Criteria

- Given the sign-in screen is shown in the demonstration environment, When a person enters a name, chooses in-app or telephone and registers, Then a patient record is created with that name and contact preference, and they are signed in as that patient.
- Given the person has not entered a name or has not chosen a contact preference, When they attempt to register, Then no patient record is created and they are told what is missing.
- Given the name entered is already in use by a registered patient, When they attempt to register, Then no patient record is created and they are told that name is already registered and that they can sign in as that patient instead. *(A name is the uniqueness key in the demonstration only; this is not a rule for production identity.)*
- Given a patient registered this way, When they request to join the waitlist, Then they are not asked to choose a preference again, because one is recorded (BR-014).
- Given an environment that is not the demonstration environment, When a person opens the sign-in screen, Then the registration step is not available.

Notes

- A patient registered this way has no telephone number on file, and the demonstration
  places no calls (Section 5).
- Signing in as a registered patient is part of the demonstration setting and is not a
  Product requirement. A signed-in patient's identity is what BR-011 and BR-015 rely on.
- "Demonstration environment" is defined in the Section 5 glossary: switched on by
  configuration, off by default.
- Who provides a patient's identity outside the demonstration is not defined by this
  Feature (sign-in is outside the Product scope, Section 5).
- The demonstration step is not counted in the Section 13 load estimate. It is a build item
  recorded as a Delivery Risk, and is the first thing to drop if the window is exceeded.


# Product Specification

| Field | Value |
|---|---|
| Product Specification ID | PS-001 |
| Version | 2.0 |
| Status | Ready with Minor Refinement |
| Product Owner | j.abarca@elsevier.com |
| Date | 2026-10-01 |
| Last Updated | 2026-10-01 |

> **Version note.** v2.0 realigns this Product Specification to the approved Use Case
> (public hospital, eight specialties). Versions 0.1–0.4 were authored against a
> narrower source and described a single private clinic. The Functional Behaviour,
> Business Rules and recorded Product decisions from v0.4 are carried forward; the
> business context, scope and success measures are restated against the approved
> Use Case. Decision history from v0.1–v0.4 is preserved in Section 14.

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
| Description | Patients join a specialist waitlist, see their position, are offered an open slot when one is released, and accept or decline it. Staff manage the same waitlist digitally, release open slots, and handle patients who cannot be reached digitally. |

**Current Product Iteration:** MVP

**MVP Statement**

The smallest independently valuable capability is a digital waitlist for **one
high-demand specialty**, where patients see their own position without calling,
staff release an open slot to the next patient in line, and that patient accepts
or declines the offer. Patients whose recorded contact preference is telephone are
reached by staff, and staff record their response on their behalf, so the waitlist
remains a single accurate record for every patient regardless of digital access.

This is deliberately one specialty, not eight. It proves the waitlist mechanic
end-to-end and can be extended specialty by specialty without re-specification.

**Known Future Product Specifications**

| Feature | Status |
|---|---|
| Slot Claim & Booking Confirmation | Planned — automated cascade and timer handling of unclaimed offers, self-service slot browsing, staff-confirmed booking as an alternative flow |
| Physician Schedule Management | Planned — physicians managing their own availability, blocking time for vacation, conferences and on-call |
| Appointment Prerequisites | Planned — appointments requiring laboratory results or other prerequisites before confirmation |
| Multi-Specialty Waitlist | Planned — extending the waitlist across the remaining specialties |

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

A digital waitlist for one high-demand specialty. Patients join, see their position,
and are offered an open slot when staff release one. Patients reachable digitally
are notified in the application; patients whose contact preference is telephone are
called by staff, who record the response on their behalf. Either way the waitlist
holds one accurate record.

**Expected Business Outcome**

Patients learn their waitlist position and receive slot offers without initiating a
call. Staff stop maintaining the waitlist manually and stop calling patients purely
to communicate status.

**Business Value**

- **Access:** patients gain visibility of a process that is currently opaque to them.
- **Operational efficiency:** status-chasing calls are removed for digitally
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

For the pilot specialty, patients self-serve their waitlist position, and slot
offers reach them without them initiating contact — in-app where possible, by a
staff call where that is the patient's recorded preference. Staff work from one
shared digital waitlist rather than personal notes.

**Business Process Context**

Sits at the front of the specialist appointment booking process. This Feature covers
waitlist membership, visibility, slot offer and the patient's response to that offer.
It does not cover physician schedule management, appointment prerequisites, or the
automated handling of unclaimed offers.

**Primary Business Actors**

| Actor | Description |
|---|---|
| Patient (digitally reachable) | Registered patient whose recorded contact preference is in-app |
| Patient (telephone preference) | Registered patient whose recorded contact preference is telephone, typically without smartphone or reliable internet |
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

- Fewer inbound status-chasing calls for digitally reachable patients.
- Outbound offer calls become prompted and tracked rather than manually coordinated.
- Reduced risk of lost patients, double offers and inaccurate position information.

**Success Measures:** See Section 11.

---

## 5. Scope

**In Scope**

- Patient joining the pilot specialty's waitlist digitally.
- Patient viewing their current waitlist position.
- Patient being notified when a slot is released to them.
- Patient accepting or declining the slot offered to them.
- Patient removing themselves from the waitlist.
- Staff viewing the digital waitlist, including each patient's contact preference.
- Staff adding a patient to the waitlist on their behalf.
- Staff removing a patient from the waitlist.
- Staff releasing an open slot to the waitlist.
- Staff passing an unanswered offer to the next patient.
- Staff recording a telephone-preference patient's accept or decline on their behalf.

**Out of Scope**

- The remaining seven specialties — this iteration covers one pilot specialty.
- Physician schedule management, including blocking availability for vacation,
  conferences or on-call, and differing per-physician availability rules.
- Appointment prerequisites such as laboratory results gating confirmation.
- Automated timer-based expiry and automatic cascade of an unclaimed offer.
- Self-service browsing or booking of open slots independent of queue position.
- Automated out-of-app messaging (SMS, email, automated voice).
- The cancellation transaction itself — see Assumptions.

**Assumptions**

- Patients using this Feature are already registered in the hospital's patient
  records. Registration is outside this Feature.
- **Contact preference** is captured by staff during a patient's first registration —
  the patient is asked how they wish to be reached about appointment booking — and is
  held on the patient record. This Feature reads that preference; it does not capture
  or amend it. *(Confirmed with hospital operations.)*
- **Slot:** a bookable appointment time in a specialist's calendar. Slots free up when
  a patient cancels a booked appointment ahead of time. That cancellation happens
  outside this Feature and is neither handled nor recorded here. What this Feature
  acts on is a staff member releasing an already-free slot to the waitlist (US-009).
  No slot reaches a patient without that staff action.
- The pilot specialty is one of the two highest-demand specialties (cardiology or
  oncology); the specific choice is an Open Decision.

**Dependencies**

| Dependency | Description | Status |
|---|---|---|
| Patient registration records | Patients must exist in hospital records before joining a waitlist | Assumed available |
| Contact preference on the patient record | US-003, US-009 and US-011 depend on knowing how each patient wishes to be reached. Staff capture this at first registration | **Confirmed** |
| Specialist calendar | Staff must be able to see that a slot has freed up in order to release it | Assumed available |

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
| Patient & Staff journey maps | `waitlist-journey-maps_1.html` | UX | Manual process vs. digital waitlist, five stages per actor |
| Interactive prototype | `waitlist-prototype_V2.html` | UX | Patient and staff views: join, position, offer, accept/decline, staff release and reassignment |

Wireframes and visual designs are to be delivered later by UX. This Product
Specification does not depend on them.

**UX Alignment Notes**

The prototype is a first build, not final UX. Where it and this Product
Specification differ, the Specification is authoritative:

- **Declining currently cascades automatically.** The prototype offers the slot to the
  next patient the instant someone declines. BR-005 requires staff to release it.
  The prototype requires change, not the Specification.
- **US-005 and US-007 are not built.** The prototype has no removal action for either
  staff or patients, so the effect of removing a mid-queue patient on other
  positions is untested.
- **Contact preference is not represented.** The prototype predates the telephone-
  preference behaviour and assumes every patient is reachable in-app.

---

## 7. Functional Behaviour

**Functional Behaviour Summary**

Patients join the pilot specialty's waitlist, see their position, and respond to a
slot offer. Staff maintain the same waitlist, release open slots to the next patient
in line, pass on unanswered offers, and act on behalf of patients who are reached by
telephone.

**Priority key:** **Must** — the MVP does not deliver its business outcome without it ·
**Should** — materially improves operational fitness, deferrable within the iteration ·
**Could** — desirable, has a workaround.

| Story | Actor | Priority |
|---|---|---|
| US-001 Join the specialty waitlist | Patient | Must |
| US-002 See current waitlist position | Patient | Must |
| US-003 Be notified of a slot offer | Patient | Must |
| US-004 View the waitlist | Staff | Must |
| US-008 Accept or decline an offered slot | Patient | Must |
| US-009 Release an open slot to the waitlist | Staff | Must |
| US-010 Pass an unanswered offer to the next patient | Staff | Must |
| US-011 Record a telephone patient's response | Staff | Must |
| US-005 Remove a patient from the waitlist | Staff | Should |
| US-006 Add a patient to the waitlist on their behalf | Staff | Should |
| US-007 Leave the waitlist | Patient | Could |

---

### US-001 — Join the specialty waitlist

**Business Actor:** Patient
**Priority:** Must

**As a** patient needing a specialist appointment, **I want** to join the waitlist
digitally, **so that** I do not have to call the hospital to be added.

**Business Outcome:** An active waitlist entry exists for the patient without
consuming call-centre time.

**Acceptance Criteria**
- Given a registered patient with no active entry for the specialty, When they request to join, Then an active entry is created with status `waiting`, placed last in join order, and they are shown confirmation and their position.
- Given a registered patient who already holds an active entry for that specialty, When they request to join again, Then no duplicate entry is created (BR-004) and they are shown their existing position.

**Business Rules:** BR-004, BR-006
**Quality Attributes:** Auditability
**Supporting UX:** Prototype — patient view, join state

---

### US-002 — See current waitlist position

**Business Actor:** Patient
**Priority:** Must

**As a** patient on the waitlist, **I want** to see my current position, **so that**
I know where I stand without calling to ask.

**Business Outcome:** The patient can self-check status at any time, removing the
reason for a status-chasing call.

**Acceptance Criteria**
- Given a patient has an active entry, When they view their waitlist status, Then their position is displayed as a plain number in the form "#2". The total number of patients waiting is not shown to the patient.
- Given entries were added at different times, When position is calculated, Then it reflects strict order of joining with no priority override (BR-006).
- Given a patient ahead of them is booked or removed, When the patient next views their status, Then their position reflects the change (BR-008).

**Business Rules:** BR-006, BR-008
**Quality Attributes:** Performance — the position shown must reflect current state, not stale data
**Supporting UX:** Prototype — patient view, waiting state

---

### US-003 — Be notified of a slot offer

**Business Actor:** Patient
**Priority:** Must

**As a** patient on the waitlist, **I want** to be told when a slot is available for
me, **so that** I can take it without waiting for an unprompted phone call.

**Business Outcome:** The patient learns of an available slot through the channel
they asked to be contacted on.

**Acceptance Criteria**
- Given a patient whose recorded contact preference is in-app and who is first in line, When staff release an open slot, Then an in-app banner appears on their waitlist view showing the slot date, time and specialist, with accept and decline actions.
- Given a patient whose recorded contact preference is telephone and who is first in line, When staff release an open slot, Then the offer is flagged in the staff view as requiring a call, and no in-app notification is relied upon (BR-001).
- Given a patient is not first in line, When staff release an open slot, Then they receive no offer and their position is unchanged (BR-006, BR-007).

**Business Rules:** BR-001, BR-006, BR-007
**Quality Attributes:** Reliability, Accessibility
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
- Given an offer is outstanding, When a staff member views the waitlist, Then they see which patient holds it and whether that patient requires a telephone call.
- Given the specialty has no active entries, When a staff member opens the waitlist, Then the view states that no patients are waiting and offers no release action.
- Given an entry has closed as `booked` or `removed`, When a staff member views the waitlist, Then that entry is excluded from the active list and from position numbering (BR-008).

**Business Rules:** BR-001, BR-007, BR-008
**Quality Attributes:** Auditability
**Supporting UX:** Prototype — staff view

---

### US-005 — Remove a patient from the waitlist

**Business Actor:** Scheduling Staff
**Priority:** Should

**As a** scheduling staff member, **I want** to remove a patient from the waitlist,
**so that** it reflects real current demand.

**Business Outcome:** Entries that no longer represent real demand are closed.

**Acceptance Criteria**
- Given a patient has an active entry, When a staff member removes it, Then the entry moves to status `removed`, is excluded from position calculations, and the patient receives no further offers for that specialty.
- Given the removed patient held position N, When removal completes, Then every patient behind them moves up one position (BR-008).
- Given the patient being removed holds an outstanding offer, When a staff member removes them, Then the offer is closed and the slot returns to staff to release again (BR-009).
- Given an entry has already closed as `booked` or `removed`, When a staff member attempts to remove it, Then no change is made and they are told the entry is no longer active.

**Business Rules:** BR-002, BR-008, BR-009
**Quality Attributes:** Auditability — removal attributable to the staff member who performed it

---

### US-006 — Add a patient to the waitlist on their behalf

**Business Actor:** Scheduling Staff
**Priority:** Should

**As a** scheduling staff member, **I want** to add a patient to the waitlist on
their behalf, **so that** patients who call or attend in person are captured in the
same digital record.

**Business Outcome:** Telephone and in-person patients appear in the same waitlist as
self-joined patients, with no parallel manual list.

**Acceptance Criteria**
- Given a registered patient without an active entry contacts staff directly, When a staff member adds them, Then an active entry is created with status `waiting`, behaving identically to a self-joined entry for position, offer eligibility and notification.
- Given the patient already holds an active entry for that specialty, When a staff member attempts to add them, Then no duplicate entry is created (BR-004) and staff are shown the existing entry and its position.

**Business Rules:** BR-004, BR-006
**Quality Attributes:** Auditability — entry attributable to the staff member who created it

---

### US-007 — Leave the waitlist

**Business Actor:** Patient
**Priority:** Could

**As a** patient on the waitlist, **I want** to remove myself, **so that** I can opt
out when I no longer need the appointment.

**Business Outcome:** Patients can leave without consuming staff time.

**Acceptance Criteria**
- Given a patient has an active entry, When they choose to leave, Then the entry moves to status `removed`, is excluded from position calculations, and they receive no further offers for that specialty.
- Given the departing patient held position N, When they leave, Then every patient behind them moves up one position (BR-008).
- Given the patient holds an outstanding offer, When they leave, Then the offer is closed and the slot returns to staff to release again (BR-009).

**Business Rules:** BR-002, BR-008, BR-009
**Quality Attributes:** —

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
- Given the confirmation step is shown, When the patient confirms, Then the booking is completed and their entry closes as `booked`.
- Given the confirmation step is shown, When the patient goes back instead, Then no booking is made and the offer remains outstanding and answerable.
- Given a patient has been offered a slot, When they decline, Then the offer closes, their entry remains active at its existing position, and the slot returns to staff to release again (BR-005).

**Business Rules:** BR-005
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
- Given at least one patient is `waiting` and no offer is outstanding, When a staff member releases an open slot, Then the patient at position 1 moves to status `notified` and is reached through their recorded contact preference (BR-001).
- Given no patient is `waiting`, When a staff member views the waitlist, Then no release action is offered.
- Given an offer is already outstanding, When a staff member views the waitlist, Then no further release action is offered until that offer resolves (BR-007).
- Given a slot was previously declined by the patient now at position 1, When a staff member releases that same slot, Then it is offered to the next patient who has not declined it (BR-005).

**Business Rules:** BR-001, BR-005, BR-006, BR-007
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
- Given patient P holds status `notified` and has not responded, When a staff member passes the offer on, Then P returns to status `waiting` at their existing position, and the next waiting patient other than P moves to `notified` and is reached per BR-001.
- Given P is the only patient on the waitlist, When a staff member passes the offer on, Then P returns to `waiting` and no new offer is raised.
- Given an offer is outstanding, When a staff member views the waitlist, Then they see which patient holds it and how long it has been outstanding.

**Business Rules:** BR-001, BR-005, BR-006, BR-007
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

**Business Rules:** BR-001, BR-005, BR-010
**Quality Attributes:** Auditability — the response is recorded as staff-entered, distinguishable from a patient's own response

---

## 8. Cross-cutting Business Rules

| Rule ID | Business Rule |
|---|---|
| BR-001 | A patient offered a slot must be reached through the contact preference held on their patient record. An in-app preference is served by an in-app banner. A telephone preference is served by the offer being flagged to staff for a call; no in-app notification is relied upon for that patient. |
| BR-002 | A waitlist entry may be removed by the patient who holds it or by a staff member; no other party may remove it. An entry also closes when an offer is accepted, whether by the patient or recorded by staff on their behalf. |
| BR-003 | Making a slot offer does not by itself change a waitlist entry's active status. An entry remains active until explicitly removed, or closed by acceptance of an offer. |
| BR-004 | A patient may hold at most one active waitlist entry per specialty. |
| BR-005 | A patient may accept or decline a slot offered to them. Accepting completes the booking. Declining closes only that offer — the entry remains active at its existing position, and staff release the slot onward. A patient who has declined a specific slot is not offered that same slot again. |
| BR-006 | Waitlist position is determined by strict order of joining. There is no priority or clinical-urgency override. |
| BR-007 | At most one slot offer may be outstanding at a time for the specialty. While an offer is outstanding, no further slot may be released until it is accepted, declined, or passed on. |
| BR-008 | When an entry closes (`booked` or `removed`), every entry behind it moves up one position, preserving join order. Positions are never renumbered by hand. |
| BR-009 | If a patient holding an outstanding offer leaves the waitlist or is removed, that offer closes and the slot returns to staff to release again. |
| BR-010 | A response recorded by staff on a patient's behalf carries the same effect as a response made by the patient, and must be attributable to the staff member who recorded it. |

**Waitlist Entry Status Model**

| Status | Entered when | Left when | Active? | Counts for position? |
|---|---|---|---|---|
| `waiting` | Patient joins (US-001), staff add them (US-006), or an offer is declined (US-008, US-011) or passed on (US-010) | Staff release a slot and they are first in line (US-009) | Yes | Yes |
| `notified` | Staff release a slot to them (US-009) | They accept or decline (US-008, US-011), or staff pass the offer on (US-010) | Yes | Yes |
| `booked` | An acceptance is confirmed (US-008) or recorded by staff (US-011) | Terminal | No | No |
| `removed` | Patient leaves (US-007) or staff remove them (US-005) | Terminal | No | No |

"Active", as used in BR-002 and BR-003, means `waiting` or `notified`. A `booked` or
`removed` entry is closed: excluded from position calculations and from further offers.

**Rule Relationships**

BR-001 governs which actor completes the response loop, and therefore determines
whether US-008 or US-011 applies. BR-003 and BR-005 together bound this Feature
against Slot Claim & Booking Confirmation: the patient's response is in scope, the
automated cascade that would follow a decline is not. BR-008 is a prerequisite for
US-002 — position cannot be stated accurately without it.

---

## 9. Cross-cutting Quality Attributes

**Universal Quality Attributes**

- **Reliability:** A slot offer must dependably reach the patient it was raised for.
  An offer that silently fails to reach its recipient directly undermines the
  Feature's purpose and returns the patient to the call centre. No measurable target
  has been agreed with the Product Owner.
- **Auditability:** Every entry creation, removal, slot release, offer and response
  must be attributable to who performed it and when — including which staff member
  recorded a response on a patient's behalf. This replaces a telephone process where
  accountability was implicit in the call.
- **Accessibility:** The patient-facing surface is in-app. Given the hospital's
  patient population, the in-app experience must not assume a recent device or fast
  connection, and the telephone path (BR-001) exists as the equivalent route for
  patients the application cannot serve. Specific conformance targets have not yet
  been agreed with the Product Owner.
- **Security and Compliance:** Waitlist records contain patient-identifying
  scheduling information. Working position for this iteration is to treat the data
  as personal information — a patient sees only their own record, staff see only the
  specialty they administer — with rigour proportionate to a time-boxed internal
  exercise using mocked calendar data. Applicability of a formal healthcare data
  framework is an Open Decision.

**Contextual Quality Attributes**

- **Usability:** Directly patient-facing for a population with mixed digital
  confidence. Specific usability expectations have not yet been defined.
- **Data Quality:** The waitlist is the single operational record of demand for the
  specialty; position and status must be correct at the point staff act on them.

---

## 10. Deferred Behaviour

**Deferred Functional Behaviour**

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

**Deferred Business Rules**

- Rules governing claim deadlines and automated cascade order — dependent on the
  deferred timer and cascade behaviour.
- Rules governing prerequisite satisfaction before an offer may be made.

**Deferred Quality Attributes**

- A measurable reliability target for offer delivery, and a formal accessibility
  conformance target. Both require Product Owner input and are recorded as
  Outstanding Actions in Section 16.

**Future Product Specifications**

| Product Specification | Status |
|---|---|
| Slot Claim & Booking Confirmation | Planned |
| Physician Schedule Management | Planned |
| Appointment Prerequisites | Planned |
| Multi-Specialty Waitlist | Planned |

**Deferred Behaviour Rationale**

The approved Use Case spans eight specialties and several operational concerns that
each carry their own business policy. Specifying them here would mean inventing
policy that has not been agreed — particularly around clinical prerequisites and
physician availability, where the hospital's actual rules are not yet documented.
The waitlist mechanic is independently valuable, demonstrable end-to-end, and
extends to further specialties without re-specification.

**Progressive Product Definition Notes**

Deferred behaviour is intentional. This Product Specification is complete for the
agreed MVP — waitlist visibility, slot offer, and patient response across both
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
| Patient-reported visibility of waitlist status | TBC | Product Owner |

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

Targets marked TBC have not been invented and require Product Owner input.

---

## 12. Dependencies

**Business Dependencies**

| Dependency | Description | Status |
|---|---|---|
| Patient registration | Patients must be registered in hospital records before joining a waitlist | Assumed available |
| Contact preference captured at registration | US-003, US-009 and US-011 depend on the patient record stating how each patient wishes to be contacted. Staff ask and save this during the patient's first registration | **Confirmed** |
| Specialist calendar visibility | Staff must be able to see that a slot has freed up in order to release it | Assumed available |

**Product Dependencies**

None. This Feature is the first in the Use Case and does not depend on another
Product Specification.

**External Dependencies**

None identified for this iteration. Mocked calendar and status data are used, per
the delivery constraints in Section 5.

---

## 13. Risks

**Product Risks**

| Risk | Impact | Mitigation |
|---|---|---|
| The 40% call-reduction objective is not backed by a formal study | The Feature may be judged against a target that was never achievable | Recorded as a leadership-stated objective rather than a requirement; adoption measures in Section 11 establish the realistic ceiling |
| Telephone-preference patients still require a staff call for every offer | Call reduction applies only to the digitally reachable cohort, so the 40% may be unreachable in a population with low digital access | Measure the telephone-preference proportion early (Section 11); automated out-of-app channels are the deferred path to closing this |
| A patient's contact preference may be stale — recorded at first registration and not revisited since | A patient may be reached on a channel they no longer use, and the offer goes unanswered | Staff can see the preference on the waitlist (US-004) and the offer can be passed on (US-010); keeping the preference current belongs to patient registration, not to this Feature |

**Operational Risks**

| Risk | Impact | Mitigation |
|---|---|---|
| Passing on an unanswered offer depends on staff noticing it; there is no timer or alert | A released slot could sit idle | US-004 and US-010 surface the outstanding offer and how long it has been open; automated prompting is deferred |
| Staff must learn a new process during transition from manual tracking | Slower reduction in manual coordination during rollout | Not yet defined — Product Owner decision |
| Information staff currently hold informally may not be captured in the digital waitlist | Patients could be given inaccurate position or status | US-004 surfaces the full list early so discrepancies are visible during the pilot |

**Delivery Risks**

| Risk | Impact | Mitigation |
|---|---|---|
| One-week window with approximately ten hours per person | Scope cannot absorb growth without losing the end-to-end slice | Priority ranking in Section 7 identifies US-005, US-006 and US-007 as the deferrable stories |

---

## 14. Open Decisions

**Outstanding Product Decisions**

| Decision | Owner | Status |
|---|---|---|
| Which specialty is the pilot — cardiology or oncology | Product Owner | Open — both carry 6+ week waits; choice affects demo data, not behaviour |
| Applicable data security and compliance framework | Product Owner | Open — working position recorded in Section 9, proportionate to a time-boxed internal exercise |
| Whether a slot freed by a same-day non-attendance should enter the waitlist, or only advance cancellations | Product Owner | Open — current position is advance cancellations only (Section 5) |

**Resolved Product Decisions**

Carried forward from versions 0.1–0.4, with rationale, so that decision history is
not lost in the realignment to the approved Use Case:

| Decision | Resolution | Rationale |
|---|---|---|
| Waitlist ordering | Strict order of joining, no priority override (BR-006) | Clinical-emergency reordering does not match real clinic behaviour — that risk is a same-day delay, not a waitlist-position issue |
| In-app notification surface | Banner on the patient's waitlist view; no persistent notification centre | No native application in scope; a persistent centre was considered and dropped for this iteration, with the exposure recorded in Risks |
| Unclaimed-offer handling | Staff pass the offer on manually; no timer | Demonstrable without inventing an unvalidated timeout policy |
| Multiple waitlist entries | One active entry per specialty per patient (BR-004) | Simple and sufficient for a single-specialty pilot |
| Position display | Plain position number only; queue length not shown to the patient | Does not over-promise a date, and avoids advertising the size of the backlog |
| Booking mechanic | Accept and decline are in MVP scope; cascade and timer deferred | Gives a complete demonstrable loop from joining to securing an appointment |
| Reaching patients without digital access | Staff call them; staff record the response on their behalf (US-011, BR-010) | A waitlist that only reaches connected patients cannot serve the hospital's stated population or its call-reduction objective |
| Iteration scope | One pilot specialty, hospital-wide business context | Fits the delivery window; extends specialty by specialty without re-specification |

**Notes**

No outstanding decision blocks a stated Acceptance Criterion. The pilot specialty
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
| User Stories | US-001 – US-011 |
| Business Rules | BR-001 – BR-010 |
| Quality Attributes | Reliability, Auditability, Accessibility, Security and Compliance, Usability, Data Quality |
| Supporting Product Artefacts | Journey maps; interactive prototype (Section 6) |

**Related Product Specifications**

| Product Specification | Relationship |
|---|---|
| Slot Claim & Booking Confirmation | Successor — takes over automated offer handling |
| Physician Schedule Management | Sibling — governs how slots come to exist |
| Appointment Prerequisites | Sibling — governs whether an offer may be made |
| Multi-Specialty Waitlist | Successor — extends this Feature beyond the pilot specialty |

---

## 16. Product Readiness Assessment

**Delivery Context** ☑ Parent Use Case, Feature, iteration and future Product
Specification context all recorded.

**Business Understanding** ☑ Business problem, value and outcome understood and
traceable to the approved Use Case.

**Functional Behaviour** ☑ Eleven User Stories, all appropriate to the MVP, all
implementation independent.

**Acceptance Criteria** ☑ All stories carry measurable criteria covering success and
alternate paths. No criterion is blocked by an open decision.

**Business Rules** ☑ BR-001 – BR-010 defined, with an explicit status model.

**Quality Attributes** ◻ Partial — attributes identified and justified, but the
reliability and accessibility targets are not yet agreed.

**Supporting Product Artefacts** ☑ Referenced, with divergences from the prototype
explicitly recorded.

**Deferred Behaviour** ☑ Explicit, with rationale and named successor Product
Specifications.

**Engineering Readiness:** ☐ Draft · ☐ Requires Refinement · ☑ **Ready with Minor
Refinement** · ☐ Engineering Ready

The contact preference dependency that previously held this Product Specification at
Requires Refinement has been confirmed with hospital operations: staff capture the
preference during a patient's first registration. US-003, US-009 and US-011 are
therefore supported by an existing capability rather than an assumption.

No outstanding item blocks a stated Acceptance Criterion, and no Must story depends
on an unresolved decision. Engineering can begin Technical Specification authoring.
The remaining refinements are Product Owner inputs that can be settled in parallel
with design, which is why this is Ready with Minor Refinement rather than Engineering
Ready.

**Outstanding Actions**

| Action | Owner | Status |
|---|---|---|
| Choose the pilot specialty | Product Owner | Open — affects demonstration data only |
| Agree a reliability target for offer delivery and an accessibility conformance target | Product Owner | Open |
| Set the Success Measure targets currently marked TBC | Product Owner | Open |
| Align the prototype with BR-005 — declining must not cascade automatically | UX | Open |

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
existing hospital capabilities this Feature reads from. Calendar and status data are
mocked for this iteration per the delivery constraints.

**Patient population.** A meaningful proportion of patients will carry a telephone
contact preference. The telephone path is not an edge case to be handled last — it is
a primary path for this population and should be exercised in the demonstration.

**Supporting artefacts.** The interactive prototype demonstrates the digitally
reachable path end-to-end. It does not yet represent contact preference, the
telephone path, or either removal story.

---

## 18. Product Specification Completion

**Delivery Context** ☑ Positioned within the wider Use Case; future Product context
recorded.

**Product Definition** ☑ MVP clearly defined; scope appropriate to the delivery
window; deferred behaviour documented.

**Functional Behaviour** ☑ User Stories, Acceptance Criteria, Business Rules and
Quality Attributes complete for the agreed iteration.

**Product Quality** ☑ Story Navigator standards satisfied. All dependencies confirmed.
Outstanding items are Product Owner inputs that do not affect specified behaviour.

**Product Status:** ☐ Draft · ☑ **In Review** · ☐ Requires Refinement · ☐ Engineering
Ready · ☐ Approved

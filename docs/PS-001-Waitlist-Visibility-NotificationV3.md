# Product Specification

**Product Specification ID:** PS-001
**Version:** 0.4
**Status:** Draft — Requires Refinement
**Product Owner:** j.abarca@elsevier.com
**Date:** 2026-09-30

---

## 1. Delivery Context

**Parent Use Case (Epic)**
- Use Case: Specialist Appointment Scheduling & Waitlist
- Business Objective: Remove phone-dependent, manual waitlist coordination for high-demand specialist appointments, giving patients self-service visibility and reducing staff coordination effort.

**Current Feature**
- Feature: Waitlist Visibility & Slot Availability Notification
- Description: Enables patients to join a specialist's waitlist, see their position, and be notified when a slot opens — without calling the office — while staff maintain the waitlist digitally instead of manually.

**Current Product Iteration:** MVP

**MVP Statement:** The smallest valuable capability is a digital waitlist that patients can see and staff can manage, where staff release an open slot and the next patient in line is notified in-app without a phone call, and that patient can accept or decline the offer. It stops short of automated cascade/timer logic, self-service browsing of open slots independent of queue position, and staff-confirmed booking as an alternative flow — these remain deferred to the Slot Claim & Booking Confirmation Feature.

**Known Future Product Specifications**

| Feature | Status |
|---|---|
| Slot Claim & Booking Confirmation | Planned — covers automated cascade/timer logic, self-service slot browsing, and staff-confirmed booking as an alternative flow |
| Doctor-initiated schedule changes (emergency reschedule, blocking off days) | Identified during stakeholder review, not in MVP scope |

Future Product Specifications beyond this are expected but have not yet been defined.

---

## 2. Overview

**Business Problem:** High-demand specialist appointments are managed via phone and manual waitlists spanning weeks. Patients have no visibility into their position; staff spend significant time on coordination calls.

**Product Summary:** A digital waitlist that patients can join, view their position on, and receive notification from when a slot opens for their specialist, with the ability to accept or decline the slot they are offered. Staff can view and manage the same waitlist, replacing manual tracking.

**Expected Business Outcome:** Reduced staff time spent on waitlist coordination calls; patients gain self-service visibility without needing to call.

**Business Value:** Operational efficiency (reduced staff call volume), customer experience (visibility, reduced frustration), trust (fewer perceived errors/double-bookings from manual tracking).

---

## 3. Business Context

**Current Situation:** Specialist demand runs at roughly twice available capacity (observed: one specialist manages 3 slots/day, 3 days/week). Waitlists are tracked manually by staff, and position/availability updates are communicated only via individual phone calls.

**Desired Future State:** Patients self-serve their waitlist status and are notified in-app when staff release an open slot — no phone call in either direction. Staff no longer maintain the list manually or call patients individually to communicate status.

**Business Process Context:** Sits at the front of appointment booking within the wider Specialist Appointment Scheduling & Waitlist Use Case. This Feature covers list membership, visibility, notification, and the patient's accept/decline response to a specific offer. It does not cover automated cascade/timer handling of unclaimed offers, self-service slot browsing, or staff-confirmed booking as an alternative flow.

**Primary Business Actors:** Patient, Scheduling Staff.

**Primary Stakeholders:** Scheduling/office operations, specialist practice management.

---

## 4. Business Value

**Business Objectives Supported:** Reduce operational cost of manual coordination; improve patient experience and trust for high-demand specialty care.

**Expected Benefits:** Reduced staff call volume; improved patient-perceived transparency; reduced risk of booking errors caused by manually tracked lists.

**Success Measures:** See Section 11.

---

## 5. Scope

**In Scope**
- Patient joining a specialist's waitlist digitally.
- Patient viewing their current waitlist position.
- Patient receiving notification when a slot opens for a specialist they're waitlisted for.
- Staff viewing the digital waitlist for a specialist.
- Staff adding a patient to the waitlist on the patient's behalf (e.g. phone-in request).
- Staff removing a patient from the waitlist.
- Patient removing themselves from a waitlist they joined.
- Patient accepting or declining the specific slot offered to them (see BR-005).
- Scoped to a single specialist within a single clinic for this iteration; multi-specialist support is explicitly out of scope.

**Out of Scope**
- Self-service browsing or booking of open slots independent of queue position; automated timer-based expiry and cascade to the next patient (handled manually by staff in this iteration); staff-confirmed booking as an alternative to patient self-accept. These govern the deferred **Slot Claim & Booking Confirmation** Feature.

**Assumptions**
- Patients interacting with this Feature are already registered patients within the practice's existing patient records; eligibility criteria for waitlist entry beyond that are not defined here.
- **Slot:** a bookable appointment time in a specialist's calendar. Slots free up when a patient cancels a booked appointment ahead of time. That cancellation happens outside this Feature — by phone, or in whichever system holds the specialist's calendar — and is neither handled nor recorded here. What this Feature acts on is a staff member releasing an already-free slot to the waitlist (US-009). No slot is offered to any patient without that staff action.

**Dependencies**
- None identified beyond patient identity/registration already existing in the business's records.

**Constraints**
- None identified beyond the two remaining open decisions in Section 14.

---

## 6. Supporting Product Artefacts

| Artefact | Reference | Covers |
|---|---|---|
| Patient & Staff journey maps | `waitlist-journey-maps_1.html` | Before/after comparison of the manual phone process vs. the digital waitlist, across five stages for each actor |
| Interactive prototype (V2) | `waitlist-prototype_V2.html` | Working patient and staff views for a single specialist: join, position, offer, accept/decline, staff release and reassignment. Source for US-009, US-010 and BR-007 |

**Scope note:** Stages 1–4 of both journeys (joining, checking position, position
updating, and being notified of an open slot) correspond to US-001 through US-006.
Stage 5 — the patient accepting or declining the offered slot — is now in scope as
US-008 following the team decisions recorded in Section 14. The staff-side release and
reassignment actions are also in scope, as US-009 and US-010. What remains **out** of
scope is any automated cascade or timer for unclaimed offers; that falls under
the deferred **Slot Claim & Booking Confirmation** Product Specification (see Section 10).

**Wireframes and visual designs:** to be delivered later by UX. They are not
available at the time of writing and are expected to follow; this Product
Specification does not depend on them for Engineering readiness.

**Known divergences in prototype V2.** V2 is a first build, not final UX. Where it and
this Product Specification differ, the Specification is authoritative unless stated
otherwise:

- **Declining currently cascades automatically.** The prototype notifies the next patient
  the instant someone declines. BR-005 requires staff to release the slot manually. The
  prototype needs to change, not the Specification.
- **US-005 (staff removes a patient) is not built.** The staff table has no remove action.
- **US-007 (patient removes themselves) is not built.** The patient view offers no way to
  leave the waitlist once joined.

Neither removal story has been exercised, so the effect of removing a mid-queue patient on
everyone else's position is untested. Flows absent from V2 are simply not built yet — they
remain in scope and may be covered in a later prototype iteration.

---

## 7. Functional Behaviour

**Functional Behaviour Summary:** Patients can join, view, and leave a specialist's waitlist, are notified when a slot opens, and can accept or decline the slot they are offered. Staff can view the same waitlist and add or remove patients on their behalf, replacing manual tracking.

**Priority key:** **Must** = the MVP does not deliver its stated business outcome without it · **Should** = materially improves operational fitness, deferrable within the iteration if needed · **Could** = desirable, has a workaround.

| Story | Priority |
|---|---|
| US-001 Join a specialist's waitlist | Must |
| US-002 See current waitlist position | Must |
| US-003 Receive slot-availability notification | Must |
| US-004 Staff view of the waitlist | Must |
| US-008 Accept or decline an offered slot | Must |
| US-009 Staff releases an open slot to the waitlist | Must |
| US-010 Staff passes an unanswered offer to the next patient | Must |
| US-005 Staff removes a patient | Should |
| US-006 Staff adds a patient on their behalf | Should |
| US-007 Patient removes themselves | Could |

*Note:* The ordering rule and notification channel that previously blocked US-002 and US-003 were resolved by the team (Section 14, Resolved) — FIFO by join date, and an in-app banner. Both stories are now fully specifiable.

### US-001
**Business Actor:** Patient
**Priority:** Must
**As a** Patient, **I want** to join a specialist's waitlist digitally, **so that** I don't need to call the office to be added.
**Business Outcome:** A new active waitlist entry exists for the patient without staff phone involvement.
**Acceptance Criteria**
- Given a registered patient with no active waitlist entry for a specialist, When they request to join that specialist's waitlist, Then an active waitlist entry is created with status `waiting` and the patient is shown confirmation of having joined.
- Given a registered patient who already holds an active entry for that specialist, When they request to join again, Then no duplicate entry is created (BR-004) and they are shown their existing position.
**Business Rules:** BR-004
**Quality Attributes:** Auditability

### US-002
**Business Actor:** Patient
**Priority:** Must
**As a** Patient, **I want** to see my current waitlist position, **so that** I know where I stand without calling for an update.
**Business Outcome:** The patient can self-check status at any time.
**Acceptance Criteria**
- Given a patient has an active waitlist entry, When they view their waitlist status, Then their current position is displayed as a plain number in the form "#2". The total number of patients waiting is not shown to the patient.
- Given the waitlist contains entries added at different times, When position is calculated, Then it reflects strict FIFO order by join date with no priority override (BR-006).
**Business Rules:** BR-006
**Quality Attributes:** Performance (position should reflect current state, not stale data)

### US-003
**Business Actor:** Patient
**Priority:** Must
**As a** Patient, **I want** to be notified when a slot opens for a specialist I'm waitlisted for, **so that** I can act on it without waiting for a phone call.
**Business Outcome:** The patient learns of an available slot without staff placing a call.
**Acceptance Criteria**
- Given a patient has an active waitlist entry for a specialist, When a staff member releases an open slot to the waitlist and that patient is first in line, Then an in-app banner appears on the patient's waitlist view announcing the open slot.
**Business Rules:** BR-001
**Quality Attributes:** Reliability (notification must be dependably delivered — see Section 9)

### US-004
**Business Actor:** Scheduling Staff
**Priority:** Must
**As a** Scheduling Staff member, **I want** to view the digital waitlist for a specialist, **so that** I can monitor demand and handle exceptions without maintaining a manual list.
**Business Outcome:** Staff have a live, shared view of demand instead of a manually maintained list.
**Acceptance Criteria**
- Given a specialist has one or more active waitlist entries, When a staff member opens that specialist's waitlist, Then they see all active entries with each patient's identity, position and status.
- Given a specialist has no active waitlist entries, When a staff member opens that specialist's waitlist, Then the view states that no patients are waiting and offers no release action (US-009).
- Given an entry has closed as `booked` or `removed`, When a staff member views the waitlist, Then that entry is excluded from the active list and from position numbering (BR-008).
**Business Rules:** BR-008
**Quality Attributes:** Auditability

### US-005
**Business Actor:** Scheduling Staff
**Priority:** Should
**As a** Scheduling Staff member, **I want** to remove a patient from the waitlist, **so that** it accurately reflects current demand.
**Business Outcome:** Stale or no-longer-needed entries are removed by staff.
**Acceptance Criteria**
- Given a patient has an active waitlist entry, When a staff member removes that entry, Then the entry moves to status `removed`, is excluded from position calculations, and the patient no longer receives notifications for that specialist.
- Given the removed patient held position N, When the removal completes, Then every patient behind them moves up one position (BR-008).
- Given the patient being removed currently holds an outstanding offer (`notified`), When a staff member removes them, Then the offer is closed and the slot returns to staff to release again (BR-009).
- Given an entry has already closed as `booked` or `removed`, When a staff member attempts to remove it, Then no change is made and they are told the entry is no longer active.
**Business Rules:** BR-002, BR-008, BR-009
**Quality Attributes:** Auditability (removal action attributable to the staff member who performed it)

### US-006
**Business Actor:** Scheduling Staff
**Priority:** Should
**As a** Scheduling Staff member, **I want** to add a patient to the waitlist on their behalf, **so that** patients who call in are still captured digitally.
**Business Outcome:** Phone-in patients are represented in the same digital waitlist as self-joined patients.
**Acceptance Criteria**
- Given a patient without an active waitlist entry contacts staff directly, When a staff member adds that patient to a specialist's waitlist, Then an active waitlist entry is created with status `waiting`, behaving identically to a self-joined entry (visible to the patient, eligible for notification).
- Given the patient already holds an active entry for that specialist, When a staff member attempts to add them, Then no duplicate entry is created (BR-004) and staff are shown the existing entry and its position.
**Business Rules:** BR-004
**Quality Attributes:** Auditability (entry attributable to the staff member who created it)

### US-007
**Business Actor:** Patient
**Priority:** Could
**As a** Patient, **I want** to remove myself from a waitlist I joined, **so that** I can opt out when I no longer need the appointment.
**Business Outcome:** Patients can voluntarily leave without needing to call staff.
**Acceptance Criteria**
- Given a patient has an active waitlist entry, When they choose to leave the waitlist, Then the entry moves to status `removed`, is excluded from position calculations, and they stop receiving notifications for that specialist.
- Given the departing patient held position N, When they leave, Then every patient behind them moves up one position (BR-008).
- Given the patient currently holds an outstanding offer (`notified`), When they leave the waitlist, Then the offer is closed and the slot returns to staff to release again (BR-009).
**Business Rules:** BR-002, BR-008, BR-009
**Quality Attributes:** —

### US-008
**Business Actor:** Patient
**Priority:** Must
**As a** Patient, **I want** to accept or decline the slot I have been offered, **so that** I can secure or release the appointment without a phone call.
**Business Outcome:** An offered slot is either booked by the patient or released back to staff, without staff phone involvement.
**Acceptance Criteria**
- Given a patient has been offered a specific slot, When they choose to accept it, Then a confirmation step is shown restating the slot date, time and specialist, with options to confirm or go back.
- Given the confirmation step is shown, When the patient confirms, Then the booking is completed for that slot and the patient's waitlist entry is closed as booked.
- Given the confirmation step is shown, When the patient goes back instead, Then no booking is made and the offer remains outstanding and answerable.
- Given a patient has been offered a specific slot, When they decline it, Then that offer is closed, the patient's waitlist entry remains active at its existing position, and the slot returns to staff to offer manually to the next patient (BR-005).
**Business Rules:** BR-005
**Quality Attributes:** Auditability (accept/decline attributable to the patient and timestamped)

### US-009
**Business Actor:** Scheduling Staff
**Priority:** Must
**As a** Scheduling Staff member, **I want** to release an open slot to the waitlist, **so that** the next patient in line is offered it without me calling anyone.
**Business Outcome:** An open slot is offered to the correct patient automatically once staff release it.
**Acceptance Criteria**
- Given a specialist has at least one patient with status `waiting` and no offer is currently outstanding, When a staff member releases an open slot to the waitlist, Then the patient at position 1 moves to status `notified` and receives the notification described in US-003.
- Given no patient currently holds status `waiting`, When a staff member views the waitlist, Then no release action is offered and the view states that no patients are waiting.
- Given an offer is already outstanding for another patient, When a staff member views the waitlist, Then no further release action is offered until that offer is resolved.
**Business Rules:** BR-006 (position order), BR-007 (one outstanding offer at a time)
**Quality Attributes:** Auditability (slot release attributable to the staff member and timestamped)

### US-010
**Business Actor:** Scheduling Staff
**Priority:** Must
**As a** Scheduling Staff member, **I want** to pass an unanswered offer to the next patient, **so that** a slot doesn't sit idle when someone doesn't respond.
**Business Outcome:** An unanswered offer is moved on by staff judgement, with no automated timer.
**Acceptance Criteria**
- Given patient P holds status `notified` and has not responded, When a staff member passes the offer on, Then P returns to status `waiting` at their existing position, and the next patient with status `waiting` moves to `notified` and is notified.
- Given P is the only patient on the waitlist, When a staff member passes the offer on, Then P returns to `waiting` and no new offer is raised.
- Given an offer is outstanding, When a staff member views the waitlist, Then they see which patient the offer is with.
**Business Rules:** BR-005, BR-006, BR-007
**Quality Attributes:** Auditability (reassignment attributable to the staff member and timestamped)

---

## 8. Cross-cutting Business Rules

| Rule ID | Business Rule |
|---|---|
| BR-001 | A patient must be notified when a slot opens for a specialist they hold an active waitlist entry for. Notification is delivered as an in-app banner on the patient's waitlist view. No persistent notification centre is provided in this iteration — a patient who is not viewing the application when the banner appears will not see the offer until they next open it. |
| BR-002 | A waitlist entry may be removed by the patient who holds it or by a staff member; no other party may remove it. An entry is also closed when the patient accepts an offered slot (BR-005). |
| BR-003 | Sending a slot-availability notification does not by itself change a waitlist entry's active status; an entry remains active until explicitly removed by the patient or staff, or closed by acceptance of an offer. |
| BR-004 | A patient may hold at most one active waitlist entry per specialist. No cap applies across different specialists, though multi-specialist support is out of scope for this iteration (Section 5). |
| BR-005 | A patient may accept or decline a slot offered to them. Accepting completes the booking. Declining does not remove the patient's waitlist entry — it only closes that specific offer, and staff manually offers the slot to the next patient. A patient who has declined a specific slot is not offered that same slot again; when staff release it, it goes to the next waiting patient who has not already declined it. The declining patient keeps their position and remains eligible for any future slot. |
| BR-006 | Waitlist position is determined by strict FIFO order by join date. There is no priority or clinical-urgency override. |
| BR-007 | At most one slot offer may be outstanding at a time for a given specialist. While an offer is outstanding, no further slot may be released to the waitlist until that offer is accepted, declined, or passed on by staff. |
| BR-008 | When a waitlist entry closes (`booked` or `removed`), every entry behind it moves up one position, preserving FIFO order (BR-006). Positions are never renumbered by hand. |
| BR-009 | If a patient holding an outstanding offer leaves the waitlist or is removed by staff, that offer is closed and the slot returns to staff to release again. |

**Waitlist Entry Status Model**

| Status | Entered when | Left when | Active? | Counts for position? |
|---|---|---|---|---|
| `waiting` | Patient joins (US-001), staff add them (US-006), or an offer is declined (US-008) or passed on (US-010) | Staff release a slot and they are first in line (US-009) | Yes | Yes |
| `notified` | Staff release a slot to them (US-009) | They accept or decline (US-008), or staff pass the offer on (US-010) | Yes | Yes |
| `booked` | Patient confirms an offered slot (US-008) | Terminal | No | No |
| `removed` | Patient leaves (US-007) or staff remove them (US-005) | Terminal | No | No |

"Active", as used in BR-002 and BR-003, means `waiting` or `notified`. A `booked`
or `removed` entry is closed: excluded from position calculations and from
receiving further notifications.

**Rule Relationships:** BR-003 fixes what does *not* change when a notification is sent, so Engineering doesn't need to guess. BR-005 defines the only two patient responses to an offer and, with BR-003, bounds this Feature against the deferred Slot Claim & Booking Confirmation Feature: the patient's response is in scope, the automated cascade that would follow a decline is not.

---

## 9. Cross-cutting Quality Attributes

**Universal Quality Attributes**
- **Reliability:** Notification delivery must be dependable — given the stated cost of inaction includes lost patients and eroded trust, undelivered notifications directly undermine the Feature's purpose. No measurable target has been agreed with the Product Owner.
- **Auditability:** Every waitlist entry creation and removal must be attributable to who performed it (patient self-service vs. named staff member) and when — this replaces a phone-based process where accountability was implicit in the call.
- **Security/Compliance:** Waitlist records contain patient-identifying scheduling information. Applicability of a specific regulatory framework (e.g. healthcare data handling) has not been confirmed with the Product Owner — flagged in Open Decisions rather than assumed. Prototype working assumption: treat waitlist data as PII; a patient sees only their own record, and staff see only the specialists they administer.
- **Accessibility:** The patient-facing channel is now confirmed as in-app (banner on the waitlist view), so accessibility can be scoped against it. Specific conformance targets have not yet been agreed with the Product Owner.

**Contextual Quality Attributes**
- Customer-facing capability: applicable given direct patient interaction; specific usability/responsiveness expectations not yet defined.

---

## 10. Deferred Behaviour

**Deferred Functional Behaviour**
- Automated timer/cascade logic for unclaimed offers (handled manually by staff this iteration); self-service browsing/booking of open slots independent of queue position; staff-confirmed alternative booking flow; doctor-initiated schedule changes (see Known Future Product Specifications, Section 1).
- **Immediate notification when a patient joins an empty waitlist while a slot is already open.** Considered and deferred — the patient joins at position 1 and staff release the slot as normal, exactly as for any other patient. This is a closed decision, not an outstanding question.
- **Out-of-app notification channels for schedule changes and booking confirmation.** This iteration notifies patients in-app only (BR-001). How a patient is told about a *changed* appointment, and how they receive confirmation of a *booked* one — by email, SMS, phone, or patient portal — is deferred to the next iteration. The channel decision, the events that trigger each message, and message content are all out of scope here. This is a known limitation of the current prototype, where a booked patient is told to "contact the office" for any change.

**Deferred Business Rules**
- Any rule governing claim deadlines or automated cascade order — depends on the deferred timer/cascade logic. Note that the patient's accept/decline response itself is **no longer deferred**; it is specified as US-008 and BR-005.

**Future Product Specifications**

| Product Specification | Status |
|---|---|
| Slot Claim & Booking Confirmation | Planned |
| Doctor-initiated schedule changes | Identified during stakeholder review, not in MVP scope |

**Deferred Behaviour Rationale:** The booking mechanic was undecided at v0.2. Team and UX review since then resolved the patient-facing half of it — accept/decline — which is now in scope as US-008, giving a complete demoable loop from joining the waitlist to securing an appointment. What remains deferred is the automation around it: timer-based expiry and automatic cascade to the next patient would require a timeout policy no one has validated, so staff handle reassignment manually this iteration.

**Progressive Product Definition Notes:** This Product Specification is complete for the agreed MVP (visibility, notification, and patient accept/decline). Engineering should implement US-008 and BR-005 as specified, but should not infer automated cascade, timer-based expiry, self-service slot browsing, or a staff-confirmed booking alternative — those will be defined in the Slot Claim & Booking Confirmation Product Specification.

---

## 11. Success Measures

**Business Success Measures**

| Measure | Target | Owner |
|---|---|---|
| Reduction in staff time spent on waitlist coordination calls | TBC | Product Owner |
| Patient-reported visibility/satisfaction with waitlist status | TBC | Product Owner |

**Operational Success Measures**

| Measure | Target | Owner |
|---|---|---|
| Reduction in manual/phone-based waitlist updates | TBC | Product Owner |

**Adoption Measures**

| Measure | Target | Owner |
|---|---|---|
| Proportion of new waitlist entries created via digital self-join vs. staff-added | TBC | Product Owner |

*Targets are left TBC — figures have not been invented; these need Product Owner input before Engineering handoff.*

---

## 12. Dependencies

No material business dependencies beyond existing patient registration records (see Assumptions, Section 5).

---

## 13. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Staff time investment to learn a new tool/process | Slower-than-expected reduction in manual coordination during rollout | Not yet defined — Product Owner decision |
| Missing/incomplete information in the digital waitlist vs. what staff currently track informally | Patients could be given inaccurate position/status | Requires staff waitlist view (US-004) to surface discrepancies early |
| Manual reassignment depends on staff noticing an unanswered offer — there is no timer or alert | A slot could sit idle if staff don't check the waitlist | US-009/US-010 surface the outstanding offer and the patient holding it directly in the staff view; automated prompting is deferred to the Slot Claim & Booking Confirmation Feature |
| A patient not viewing the application when the banner appears has no other way to learn of the offer | The offer may go unanswered despite the patient being reachable, delaying the slot being filled | Staff see the outstanding offer in their view and can pass it on (US-010); out-of-app channels are deferred to the next iteration (Section 10) |

---

## 14. Open Decisions

### Resolved

| Decision | Resolution | Rationale |
|---|---|---|
| Waitlist ordering | Strict FIFO by join date, no priority override (BR-006) | Clinical-emergency reordering doesn't match real clinic behaviour — that risk is a same-day delay, not a waitlist-position issue |
| Notification channel | In-app banner only (BR-001) | No native app in scope; push adds permission complexity with no demo payoff. A persistent notification centre was considered and dropped for this iteration — the resulting exposure is recorded in Risks (Section 13) |
| Unclaimed-offer reassignment | Staff manually offers to next patient, no timer | Demoable without inventing an unvalidated timeout policy |
| Multi-entry (BR-004) | One active entry per specialist per patient; no cap across different specialists | Simple data model, matches single-specialist scope |
| Specialist scope | Single specialist, single clinic | Matches the singular framing of the original problem |
| Position display | Plain position number only (e.g. "#2"); queue length is not shown to the patient | Doesn't over-promise a specific date, and avoids advertising the size of the backlog |
| Booking mechanic | Accept/decline in MVP scope (US-008, BR-005); cascade/timer deferred | Matches PRD acceptance criteria, gives a complete demoable loop |

### Still open

| Decision | Owner | Status |
|---|---|---|
| Applicable data security/compliance framework for patient waitlist data | Product Owner | Open — prototype assumption recorded in Section 9: treat as PII, patient sees only their own record, staff see only the specialists they administer |
| Whether to extend slot-availability beyond advance cancellations to include same-day no-shows | UX/team, via prototype | Open — current Product Specification position is cancellation-only (Section 5, Assumptions); to be confirmed while building screens |

**Notes:** Neither remaining decision blocks a stated Acceptance Criterion. The compliance framework affects the Security/Compliance Quality Attribute (Section 9) and has a recorded working assumption; the no-show question would widen the slot-availability trigger in Section 5 but does not invalidate any existing criterion.

**Terminology caution:** "no-show" is used in two distinct senses across the source material. The open decision above concerns a *patient not attending a booked appointment*, which might free a slot. Separately, the PRD refers to a patient *not responding to an offer* — that case is already covered in this iteration by manual staff reassignment (BR-005) and is not an open question.

---

## 15. Traceability

| Product Artefact | Reference |
|---|---|
| Use Case (Epic) | Specialist Appointment Scheduling & Waitlist |
| Feature | Waitlist Visibility & Slot Availability Notification |
| Current Iteration | MVP |
| User Stories | US-001 – US-010 |
| Business Rules | BR-001 – BR-009 |
| Quality Attributes | Reliability, Auditability, Security/Compliance, Accessibility |

**Related Product Specifications:** Slot Claim & Booking Confirmation (planned, not yet defined).

---

## 16. Product Readiness Assessment

- Delivery Context ☑ Business Understanding ☑ Functional Behaviour ☑ (US-001 – US-010, none blocked)
- Acceptance Criteria ☑ (all stories now verifiable; the two previously flagged as blocked were unblocked by the Section 14 resolutions)
- Business Rules ☑ (BR-001 – BR-009, all defined)
- Quality Attributes ☑ (partial — compliance framework pending, working assumption recorded; accessibility conformance target not yet agreed)
- Deferred Behaviour ☑

**Engineering Readiness:** ☑ Requires Refinement

Two open decisions remain (Section 14), and neither blocks a stated Acceptance Criterion — a change from v0.2, where four were open and three blocked criteria directly. The compliance framework affects the Security/Compliance Quality Attribute in Section 9 and carries a recorded prototype working assumption; the no-show question would widen the slot-availability trigger in Section 5 but invalidates nothing already written.

The staff-side reassignment interaction that was undefined at v0.3 is now specified as US-009 and US-010, derived from the `waitlist-prototype_V2.html` build. One item still warrants Product Owner attention before this is marked Engineering Ready: the Success Measure targets in Section 11 remain TBC.

---

## 17. Engineering Handoff Notes

Not yet complete — this Product Specification is Requires Refinement, not Engineering Ready. Once the two remaining Open Decisions in Section 14 are resolved and the Success Measure targets in Section 11 are set, this section should record expected business volumes (e.g. specialist capacity/demand ratios — observed at 3 slots/day, 3 days/week for a single specialist) and any known operational considerations relevant to Technical Specification authoring.

---

## 18. Product Specification Status

**Status:** Draft — Requires Refinement

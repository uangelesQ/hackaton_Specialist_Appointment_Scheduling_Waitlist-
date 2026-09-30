# Product Specification

**Product Specification ID:** PS-001
**Version:** 0.2
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

**MVP Statement:** The smallest valuable capability is a digital waitlist that patients can see and staff can manage, with automatic notification when a slot opens. It stops short of the patient claiming/booking that slot, which remains undecided.

**Known Future Product Specifications**

| Feature | Status |
|---|---|
| Slot Claim & Booking Confirmation | Planned — pending decision on self-book vs. staff-confirmed flow |

Future Product Specifications beyond this are expected but have not yet been defined.

---

## 2. Overview

**Business Problem:** High-demand specialist appointments are managed via phone and manual waitlists spanning weeks. Patients have no visibility into their position; staff spend significant time on coordination calls.

**Product Summary:** A digital waitlist that patients can join, view their position on, and receive notification from when a slot opens for their specialist. Staff can view and manage the same waitlist, replacing manual tracking.

**Expected Business Outcome:** Reduced staff time spent on waitlist coordination calls; patients gain self-service visibility without needing to call.

**Business Value:** Operational efficiency (reduced staff call volume), customer experience (visibility, reduced frustration), trust (fewer perceived errors/double-bookings from manual tracking).

---

## 3. Business Context

**Current Situation:** Specialist demand runs at roughly twice available capacity (observed: one specialist manages 3 slots/day, 3 days/week). Waitlists are tracked manually by staff, and position/availability updates are communicated only via individual phone calls.

**Desired Future State:** Patients self-serve waitlist status and are notified automatically when a slot opens; staff no longer maintain the list manually or make individual calls to communicate status.

**Business Process Context:** Sits upstream of appointment booking within the wider Specialist Appointment Scheduling & Waitlist Use Case. This Feature covers list membership, visibility and notification only — not the booking transaction itself.

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
- Applies generally to any specialist/specialty with a waitlist, not only the specific specialist described in source material.

**Out of Scope**
- What happens after notification is sent — self-booking, staff-confirmed booking, response-window expiry, and cascading the offer to the next patient. This governs the deferred **Slot Claim & Booking Confirmation** Feature.

**Assumptions**
- Patients interacting with this Feature are already registered patients within the practice's existing patient records; eligibility criteria for waitlist entry beyond that are not defined here.
- **Slot:** a bookable appointment time in a specialist's calendar. A slot becomes available when a patient cancels a booked appointment in advance of the appointment time. This is the only circumstance that raises a slot-availability event for this Feature.

**Dependencies**
- None identified beyond patient identity/registration already existing in the business's records.

**Constraints**
- None identified beyond the four open decisions in Section 14.

---

## 6. Supporting Product Artefacts

| Artefact | Reference | Covers |
|---|---|---|
| Patient & Staff journey maps | `waitlist-journey-maps_1.html` | Before/after comparison of the manual phone process vs. the digital waitlist, across five stages for each actor |

**Scope note:** Stages 1–3 of both journeys (joining, checking position, position
updating) correspond to US-001, US-002, US-004 and US-006 in this Product
Specification. Stages 4–5 (accepting or declining an offered slot, and offering
an unclaimed slot to the next patient) fall under the deferred **Slot Claim &
Booking Confirmation** Product Specification — they are shown in the artefact
for end-to-end context and are **not** in scope here (see Section 10).

**Wireframes and visual designs:** to be delivered later by UX. They are not
available at the time of writing and are expected to follow; this Product
Specification does not depend on them for Engineering readiness.

---

## 7. Functional Behaviour

**Functional Behaviour Summary:** Patients can join, view, and leave a specialist's waitlist, and are notified when a slot opens. Staff can view the same waitlist and add or remove patients on their behalf, replacing manual tracking.

**Priority key:** **Must** = the MVP does not deliver its stated business outcome without it · **Should** = materially improves operational fitness, deferrable within the iteration if needed · **Could** = desirable, has a workaround.

| Story | Priority |
|---|---|
| US-001 Join a specialist's waitlist | Must |
| US-002 See current waitlist position | Must |
| US-003 Receive slot-availability notification | Must |
| US-004 Staff view of the waitlist | Must |
| US-005 Staff removes a patient | Should |
| US-006 Staff adds a patient on their behalf | Should |
| US-007 Patient removes themselves | Could |

*Note:* US-002 and US-003 are both Must and both currently blocked by Open Decisions (Section 14) — resolving the ordering rule and notification channel is therefore on the critical path for the MVP, not a background task.

### US-001
**Business Actor:** Patient
**Priority:** Must
**As a** Patient, **I want** to join a specialist's waitlist digitally, **so that** I don't need to call the office to be added.
**Business Outcome:** A new active waitlist entry exists for the patient without staff phone involvement.
**Acceptance Criteria**
- Given a registered patient with no active waitlist entry for a specialist, When they request to join that specialist's waitlist, Then an active waitlist entry is created and the patient is shown confirmation of having joined.
**Business Rules:** BR-004 (not yet defined — see Open Decisions, Section 14)
**Quality Attributes:** Auditability

### US-002
**Business Actor:** Patient
**Priority:** Must
**As a** Patient, **I want** to see my current waitlist position, **so that** I know where I stand without calling for an update.
**Business Outcome:** The patient can self-check status at any time.
**Acceptance Criteria**
- Given a patient has an active waitlist entry, When they view their waitlist status, Then their current position is displayed.
- *Note: the ordering rule determining position is an Open Decision (Section 14); this criterion cannot be fully verified until it is resolved.*
**Business Rules:** Pending — see Open Decisions (ordering rule)
**Quality Attributes:** Performance (position should reflect current state, not stale data)

### US-003
**Business Actor:** Patient
**Priority:** Must
**As a** Patient, **I want** to be notified when a slot opens for a specialist I'm waitlisted for, **so that** I can act on it without waiting for a phone call.
**Business Outcome:** The patient learns of an available slot without staff placing a call.
**Acceptance Criteria**
- Given a patient has an active waitlist entry for a specialist, When a slot becomes available for that specialist, Then the patient receives a notification.
- *Note: the notification channel is an Open Decision (Section 14); this criterion cannot be fully verified until it is resolved.*
**Business Rules:** BR-001
**Quality Attributes:** Reliability (notification must be dependably delivered — see Section 9)

### US-004
**Business Actor:** Scheduling Staff
**Priority:** Must
**As a** Scheduling Staff member, **I want** to view the digital waitlist for a specialist, **so that** I can monitor demand and handle exceptions without maintaining a manual list.
**Business Outcome:** Staff have a live, shared view of demand instead of a manually maintained list.
**Acceptance Criteria**
- Given a specialist has one or more active waitlist entries, When a staff member opens that specialist's waitlist, Then they see all active entries with each patient's identity and position.
**Business Rules:** —
**Quality Attributes:** Auditability

### US-005
**Business Actor:** Scheduling Staff
**Priority:** Should
**As a** Scheduling Staff member, **I want** to remove a patient from the waitlist, **so that** it accurately reflects current demand.
**Business Outcome:** Stale or no-longer-needed entries are removed by staff.
**Acceptance Criteria**
- Given a patient has an active waitlist entry, When a staff member removes that entry, Then the entry becomes inactive, is excluded from position calculations, and the patient no longer receives notifications for that specialist.
**Business Rules:** BR-002
**Quality Attributes:** Auditability (removal action attributable to the staff member who performed it)

### US-006
**Business Actor:** Scheduling Staff
**Priority:** Should
**As a** Scheduling Staff member, **I want** to add a patient to the waitlist on their behalf, **so that** patients who call in are still captured digitally.
**Business Outcome:** Phone-in patients are represented in the same digital waitlist as self-joined patients.
**Acceptance Criteria**
- Given a patient without an active waitlist entry contacts staff directly, When a staff member adds that patient to a specialist's waitlist, Then an active waitlist entry is created for the patient, behaving identically to a self-joined entry (visible to the patient, eligible for notification).
**Business Rules:** BR-004 (not yet defined — see Open Decisions, Section 14)
**Quality Attributes:** Auditability (entry attributable to the staff member who created it)

### US-007
**Business Actor:** Patient
**Priority:** Could
**As a** Patient, **I want** to remove myself from a waitlist I joined, **so that** I can opt out when I no longer need the appointment.
**Business Outcome:** Patients can voluntarily leave without needing to call staff.
**Acceptance Criteria**
- Given a patient has an active waitlist entry, When they choose to leave the waitlist, Then the entry becomes inactive, is excluded from position calculations, and they stop receiving notifications for that specialist.
**Business Rules:** BR-002
**Quality Attributes:** —

---

## 8. Cross-cutting Business Rules

| Rule ID | Business Rule |
|---|---|
| BR-001 | A patient must be notified when a slot opens for a specialist they hold an active waitlist entry for. The specific notification channel is not yet defined (see Section 14). |
| BR-002 | A waitlist entry may be removed by the patient who holds it or by a staff member; no other party may remove it. |
| BR-003 | Sending a slot-availability notification does not by itself change a waitlist entry's active status; an entry remains active until explicitly removed by the patient or staff. |
| BR-004 | Whether a patient may hold more than one active waitlist entry — for the same specialist or across multiple specialists — is not yet defined. See Open Decisions (Section 14). |

**Rule Relationships:** BR-003 is a prerequisite for correctly scoping US-002/US-003 against the deferred Slot Claim & Booking Confirmation Feature — it fixes what does *not* change when a notification is sent, so Engineering doesn't need to guess.

---

## 9. Cross-cutting Quality Attributes

**Universal Quality Attributes**
- **Reliability:** Notification delivery must be dependable — given the stated cost of inaction includes lost patients and eroded trust, undelivered notifications directly undermine the Feature's purpose. No measurable target has been agreed; flagged in Open Decisions.
- **Auditability:** Every waitlist entry creation and removal must be attributable to who performed it (patient self-service vs. named staff member) and when — this replaces a phone-based process where accountability was implicit in the call.
- **Security/Compliance:** Waitlist records contain patient-identifying scheduling information. Applicability of a specific regulatory framework (e.g. healthcare data handling) has not been confirmed with the Product Owner — flagged in Open Decisions rather than assumed.
- **Accessibility:** Not yet assessed — requires confirmation of the patient-facing channel(s) before this can be scoped.

**Contextual Quality Attributes**
- Customer-facing capability: applicable given direct patient interaction; specific usability/responsiveness expectations not yet defined.

---

## 10. Deferred Behaviour

**Deferred Functional Behaviour**
- Slot claim and booking flow — whether the patient self-books or staff confirms, response-window handling, and cascading an unclaimed slot to the next patient.

**Deferred Business Rules**
- Any rule governing what happens after notification (claim deadlines, cascade order) — depends on the deferred booking flow.

**Future Product Specifications**

| Product Specification | Status |
|---|---|
| Slot Claim & Booking Confirmation | Planned |

**Deferred Behaviour Rationale:** The booking mechanic was explicitly undecided during Feature definition; including it in this Product Specification would mean inventing business policy. It is deferred to preserve MVP focus on visibility and notification, which is independently valuable and matches the acceptance criteria the business problem specified.

**Progressive Product Definition Notes:** This Product Specification is complete for the agreed MVP (visibility + notification). Engineering should not attempt to infer or implement the slot-claim/booking mechanic from this document — it will be defined in a future Product Specification once that business decision is made.

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
| Undecided ordering rule and notification channel | Feature cannot be fully specified for Engineering until resolved | See Open Decisions |

---

## 14. Open Decisions

| Decision | Owner | Status |
|---|---|---|
| What determines waitlist position (FIFO by join date vs. clinical priority) | Product Owner | Open |
| Which notification channel(s) are supported (SMS / email / portal) | Product Owner | Open |
| Whether a patient can hold more than one active waitlist entry (same or multiple specialists) | Product Owner | Open |
| Applicable data security/compliance framework for patient waitlist data | Product Owner | Open |

**Notes:** These decisions block full Engineering readiness — they are not stylistic gaps. Ordering rule and notification channel each affect a stated Acceptance Criterion (US-002, US-003) directly.

---

## 15. Traceability

| Product Artefact | Reference |
|---|---|
| Use Case (Epic) | Specialist Appointment Scheduling & Waitlist |
| Feature | Waitlist Visibility & Slot Availability Notification |
| Current Iteration | MVP |
| User Stories | US-001 – US-007 |
| Business Rules | BR-001 – BR-004 |
| Quality Attributes | Reliability, Auditability, Security/Compliance, Accessibility |

**Related Product Specifications:** Slot Claim & Booking Confirmation (planned, not yet defined).

---

## 16. Product Readiness Assessment

- Delivery Context ☑ Business Understanding ☑ Functional Behaviour ☑ (US-002/US-003 partially blocked by open decisions)
- Acceptance Criteria ☑ (two explicitly flagged as unverifiable until open decisions resolve)
- Business Rules ☑ (partial — ordering and channel rules pending)
- Quality Attributes ☑ (partial — targets/framework pending)
- Deferred Behaviour ☑

**Engineering Readiness:** ☑ Requires Refinement

Four unresolved Product decisions remain (Section 14). Three of them — ordering rule, notification channel, and multi-entry policy — directly affect stated Acceptance Criteria (US-002, US-003, US-001/US-006 via BR-004). The fourth, the applicable data security/compliance framework, affects the Security/Compliance Quality Attribute in Section 9 rather than a specific Acceptance Criterion. This Product Specification cannot be marked Engineering Ready until all four are resolved.

---

## 17. Engineering Handoff Notes

Not yet applicable — this Product Specification is Requires Refinement, not Engineering Ready. Once the Open Decisions in Section 14 are resolved, this section should record expected business volumes (e.g. specialist capacity/demand ratios) and any known operational considerations relevant to Technical Specification authoring.

---

## 18. Product Specification Status

**Status:** Draft — Requires Refinement

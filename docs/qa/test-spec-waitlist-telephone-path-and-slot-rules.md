# Test Spec: Waitlist Telephone Path & Slot Rules

| | |
|---|---|
| **Feature** | Specialist Waitlist Visibility, Notification & Slot Offer — registry → slot release → acceptance (single specialist, Cardiology demo data) |
| **OpenSpec change** | `waitlist-telephone-path-and-slot-rules` |
| **Product Spec** | `docs/PS-001-Specialist-Waitlist-v2.4.md` · v2.4 · Requires Refinement |
| **Technical spec** | `openspec/changes/waitlist-telephone-path-and-slot-rules/` (proposal, `contact-preference`, `telephone-offer-response`, `offer-targeting`, `waitlist-screens`, design) |
| **UI reference** | `docs/waitlist-prototypeV3.html`, `docs/prototype-walkthroughV3.md`, `docs/waitlist-journey-mapsV3.html` |
| **Date** | 2026-10-01 |
| **Status** | Draft v0.3 — 20 test cases (maximum agreed). Gaps G-01, G-02, G-06, G-12, G-13, G-15 resolved by the Product Owner on 2026-10-01 |

Precedence when sources disagree: PS, then OpenSpec specs, then design, then prototype.

---

## 1. Scope and approach

**Covered:** the agreed flow, in the stories US-001, US-003, US-004, US-006, US-008, US-009, US-010, US-011, with business rules BR-001, BR-004 to BR-008, BR-010 to BR-013 where they apply.

**Out of scope** (PS-001 v2.4 Section 10, deferred):
- US-002 patient-facing position, US-005 staff removal, US-007 patient leaving, BR-009 and the `removed` status. The screens for these are hidden in this iteration, so there are no positive cases for them. Case TC-US004-001 and TC-US001-001 check that they are not shown.
- Automated timer or cascade, out-of-app messaging, real calendar write-back, immediate notification when a patient joins an empty waitlist.
- The 99%-within-60-seconds reliability target and WCAG 2.1 AA: the PS still marks them *Proposed*.
- The 5-second 3G load time: accepted by the Product Owner but measured manually, not by a test case (see G-04).
- Specialty scoping of staff (US-004 AC6, BR-011 staff side): single specialist, so it cannot be tested (G-11).

**Techniques used:** state transition, boundary and edge, negative and permission, concurrency, audit and attribution, business-rule checks, UI behaviour from the prototype.

**Cases assume the demo data in section 4**, which the OpenSpec change creates in task 1.3 and 1.4. They cannot be run until that change is implemented.

**Slot release follows the app (G-01):** staff type the slot date and time and select "Release slot". When a slot has been returned to staff, the date and time are not asked for again. **Labels:** controls the app already has use the app's labels (`Release slot`, `No response — offer to next patient`, `Cancel`); controls that do not exist yet use the prototype's labels (`They accepted`, `They declined`).

---

## 2. Gap and ambiguity log

| ID | Source | What is unclear | What a test case needs |
|---|---|---|---|
| G-01 | PS US-009 AC3; spec `offer-targeting` | How staff identify the slot they release is not defined in the PS. The OpenSpec design and the built app have staff enter a date and time; the prototype releases a fixed slot with one button. | **Resolved 2026-10-01 (revised in v0.3):** follow the app. Staff type the date and time; a returned slot is reused without asking again. This replaces the v0.2 decision to follow the prototype. |
| G-02 | PS US-003 AC6 vs US-008 AC7 | US-003 AC6 shows an outstanding offer with accept and decline to "a patient" who opens the view, but US-008 AC7 hides accept and decline from telephone and not-recorded patients. | Followed US-008 AC7, BR-001 and `contact-preference` (no banner or actions for non-in-app). **Resolved 2026-10-01:** Product Owner confirmed. US-003 AC6 should be scoped to in-app patients in the next PS version. |
| G-03 | PS US-004 AC2, US-010 AC5 | "How long it has been outstanding" has no format or unit. | Exact display format. Cases assert that an elapsed-time value is shown, not its format. |
| G-04 | PS Section 9 | Reliability (99% within 60 s) and WCAG 2.1 AA are *Proposed*. The 3 G / 5 s load time and "3 steps or fewer" are accepted but measured manually. | Confirmation of the Proposed targets. Step count is checked inside TC-US008-001; load time is out of this file. |
| G-05 | PS BR-001, BR-005, BR-012, BR-013 | Marked *Proposed — PO to confirm* (not-recorded = telephone; passed-over not re-offered; first action wins; booking-complete wording). | Confirmation. Cases that rest on them are tagged "Proposed rule" in Notes. |
| G-06 | PS US-011 | Whether a staff-recorded accept or decline needs a confirm step is not stated. The prototype and design use one click. | **Resolved 2026-10-01:** one click, no confirm. The Product Owner will say if it differs. |
| G-07 | Design (open question) | Wording of the notice shown to a telephone or not-recorded patient who holds an offer is pending UX. | Final text. Cases assert only that a notice is shown and no banner or action appears. **Blocked for exact text.** |
| G-08 | Prototype V3 vs PS US-004 AC4 | The prototype staff table lists `booked` entries with "—". The PS excludes them. | PS followed: booked entries are not listed. |
| G-09 | Journey map V3 vs PS Section 10 | The journey map says a patient who joins an empty waitlist is notified immediately; the PS defers it. | Not tested. |
| G-10 | PS US-006 AC4, US-008 AC5, US-009 AC3, US-011 AC6 | Rejection messages ("told…") have no exact wording, except the prototype add-panel text for an unregistered person. | Exact wording. Cases assert the reason, not the string. |
| G-11 | PS US-004 AC6, BR-011 | Specialty scoping cannot be tested with one specialist. | A second specialist. Out of scope. |
| G-12 | Prototype V3 add panel | The prototype lists an unregistered person (Sofía Reyes) in the picker; the built picker lists registered patients only. The unregistered rejection is reachable by API, not by choosing a name in the UI. | **Resolved 2026-10-01:** no lookup field. TC-US006-002 stays API-level. |
| G-13 | PS BR-010, US-011 | How QA observes the audit record (no audit screen in the PS or prototype). | **Resolved 2026-10-01:** reading the audit record through the API or database is acceptable. |
| G-15 | Prototype V3 vs OpenSpec design; PS US-009 AC3, BR-005, BR-013 | With one-button release of a single fixed slot, nothing defines a second slot. | **Resolved 2026-10-01:** moot, because the app has typed date and time, so a second slot (SLOT-B) can be released. The steps that were Blocked (G-15) are active again. |
| G-14 | PS BR-006 | Order of two entries created in the same instant is undefined. | Not needed; cases create entries in distinct steps. |

---

## 3. Risk ranking

| Area | Risk | Why |
|---|---|---|
| Offer resolution (accept, decline, pass-on, staff-recorded) | High | Concurrent or late actions on one offer can double-book or strand a slot (BR-007, BR-012). |
| Offer targeting (declined, passed-over, booked slot) | High | A wrong target offers a slot to someone who refused it, or offers a taken slot twice (BR-005, BR-013). |
| Response channel by preference | High | A patient with two ways to answer, or none, breaks the telephone path (BR-001, US-008 AC7, US-011 AC4). |
| Audit and attribution | Medium | Staff-entered responses must be distinguishable from the patient's own (BR-010). |
| Registry (join, add, duplicate, unregistered) | Medium | Duplicate or phantom entries corrupt the single record (BR-004, US-006 AC4). |
| Screens (columns, hidden controls) | Low | Presentation only, but hidden deferred controls must stay hidden. |

---

## 4. Test data conventions

Each case still sets up its own state and cleans up.

- **Specialist:** Dr. Elena Ruiz, Cardiology.
- **Patients** (from the OpenSpec seed, tasks 1.3 and 1.4):

| Patient | Contact preference | Note |
|---|---|---|
| Maria Gómez | In-app | The patient followed in the walkthrough |
| Ben Carter | In-app | Extra in-app patient |
| Chloe Nguyen | In-app | Extra in-app patient |
| Carlos Mendoza | Telephone | |
| Ana Torres | Not recorded | |
| Jorge Ramírez | Telephone | Registered, not on the waitlist at the start |
| Sofía Reyes | — | Not registered in hospital records. Never seeded |

- **Staff:** Sam Patel (staff 1). The seed also contains a staff member named Maria Gomez; avoid confusing her with patient Maria Gómez.
- **Slots:** SLOT-A = 2026-10-02 10:30 and SLOT-B = 2026-10-02 14:00, both typed by staff in "Slot date and time". The app shows them as `Friday, Oct 2 · 10:30 AM` (2 October 2026 is a Friday; the prototype's "Thursday" is wrong, so compare date and time only).
- **Notation:** `#n` is the position among active entries in join order. "Active" means `waiting` or `notified`.
- **Reset:** re-run the seed, or clear the waitlist, offers, slots and audit tables.

---

## 5. Test cases

### US-001 Join the specialty waitlist

### TC-US001-001: A registered in-app patient joins and sees her status, with no queue position

- **Traces to:** US-001 AC1, BR-004, BR-006 · spec: `waitlist-screens` / "Patient sees their status, not a queue position"
- **Type / Priority:** Positive · UI behaviour / High
- **Pre-conditions:**
  - Carlos Mendoza #1 `waiting`, Ana Torres #2 `waiting`
  - Maria Gómez registered, in-app, no active entry
  - No offer outstanding
- **Test data:** Maria Gómez (patient session), Sam Patel (staff session)

| # | Action | Expected result |
|---|---|---|
| 1 | Maria signs in to the patient view | She sees "You're not on the waitlist yet" and a Join waitlist action |
| 2 | Maria selects Join waitlist | An entry is created with status `waiting`. The screen shows she is on the waitlist, the Waiting status and her join date |
| 3 | Check Maria's patient screen for a queue position, a count of patients waiting, or a Leave action | None of the three is shown in any status |
| 4 | Sam opens the staff view | Maria is listed last at #3, below Carlos #1 and Ana #2, with status Waiting and contact preference In-app |

- **Clean-up:** remove Maria's entry (reset the data).
- **Status:** Draft
- **Notes:** Position exists in the API but is hidden in the UI by decision; step 3 checks the UI only.

### TC-US001-002: Joining twice does not create a second entry

- **Traces to:** US-001 AC2, BR-004 · spec: `waitlist-screens` (add outcomes)
- **Type / Priority:** Negative · Boundary / Medium
- **Pre-conditions:**
  - Maria Gómez #1 `waiting`; no other entries
  - No offer outstanding
- **Test data:** Maria Gómez (patient session)

| # | Action | Expected result |
|---|---|---|
| 1 | Maria sends a second join request for the same specialty (UI if a join action is still reachable, otherwise the API) | No second entry is created; Maria still has exactly one active entry |
| 2 | Maria opens her screen | She is told she is already on the waitlist and still sees the Waiting status |
| 3 | Sam opens the staff view | Maria appears once |

- **Clean-up:** reset the data.
- **Status:** Draft
- **Notes:** In the UI the Join action is hidden once she is on the list, so the duplicate path is mostly API-level.

### US-006 Add a patient on their behalf

### TC-US006-001: Staff add a registered telephone patient and the preference is shown

- **Traces to:** US-006 AC1, AC3, BR-004 · spec: `waitlist-screens` / "Staff add outcomes are explained"
- **Type / Priority:** Positive · Business-rule / High
- **Pre-conditions:**
  - Carlos #1 `waiting`, Ana #2 `waiting`
  - Jorge Ramírez registered, preference Telephone, no active entry
- **Test data:** Jorge Ramírez, Sam Patel

| # | Action | Expected result |
|---|---|---|
| 1 | Sam adds Jorge from "Add a patient on their behalf" | A confirmation is shown that Jorge was added, with his contact preference Telephone |
| 2 | Sam reads the waitlist table | Jorge is #3, status Waiting, preference pill Telephone |
| 3 | Sam adds Jorge again | No second entry is created and Sam is told Jorge is already on the waitlist |

- **Clean-up:** reset the data.
- **Status:** Draft
- **Notes:** Step 3 covers US-006 AC2.

### TC-US006-002: Staff cannot add a person who is not registered, and nothing is created

- **Traces to:** US-006 AC4 · spec: `waitlist-screens` / "Staff add outcomes are explained" · walkthrough step 6
- **Type / Priority:** Negative · Permission and input / High
- **Pre-conditions:**
  - Carlos #1 `waiting`; no other entries
  - Sofía Reyes does not exist in the patient records
- **Test data:** Sofía Reyes (unregistered), Sam Patel (staff token)

| # | Action | Expected result |
|---|---|---|
| 1 | Sam attempts to add Sofía Reyes through the add-patient request (API; she is not selectable in the picker, see G-12) | The request is rejected as patient not found; no entry is created |
| 2 | Check the patient records | No Sofía Reyes patient record exists |
| 3 | Check the on-screen message for this failure | It says the person is not registered in hospital records and must register before joining the waitlist |
| 4 | Sam opens the waitlist | Only Carlos is listed |

- **Clean-up:** none.
- **Status:** Draft
- **Notes:** Step 3 reads the message the screen maps to the error code (G-10, G-12). Exact wording is from the prototype.

### US-004 View the waitlist

### TC-US004-001: The staff table shows position order, contact preference and a call flag, and no deferred controls

- **Traces to:** US-004 AC1, AC2, AC5, BR-001, BR-008 · spec: `waitlist-screens` / "Staff table columns"; `contact-preference` / "Staff see contact preference and which offers need a call"
- **Type / Priority:** Positive · UI behaviour / High
- **Pre-conditions:**
  - Carlos Mendoza #1 `waiting` (Telephone), Ana Torres #2 `waiting` (Not recorded), Maria Gómez #3 `waiting` (In-app)
  - No offer outstanding; a slot SLOT-A is ready to release
- **Test data:** Sam Patel

| # | Action | Expected result |
|---|---|---|
| 1 | Sam opens the staff view | Columns are #, Patient, Contact preference, Status. Rows are in order: Carlos 1, Ana 2, Maria 3. Preference pills read Telephone, Not recorded, In-app |
| 2 | Look for a Joined column and a Remove action on every row | Neither is present |
| 3 | Sam releases SLOT-A | Carlos becomes Notified. His status shows a "requires a call" flag. The control text says it is waiting on Carlos's response and that a call is required. Elapsed time since release is shown (G-03) |
| 4 | Check Ana and Maria's rows | No call flag on either row; both remain Waiting |

- **Clean-up:** reset the data.
- **Status:** Draft
- **Notes:** The Joined column and Remove action are deferred (US-005) and hidden by decision.

### TC-US004-002: An empty waitlist shows a message and no release action

- **Traces to:** US-004 AC3, US-009 AC2 · spec: `waitlist-screens` / "Staff table columns" (Empty waitlist)
- **Type / Priority:** Boundary / Medium
- **Pre-conditions:**
  - No entries on the waitlist; no offer outstanding
- **Test data:** Sam Patel

| # | Action | Expected result |
|---|---|---|
| 1 | Sam opens the staff view | A message states that no patients are waiting; the table has no rows |
| 2 | Look for a release action | None is offered |

- **Clean-up:** none.
- **Status:** Draft

### US-009 Release an open slot

### TC-US009-001: Releasing a slot offers it to the next patient in line only

- **Traces to:** US-009 AC1, US-003 AC2, AC4, BR-001, BR-006, BR-007 · spec: `offer-targeting` / "A released slot goes to the next patient in line"
- **Type / Priority:** Positive · State transition / High
- **Pre-conditions:**
  - Carlos Mendoza #1 `waiting` (Telephone), Ana Torres #2 `waiting` (Not recorded), Maria Gómez #3 `waiting` (In-app)
  - No offer outstanding; no open slot
- **Test data:** SLOT-A (2026-10-02 10:30), Sam Patel, Maria's session

| # | Action | Expected result |
|---|---|---|
| 1 | Sam enters SLOT-A (2026-10-02 10:30) in "Slot date and time" and selects "Release slot" | Carlos moves to `notified` and holds the only outstanding offer for SLOT-A |
| 2 | Sam reads the table | Carlos's status is Notified with a "requires a call" flag. Ana and Maria are still Waiting at #2 and #3 |
| 3 | Maria opens her screen | She sees Waiting status and no banner, no offer |
| 4 | Carlos's entry position | Still #1 |

- **Clean-up:** reset the data.
- **Status:** Draft
- **Notes:** Telephone patient has no patient screen in the prototype; his state is observed only on the staff view.

### TC-US009-002: Only one offer can be outstanding at a time

- **Traces to:** US-009 AC4, BR-007 · spec: `offer-targeting` / "One outstanding offer at a time is preserved"
- **Type / Priority:** Negative · Concurrency / High
- **Pre-conditions:**
  - Carlos #1 `notified` holding an offer for SLOT-A; Ana #2 and Maria #3 `waiting`
- **Test data:** SLOT-A (2026-10-02 10:30), two staff sessions (Sam Patel, and a second staff token)

| # | Action | Expected result |
|---|---|---|
| 1 | Sam opens the staff view | No release action is offered |
| 2 | Submit a second release request through the API while the offer is outstanding | The request is rejected as an offer already outstanding; no second offer exists |
| 3 | Clear the offer (pass it on or record Carlos's decline), then send two release requests at the same moment from the two staff sessions | Exactly one offer is created; the other request is rejected |

- **Clean-up:** reset the data.
- **Status:** Draft

### US-003 Be notified of a slot offer

### TC-US003-001: An in-app patient sees the offer banner, and other patients see none

- **Traces to:** US-003 AC1, AC4, US-008 AC1 · spec: `contact-preference` / "In-app banner only for in-app patients"; `waitlist-screens` / "Offer banner tells the patient what happens if unanswered"
- **Type / Priority:** Positive · UI behaviour / High
- **Pre-conditions:**
  - Maria Gómez #1 `waiting` (In-app), Ben Carter #2 `waiting` (In-app)
  - No offer outstanding
- **Test data:** SLOT-A (2026-10-02 10:30), Sam Patel, Maria and Ben sessions

| # | Action | Expected result |
|---|---|---|
| 1 | Sam enters SLOT-A (2026-10-02 10:30) in "Slot date and time" and selects "Release slot" | Maria becomes `notified`; Ben stays `waiting` |
| 2 | Maria opens her screen (or refreshes) | A banner announces that a slot opened. It shows the slot date 2026-10-02, time 10:30 and Dr. Elena Ruiz, with Accept and Decline, and a note that staff can pass an unanswered offer to the next patient. Status is Notified |
| 3 | Ben opens his screen | Waiting status, no banner |

- **Clean-up:** reset the data.
- **Status:** Draft
- **Notes:** Visible-within-60-seconds is a Proposed target (G-04); here the screen is refreshed manually.

### US-008 Accept or decline an offered slot

### TC-US008-001: An in-app patient accepts after a confirm step and the slot is booked

- **Traces to:** US-008 AC1, AC2, BR-005, BR-008, BR-013 · spec: `offer-targeting` / "A booked slot cannot be released again"
- **Type / Priority:** Positive · State transition / High
- **Pre-conditions:**
  - Maria Gómez #1 `notified` (In-app) holding the offer for SLOT-A
  - Ben Carter #2 `waiting`
- **Test data:** SLOT-A (2026-10-02 10:30), Maria and Sam sessions

| # | Action | Expected result |
|---|---|---|
| 1 | Maria selects Accept | A confirm step restates SLOT-A date, time and Dr. Elena Ruiz, with options to confirm or go back |
| 2 | Maria confirms | Her entry closes as Booked; the screen shows the slot date, time and specialist and says to contact the office to change it. No offer is outstanding |
| 3 | Sam opens the staff view | Maria is not listed; Ben is now #1 |
| 4 | Count the actions from the banner to booked | Two actions (Accept, Confirm), within the accepted "3 steps or fewer" |

- **Clean-up:** reset the data.
- **Status:** Draft

### TC-US008-002: Going back from the confirm step changes nothing

- **Traces to:** US-008 AC3 · spec: `waitlist-screens` (banner)
- **Type / Priority:** Negative · State transition / Medium
- **Pre-conditions:**
  - Maria #1 `notified` (In-app) holding the offer for SLOT-A
- **Test data:** Maria's session

| # | Action | Expected result |
|---|---|---|
| 1 | Maria selects Accept, then Cancel (the app's go-back control) on the confirm step | No booking is made |
| 2 | Maria reads her screen | Status is still Notified and the banner with Accept and Decline is still shown |
| 3 | Maria selects Accept and Confirm | The booking is completed (offer was still answerable) |

- **Clean-up:** reset the data.
- **Status:** Draft

### TC-US008-003: Declining returns the slot to staff, notifies nobody else, and the same slot is not offered to the decliner again

- **Traces to:** US-008 AC4, US-009 AC5, BR-005 · spec: `offer-targeting` / "A released slot goes to the next patient in line"
- **Type / Priority:** Positive · State transition / High
- **Pre-conditions:**
  - Maria Gómez #1 `notified` (In-app) holding the offer for SLOT-A
  - Ben Carter #2 `waiting` (In-app); Chloe Nguyen #3 `waiting` (In-app)
- **Test data:** SLOT-A (2026-10-02 10:30)

| # | Action | Expected result |
|---|---|---|
| 1 | Maria selects Decline | The offer closes. Maria's entry is Waiting at #1 |
| 2 | Check Ben and Chloe | Both remain Waiting; neither is notified (no automatic cascade) |
| 3 | Sam opens the staff view | A returned slot SLOT-A is ready to release, with its original date and time |
| 4 | Sam selects "Release slot" again for the returned SLOT-A (no date or time is asked) | Ben (not Maria) becomes Notified for SLOT-A |

- **Clean-up:** reset the data.
- **Status:** Draft
- **Notes:** The passed-over part of BR-005 (a *Proposed* rule, G-05) is covered in TC-US010-001.

### US-010 Pass an unanswered offer to the next patient

### TC-US010-001: Passing on an unreachable patient moves the offer to the next in line, and the passed-over patient is not re-offered that slot

- **Traces to:** US-010 AC1, US-011 AC3, BR-005, BR-007 · spec: `offer-targeting` / "A passed-over patient is not offered the same slot again"
- **Type / Priority:** Positive · State transition / High
- **Pre-conditions:**
  - Carlos Mendoza #1 `waiting` (Telephone), Ana Torres #2 `notified` (Not recorded) holding the offer for SLOT-A, Maria Gómez #3 `waiting` (In-app)
  - Carlos previously declined SLOT-A (recorded by staff)
- **Test data:** SLOT-A (2026-10-02 10:30), SLOT-B (2026-10-02 14:00), Sam Patel

| # | Action | Expected result |
|---|---|---|
| 1 | Sam selects "No response — offer to next patient" | Ana returns to Waiting at #2. Maria becomes Notified for SLOT-A. Carlos stays Waiting at #1 |
| 2 | Maria declines, then Sam looks at the staff control | Maria returns to Waiting at #3. Carlos (declined), Ana (passed over) and Maria (declined) are all ineligible for SLOT-A, so no eligible patient remains and no release action is offered |
| 3 | Sam enters SLOT-B (2026-10-02 14:00) and releases it | Carlos (#1) is eligible for SLOT-B and is offered it |

- **Clean-up:** reset the data.
- **Status:** Draft
- **Notes:** Proposed rule (BR-005 passed-over, G-05). Step 3 shows a passed-over or declined patient stays eligible for later slots.

### TC-US010-002: Nobody eligible leaves the slot with staff and offers no release action

- **Traces to:** US-010 AC2, US-009 AC6, BR-005 · spec: `offer-targeting` / "Slot returns to staff when no patient is eligible"
- **Type / Priority:** Boundary · State transition / High
- **Pre-conditions:**
  - Ana Torres #1 `notified` (Not recorded) holding the offer for SLOT-A; she is the only patient on the waitlist
- **Test data:** SLOT-A (2026-10-02 10:30), SLOT-B (2026-10-02 14:00), Sam Patel

| # | Action | Expected result |
|---|---|---|
| 1 | Sam selects "No response — offer to next patient" | Ana returns to Waiting at #1. No new offer is raised |
| 2 | Sam reads the staff control | It states that no eligible patient remains for this slot and offers no release action |
| 3 | Submit a release for SLOT-A through the API | The request is rejected as no eligible patient |
| 4 | Sam enters SLOT-B (2026-10-02 14:00) and releases it | Ana is offered SLOT-B (she is eligible for a different slot) |

- **Clean-up:** reset the data.
- **Status:** Draft
- **Notes:** Step 4 is the only place that shows a passed-over patient stays eligible for later slots.

### US-011 Record a telephone patient's response

### TC-US011-001: Staff record a telephone patient's acceptance, and the audit shows it was staff-entered

- **Traces to:** US-011 AC1, BR-010, BR-013 · spec: `telephone-offer-response` / "Staff record a telephone patient's acceptance", "Staff-recorded responses are attributable and distinguishable"
- **Type / Priority:** Positive · Audit and attribution / High
- **Pre-conditions:**
  - Carlos Mendoza #1 `notified` (Telephone) holding the offer for SLOT-A
  - Ana Torres #2 `waiting` (Not recorded)
- **Test data:** SLOT-A (2026-10-02 10:30), Sam Patel

| # | Action | Expected result |
|---|---|---|
| 1 | Sam selects "They accepted" (one click) | Carlos's entry closes as Booked; no offer is outstanding |
| 2 | Sam reads the table | Carlos is not listed; Ana is now #1 |
| 3 | Read the audit record for this action (G-13) | It names Sam Patel, Carlos's entry, SLOT-A and the time, and marks the response as recorded on Carlos's behalf |
| 4 | Sam attempts to release SLOT-A again through the API | The request is rejected: the slot is already booked |

- **Clean-up:** reset the data.
- **Status:** Draft
- **Notes:** Proposed rule for BR-013 wording and the one-click behaviour (G-05, G-06). Audit action name from design is `offer_accepted_by_staff`.

### TC-US011-002: Staff record a not-recorded patient's decline

- **Traces to:** US-011 AC2, AC5, BR-001, BR-005, BR-010 · spec: `telephone-offer-response` / "Staff record a telephone patient's decline"
- **Type / Priority:** Positive · State transition / High
- **Pre-conditions:**
  - Ana Torres #1 `notified` (Not recorded) holding the offer for SLOT-A
  - Maria Gómez #2 `waiting` (In-app)
- **Test data:** SLOT-A (2026-10-02 10:30), Sam Patel

| # | Action | Expected result |
|---|---|---|
| 1 | Sam selects "They declined" | The offer closes; Ana returns to Waiting at #1; Maria is not notified |
| 2 | Sam reads the staff control | The slot is back with staff, ready to release |
| 3 | Sam releases SLOT-A again | Maria is offered the slot; Ana is skipped |
| 4 | Read the audit records | Ana's decline is marked as recorded by Sam Patel on her behalf |

- **Clean-up:** reset the data.
- **Status:** Draft
- **Notes:** Proposed rule (not recorded treated as telephone, G-05).

### BR-001 One response channel per patient

### TC-BR001-001: Each patient answers in exactly one place

- **Traces to:** BR-001, US-008 AC7, US-011 AC4, US-003 AC1 to AC3 · spec: `telephone-offer-response` / "In-app response is refused for non-in-app patients", "Recording is not available for in-app patients"; `contact-preference` / "In-app banner only for in-app patients"
- **Type / Priority:** Negative · Permission / High
- **Pre-conditions:**
  - Carlos Mendoza #1 `notified` (Telephone) holding the offer for SLOT-A
  - Maria Gómez #2 `waiting` (In-app)
- **Test data:** SLOT-A (2026-10-02 10:30), Carlos's and Sam's tokens

| # | Action | Expected result |
|---|---|---|
| 1 | Carlos's patient session submits an in-app accept for his offer (API) | The request is rejected; the offer and his entry are unchanged |
| 2 | Carlos's patient session submits an in-app decline (API) | Rejected, no change |
| 3 | If a patient screen exists for Carlos, open it | A notice is shown; no banner, no Accept or Decline (G-07: wording blocked, only absence is checked) |
| 4 | Sam records Carlos's decline, then releases SLOT-A to Maria and, with Maria holding the offer, looks at the staff control | For Maria (In-app) the control offers only the pass-on action; no "They accepted" or "They declined" |
| 5 | Sam submits a record-accept for Maria's offer through the API | Rejected because the patient responds in the app; no change |

- **Clean-up:** reset the data.
- **Status:** Draft
- **Notes:** G-02: PS wording in US-003 AC6 conflicts; this case follows US-008 AC7. Step 3 is partially Blocked on UX wording (G-07).

### BR-012 First action wins

### TC-BR012-001: Only the first action on an offer is applied

- **Traces to:** BR-012, BR-007, US-008 AC5, US-010 AC4, US-011 AC6, US-003 AC6 · spec: `telephone-offer-response` / "Only one response resolves an offer"; `contact-preference` / "An unseen or stale in-app offer is handled"
- **Type / Priority:** Negative · Concurrency / High
- **Pre-conditions:**
  - Maria Gómez #1 `notified` (In-app) holding the offer for SLOT-A, not yet viewed
  - Ben Carter #2 `waiting` (In-app)
- **Test data:** SLOT-A (2026-10-02 10:30), Sam and Maria sessions

| # | Action | Expected result |
|---|---|---|
| 1 | Sam passes the offer on before Maria opens the app | Maria returns to Waiting; Ben becomes Notified for SLOT-A |
| 2 | Maria then selects Accept and Confirm on her stale screen | Nothing is booked; Maria is told the offer is no longer available. Ben's offer is unchanged |
| 3 | Repeat the setup with Carlos (Telephone) holding the offer. Sam records Carlos's acceptance, then immediately attempts "No response — offer to next patient" | The pass-on is rejected; Sam is told the offer is no longer available and Carlos's booking stands |
| 4 | Repeat the setup with Carlos holding the offer and send Sam's record-accept and a second staff's pass-on at the same moment | Exactly one is applied and the other is rejected |

- **Clean-up:** reset the data.
- **Status:** Draft
- **Notes:** Proposed rule (BR-012, G-05).

### BR-013 Booked slot is not released again

### TC-BR013-001: A booked slot cannot be released again

- **Traces to:** BR-013, US-009 AC3 · spec: `offer-targeting` / "A booked slot cannot be released again"
- **Type / Priority:** Negative · Business-rule / High
- **Pre-conditions:**
  - SLOT-A (2026-10-02 10:30) is booked for Maria Gómez
  - Ben Carter #1 `waiting`; no offer outstanding
- **Test data:** SLOT-A (2026-10-02 10:30), SLOT-B (2026-10-02 14:00), Sam Patel

| # | Action | Expected result |
|---|---|---|
| 1 | Sam opens the staff view after Maria's booking | SLOT-A is marked taken and is not offered for release again; no offer is created and Ben stays Waiting |
| 2 | Submit a release for 2026-10-02 10:30 (the same date and time as SLOT-A) through the API | The request is rejected and Sam is told the slot is already booked; no offer is created |
| 3 | Check that SLOT-A is not offered to anyone | Maria's booking is unchanged |
| 4 | Sam enters SLOT-B (2026-10-02 14:00) and releases it | Ben is offered SLOT-B |

- **Clean-up:** reset the data.
- **Status:** Draft
- **Notes:** Proposed rule (BR-013 wording, G-05). Step 2 enters the date and time in the "Slot date and time" field; a rejected release leaves no offer.

---

### BR-011 Patients see only their own offer

### TC-BR011-001: A patient cannot view or answer another patient's offer

- **Traces to:** BR-011, US-008 AC6 · spec: `contact-preference` (access); design (holder-only access)
- **Type / Priority:** Negative · Permission / High
- **Pre-conditions:**
  - Maria Gómez #1 `notified` (In-app) holding the offer for SLOT-A
  - Ben Carter #2 `waiting` (In-app)
- **Test data:** Ben's token, an unauthenticated request, Maria's offer id

| # | Action | Expected result |
|---|---|---|
| 1 | Ben opens his screen | He sees Waiting status and no banner, nothing about Maria's offer |
| 2 | Ben submits accept for Maria's offer through the API | The request is refused as forbidden; Maria's offer and entry are unchanged |
| 3 | Ben submits decline for Maria's offer through the API | Refused as forbidden; no change |
| 4 | An unauthenticated request submits accept for Maria's offer | Rejected as unauthenticated; no change |

- **Clean-up:** reset the data.
- **Status:** Draft

---

## 6. Coverage matrix

| Item | Covered by |
|---|---|
| US-001 AC1 | TC-US001-001 |
| US-001 AC2 | TC-US001-002 |
| US-003 AC1 | TC-US003-001, TC-BR001-001 |
| US-003 AC2 | TC-US009-001, TC-BR001-001 |
| US-003 AC3 | TC-US011-002 (not-recorded), TC-BR001-001 |
| US-003 AC4 | TC-US009-001 |
| US-003 AC5 | Not covered: needs an offline in-app patient. Left out to stay within the 20-case limit; add a case if the limit is raised |
| US-003 AC6 | TC-BR012-001 (closed offer message); conflict with US-008 AC7 logged as G-02 |
| US-004 AC1, AC2, AC5 | TC-US004-001 |
| US-004 AC3 | TC-US004-002 |
| US-004 AC4 | TC-US008-001, TC-US011-001 |
| US-004 AC6 | Out of scope (G-11) |
| US-006 AC1, AC2, AC3 | TC-US006-001 |
| US-006 AC4 | TC-US006-002 |
| US-008 AC1, AC2 | TC-US008-001 |
| US-008 AC3 | TC-US008-002 |
| US-008 AC4 | TC-US008-003 |
| US-008 AC5 | TC-BR012-001 |
| US-008 AC6 | TC-BR011-001 |
| US-008 AC7 | TC-BR001-001 |
| US-009 AC1 | TC-US009-001 |
| US-009 AC2 | TC-US004-002 |
| US-009 AC3 | TC-BR013-001, TC-US011-001 |
| US-009 AC4 | TC-US009-002 |
| US-009 AC5 | TC-US008-003, TC-US010-001 |
| US-009 AC6 | TC-US010-002 |
| US-010 AC1 | TC-US010-001 |
| US-010 AC2 | TC-US010-002 |
| US-010 AC3 | Not covered (offline in-app patient; same reason as US-003 AC5) |
| US-010 AC4 | TC-BR012-001 |
| US-010 AC5 | TC-US004-001 |
| US-011 AC1 | TC-US011-001 |
| US-011 AC2 | TC-US011-002 |
| US-011 AC3 | TC-US010-001 |
| US-011 AC4 | TC-BR001-001 |
| US-011 AC5 | TC-US011-002 |
| US-011 AC6 | TC-BR012-001 |
| BR-001 | TC-US009-001, TC-US011-002, TC-BR001-001 |
| BR-004 | TC-US001-002, TC-US006-001 |
| BR-005 | TC-US008-003, TC-US010-001, TC-US010-002 |
| BR-006 | TC-US001-001, TC-US009-001 |
| BR-007 | TC-US009-001, TC-US009-002 |
| BR-008 | TC-US008-001, TC-US011-001 |
| BR-010 | TC-US011-001, TC-US011-002 |
| BR-011 | TC-BR011-001 (patient side); staff side out of scope (G-11) |
| BR-012 | TC-BR012-001 |
| BR-013 | TC-BR013-001, TC-US011-001, TC-US008-001 |
| BR-002, BR-003 | No case: BR-002 and BR-003 describe closing and active status and are exercised through the accept and decline cases; no distinct check |
| BR-009 | Out of scope (deferred) |
| US-002, US-005, US-007 | Out of scope (deferred); only their absence is checked in TC-US001-001 and TC-US004-001 |
| Quality targets (reliability, WCAG, 3G load) | Out of scope for this file (G-04); step count checked in TC-US008-001 |

---

## 7. Change log

| Version | Date | Based on | Change |
|---|---|---|---|
| 0.1 | 2026-10-01 | PS-001 v2.4; OpenSpec `waitlist-telephone-path-and-slot-rules`; prototype V3 | First draft, 20 test cases |
| 0.3 | 2026-10-01 | PS-001 v2.4 (unchanged) | Slot release now follows the app (typed date and time), reversing the v0.2 prototype decision. G-15 resolved, the three Blocked (G-15) steps are active again, labels aligned with the app, SLOT-B added to the test data of three cases. Case count unchanged |
| 0.2 | 2026-10-01 | PS-001 v2.4 (unchanged) | Product Owner answers applied: slot release follows the prototype (G-01), G-02, G-06, G-12 and G-13 resolved, new gap G-15, three steps and TC-BR013-001 step 4 marked Blocked. Case count unchanged |

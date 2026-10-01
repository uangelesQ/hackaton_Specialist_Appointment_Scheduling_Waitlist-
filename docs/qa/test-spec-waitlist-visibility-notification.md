# Test Spec: Waitlist Visibility & Slot Availability Notification

| | |
|---|---|
| **Feature** | Waitlist Visibility & Slot Availability Notification (single specialist, single clinic) |
| **OpenSpec change** | `waitlist-visibility-notification` |
| **Product Spec** | `docs/PS-001-Waitlist-Visibility-NotificationV3.md` · v0.4 · Draft — Requires Refinement |
| **Technical spec** | `openspec/changes/waitlist-visibility-notification/` (proposal, `waitlist-membership`, `waitlist-visibility`, `slot-offers`, design) |
| **UI reference** | `docs/waitlist-prototype_V2.html` |
| **Date** | 2026-09-30 |
| **Status** | Draft |

Source precedence when they disagree: PS, then OpenSpec specs, then design, then prototype. Disagreements are in the gap log.

---

## 1. Scope and approach

**Covered:** US-001 to US-010, BR-001 to BR-009, the entry status model, auditability, and the access-control working assumption in PS §9.

**Out of scope (PS §5, §10):** automated timer or cascade for unclaimed offers, self-service slot browsing or booking independent of queue position, staff-confirmed booking as an alternative, doctor-initiated schedule changes, out-of-app notification channels, multi-specialist support, handling of cancellations (they happen outside this feature), same-day no-shows (open decision).

**Not covered:** accessibility conformance and notification-delivery reliability targets (no target agreed in the PS, see G-10).

**Techniques:** state transition (including illegal transitions), boundary and edge cases on the queue, negative and permission checks, concurrency and consistency, audit and attribution, business-rule checks, UI behaviour stated by the PS or specs.

**This document guides later test automation. It contains no automation code.**

---

## 2. Gap and ambiguity log

| ID | Source | What is unclear | What a test needs | Affects |
|---|---|---|---|---|
| G-01 | PS §5 Assumptions, US-009 · spec `slot-offers` | PS says staff "release an already-free slot" but not how the slot (date and time) is identified or validated. The change assumes staff enter a date and time on release. | Decision on slot input fields and validation (for example a past date) | TC-US009-004 |
| G-02 | BR-005, US-005 AC-3, US-007 AC-3 · spec `slot-offers` | "The slot returns to staff to release again" is not defined: does the slot keep its date and time, and how does staff see it? The change assumes it stays open with the same date and time. | Confirm returned-slot behaviour | TC-US005-004, TC-US008-005 |
| G-03 | BR-005, US-009 | What happens when every `waiting` patient has already declined the slot. The change assumes no release action is offered and the slot stays open. | Expected staff view and slot state | TC-US008-009 |
| G-04 | US-010 AC-1, BR-005 | "The next patient with status `waiting`": next in order behind the passed patient, or the first `waiting` patient (who may be ahead and may have declined the slot)? The change assumes the next eligible patient behind the holder who has not declined. | Definition of "next" and of eligibility | TC-US010-003 |
| G-05 | US-008 AC-2 | "The booking is completed" is not defined beyond the entry closing as `booked`. What the patient sees afterwards (the prototype says "You're booked") and whether a booking record exists are not specified. | Expected patient-facing confirmation and booking record | TC-US008-002 (step 4) |
| G-06 | US-003 AC-1, BR-001 | PS requires a banner "announcing the open slot". Banner content (slot date, time, specialist) comes from the spec and prototype, not the PS. | Confirm banner content | TC-US003-004 |
| G-07 | BR-001 vs US-003 / US-009 | BR-001 says a patient must be notified when a slot opens for a specialist they hold an active entry for (reads as all active entries). US-003 and US-009 notify only the patient at position 1. Cases follow US-009. | PO ruling on BR-001 wording | TC-US003-002 |
| G-08 | PS §9, §14 | Compliance framework is an open decision. Working assumption: waitlist data is PII, a patient sees only their own record, staff see only the specialist they administer. With one specialist the staff-scope rule cannot be tested. | Framework decision; multi-specialist scope | TC-SEC-001 to TC-SEC-004 |
| G-09 | PS §9 Auditability, US-001 to US-010 | Audit is required but the PS and specs define no place where the audit record can be read. | Where and how audit records are observed (API, UI, database) | TC-AUD-001 to TC-AUD-003 |
| G-10 | PS §9 | No measurable target for notification delivery reliability, no accessibility conformance target, no usability expectations. | Targets | No cases written |
| G-11 | PS §6 "Known divergences" | Prototype V2 differs from the PS: declining cascades automatically, staff table shows Booked rows, there is no staff remove or patient leave. The PS wins. | None (cases follow the PS) | US-008, US-004, US-005, US-007 |
| G-12 | BR-004 | BR-004 limits only active entries, so a patient with a `booked` entry could join again. The PS does not say whether that is intended. | PO decision | TC-US001-006 |
| G-13 | BR-007, spec `slot-offers` | PS is silent on simultaneous actions (two releases, accept racing pass-on) and on partial failures. The specs define one winner and atomic transitions. Cases derive from BR-007 and the specs. | Confirm | TC-US009-003, TC-BR007-001, TC-REL-001 |
| G-14 | PS §10 | Same-day no-shows are an open decision; current position is cancellation-only (and cancellation is outside this feature). | Decision | No cases written |
| G-15 | US-007, US-008 | No acceptance criterion for a patient leaving a closed entry, and the PS does not define the message when a patient answers an offer that is no longer outstanding. The specs say it is rejected. | Expected message and behaviour | TC-US008-007, TC-US008-008 |
| G-16 | PS §5 Assumptions, spec `waitlist-membership` | PS only assumes joining patients are already registered. Rejection of an unregistered person is a spec assumption. | Confirm | TC-US001-005 |

---

## 3. Test data conventions

Fictional actors (from the prototype and its walkthrough). Each case creates its own state; do not rely on another case.

| Actor | Role | Notes |
|---|---|---|
| Carlos Mendoza | Patient | Registered |
| Maria Gomez | Patient | Registered |
| Ana Torres | Patient | Registered |
| Luis Fernández | Patient | Registered |
| Staff A, Staff B | Scheduling staff | Two staff users, for concurrency and stale-screen cases |
| Dr. Elena Ruiz | Specialist | Dermatology, the single specialist |
| Slot A | Slot | Thursday, Oct 2 · 10:30 AM (prototype value) |
| Slot B | Slot | Friday, Oct 3 · 9:00 AM (test data, not from the PS) |

**W4** (the base state used in most cases): Carlos #1, Maria #2, Ana #3, Luis #4, all `waiting`, joined in that order (Carlos first), no outstanding offer, no open slot.

Status names (`waiting`, `notified`, `booked`, `removed`) are the PS status model. UI wording is not defined by the PS; the prototype uses "Waiting", "Notified" and "Booked".

**Default clean-up:** remove every entry and slot the case created, preferably through the API after each test. A case lists clean-up only when it needs more.

---

## 4. Test cases

### US-001 Join a specialist's waitlist

### TC-US001-001: A registered patient joins an empty waitlist and sees confirmation and position #1

- **Traces to:** US-001 AC-1, US-002 AC-1 · spec: waitlist-membership / "Patient joins the waitlist"
- **Type / Priority:** Positive · Functional / High
- **Pre-conditions:**
  - Maria is registered and has no entry
  - The waitlist is empty
- **Test data:** Maria, Staff A

| # | Action | Expected result |
|---|---|---|
| 1 | Maria opens her waitlist view | The view states she is not on the waitlist and offers a join action |
| 2 | Maria joins the waitlist | A confirmation of having joined is shown, her position is "#1", her entry has status `waiting` |
| 3 | Staff A opens the waitlist | One row is listed: Maria, position 1, status `waiting` |

- **Clean-up:** Default
- **Status:** Draft

### TC-US001-002: A patient who joins behind existing patients gets the next position

- **Traces to:** US-001 AC-1, US-002 AC-2, BR-006
- **Type / Priority:** Positive · Boundary / High
- **Pre-conditions:**
  - Carlos #1 and Ana #2, both `waiting`
  - Maria has no entry
- **Test data:** Carlos, Ana, Maria

| # | Action | Expected result |
|---|---|---|
| 1 | Maria joins the waitlist | Confirmation is shown and her position is "#3" |
| 2 | Carlos and Ana open their views | Their positions are still "#1" and "#2" |

- **Clean-up:** Default
- **Status:** Draft

### TC-US001-003: A duplicate join creates no second entry and shows the existing position

- **Traces to:** US-001 AC-2, BR-004 · spec: waitlist-membership / "One active entry per patient"
- **Type / Priority:** Negative · Boundary / High
- **Pre-conditions:**
  - W4 (Maria #2, `waiting`)
- **Test data:** Maria, Staff A

| # | Action | Expected result |
|---|---|---|
| 1 | Maria submits a second join request (API call or second session, because the UI may hide the join action) | No new entry is created and Maria is shown her existing position "#2" |
| 2 | Staff A opens the waitlist | Maria appears once, at position 2; the list still has 4 rows |

- **Clean-up:** Default
- **Status:** Draft
- **Notes:** Needs an API-level call if the UI hides the join control.

### TC-US001-004: A patient who left can join again and goes to the back of the queue

- **Traces to:** BR-004, BR-006 · spec: waitlist-membership / "One active entry per patient" (rejoin)
- **Type / Priority:** Positive · State transition / Medium
- **Pre-conditions:**
  - W4
- **Test data:** Maria

| # | Action | Expected result |
|---|---|---|
| 1 | Maria leaves the waitlist | Her entry is `removed`; Ana is "#2", Luis is "#3" |
| 2 | Maria joins the waitlist again | A new entry with status `waiting` is created; Maria's position is "#4"; Carlos, Ana and Luis are still #1, #2, #3 |

- **Clean-up:** Default
- **Status:** Draft

### TC-US001-005: A person who is not a registered patient cannot join

- **Traces to:** PS §5 Assumptions · spec: waitlist-membership / "Patient joins the waitlist" (unregistered person)
- **Type / Priority:** Negative · Permission / Low
- **Pre-conditions:**
  - A user identity exists that has no patient record
  - The waitlist is empty
- **Test data:** Unregistered user (fictional)

| # | Action | Expected result |
|---|---|---|
| 1 | The user requests to join the waitlist | The request is rejected |
| 2 | Staff A opens the waitlist | The waitlist is still empty |

- **Clean-up:** Default
- **Status:** Draft
- **Notes:** Spec-derived behaviour (G-16).

### TC-US001-006: A patient with a booked entry tries to join again

- **Traces to:** BR-004
- **Type / Priority:** Boundary · State transition / Medium
- **Pre-conditions:**
  - Carlos's entry is `booked` (he accepted and confirmed Slot A)
- **Test data:** Carlos, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Carlos requests to join the waitlist again | Undefined by the PS (G-12) |

- **Clean-up:** Default
- **Status:** Blocked (G-12)

### US-002 See current waitlist position

### TC-US002-001: A patient sees their position as "#N" with no total count

- **Traces to:** US-002 AC-1 · spec: waitlist-visibility / "Patient views own position"
- **Type / Priority:** Positive · UI / High
- **Pre-conditions:**
  - W4
- **Test data:** Maria

| # | Action | Expected result |
|---|---|---|
| 1 | Maria opens her waitlist view | Her position is displayed as "#2" |
| 2 | Maria looks for the number of patients waiting | No total (for example "of 4") is displayed anywhere on her view |

- **Clean-up:** Default
- **Status:** Draft

### TC-US002-002: Position follows join order, including patients added by staff

- **Traces to:** US-002 AC-2, BR-006, US-006 AC-1 · spec: waitlist-visibility / "Waitlist position is FIFO by join date"
- **Type / Priority:** Positive · Business rule / High
- **Pre-conditions:**
  - The waitlist is empty
  - Carlos, Ana and Maria have no entry
- **Test data:** Carlos, Ana, Maria, Staff A

| # | Action | Expected result |
|---|---|---|
| 1 | Carlos joins | Carlos is "#1" |
| 2 | Staff A adds Ana on her behalf | Ana is "#2" |
| 3 | Maria joins | Maria is "#3" |
| 4 | Staff A opens the waitlist | Order is Carlos, Ana, Maria, matching the order in which the entries were created |

- **Clean-up:** Default
- **Status:** Draft

### TC-US002-003: A patient's position updates after a patient ahead of them leaves

- **Traces to:** US-002 (Performance: position reflects current state), BR-008 · spec: waitlist-visibility / "Closing an entry moves others up"
- **Type / Priority:** Positive · Consistency / High
- **Pre-conditions:**
  - Carlos #1, Ana #2, Maria #3, all `waiting`
- **Test data:** Carlos, Ana, Maria

| # | Action | Expected result |
|---|---|---|
| 1 | Maria opens her view | Position "#3" |
| 2 | Ana leaves the waitlist | Ana's entry is `removed` |
| 3 | Maria refreshes her view | Position "#2", with no manual renumbering |

- **Clean-up:** Default
- **Status:** Draft

### TC-US002-004: A notified patient keeps their position and stays active

- **Traces to:** BR-003, status model (`notified` counts for position)
- **Type / Priority:** Positive · State transition / High
- **Pre-conditions:**
  - W4
  - Staff A has released Slot A; Carlos is `notified`
- **Test data:** Carlos, Maria, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Carlos opens his view | Position is still "#1" |
| 2 | Maria opens her view | Position is still "#2" |
| 3 | Staff A opens the waitlist | Carlos is listed at position 1 with status `notified`; all four patients are still listed |

- **Clean-up:** Default
- **Status:** Draft

### US-003 Receive slot-availability notification

### TC-US003-001: The first patient in line sees an in-app banner after staff release a slot

- **Traces to:** US-003 AC-1, US-009 AC-1, BR-001 · spec: slot-offers / "Notified patient sees an in-app banner"
- **Type / Priority:** Positive · UI / High
- **Pre-conditions:**
  - W4
- **Test data:** Carlos, Staff A, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Carlos opens his waitlist view | No banner is shown |
| 2 | Staff A releases Slot A | The release succeeds |
| 3 | Carlos refreshes or reopens his waitlist view | A banner announcing the open slot is shown |

- **Clean-up:** Default
- **Status:** Draft

### TC-US003-002: Patients who are not first in line see no banner

- **Traces to:** US-003 AC-1, US-009 AC-1 · spec: slot-offers / "Notified patient sees an in-app banner" (other patients)
- **Type / Priority:** Negative · Business rule / High
- **Pre-conditions:**
  - W4
  - Staff A has released Slot A; Carlos is `notified`
- **Test data:** Maria, Ana, Luis

| # | Action | Expected result |
|---|---|---|
| 1 | Maria, Ana and Luis each open their waitlist views | None of them sees an offer banner |
| 2 | Staff A opens the waitlist | Maria, Ana and Luis still have status `waiting` |

- **Clean-up:** Default
- **Status:** Draft
- **Notes:** Follows US-009 (G-07: BR-001 reads as notifying every active entry).

### TC-US003-003: A patient who was not in the app when the slot was released sees the banner on their next visit

- **Traces to:** BR-001, US-003 (Reliability) · spec: slot-offers / "Offer persists until next visit"
- **Type / Priority:** Positive · Reliability / High
- **Pre-conditions:**
  - W4
  - Carlos is logged out
- **Test data:** Carlos, Staff A, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A releases Slot A while Carlos is logged out | Carlos's entry is `notified` |
| 2 | Carlos logs in later and opens his waitlist view | The banner announcing the open slot is shown, and he can respond to the offer |

- **Clean-up:** Default
- **Status:** Draft

### TC-US003-004: The banner shows the slot date, time and specialist

- **Traces to:** US-003 AC-1 · spec: slot-offers / "Notified patient sees an in-app banner"
- **Type / Priority:** Positive · UI / Medium
- **Pre-conditions:**
  - W4
  - Staff A has released Slot A; Carlos is `notified`
- **Test data:** Carlos, Slot A (Thursday, Oct 2 · 10:30 AM), Dr. Elena Ruiz

| # | Action | Expected result |
|---|---|---|
| 1 | Carlos opens his waitlist view | The banner and offer show Thursday, Oct 2 · 10:30 AM with Dr. Elena Ruiz |

- **Clean-up:** Default
- **Status:** Draft
- **Notes:** The PS only requires "announcing the open slot"; the content is from the spec and prototype (G-06).

### US-004 Staff view of the waitlist

### TC-US004-001: Staff see all active entries with identity, position and status

- **Traces to:** US-004 AC-1 · spec: waitlist-visibility / "Staff views the waitlist"
- **Type / Priority:** Positive · Functional / High
- **Pre-conditions:**
  - W4
- **Test data:** Staff A

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A opens the waitlist | Four rows in position order: Carlos 1, Maria 2, Ana 3, Luis 4, each with status `waiting` |

- **Clean-up:** Default
- **Status:** Draft

### TC-US004-002: An empty waitlist shows a message and no release action

- **Traces to:** US-004 AC-2, US-009 AC-2 · spec: waitlist-visibility / "Staff views the waitlist" (empty)
- **Type / Priority:** Boundary · UI / High
- **Pre-conditions:**
  - The waitlist is empty
- **Test data:** Staff A

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A opens the waitlist | The view states that no patients are waiting |
| 2 | Staff A looks for a release action | No release action is offered |

- **Clean-up:** Default
- **Status:** Draft

### TC-US004-003: A booked entry is removed from the staff list and the positions close up

- **Traces to:** US-004 AC-3, BR-008 · spec: waitlist-visibility / "Closing an entry moves others up"
- **Type / Priority:** Positive · State transition / High
- **Pre-conditions:**
  - W4
  - Staff A has released Slot A; Carlos is `notified`
- **Test data:** Carlos, Maria, Staff A, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Carlos accepts and confirms the offer | Carlos's entry is `booked` |
| 2 | Staff A opens the waitlist | Carlos is not listed; three rows: Maria 1, Ana 2, Luis 3 |

- **Clean-up:** Default
- **Status:** Draft

### TC-US004-004: A removed entry is excluded from the staff list

- **Traces to:** US-004 AC-3 · spec: waitlist-visibility / "Staff views the waitlist" (closed entries)
- **Type / Priority:** Positive · Functional / Medium
- **Pre-conditions:**
  - W4
- **Test data:** Ana, Staff A

| # | Action | Expected result |
|---|---|---|
| 1 | Ana leaves the waitlist | Ana's entry is `removed` |
| 2 | Staff A opens the waitlist | Ana is not listed; three rows: Carlos 1, Maria 2, Luis 3 |

- **Clean-up:** Default
- **Status:** Draft

### TC-US004-005: Staff can see which patient holds the outstanding offer

- **Traces to:** US-004 AC-1, US-010 AC-3 · spec: waitlist-visibility / "Staff views the waitlist" (outstanding offer)
- **Type / Priority:** Positive · UI / High
- **Pre-conditions:**
  - W4
  - Staff A has released Slot A; Carlos is `notified`
- **Test data:** Carlos, Staff A

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A opens the waitlist | Carlos is shown with status `notified` and identified as the holder of the outstanding offer; the other three are `waiting` |

- **Clean-up:** Default
- **Status:** Draft

### US-005 Staff removes a patient

### TC-US005-001: Removing a mid-queue patient moves everyone behind them up

- **Traces to:** US-005 AC-1, AC-2, BR-002, BR-008 · spec: waitlist-membership / "Staff removes a patient"
- **Type / Priority:** Positive · Boundary / High
- **Pre-conditions:**
  - W4
- **Test data:** Ana (#3), Staff A

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A removes Ana's entry | Ana's entry is `removed` |
| 2 | Staff A opens the waitlist | Carlos 1, Maria 2, Luis 3; Ana is not listed |
| 3 | Ana opens her waitlist view | She is shown as not on the waitlist |

- **Clean-up:** Default
- **Status:** Draft

### TC-US005-002: A removed patient is not offered a later slot

- **Traces to:** US-005 AC-1 (no longer receives notifications), US-009 AC-1
- **Type / Priority:** Positive · Business rule / High
- **Pre-conditions:**
  - Carlos #1, Maria #2, Ana #3, all `waiting`, no outstanding offer
- **Test data:** Carlos, Maria, Staff A, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A removes Carlos's entry | Carlos is `removed`; Maria is "#1" |
| 2 | Staff A releases Slot A | Maria becomes `notified` and sees the banner; Carlos sees no banner and is not on the waitlist |

- **Clean-up:** Default
- **Status:** Draft

### TC-US005-003: Removing the patient who holds the offer closes the offer and notifies nobody else

- **Traces to:** US-005 AC-3, BR-009 · spec: slot-offers / "Closing an offer by removal returns the slot"
- **Type / Priority:** Positive · State transition / High
- **Pre-conditions:**
  - W4
  - Staff A has released Slot A; Carlos is `notified`
- **Test data:** Carlos, Maria, Staff A, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Staff B removes Carlos's entry | Carlos is `removed`; his offer is closed |
| 2 | Maria opens her waitlist view | She is "#1", status `waiting`, and no banner is shown |
| 3 | Staff B opens the waitlist | Three rows, all `waiting`; no offer is outstanding; a release action is available |

- **Clean-up:** Default
- **Status:** Draft

### TC-US005-004: After the holder is removed, the returned slot goes to the next waiting patient

- **Traces to:** US-005 AC-3, BR-009, BR-006 · spec: slot-offers / "Closing an offer by removal returns the slot"
- **Type / Priority:** Positive · State transition / Medium
- **Pre-conditions:**
  - As at the end of TC-US005-003 (Carlos `removed`, Maria #1 `waiting`, Ana #2, Luis #3, no outstanding offer), set up directly
- **Test data:** Maria, Staff A, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A releases the returned slot | Maria becomes `notified` and sees the banner |

- **Clean-up:** Default
- **Status:** Draft
- **Notes:** How staff identify the returned slot is open (G-02).

### TC-US005-005: Removing an entry that is already removed makes no change and tells staff

- **Traces to:** US-005 AC-4 · spec: waitlist-membership / "Staff removes a patient" (closed entry)
- **Type / Priority:** Negative · State transition / Medium
- **Pre-conditions:**
  - W4
  - Staff A and Staff B both have the waitlist open, showing Ana (#3)
- **Test data:** Ana, Staff A, Staff B

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A removes Ana's entry | Ana is `removed` |
| 2 | Staff B (stale screen) removes Ana's entry | No change is made and Staff B is told the entry is no longer active |
| 3 | Staff B refreshes the waitlist | Carlos 1, Maria 2, Luis 3 |

- **Clean-up:** Default
- **Status:** Draft

### TC-US005-006: Removing an entry that is already booked makes no change and tells staff

- **Traces to:** US-005 AC-4
- **Type / Priority:** Negative · State transition / Medium
- **Pre-conditions:**
  - Carlos's entry is `booked`; Maria #1 `waiting`
- **Test data:** Carlos, Maria, Staff A

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A attempts to remove Carlos's entry (API call, since the booked entry is not listed) | No change is made and Staff A is told the entry is no longer active; Carlos's entry stays `booked` |

- **Clean-up:** Default
- **Status:** Draft

### US-006 Staff adds a patient on their behalf

### TC-US006-001: A phone-in patient added by staff behaves like a self-joined entry

- **Traces to:** US-006 AC-1 · spec: waitlist-membership / "Staff adds a patient on their behalf"
- **Type / Priority:** Positive · Functional / High
- **Pre-conditions:**
  - The waitlist is empty
  - Luis has no entry
- **Test data:** Luis, Staff A, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A adds Luis to the waitlist | An entry with status `waiting` is created; Luis is at position 1 in the staff list |
| 2 | Luis opens his waitlist view | He sees his entry and position "#1" |
| 3 | Staff A releases Slot A | Luis becomes `notified` and sees the banner |

- **Clean-up:** Default
- **Status:** Draft

### TC-US006-002: Adding a patient who already has an active entry creates no duplicate and shows the existing entry

- **Traces to:** US-006 AC-2, BR-004 · spec: waitlist-membership / "One active entry per patient"
- **Type / Priority:** Negative · Boundary / High
- **Pre-conditions:**
  - W4 (Maria #2, `waiting`)
- **Test data:** Maria, Staff A

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A adds Maria to the waitlist | No entry is created; Staff A is shown Maria's existing entry and its position (2) |
| 2 | Staff A opens the waitlist | Maria appears once; four rows |

- **Clean-up:** Default
- **Status:** Draft

### US-007 Patient removes themselves

### TC-US007-001: A patient leaves and everyone behind them moves up

- **Traces to:** US-007 AC-1, AC-2, BR-002, BR-008 · spec: waitlist-membership / "Patient removes themselves"
- **Type / Priority:** Positive · Boundary / High
- **Pre-conditions:**
  - W4
- **Test data:** Maria (#2), Staff A

| # | Action | Expected result |
|---|---|---|
| 1 | Maria chooses to leave the waitlist | Her entry is `removed` and her view shows she is not on the waitlist |
| 2 | Staff A opens the waitlist | Carlos 1, Ana 2, Luis 3; Maria is not listed |

- **Clean-up:** Default
- **Status:** Draft

### TC-US007-002: A patient who leaves while holding an offer closes the offer and notifies nobody else

- **Traces to:** US-007 AC-3, BR-009 · spec: slot-offers / "Closing an offer by removal returns the slot"
- **Type / Priority:** Positive · State transition / High
- **Pre-conditions:**
  - W4
  - Staff A has released Slot A; Carlos is `notified`
- **Test data:** Carlos, Maria, Staff A, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Carlos leaves the waitlist | Carlos is `removed`; his offer is closed |
| 2 | Maria opens her waitlist view | She is "#1", status `waiting`, no banner |
| 3 | Staff A opens the waitlist | No outstanding offer; a release action is available |

- **Clean-up:** Default
- **Status:** Draft

### TC-US007-003: A patient cannot remove another patient's entry

- **Traces to:** BR-002 · spec: waitlist-membership / "Patient removes themselves" (other patient's entry)
- **Type / Priority:** Negative · Permission / High
- **Pre-conditions:**
  - W4
- **Test data:** Maria, Ana

| # | Action | Expected result |
|---|---|---|
| 1 | Maria sends a remove request for Ana's entry (API call) | The request is rejected |
| 2 | Staff A opens the waitlist | Ana is still listed at position 3, status `waiting` |

- **Clean-up:** Default
- **Status:** Draft

### US-008 Accept or decline an offered slot

### TC-US008-001: Accepting shows a confirmation step before any booking is made

- **Traces to:** US-008 AC-1 · spec: slot-offers / "Patient accepts an offer with confirmation"
- **Type / Priority:** Positive · UI / High
- **Pre-conditions:**
  - W4
  - Staff A has released Slot A; Carlos is `notified`
- **Test data:** Carlos, Slot A, Dr. Elena Ruiz

| # | Action | Expected result |
|---|---|---|
| 1 | Carlos chooses Accept on the offer | A confirmation step restates Thursday, Oct 2 · 10:30 AM and Dr. Elena Ruiz, with options to confirm or go back |
| 2 | Staff A opens the waitlist | Carlos is still `notified`; nothing is booked yet |

- **Clean-up:** Default
- **Status:** Draft

### TC-US008-002: Confirming books the slot and closes the entry as booked

- **Traces to:** US-008 AC-2, BR-002, BR-008 · spec: slot-offers / "Patient accepts an offer with confirmation"
- **Type / Priority:** Positive · State transition / High
- **Pre-conditions:**
  - W4
  - Staff A has released Slot A; Carlos is `notified`
  - Carlos is on the confirmation step
- **Test data:** Carlos, Maria, Staff A, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Carlos confirms | The booking for Slot A is completed and Carlos's entry is `booked` |
| 2 | Staff A opens the waitlist | Carlos is not listed; Maria 1, Ana 2, Luis 3; no outstanding offer; a release action is available |
| 3 | Maria opens her waitlist view | Position "#1" |
| 4 | Carlos opens his view | The view reflects the booking (content not defined by the PS, G-05) and offers no further response to the offer |

- **Clean-up:** Default
- **Status:** Draft
- **Notes:** Step 4 content is open (G-05).

### TC-US008-003: Going back from the confirmation step makes no booking and keeps the offer answerable

- **Traces to:** US-008 AC-3 · spec: slot-offers / "Patient accepts an offer with confirmation" (go back)
- **Type / Priority:** Positive · UI · State transition / High
- **Pre-conditions:**
  - W4
  - Staff A has released Slot A; Carlos is `notified`
- **Test data:** Carlos, Staff A, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Carlos chooses Accept, then chooses to go back | He returns to the offer; no booking is made |
| 2 | Carlos checks the offer | The banner is still shown and Accept and Decline are both available |
| 3 | Staff A opens the waitlist | Carlos is still `notified`; no release action is offered |

- **Clean-up:** Default
- **Status:** Draft

### TC-US008-004: Declining closes the offer and keeps the patient's entry and position

- **Traces to:** US-008 AC-4, BR-005, BR-007 · spec: slot-offers / "Patient declines an offer"
- **Type / Priority:** Positive · State transition / High
- **Pre-conditions:**
  - W4
  - Staff A has released Slot A; Carlos is `notified`
- **Test data:** Carlos, Maria, Staff A, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Carlos declines the offer | The offer is closed; Carlos's entry is `waiting` at position "#1" |
| 2 | Maria opens her waitlist view | Status `waiting`, position "#2", no banner (no automatic notification) |
| 3 | Staff A opens the waitlist | No outstanding offer; a release action is available |

- **Clean-up:** Default
- **Status:** Draft

### TC-US008-005: A declined slot is not offered again to the patient who declined it

- **Traces to:** BR-005 · spec: slot-offers / "Declined slot skips the decliner"
- **Type / Priority:** Positive · Business rule / High
- **Pre-conditions:**
  - W4
  - Carlos was offered Slot A and declined it; no outstanding offer
- **Test data:** Carlos, Maria, Staff A, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A releases Slot A again | Maria (position 2) becomes `notified` and sees the banner |
| 2 | Carlos opens his waitlist view | No banner; status `waiting`, position "#1" |

- **Clean-up:** Default
- **Status:** Draft
- **Notes:** How the same slot is identified when re-released is open (G-02).

### TC-US008-006: A patient who declined one slot is still offered a later, different slot

- **Traces to:** BR-005
- **Type / Priority:** Positive · Business rule / Medium
- **Pre-conditions:**
  - W4
  - Carlos declined Slot A; Maria was then offered Slot A, accepted and confirmed (Maria `booked`)
- **Test data:** Carlos, Ana, Staff A, Slot B

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A releases Slot B | Carlos (position 1) becomes `notified` and sees the banner for Slot B |
| 2 | Staff A opens the waitlist | Carlos 1 `notified`, Ana 2, Luis 3 `waiting` |

- **Clean-up:** Default
- **Status:** Draft

### TC-US008-007: A patient who does not hold the offer cannot accept or decline it

- **Traces to:** US-008 · spec: slot-offers / "Patient accepts an offer with confirmation" (only the offer holder)
- **Type / Priority:** Negative · Permission / Medium
- **Pre-conditions:**
  - W4
  - Staff A has released Slot A; Carlos is `notified`
- **Test data:** Carlos, Maria, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Maria sends an accept request for Carlos's offer (API call) | The request is rejected |
| 2 | Maria sends a decline request for Carlos's offer (API call) | The request is rejected |
| 3 | Staff A opens the waitlist | Carlos is still `notified` and holds the offer |

- **Clean-up:** Default
- **Status:** Draft
- **Notes:** Spec-derived (G-15).

### TC-US008-008: Answering an offer that staff already passed on is rejected

- **Traces to:** US-008, US-010 · spec: slot-offers / "Patient accepts an offer with confirmation" (offer no longer outstanding)
- **Type / Priority:** Negative · State transition / High
- **Pre-conditions:**
  - W4
  - Staff A has released Slot A; Carlos is `notified` and has his offer open on screen
- **Test data:** Carlos, Maria, Staff A, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A passes the offer on | Carlos is `waiting` at "#1"; Maria is `notified` |
| 2 | Carlos (stale screen) accepts and confirms | The request is rejected and Carlos is told the offer is no longer available |
| 3 | Staff A opens the waitlist | Carlos `waiting` at 1, Maria `notified`; nothing is booked |

- **Clean-up:** Default
- **Status:** Draft
- **Notes:** The message text is open (G-15).

### TC-US008-009: Every waiting patient has declined the same slot

- **Traces to:** BR-005 · spec: slot-offers / "Patient declines an offer" (every waiting patient has declined)
- **Type / Priority:** Boundary · State transition / Medium
- **Pre-conditions:**
  - Carlos #1 and Maria #2, both `waiting`
  - Both were offered Slot A and declined it
- **Test data:** Carlos, Maria, Staff A, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A opens the waitlist | Undefined by the PS (G-03): expected staff view and slot state |

- **Clean-up:** Default
- **Status:** Blocked (G-03)

### US-009 Staff releases an open slot to the waitlist

### TC-US009-001: Releasing a slot notifies only the patient at position 1

- **Traces to:** US-009 AC-1, BR-006 · spec: slot-offers / "Staff releases an open slot"
- **Type / Priority:** Positive · State transition / High
- **Pre-conditions:**
  - W4
- **Test data:** Staff A, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A releases Slot A | The release succeeds |
| 2 | Staff A opens the waitlist | Carlos is `notified`; Maria, Ana and Luis are `waiting`; positions are unchanged (1 to 4) |

- **Clean-up:** Default
- **Status:** Draft

### TC-US009-002: No release action is offered while an offer is outstanding, and a direct release is rejected

- **Traces to:** US-009 AC-3, BR-007 · spec: slot-offers / "One outstanding offer at a time"
- **Type / Priority:** Negative · Business rule / High
- **Pre-conditions:**
  - W4
  - Staff A has released Slot A; Carlos is `notified`
- **Test data:** Staff A, Slot B

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A opens the waitlist | No release action is offered; Carlos is identified as the offer holder |
| 2 | Staff A sends a release request for Slot B (API call) | The request is rejected; Maria is not notified |

- **Clean-up:** Default
- **Status:** Draft

### TC-US009-003: Two staff releasing at the same moment produce exactly one offer

- **Traces to:** BR-007 · spec: slot-offers / "One outstanding offer at a time" (concurrent releases)
- **Type / Priority:** Negative · Concurrency / High
- **Pre-conditions:**
  - W4
- **Test data:** Staff A, Staff B, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A and Staff B submit a release for Slot A at the same moment | Exactly one succeeds; the other is rejected |
| 2 | Staff A opens the waitlist | Carlos is the only `notified` patient; one outstanding offer; Maria, Ana, Luis are `waiting` |

- **Clean-up:** Default
- **Status:** Draft
- **Notes:** Spec-derived outcome (G-13); needs a way to fire two requests in parallel.

### TC-US009-004: Release requires valid slot details

- **Traces to:** US-009 · spec: slot-offers / "Staff releases an open slot"
- **Type / Priority:** Negative · Boundary / Medium
- **Pre-conditions:**
  - W4
- **Test data:** Staff A

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A tries to release with no slot date and time, and with a date and time in the past | Undefined by the PS (G-01) |

- **Clean-up:** Default
- **Status:** Blocked (G-01)

### US-010 Staff passes an unanswered offer to the next patient

### TC-US010-001: Passing an offer on returns the holder to waiting and notifies the next patient

- **Traces to:** US-010 AC-1, BR-005, BR-006, BR-007 · spec: slot-offers / "Staff passes an unanswered offer to the next patient"
- **Type / Priority:** Positive · State transition / High
- **Pre-conditions:**
  - W4
  - Staff A has released Slot A; Carlos is `notified`
- **Test data:** Carlos, Maria, Staff A, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A passes the offer on | Carlos is `waiting` at "#1"; Maria is `notified` and sees the banner for Slot A |
| 2 | Staff A opens the waitlist | Maria is identified as the offer holder; Ana and Luis are `waiting`; one outstanding offer |

- **Clean-up:** Default
- **Status:** Draft

### TC-US010-002: Passing on when the holder is the only patient raises no new offer

- **Traces to:** US-010 AC-2 · spec: slot-offers / "Staff passes an unanswered offer to the next patient" (only patient)
- **Type / Priority:** Boundary · State transition / Medium
- **Pre-conditions:**
  - Only Carlos is on the waitlist, `waiting` at #1
  - Staff A has released Slot A; Carlos is `notified`
- **Test data:** Carlos, Staff A, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A passes the offer on | Carlos is `waiting` at "#1"; no other offer is raised |
| 2 | Staff A opens the waitlist | No outstanding offer; a release action is available |

- **Clean-up:** Default
- **Status:** Draft

### TC-US010-003: Passing on skips the patient ahead who already declined this slot

- **Traces to:** US-010 AC-1, BR-005
- **Type / Priority:** Boundary · Business rule / Medium
- **Pre-conditions:**
  - W4
  - Carlos declined Slot A; Staff A re-released it and Maria is `notified`
- **Test data:** Carlos, Maria, Ana, Staff A, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A passes Maria's offer on | Undefined by the PS (G-04): Ana (next behind Maria) or Carlos (first `waiting`, but declined this slot) |

- **Clean-up:** Default
- **Status:** Blocked (G-04)

### TC-US010-004: A patient whose offer was passed on stays eligible for the next slot

- **Traces to:** BR-005, status model (`notified` to `waiting`) · spec: slot-offers / "Staff passes an unanswered offer to the next patient"
- **Type / Priority:** Positive · State transition / Medium
- **Pre-conditions:**
  - W4
  - Carlos was offered Slot A and staff passed it on; Maria accepted and confirmed (Maria `booked`)
- **Test data:** Carlos, Ana, Staff A, Slot B

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A releases Slot B | Carlos (position 1, passed on before, never declined) becomes `notified` |

- **Clean-up:** Default
- **Status:** Draft

### TC-US010-005: The pass-on action is only available while an offer is outstanding

- **Traces to:** US-010 · spec: slot-offers / "Staff passes an unanswered offer to the next patient"
- **Type / Priority:** Negative · State transition / Low
- **Pre-conditions:**
  - W4 (no outstanding offer)
- **Test data:** Staff A

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A opens the waitlist | No pass-on action is offered |
| 2 | Staff A sends a pass-on request (API call) | The request is rejected; all four patients stay `waiting` |

- **Clean-up:** Default
- **Status:** Draft
- **Notes:** The rejection is spec-derived (G-15).

### Cross-cutting business rules

### TC-BR006-001: Staff have no way to reorder or prioritise entries

- **Traces to:** BR-006
- **Type / Priority:** Negative · Business rule / Low
- **Pre-conditions:**
  - W4
- **Test data:** Staff A

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A inspects the waitlist view for controls to reorder, prioritise or mark urgent | No such control exists; order is Carlos 1, Maria 2, Ana 3, Luis 4 |

- **Clean-up:** Default
- **Status:** Draft

### TC-BR007-001: A patient accepting and staff passing on the same offer leave one consistent outcome

- **Traces to:** BR-007 · spec: slot-offers / "Offers are reliable and auditable" (simultaneous response and pass-on)
- **Type / Priority:** Negative · Concurrency / High
- **Pre-conditions:**
  - W4
  - Staff A has released Slot A; Carlos is `notified` and on the confirmation step
- **Test data:** Carlos, Maria, Staff A, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Carlos confirms and Staff A passes the offer on at the same moment | Exactly one action succeeds; the other is rejected |
| 2 | Staff A opens the waitlist | Either (a) Carlos is `booked` and not listed, and Maria is not notified, or (b) Carlos is `waiting` at 1 and Maria is `notified`. Never both Carlos booked and Maria notified, and never two offers |

- **Clean-up:** Default
- **Status:** Draft
- **Notes:** Spec-derived (G-13).

### TC-BR008-001: Booking closes the entry and only the entries behind it move up

- **Traces to:** BR-008 · spec: waitlist-visibility / "Closing an entry moves others up"
- **Type / Priority:** Positive · Boundary / Medium
- **Pre-conditions:**
  - W4
  - Carlos declined Slot A; Staff A re-released it and Maria (#2) is `notified`
- **Test data:** Carlos, Maria, Ana, Luis, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Maria accepts and confirms | Maria is `booked` |
| 2 | Staff A opens the waitlist | Carlos is still 1, Ana moves from 3 to 2, Luis from 4 to 3; Maria is not listed |

- **Clean-up:** Default
- **Status:** Draft

### Entry status model (end to end)

### TC-STS-001: A patient goes from waiting to notified to booked

- **Traces to:** Status model, US-001 AC-1, US-003 AC-1, US-008 AC-2, US-009 AC-1
- **Type / Priority:** Positive · State transition · End-to-end / High
- **Pre-conditions:**
  - The waitlist is empty
  - Carlos has no entry
- **Test data:** Carlos, Staff A, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Carlos joins the waitlist | Entry `waiting`, position "#1" |
| 2 | Staff A releases Slot A | Carlos is `notified`; Carlos sees the banner |
| 3 | Carlos accepts and confirms | Entry is `booked` |
| 4 | Staff A opens the waitlist | The waitlist is empty and a message states no patients are waiting |

- **Clean-up:** Default
- **Status:** Draft

### Access control (working assumption, PS §9)

### TC-SEC-001: A patient sees only their own record

- **Traces to:** PS §9 Security/Compliance working assumption · spec: waitlist-visibility / "Waitlist data is access-controlled"
- **Type / Priority:** Negative · Permission / High
- **Pre-conditions:**
  - W4
- **Test data:** Maria, Ana

| # | Action | Expected result |
|---|---|---|
| 1 | Maria requests the full waitlist (API call) | The request is denied |
| 2 | Maria requests Ana's entry (API call) | The request is denied |
| 3 | Maria opens her waitlist view | Only her own entry and position are shown; no other patient's name or position appears |

- **Clean-up:** Default
- **Status:** Draft
- **Notes:** Framework is open (G-08).

### TC-SEC-002: A patient cannot perform staff actions

- **Traces to:** US-006, US-009, US-010, BR-002 · spec: waitlist-membership / "Only authorised actors may act"
- **Type / Priority:** Negative · Permission / High
- **Pre-conditions:**
  - W4
  - Staff A has released Slot A; Carlos is `notified`
- **Test data:** Maria, Luis

| # | Action | Expected result |
|---|---|---|
| 1 | Maria attempts each of: staff add of a patient, release a slot, pass the offer on, remove another patient's entry (API calls) | Every request is rejected |
| 2 | Staff A opens the waitlist | Nothing changed: Carlos `notified`, the others `waiting`, four entries |

- **Clean-up:** Default
- **Status:** Draft

### TC-SEC-003: Unauthenticated requests are rejected

- **Traces to:** spec: waitlist-membership / "Only authorised actors may act"
- **Type / Priority:** Negative · Permission / Medium
- **Pre-conditions:**
  - W4
- **Test data:** No credentials

| # | Action | Expected result |
|---|---|---|
| 1 | Without a session, send each waitlist action: view, join, leave, release, accept, decline, pass on | Every request is rejected |
| 2 | Staff A opens the waitlist | Unchanged: four `waiting` entries |

- **Clean-up:** Default
- **Status:** Draft

### TC-SEC-004: Patient personal details do not appear in logs

- **Traces to:** PS §9 Security/Compliance · spec: waitlist-visibility / "Waitlist data is access-controlled"
- **Type / Priority:** Positive · Security / Low
- **Pre-conditions:**
  - W4
- **Test data:** Carlos, Staff A, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Run a release, an accept and a rejected request, then inspect the application logs | No patient names or other personal details appear in the logs |

- **Clean-up:** Default
- **Status:** Draft
- **Notes:** Observable only by log inspection.

### Reliability and consistency

### TC-REL-001: A failure during release leaves entry, offer and slot consistent

- **Traces to:** PS §9 Reliability · spec: slot-offers / "Offers are reliable and auditable" (failure during release)
- **Type / Priority:** Negative · Consistency / Medium
- **Pre-conditions:**
  - W4
  - A fault can be injected part-way through a release (for example by failing the offer write)
- **Test data:** Staff A, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A releases Slot A while the fault is active | The release is reported as failed |
| 2 | Staff A opens the waitlist | All four entries are `waiting`; no offer is outstanding; Carlos sees no banner |

- **Clean-up:** Remove the injected fault, then default
- **Status:** Draft
- **Notes:** Spec-derived (G-13); needs fault injection, which may not be possible through the UI.

### Auditability

### TC-AUD-001: Entry creation is attributed to the patient or the named staff member

- **Traces to:** PS §9 Auditability, US-001, US-006 · spec: waitlist-membership / "Entry creation and removal are auditable"
- **Type / Priority:** Positive · Audit / High
- **Pre-conditions:**
  - The waitlist is empty
- **Test data:** Carlos (self-join), Ana (added by Staff A)

| # | Action | Expected result |
|---|---|---|
| 1 | Carlos joins; Staff A adds Ana | Audit records exist for each: the actor (Carlos as patient, Staff A as staff), the entry and the time — where these can be read is undefined (G-09) |

- **Clean-up:** Default
- **Status:** Blocked (G-09)

### TC-AUD-002: Entry removal is attributed to the patient or the named staff member

- **Traces to:** PS §9 Auditability, US-005, US-007 · spec: waitlist-membership / "Entry creation and removal are auditable"
- **Type / Priority:** Positive · Audit / High
- **Pre-conditions:**
  - W4
- **Test data:** Maria (self-leave), Ana (removed by Staff A)

| # | Action | Expected result |
|---|---|---|
| 1 | Maria leaves; Staff A removes Ana | Audit records exist for each: the actor, the entry and the time — where these can be read is undefined (G-09) |

- **Clean-up:** Default
- **Status:** Blocked (G-09)

### TC-AUD-003: Release, accept, decline and pass-on are attributed and timestamped

- **Traces to:** US-008, US-009, US-010 (Auditability) · spec: slot-offers
- **Type / Priority:** Positive · Audit / High
- **Pre-conditions:**
  - W4
- **Test data:** Carlos, Maria, Staff A, Slot A

| # | Action | Expected result |
|---|---|---|
| 1 | Staff A releases Slot A; Carlos declines; Staff A releases again; Staff A passes the offer on; Ana accepts and confirms | Audit records exist for each action: the actor, the slot and the time — where these can be read is undefined (G-09) |

- **Clean-up:** Default
- **Status:** Blocked (G-09)

---

## 5. Coverage matrix

| Item | Test cases |
|---|---|
| US-001 AC-1 | TC-US001-001, TC-US001-002, TC-STS-001 |
| US-001 AC-2 | TC-US001-003 |
| US-002 AC-1 | TC-US002-001, TC-US001-001 |
| US-002 AC-2 | TC-US002-002, TC-US001-002 |
| US-003 AC-1 | TC-US003-001, TC-US003-002, TC-US003-003, TC-US003-004 |
| US-004 AC-1 | TC-US004-001, TC-US004-005 |
| US-004 AC-2 | TC-US004-002 |
| US-004 AC-3 | TC-US004-003, TC-US004-004 |
| US-005 AC-1 | TC-US005-001, TC-US005-002 |
| US-005 AC-2 | TC-US005-001 |
| US-005 AC-3 | TC-US005-003, TC-US005-004 |
| US-005 AC-4 | TC-US005-005, TC-US005-006 |
| US-006 AC-1 | TC-US006-001 |
| US-006 AC-2 | TC-US006-002 |
| US-007 AC-1 | TC-US007-001 |
| US-007 AC-2 | TC-US007-001 |
| US-007 AC-3 | TC-US007-002 |
| US-008 AC-1 | TC-US008-001 |
| US-008 AC-2 | TC-US008-002, TC-STS-001 |
| US-008 AC-3 | TC-US008-003 |
| US-008 AC-4 | TC-US008-004 |
| US-009 AC-1 | TC-US009-001, TC-STS-001 |
| US-009 AC-2 | TC-US004-002 |
| US-009 AC-3 | TC-US009-002 |
| US-010 AC-1 | TC-US010-001, TC-US010-003 (Blocked) |
| US-010 AC-2 | TC-US010-002 |
| US-010 AC-3 | TC-US004-005 |
| BR-001 | TC-US003-001, TC-US003-002, TC-US003-003 (see G-07) |
| BR-002 | TC-US005-001, TC-US007-001, TC-US007-003, TC-SEC-002 |
| BR-003 | TC-US002-004 |
| BR-004 | TC-US001-003, TC-US001-004, TC-US006-002, TC-US001-006 (Blocked) |
| BR-005 | TC-US008-004, TC-US008-005, TC-US008-006, TC-US010-001, TC-US010-004, TC-US008-009 (Blocked) |
| BR-006 | TC-US001-002, TC-US002-002, TC-US009-001, TC-BR006-001 |
| BR-007 | TC-US009-002, TC-US009-003, TC-BR007-001 |
| BR-008 | TC-US002-003, TC-US004-003, TC-US005-001, TC-US007-001, TC-BR008-001 |
| BR-009 | TC-US005-003, TC-US007-002 |
| Quality: Auditability | TC-AUD-001, TC-AUD-002, TC-AUD-003 (all Blocked, G-09) |
| Quality: Reliability | TC-US003-003, TC-REL-001 (no target defined, G-10) |
| Quality: Performance (current position) | TC-US002-003 |
| Quality: Security/Compliance | TC-SEC-001 to TC-SEC-004 (framework open, G-08) |
| Quality: Accessibility | Not covered (G-10) |
| Open decision: same-day no-shows | Not covered (G-14) |

Every acceptance criterion and business rule has at least one runnable (Draft) case. The 7 Blocked cases cover G-01, G-03, G-04, G-09 (three cases) and G-12; they add coverage once those gaps are resolved.

---

## 6. Change log

| Version | Date | PS version | Change |
|---|---|---|---|
| 0.1 | 2026-09-30 | v0.4 (`...V3.md`) | First draft: 60 cases (53 Draft, 7 Blocked) |

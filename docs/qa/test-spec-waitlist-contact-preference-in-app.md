# Test Spec: Contact Preference Set in the App

| | |
|---|---|
| **Feature** | Specialist Waitlist — contact preference chosen and changed in the application, demo registration step (single specialist, Cardiology demo data) |
| **OpenSpec change** | `waitlist-contact-preference-in-app` |
| **Product Spec** | `docs/PS-001-Specialist-Waitlist-v2.5.md` · v2.5 · **Draft** (hospital operations have not confirmed the change, PS Section 14) |
| **Technical spec** | `openspec/changes/waitlist-contact-preference-in-app/` (proposal, design, deltas for `contact-preference`, `demo-registration`, `waitlist-membership`, `telephone-offer-response`, `waitlist-screens`); main specs in `openspec/specs/` |
| **UI reference** | `docs/waitlist-prototypeV3.html` (V4 does not exist yet; new screen text comes from the OpenSpec design and the built app) |
| **Implementation status** | 25 of 25 tasks done. The previous change `waitlist-telephone-path-and-slot-rules` is archived and built |
| **Predecessor** | `docs/qa/test-spec-waitlist-telephone-path-and-slot-rules.md` (v0.3, PS v2.4, 20 cases) |
| **Date** | 2026-10-02 |
| **Status** | Draft v0.1 — 26 test cases (limit agreed: up to 30) |

Precedence when sources disagree: PS, then OpenSpec specs, then design, then prototype.

---

## 1. Scope and approach

**This is a delta spec.** It holds cases only for what PS v2.5 adds or changes. Behaviour that did not change is covered by the predecessor spec; section 4 says which of its cases still apply and what they need.

**Covered**
- US-012 Choose how to be contacted, and US-013 Set or change how I am contacted (all criteria).
- Changed criteria: US-001 AC3, US-003 AC3, US-004 AC5, US-006 AC4–AC6, US-008 AC8, US-011 AC7.
- Rules BR-014 to BR-021, and the changed BR-001.
- Appendix A1, the demo registration step (included at the Product Owner's request, although it is not Product scope).

**Out of scope**
- US-002, US-005, US-007 and BR-009 (deferred), staff correcting a recorded preference, telephone numbers, contact options other than in-app and telephone, passing a change back to hospital registration, and any screen showing change history (PS Section 10).
- The 60-second reliability target and WCAG 2.1 AA (still *Proposed*, G-10).
- Behaviour that did not change in v2.5 (see section 4).

**Techniques used:** state transition (preference states and the offer lifecycle), boundary and edge, negative and permission, concurrency and consistency (a change racing an action), audit and attribution, business-rule checks, UI behaviour.

---

## 2. Gap and ambiguity log

| ID | Source | What is unclear | What a test case needs |
|---|---|---|---|
| G-01 | PS Draft; Section 14; Section 16 | Hospital operations have not confirmed that patients set and change the preference (US-012, US-013, US-006 AC4–AC6, BR-014 to BR-017, BR-019 to BR-021). The earlier position (read-only) was confirmed with them | Confirmation. If they refuse, the OpenSpec change is reverted and these cases become obsolete. Every case below depends on it |
| G-02 | US-012 AC2 | The option descriptions are *Proposed*. The app shows "In-app — offers appear in the app" and "Telephone — staff will call you" (OpenSpec proposal) | Final wording. Cases quote the app text and assert the meaning |
| G-03 | BR-017; PS Section 9 | "Applies at once, within the time set for a newly released offer" rests on the *Proposed* 60-second target. The app polls every 10 seconds | Confirmed target. Cases allow up to 60 seconds and check the app within that time |
| G-04 | BR-020 | "The most recent write applies" involves hospital registration, which is not built. Only writes made inside the app can be tested | A second real writer. TC-BR020-001 uses two writes made through the app |
| G-05 | US-013 last criterion; Section 9 | The record of previous and new values is shown on no screen. QA needs audit access | Read access to the `audit_log` table (action `contact_preference_set`; columns patient_id, previous_value, new_value, actor, time) |
| G-06 | US-012 AC6 | A join that fails after the choice was saved cannot be caused from outside the app by normal use | A way to make the join request fail. The case blocks the join request in the browser |
| G-07 | PS vs OpenSpec | The PS names no screen text for the preference card or the choose-then-join step. The text ("How we contact you", "Not chosen yet", "Confirm and join") comes from the OpenSpec design and the built app | Prototype V4 or UX wording. Expected screen text is quoted from the app and may change |
| G-08 | Appendix A1 AC3 | The PS says "name already in use". The OpenSpec spec adds a case-insensitive, trimmed comparison. The PS is silent on case | PS decision. TC-A1-003 follows the OpenSpec behaviour and says so |
| G-09 | BR-019 | A patient who is waiting with no preference cannot be created through the app now that joining is gated. That state exists only through the demo seed (Ana Torres) | Seed data (SEED-DEMO in section 3) |
| G-10 | PS Section 9 | The 60-second target and WCAG 2.1 AA are *Proposed* | PO confirmation. Not tested here |
| G-11 | PS Section 5 | Telephone numbers are held in hospital records outside this Feature; nothing is captured or shown | Nothing to test. Recorded so it is not mistaken for a gap in the cases |

Gaps carried from the predecessor spec that still matter: G-05 there (Proposed rules BR-005, BR-012, BR-013 wording) and G-07 there (wording of the notice shown to a telephone patient holding an offer).

---

## 3. Test data conventions

Each case still sets up its own state and resets afterwards.

**Seeds** (from `apps/api/src/db/seed.ts`)

| Seed | Content |
|---|---|
| **SEED-BASE** | People only, empty waitlist |
| **SEED-DEMO** | SEED-BASE plus Carlos Mendoza waiting at #1 and Ana Torres waiting at #2, both added before the gate existed. This is the only way to have a waiting patient with no preference (G-09) |

**Patients:** Maria Gómez (in-app), Diego Herrera (in-app), Valeria Tapia (in-app), Carlos Mendoza (telephone), Ana Torres (**no preference**), Jorge Ramírez (telephone). **Not registered:** Sofía Reyes. **New in this spec (fictional):** Lucía Fernández, created by demo registration.

**Staff:** Ricardo Salazar (staff 1), Guadalupe Ortega (staff 2).

**Slot:** SLOT-A = 2026-10-03 10:30, typed by staff in "Slot date and time". Compare date and time only, not the weekday.

**Sessions:** a "session" is one signed-in browser context. Cases that need two sessions say so.

**Environment:** demo login enabled (`DEMO_LOGIN=true`) unless the case says otherwise. Audit checks read the `audit_log` table (G-05).

---

## 4. Carried forward from the predecessor spec

These flows did not change in v2.5. The cases stay valid but need the new seed names (the previous names Ana, Ben, Chloe, David, Eva and staff Sam Patel no longer exist) and the build is now complete, so the cases that were Blocked in the predecessor can be run.

| Predecessor case(s) | Status for v2.5 |
|---|---|
| TC-US001-001, TC-US001-002 | Valid. Use Maria Gómez (has a preference). Ana now needs a choice first (TC-US001-003, TC-US012-001) |
| TC-US003-001, TC-US009-001, TC-US009-002, TC-US010-001, TC-US010-002, TC-US008-001, TC-US008-002, TC-US008-003 | Valid. Rename actors; previously Blocked cases can now run |
| TC-US004-001, TC-US004-002, TC-US006-001, TC-US006-002 | Valid. TC-US006-001 now uses Jorge, who has a recorded preference, so no choice is asked |
| TC-US011-001, TC-US011-002, TC-BR001-001, TC-BR011-001, TC-BR012-001, TC-BR013-001 | Valid. TC-US011-002 uses the waiting patient with no preference (Ana, SEED-DEMO). Previously Blocked cases can now run |
| TC-BR011-001 (patients see only their own offer) | Valid and extended by TC-US013-009 for the preference |

The Playwright suite in `playwright-suite/` still uses the previous names and staff, and has 11 skipped tests that should now be switched on.

---

## 5. Test cases

### US-001 and US-012 Join the waitlist, choosing how to be contacted

### TC-US001-003: Joining without a recorded preference is refused and creates no entry

- **Traces to:** US-001 AC3, BR-014 · spec: `waitlist-membership` / "Patient joins the waitlist" (No recorded preference)
- **Type / Priority:** Negative · Business-rule / High
- **Pre-conditions:**
  - SEED-BASE: empty waitlist
  - Ana Torres has no recorded preference and no active entry
- **Test data:** Ana Torres (patient token), Ricardo Salazar (staff session)

| # | Action | Expected result |
|---|---|---|
| 1 | Ana sends a join request directly (API) | The request is refused with "a choice is required" (409 `preference_required`); no entry is created |
| 2 | Ricardo opens the staff view | The message "No patients are currently waiting." is shown and Ana is not listed |
| 3 | Read Ana's own waitlist data (API) | It shows no entry and a contact preference of none |

- **Clean-up:** none.
- **Status:** Draft
- **Notes:** Depends on G-01. The API step proves the gate holds for any client, not only the web screen.

### TC-US012-001: A patient with no preference is asked to choose, with each option described, before joining

- **Traces to:** US-012 AC1, AC2, BR-014 · spec: `waitlist-screens` / "A patient with no preference chooses before joining" (Choice asked before joining)
- **Type / Priority:** Positive · UI behaviour / High
- **Pre-conditions:**
  - SEED-BASE: empty waitlist
  - Ana Torres has no recorded preference and no active entry
- **Test data:** Ana Torres, Ricardo Salazar

| # | Action | Expected result |
|---|---|---|
| 1 | Ana signs in as a patient | The card "How we contact you" shows "Not chosen yet" with a "Choose" action, and the card "You're not on the waitlist yet" shows "Join waitlist" |
| 2 | Ana selects "Join waitlist" | The text "Choose how you would like to be contacted when a slot opens." appears with two options: "In-app — offers appear in the app" and "Telephone — staff will call you". "Confirm and join" is disabled until an option is selected |
| 3 | Ricardo opens the staff view | Ana is not listed; no entry was created |

- **Clean-up:** none.
- **Status:** Draft
- **Notes:** Option wording is *Proposed* (G-02); screen text is from the app (G-07).

### TC-US012-002: Choosing and confirming saves the preference, creates the entry, and confirms both

- **Traces to:** US-012 AC3, AC7, BR-014, BR-015 · spec: `waitlist-screens` / "A patient with no preference chooses before joining" (Chosen and joined); `contact-preference` / "Every preference change is auditable" (First choice is audited)
- **Type / Priority:** Positive · Audit and attribution / High
- **Pre-conditions:**
  - SEED-BASE with Carlos Mendoza added to the waitlist by staff, so he is #1 `waiting`
  - Ana Torres has no recorded preference and no active entry
- **Test data:** Ana Torres, Ricardo Salazar, access to `audit_log` (G-05)

| # | Action | Expected result |
|---|---|---|
| 1 | Ana signs in, selects "Join waitlist", chooses "Telephone", and selects "Confirm and join" | A notice reads "Contact preference saved: Telephone. You're on the waitlist."; the card "How we contact you" shows "Telephone"; her entry is `waiting` |
| 2 | Ricardo opens the staff view | Ana is listed after Carlos with status Waiting and contact preference Telephone |
| 3 | Read the audit record of the save | One `contact_preference_set` record: actor is patient Ana, time is set, previous value is empty, new value is `telephone` |

- **Clean-up:** reset the data.
- **Status:** Draft
- **Notes:** Depends on G-01. Audit access is G-05.

### TC-US012-003: Leaving the choice without choosing saves nothing and creates no entry

- **Traces to:** US-012 AC4, BR-014 · spec: `waitlist-screens` / "A patient with no preference chooses before joining" (Left without choosing)
- **Type / Priority:** Negative · Boundary / Medium
- **Pre-conditions:**
  - SEED-BASE: empty waitlist; Ana Torres has no recorded preference and no active entry
- **Test data:** Ana Torres, Ricardo Salazar

| # | Action | Expected result |
|---|---|---|
| 1 | Ana signs in, selects "Join waitlist", selects "In-app", then selects "Cancel" | The options close and the card "You're not on the waitlist yet" shows "Join waitlist" again |
| 2 | Look at the card "How we contact you" | It still shows "Not chosen yet" |
| 3 | Ricardo opens the staff view; read the audit table | Ana is not listed and no `contact_preference_set` record exists for her |

- **Clean-up:** none.
- **Status:** Draft

### TC-US012-004: A patient who already has a recorded preference joins without being asked

- **Traces to:** US-012 AC5 · spec: `waitlist-membership` / "Patient joins the waitlist" (Patient who already has a preference is not asked again)
- **Type / Priority:** Positive · Business-rule / Medium
- **Pre-conditions:**
  - SEED-BASE: empty waitlist; Maria Gómez has preference In-app and no active entry
- **Test data:** Maria Gómez

| # | Action | Expected result |
|---|---|---|
| 1 | Maria signs in and selects "Join waitlist" | No options are shown; she is placed on the waitlist and confirmation says she is on the waitlist |
| 2 | Look at the card "How we contact you" | It still shows "In-app" |

- **Clean-up:** reset the data.
- **Status:** Draft

### TC-US012-005: A failed join after the choice keeps the preference, and a retry does not ask again

- **Traces to:** US-012 AC6, BR-015 · spec: `waitlist-screens` / "A patient with no preference chooses before joining" (Join fails after the choice was saved); `contact-preference` / "A patient with no recorded preference must choose before joining" (Preference kept when joining fails)
- **Type / Priority:** Negative · Concurrency and consistency / High
- **Pre-conditions:**
  - SEED-BASE: empty waitlist; Ana Torres has no recorded preference and no active entry
- **Test data:** Ana Torres. Browser tool able to block one request

| # | Action | Expected result |
|---|---|---|
| 1 | Ana signs in, selects "Join waitlist" and chooses "In-app" | The options are shown |
| 2 | Block the join request (the request to join the waitlist) and select "Confirm and join" | A message reads "You have not joined the waitlist. Your contact preference was saved, so you won't be asked again." (followed by the reason); no entry exists |
| 3 | Look at the card "How we contact you" | It shows "In-app" |
| 4 | Stop blocking and select "Join waitlist" again | No options are shown; she joins directly and is on the waitlist |

- **Clean-up:** reset the data.
- **Status:** Draft
- **Notes:** The failure is caused by blocking the request (G-06). If the PS or UX change the message, step 2 changes.

### US-013 Set or change how I am contacted

### TC-US013-001: A patient changes the preference; the new value is shown and the entry is unchanged

- **Traces to:** US-013 AC1, AC3, BR-015, BR-018 · spec: `contact-preference` / "A patient sets or changes their own contact preference" (Patient changes the preference); `waitlist-screens` / "A patient sees and changes their contact preference"
- **Type / Priority:** Positive · State transition / High
- **Pre-conditions:**
  - SEED-BASE with Maria Gómez (In-app) waiting at #1 and Diego Herrera (In-app) waiting at #2
- **Test data:** Maria Gómez, Ricardo Salazar

| # | Action | Expected result |
|---|---|---|
| 1 | Maria signs in; in "How we contact you" select "Change", choose "Telephone", and select "Save" | The card shows "Telephone"; only the current value is shown, no history |
| 2 | Look at Maria's entry | Status is still Waiting |
| 3 | Ricardo opens the staff view | Maria is still #1 with status Waiting and preference Telephone; Diego is #2 |

- **Clean-up:** reset the data.
- **Status:** Draft

### TC-US013-002: A patient already waiting with no preference sets a first one and keeps their place

- **Traces to:** US-013 AC2, BR-019, BR-018, BR-001 · spec: `contact-preference` / "A patient sets or changes their own contact preference" (Patient sets a first preference while waiting)
- **Type / Priority:** Positive · State transition / High
- **Pre-conditions:**
  - SEED-DEMO: Carlos Mendoza (Telephone) waiting at #1; Ana Torres (no preference) waiting at #2
- **Test data:** Ana Torres, Ricardo Salazar, SLOT-A

| # | Action | Expected result |
|---|---|---|
| 1 | Ana signs in | The card "How we contact you" shows "Not chosen yet" and she is shown as waiting |
| 2 | Ana chooses "In-app" and selects "Save" | The card shows "In-app"; her entry is still Waiting |
| 3 | Ricardo opens the staff view | Ana is still #2, status Waiting, preference In-app |
| 4 | Ricardo releases SLOT-A; it goes to Carlos, who is reached by call; Ricardo records that Carlos declined, then releases SLOT-A again | The offer goes to Ana. She sees the in-app banner with Accept and Decline, and the staff view shows no "requires a call" flag for her |

- **Clean-up:** reset the data.
- **Status:** Draft
- **Notes:** Step 4 shows that offers made after the choice follow it. Before the choice she would have been handled as telephone (TC-US003-002).

### TC-US013-003: Switching from in-app to telephone while holding an offer removes the banner and flags the call

- **Traces to:** US-013 AC4, BR-017, BR-001, BR-007 · spec: `contact-preference` / "A change of preference takes effect on a held offer at once" (In-app to telephone while holding an offer)
- **Type / Priority:** Positive · State transition / High
- **Pre-conditions:**
  - SEED-BASE with Maria Gómez (In-app) waiting at #1 and Diego Herrera (In-app) at #2
  - Ricardo has released SLOT-A: Maria is `notified` and holds the only outstanding offer
- **Test data:** Maria Gómez, Ricardo Salazar, SLOT-A

| # | Action | Expected result |
|---|---|---|
| 1 | Maria signs in | The banner shows the slot with Accept and Decline |
| 2 | Maria changes her preference to "Telephone" and saves | The card shows "Telephone" |
| 3 | Within 60 seconds, Maria's screen is refreshed (or refreshes itself) | The banner and the Accept and Decline actions are gone and a notice says staff will contact her |
| 4 | Ricardo opens the staff view | The offer is still outstanding with Maria, shown with "Requires a call", with the "They accepted" and "They declined" actions; the time outstanding was not restarted; Diego is not notified |

- **Clean-up:** reset the data.
- **Status:** Draft
- **Notes:** The 60 seconds is the *Proposed* target (G-03). The app polls every 10 seconds.

### TC-US013-004: Switching from telephone to in-app while holding an offer shows the banner and clears the call flag

- **Traces to:** US-013 AC5, BR-017, BR-021 · spec: `contact-preference` / "A change of preference takes effect on a held offer at once" (Telephone to in-app while holding an offer)
- **Type / Priority:** Positive · State transition / High
- **Pre-conditions:**
  - SEED-BASE with Carlos Mendoza (Telephone) waiting at #1 and Jorge Ramírez (Telephone) at #2
  - Ricardo has released SLOT-A: Carlos holds the outstanding offer
- **Test data:** Carlos Mendoza, Ricardo Salazar, SLOT-A

| # | Action | Expected result |
|---|---|---|
| 1 | Ricardo opens the staff view | Carlos's offer shows "Requires a call" with "They accepted" and "They declined" |
| 2 | Carlos signs in as a patient | No banner and no Accept or Decline; a notice says staff will contact him |
| 3 | Carlos changes his preference to "In-app" and saves | The card shows "In-app" |
| 4 | Within 60 seconds, Carlos's screen is refreshed | The banner shows the slot with Accept and Decline |
| 5 | Ricardo's staff view is refreshed | The offer is still outstanding with Carlos at the same creation time; "Requires a call" is gone and "They accepted" and "They declined" are not offered |

- **Clean-up:** reset the data.
- **Status:** Draft
- **Notes:** Same 60-second note as TC-US013-003 (G-03).

### TC-US013-005: A patient on the confirmation step who switched to telephone in another session cannot book

- **Traces to:** US-013 AC7, US-008 AC8, BR-021 · spec: `telephone-offer-response` / "In-app response is refused for non-in-app patients" (Patient switched to telephone after the confirmation step was shown)
- **Type / Priority:** Negative · Concurrency and consistency / High
- **Pre-conditions:**
  - SEED-BASE with Maria Gómez (In-app) waiting at #1 and Diego Herrera at #2
  - Ricardo has released SLOT-A: Maria holds the outstanding offer
- **Test data:** Maria Gómez in two sessions (S1 and S2), Ricardo Salazar

| # | Action | Expected result |
|---|---|---|
| 1 | In S1, Maria signs in and selects "Accept" | A confirmation dialog "Book this appointment?" restates the slot and the specialist |
| 2 | In S2, Maria signs in and changes her preference to "Telephone" | S2 shows "Telephone" |
| 3 | In S1, Maria selects "Confirm" | No booking is made; she is told the current state (that staff will record her response); her entry is not `booked` |
| 4 | Ricardo opens the staff view | The offer is still outstanding with Maria, shown with "Requires a call"; Diego is not notified |

- **Clean-up:** reset the data.
- **Status:** Draft
- **Notes:** The exact message is not in the PS (G-07); assert that no booking is made and the offer stays outstanding.

### TC-US013-006: Staff cannot record a response for a patient who has switched to in-app

- **Traces to:** US-013 AC6, US-011 AC7, BR-021 · spec: `telephone-offer-response` / "Recording is not available for in-app patients" (Patient switched to in-app after the staff view loaded)
- **Type / Priority:** Negative · Concurrency and consistency / High
- **Pre-conditions:**
  - SEED-BASE with Carlos Mendoza (Telephone) waiting at #1
  - Ricardo has released SLOT-A: Carlos holds the offer, and Ricardo's staff view is open showing "They accepted" and "They declined"
- **Test data:** Carlos Mendoza, Ricardo Salazar (two sessions)

| # | Action | Expected result |
|---|---|---|
| 1 | In another session, Carlos signs in and changes his preference to "In-app" | The change is saved |
| 2 | In Ricardo's open (not refreshed) staff view, select "They accepted" | No change is made; Ricardo is told "This patient answers in the app, so staff cannot record a response for them." |
| 3 | Refresh the staff view | The offer is still outstanding with Carlos, not booked; the record actions are no longer offered |

- **Clean-up:** reset the data.
- **Status:** Draft

### TC-US013-007: A patient with a booked entry or no entry can set the preference without creating or changing an entry

- **Traces to:** US-013 AC8, BR-015, BR-018 · spec: `contact-preference` / "A patient sets or changes their own contact preference" (Patient with a booked entry or no entry)
- **Type / Priority:** Positive · Boundary / Medium
- **Pre-conditions:**
  - SEED-BASE; Maria Gómez has accepted an offer for SLOT-A, so her entry is `booked`
  - Diego Herrera (In-app) has no entry
- **Test data:** Maria Gómez, Diego Herrera, Ricardo Salazar

| # | Action | Expected result |
|---|---|---|
| 1 | Maria signs in and changes her preference to "Telephone" | The card shows "Telephone"; the booking confirmation still shows her booked slot |
| 2 | Diego signs in and changes his preference to "Telephone" | The card shows "Telephone"; "You're not on the waitlist yet" is still shown |
| 3 | Ricardo opens the staff view | Neither Maria nor Diego is listed; no entry was created or changed |
| 4 | Diego selects "Join waitlist" | No options are shown; he joins directly, and the staff view lists him with preference Telephone |

- **Clean-up:** reset the data.
- **Status:** Draft

### TC-US013-008: A response already recorded is not changed by a later change of preference

- **Traces to:** US-013 AC9, BR-018 · spec: `telephone-offer-response` / "A recorded response stands after a later change of preference"
- **Type / Priority:** Negative · State transition / High
- **Pre-conditions:**
  - SEED-BASE with Maria Gómez (In-app) at #1 and Carlos Mendoza (Telephone) at #2
  - Ricardo has released SLOT-A to Maria; Maria accepted and confirmed (her entry is `booked`)
  - Ricardo has released SLOT-B (2026-10-03 14:00) to Carlos; Ricardo recorded that Carlos declined
- **Test data:** Maria Gómez, Carlos Mendoza, Ricardo Salazar, SLOT-A, SLOT-B

| # | Action | Expected result |
|---|---|---|
| 1 | Maria changes her preference to "Telephone" and saves | Her entry is still `booked`; SLOT-A is still marked taken (a release of 2026-10-03 10:30 is still refused) |
| 2 | Carlos signs in and changes his preference to "In-app" | The change is saved |
| 3 | Ricardo opens the staff view | Carlos is still `waiting` at the same position; SLOT-B is still shown as returned to staff; no offer is outstanding |

- **Clean-up:** reset the data.
- **Status:** Draft

### TC-US013-009: A patient cannot change another patient's preference, and invalid values are refused

- **Traces to:** US-013 AC10, BR-011, BR-015 · spec: `contact-preference` / "A patient sets or changes their own contact preference" (Patient cannot change another patient's preference; An unrecognised value is refused)
- **Type / Priority:** Negative · Permission / High
- **Pre-conditions:**
  - SEED-BASE; Maria Gómez and Diego Herrera both have preference In-app
- **Test data:** Maria Gómez and Ricardo Salazar (tokens), Diego Herrera's patient id

| # | Action | Expected result |
|---|---|---|
| 1 | Maria sends the change request with a value that is not in-app or telephone (API) | The request is refused as invalid; Maria's preference is unchanged |
| 2 | Maria sends the change request with "Telephone" and Diego's patient id in the body (API) | Only Maria's preference changes to Telephone; Diego's is still In-app |
| 3 | Ricardo (staff) sends the change request (API) | The request is refused as not allowed (403); nothing changes |
| 4 | Send requests that try to write a patient's preference by another route (PATCH or PUT on a patient or on "me") | Each is not found (404); Diego's preference is still In-app |

- **Clean-up:** reset the data.
- **Status:** Draft
- **Notes:** The path of the change request has no patient id, so a patient can only name themselves. Step 2 confirms an id in the body is ignored.

### TC-US013-010: Every change is audited with previous and new values and shown on no screen

- **Traces to:** US-013 AC11, US-012 AC7, BR-015 · spec: `contact-preference` / "Every preference change is auditable"
- **Type / Priority:** Positive · Audit and attribution / Medium
- **Pre-conditions:**
  - SEED-BASE; Maria Gómez has preference In-app; the audit table has no preference records
- **Test data:** Maria Gómez, Ricardo Salazar, access to `audit_log` (G-05)

| # | Action | Expected result |
|---|---|---|
| 1 | Maria changes her preference to "Telephone", saves, then changes it back to "In-app" and saves | The card shows "In-app" |
| 2 | Read the audit records | Two `contact_preference_set` records for Maria: first previous `in_app`, new `telephone`; second previous `telephone`, new `in_app`; actor is patient Maria; each has a time, the second later than the first |
| 3 | Look at Maria's screen and at the staff view | Neither shows any history of earlier values |

- **Clean-up:** reset the data.
- **Status:** Draft
- **Notes:** Audit access is G-05.

### US-003 / US-004 Patients already waiting with no preference

### TC-US003-002: A waiting patient with no preference is shown as "Not recorded" and flagged as needing a call when offered a slot

- **Traces to:** US-003 AC3, US-004 AC5, BR-001, BR-019 · spec: `contact-preference` / "Patient has a contact preference" (Not recorded is treated as telephone); "Staff see contact preference and which offers need a call"
- **Type / Priority:** Positive · Business-rule / High
- **Pre-conditions:**
  - SEED-DEMO: Carlos Mendoza (Telephone) waiting at #1; Ana Torres (no preference) waiting at #2
- **Test data:** Ricardo Salazar, Ana Torres, SLOT-A

| # | Action | Expected result |
|---|---|---|
| 1 | Ricardo opens the staff view | Ana's preference is shown as "Not recorded" |
| 2 | Ricardo releases SLOT-A | Carlos is notified and flagged "Requires a call" |
| 3 | Ricardo records that Carlos declined, then releases SLOT-A again | The offer goes to Ana (Carlos is not eligible for that slot); her row shows "Requires a call" and the "They accepted" and "They declined" actions are offered |
| 4 | Ana signs in as a patient | No banner and no Accept or Decline; a notice says staff will contact her; her place is unchanged |

- **Clean-up:** reset the data.
- **Status:** Draft
- **Notes:** Hospital operations have not confirmed the "treated as telephone" handling (G-01).

### US-006 Staff add a caller

### TC-US006-003: Staff are asked to record a preference before adding a caller who has none

- **Traces to:** US-006 AC4, BR-014, BR-016 · spec: `waitlist-screens` / "Staff add outcomes are explained" (Caller with no preference); `waitlist-membership` / "Staff adds a patient on their behalf"
- **Type / Priority:** Negative · Business-rule / High
- **Pre-conditions:**
  - SEED-BASE: empty waitlist; Ana Torres has no recorded preference and no active entry
- **Test data:** Ricardo Salazar (session and token), Ana Torres

| # | Action | Expected result |
|---|---|---|
| 1 | Ricardo selects Ana in "Patient to add" | A second selector "Contact preference" appears with "Choose in-app or telephone"; "Add to waitlist" is disabled |
| 2 | Ricardo sends the add request for Ana with no preference (API) | The request is refused with "a choice is required" (409 `preference_required`); no entry is created |
| 3 | Ricardo opens the staff view | The message "No patients are currently waiting." is shown |

- **Clean-up:** none.
- **Status:** Draft

### TC-US006-004: Staff record the caller's stated choice while adding; it is saved with the entry and attributed to the staff member

- **Traces to:** US-006 AC5, BR-016, BR-014 · spec: `waitlist-membership` / "Staff adds a patient on their behalf" (Staff adds a caller with no preference and records one); `contact-preference` / "Staff record a preference only when adding a caller who has none"
- **Type / Priority:** Positive · Audit and attribution / High
- **Pre-conditions:**
  - SEED-BASE: empty waitlist; Ana Torres has no recorded preference and no active entry
- **Test data:** Ricardo Salazar, Ana Torres, access to `audit_log` (G-05)

| # | Action | Expected result |
|---|---|---|
| 1 | Ricardo selects Ana, chooses "Telephone" in "Contact preference", and selects "Add to waitlist" | A confirmation reads "Ana Torres was added to the waitlist. Contact preference: Telephone." |
| 2 | Look at the staff view | Ana is listed with status Waiting and preference Telephone |
| 3 | Read the audit record | One `contact_preference_set` record: actor is staff Ricardo, previous value empty, new value `telephone`, linked to Ana's entry, with a time |
| 4 | Ana signs in as a patient | The card "How we contact you" shows "Telephone" |

- **Clean-up:** reset the data.
- **Status:** Draft

### TC-US006-005: Staff cannot change a preference that is already recorded

- **Traces to:** US-006 AC6, BR-016 · spec: `waitlist-screens` / "Staff add outcomes are explained" (Caller who already has a preference); `waitlist-membership` (Preference already recorded)
- **Type / Priority:** Negative · Permission / High
- **Pre-conditions:**
  - SEED-BASE: empty waitlist; Jorge Ramírez has preference Telephone and no active entry
- **Test data:** Ricardo Salazar (session and token), Jorge Ramírez

| # | Action | Expected result |
|---|---|---|
| 1 | Ricardo selects Jorge in "Patient to add" | No "Contact preference" selector appears; "Add to waitlist" is enabled |
| 2 | Ricardo sends the add request for Jorge with preference "In-app" (API) | The request is refused with "This patient already has a contact preference, and only the patient can change it." (409 `preference_already_recorded`); no entry is created |
| 3 | Ricardo adds Jorge with the screen | Jorge is listed with preference Telephone, unchanged |

- **Clean-up:** reset the data.
- **Status:** Draft

### TC-US006-006: The preference and the entry are saved together or not at all

- **Traces to:** US-006 AC5, BR-016, BR-004 · spec: `waitlist-membership` (Entry cannot be created)
- **Type / Priority:** Negative · Concurrency and consistency / Medium
- **Pre-conditions:**
  - SEED-DEMO: Carlos Mendoza waiting at #1; Ana Torres (no preference) already waiting at #2
- **Test data:** Ricardo Salazar (token), Ana Torres, an unregistered patient id (Sofía Reyes)

| # | Action | Expected result |
|---|---|---|
| 1 | Ricardo sends the add request for Ana with preference "In-app" (API) | Ana's existing entry is returned unchanged |
| 2 | Look at the staff view and the audit table | Ana is still #2 with preference "Not recorded"; no `contact_preference_set` record exists for her |
| 3 | Ricardo sends the add request with preference "In-app" for a patient id that does not exist (API) | The request is refused as patient not found (404); nothing is created |

- **Clean-up:** reset the data.
- **Status:** Draft
- **Notes:** Demonstrates that no preference is recorded when the entry is not created.

### BR-020 Which write applies

### TC-BR020-001: When the preference is written twice, the later value is the one used

- **Traces to:** BR-020, BR-015, BR-016 · spec: `contact-preference` / "Patient has a contact preference" (Most recent write applies)
- **Type / Priority:** Positive · Business-rule / Medium
- **Pre-conditions:**
  - SEED-BASE: empty waitlist; Ana Torres has no recorded preference and no active entry
- **Test data:** Ricardo Salazar, Ana Torres, SLOT-A

| # | Action | Expected result |
|---|---|---|
| 1 | Ricardo adds Ana, recording "Telephone" | Ana is listed with preference Telephone |
| 2 | Ana signs in and changes her preference to "In-app" | The card shows "In-app" |
| 3 | Ricardo opens the staff view | Ana's preference is In-app (the later write) |
| 4 | Ricardo releases SLOT-A | Ana is offered the slot in the app (banner with Accept and Decline) and the staff view shows no "requires a call" flag |

- **Clean-up:** reset the data.
- **Status:** Draft
- **Notes:** Only writes made through the app can be tested (G-04); hospital registration is not built.

### Appendix A1 Demo registration

### TC-A1-001: Registering creates a patient with the chosen preference, signs them in, and they are not asked again when joining

- **Traces to:** Appendix A1 AC1, AC4, BR-014 · spec: `demo-registration` / "A person can register in the demonstration environment"
- **Type / Priority:** Positive · UI behaviour / Medium
- **Pre-conditions:**
  - SEED-BASE with demo login enabled; no patient named Lucía Fernández
- **Test data:** Lucía Fernández (new), Ricardo Salazar, access to `audit_log` (G-05)

| # | Action | Expected result |
|---|---|---|
| 1 | On the sign-in screen, in "Register (demo)", enter the name "Lucía Fernández", choose "Telephone", and select "Register" | She is signed in as Lucía Fernández; the card "How we contact you" shows "Telephone" |
| 2 | Select "Join waitlist" | No options are shown; she joins directly and is on the waitlist |
| 3 | Ricardo opens the staff view | Lucía is listed with status Waiting and preference Telephone |
| 4 | Read the audit record | One `contact_preference_set` record: actor is patient Lucía, previous value empty, new value `telephone` |

- **Clean-up:** reset the data (the new patient remains until the database is reset).
- **Status:** Draft
- **Notes:** Appendix A is not Product scope. The patient holds no telephone number and no call is placed.

### TC-A1-002: Registration needs a name and a preference

- **Traces to:** Appendix A1 AC2 · spec: `demo-registration` / "Registration needs a name and a preference"
- **Type / Priority:** Negative · Input / Medium
- **Pre-conditions:**
  - SEED-BASE with demo login enabled
- **Test data:** no name; a name of only spaces; a valid name without a choice

| # | Action | Expected result |
|---|---|---|
| 1 | Choose "In-app" and select "Register" with the name field empty | "Enter a name to register." is shown; no patient is created |
| 2 | Enter only spaces as the name, choose "In-app", and select "Register" | The same message is shown; no patient is created |
| 3 | Enter a valid name, choose no option, and select "Register" | "Choose in-app or telephone as the contact preference." is shown; no patient is created |
| 4 | Ricardo opens the staff add panel | The patient picker shows only the six seeded patients |

- **Clean-up:** none.
- **Status:** Draft

### TC-A1-003: A name already in use is refused

- **Traces to:** Appendix A1 AC3 · spec: `demo-registration` / "A name already in use is refused"
- **Type / Priority:** Negative · Boundary / Medium
- **Pre-conditions:**
  - SEED-BASE with demo login enabled; Maria Gómez exists with preference In-app
- **Test data:** the name "Maria Gómez", and the same name in lower case with spaces before and after

| # | Action | Expected result |
|---|---|---|
| 1 | Register with the name "Maria Gómez" and choose "Telephone" | The message "That name is already registered. You can sign in as that patient instead." is shown; no patient is created |
| 2 | Register with the name "  maria gómez  " (lower case, spaces before and after) and choose "Telephone" | It is refused the same way |
| 3 | Sign in as Maria Gómez | Her preference is still In-app |

- **Clean-up:** none.
- **Status:** Draft
- **Notes:** Case-insensitive and trimmed matching comes from the OpenSpec spec; the PS is silent (G-08).

### TC-A1-004: The registration step is not available when demo login is off

- **Traces to:** Appendix A1 AC5 · spec: `demo-registration` / "Registration is unavailable outside the demonstration environment"
- **Type / Priority:** Negative · Configuration / Medium
- **Pre-conditions:**
  - The API is started with demo login off (`DEMO_LOGIN` not set) and a signing secret set
- **Test data:** a registration request body with a valid name and preference

| # | Action | Expected result |
|---|---|---|
| 1 | Send the registration request (API) | The endpoint does not exist (not found); no patient is created |
| 2 | Open the sign-in screen | No "Register (demo)" form is shown (and no demo user buttons) |

- **Clean-up:** restart the API with demo login on.
- **Status:** Draft
- **Notes:** Needs the API restarted with a different configuration; the sign-in itself is outside the Product scope.

---

## 6. Coverage matrix

| Item | Covered by |
|---|---|
| US-001 AC3 | TC-US001-003, TC-US012-001 |
| US-003 AC3 | TC-US003-002 |
| US-004 AC5 | TC-US003-002 |
| US-006 AC4 | TC-US006-003 |
| US-006 AC5 | TC-US006-004, TC-US006-006 |
| US-006 AC6 | TC-US006-005 |
| US-008 AC8 | TC-US013-005 |
| US-011 AC7 | TC-US013-006 |
| US-012 AC1 | TC-US012-001 |
| US-012 AC2 | TC-US012-001 |
| US-012 AC3 | TC-US012-002 |
| US-012 AC4 | TC-US012-003 |
| US-012 AC5 | TC-US012-004 |
| US-012 AC6 | TC-US012-005 |
| US-012 AC7 | TC-US012-002, TC-US013-010 |
| US-013 AC1 | TC-US013-001 |
| US-013 AC2 | TC-US013-002 |
| US-013 AC3 | TC-US013-001 |
| US-013 AC4 | TC-US013-003 |
| US-013 AC5 | TC-US013-004 |
| US-013 AC6 | TC-US013-006 |
| US-013 AC7 | TC-US013-005 |
| US-013 AC8 | TC-US013-007 |
| US-013 AC9 | TC-US013-008 |
| US-013 AC10 | TC-US013-009 |
| US-013 AC11 | TC-US013-010 |
| Appendix A1 AC1, AC4 | TC-A1-001 |
| Appendix A1 AC2 | TC-A1-002 |
| Appendix A1 AC3 | TC-A1-003 |
| Appendix A1 AC5 | TC-A1-004 |
| BR-001 (changed) | TC-US003-002, TC-US013-002, TC-US013-003, TC-US013-004 |
| BR-014 | TC-US001-003, TC-US012-001, TC-US012-003, TC-US006-003 |
| BR-015 | TC-US012-002, TC-US012-005, TC-US013-001, TC-US013-009 |
| BR-016 | TC-US006-004, TC-US006-005, TC-US006-006 |
| BR-017 | TC-US013-003, TC-US013-004 |
| BR-018 | TC-US013-001, TC-US013-007, TC-US013-008 |
| BR-019 | TC-US013-002, TC-US003-002 |
| BR-020 | TC-BR020-001 (writes made through the app only, G-04) |
| BR-021 | TC-US013-004, TC-US013-005, TC-US013-006 |
| Unchanged criteria and rules (US-003 AC1, 2, 4–6; US-004 AC1–4, AC6; US-006 AC1–3, AC7; US-008 AC1–7; US-009; US-010; US-011 AC1–6; BR-002 to BR-013) | Predecessor spec, section 4 |
| Section 9 targets (60 seconds, WCAG 2.1 AA) | Not covered: *Proposed* (G-10) |

---

## 7. Change log

| Version | Date | Based on | Change |
|---|---|---|---|
| 0.1 | 2026-10-02 | PS-001 v2.5 (Draft); OpenSpec `waitlist-contact-preference-in-app` | First draft: delta spec, 26 test cases, carried-forward table for the predecessor spec |

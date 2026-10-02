# Proposal

## Why

The built MVP (change `waitlist-visibility-notification`, PS-001 v0.4) assumes every patient can be reached and can respond in the app. PS-001 v2.4 narrows the flow to registry → slot release → acceptance and adds what the MVP lacks for a hospital population where many patients have no smartphone or reliable internet: each patient has a recorded contact preference, patients who prefer telephone are reached by a staff call, and staff record their response so the waitlist stays one accurate record (US-011, BR-001, BR-010). v2.4 also tightens who is offered a slot (BR-005) and stops a booked slot being offered again (BR-013). Prototype V3 shows the intended screens for that flow, and this change brings the built web app in line with it.

## What Changes

This change is a delta on the built code. It adds only what PS-001 v2.4 introduces.

- Each patient has a read-only **contact preference** (`in_app`, `telephone`, or not recorded). Not recorded is treated as telephone (BR-001).
- The staff waitlist shows each patient's contact preference, marks an offer held by a telephone or not-recorded patient as **requiring a call**, and shows how long the offer has been outstanding (US-003, US-004, US-010).
- In-app offer banner, accept and decline are available only to `in_app` patients. For telephone or not-recorded patients the app offers no response action (US-003, US-008, BR-001).
- Staff can **record a telephone patient's accept or decline** on their behalf. Accept books the slot, decline returns it to staff. The record is attributable to the staff member and distinguishable from a patient's own response. Not available for `in_app` patients (US-011, BR-010).
- **Offer targeting** follows the v2.4 glossary: a released slot goes to the *next in line* — the lowest-position patient with status `waiting` who has neither declined nor been passed over for that slot. A passed-over patient is not offered that slot again (BR-005, US-009, US-010).
- A slot that is already **booked cannot be released again**, so the same date and time is never offered twice (BR-013, US-009).
- **Screens align with prototype V3.** The patient view shows a status stepper (Joined, Waiting, Notified, Booked) and no queue position, and no Leave control. The staff table shows #, Patient, Contact preference and Status (with a "Requires a call" flag), with no Joined column and no Remove control. Staff controls read "They accepted", "They declined" and "Couldn't reach them — pass to next". The add panel tells staff when a person is not registered in hospital records or is already on the waitlist (US-002 and US-005/US-007 are deferred in v2.4).
- Demo seed data follows the V3 walkthrough: Cardiology, Dr. Elena Ruiz, a registered patient of each contact preference, and Carlos Mendoza and Ana Torres already waiting (PS Section 17).

Already satisfied by the built code, so no new requirement is written: an unregistered person cannot be added and nothing is created (US-006), a patient can act only on their own offer (BR-011), the first action on an offer wins and later ones are rejected (BR-012), and a booked slot is marked `booked` (BR-013, first part). These get regression tests only. The leave, remove and position endpoints stay in the API with their tests, but their screens are hidden (see the UI decisions below).

Decisions taken by assumption, pending Product Owner confirmation (PS-001 v2.4 *Proposed* items):
- Not-recorded preference is treated as telephone (BR-001).
- A passed-over patient is not offered that same slot again (BR-005), and keeps their position.
- First action on an offer wins (BR-012); the loser is told the offer is no longer available.
- "Booking is completed" means the slot is recorded against the patient, marked taken, the entry closes as `booked`, and a confirmation is shown (BR-013). The calendar is mocked: the slot table is the calendar.
- A telephone or not-recorded patient has exactly one response channel, a staff-recorded one. The PS says the call happens outside the system; the choice to hide in-app accept and decline from these patients is this plan's reading of US-008 AC7.
- A slot is identified by its date and time (single specialist). Staff still enter the date and time on release, as built; a returned slot is reused.
- The patient view shows no actions, only a neutral notice, to a telephone or not-recorded patient who holds an offer. Wording is pending UX.
- Quality targets accepted by the Product Owner (offer view loads in 5 seconds on a throttled 3G profile, first-time user accepts or declines in 3 steps or fewer) are verified manually. The 99% within 60 seconds reliability target and WCAG 2.1 AA are still *Proposed*: the plan relies on the existing 10-second polling and the existing UI components, and does not add accessibility work.

Decisions on prototype V3. Only the first (hiding position, leave and remove) was confirmed by the Product Owner; the rest are assumptions or follow PS v2.4:
- Patient-facing position, patient leaving and staff removal are hidden in the UI and kept in the API. This reverses an earlier "leave as is" answer, because prototype V3 and PS v2.4 both defer them. The API, services and their tests stay so the successor spec can re-enable them.
- Staff recording a telephone patient's response is one click, as in the prototype, with no confirm step (assumption; the prototype only confirms the patient's own accept).
- Specialty is Cardiology in the demo seed, as in the prototype. The pilot specialty is still an open Product decision (PS v2.4 Section 14); this affects demo data only.
- Where the prototype or journey map differ from PS v2.4, the PS wins and the difference is not built: the prototype's staff table shows `booked` entries with "—" for position (PS: closed entries are excluded), the journey map says a patient who joins an empty waitlist is notified immediately (PS Section 10: deferred), and the prototype's fixed slot time, "(you)" label and "Reset demo" are prototype-only.
- The prototype's add panel lists an unregistered caller to demonstrate the guardrail. The built picker lists registered patients only (the hospital lookup is out of scope), so the "not registered" message is covered through the API error and its screen text, not through a picker option.

Deferred or not built here (PS-001 v2.4 Section 10): patient-facing position, staff removal and patient leaving as requirements, automated cascade or timers, automated out-of-app messaging, real calendar write-back, and anything owned by the Slot Claim & Booking Confirmation feature.

**BREAKING** (internal): a patient with no recorded preference can no longer accept or decline in-app. Existing tests and seed data that create patients without a preference must set `in_app`.

## Capabilities

### New Capabilities
- `contact-preference`: the stored contact preference per patient, the treatment of "not recorded", and how it shows in the staff waitlist (preference, call-required flag, time outstanding) and in the patient view (banner only for in-app patients).
- `telephone-offer-response`: staff record an accept or decline for a telephone or not-recorded patient, attribution, and the rule that in-app patients respond only in the app.
- `waitlist-screens`: what the patient and staff screens show and hide in this iteration (status instead of position, no leave or remove controls, staff table columns, add-panel outcomes), per prototype V3.
- `offer-targeting`: who a released slot is offered to (eligible patient, next in line, passed-over exclusion) and the rule that a booked slot cannot be released again.

### Modified Capabilities

None. `openspec/specs/` is empty because `waitlist-visibility-notification` is complete but not archived. Behaviour that refines its `slot-offers`, `waitlist-visibility` and `waitlist-membership` capabilities is written here as new capabilities to avoid duplicating their names. When both changes are archived, reconcile `offer-targeting` and `contact-preference` with `slot-offers` and `waitlist-visibility`.

## Impact

- API (`apps/api`): migration adding `patients.contact_preference`; patient repository; offer service (`accept`, `decline`, `passOn`, `release`, new staff-recorded accept and decline); offer routes; staff waitlist view service; seed data.
- Shared types (`packages/shared`): staff entry and offer views gain preference, call-required and outstanding-since; patient view gains the response channel.
- Web (`apps/web`): staff table and slot control (preference, call-required, one-click record-by-phone actions, V3 columns and labels, no Joined or Remove); patient view (status stepper, no position, no Leave, no banner or actions for non-in-app patients); add-panel messages.
- Tests: existing API and web tests that rely on patient names, ids or any patient accepting in-app need updating to the new seed; web tests for position, Leave, Remove and the Joined column become tests that those are absent.
- Docs: README note on the contact preference and the telephone path; the old change's config context is not edited here.
- No new external services and no dependencies.

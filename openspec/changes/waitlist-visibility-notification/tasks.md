# Tasks

## 1. Project scaffolding

- [x] 1.1 Create monorepo with `apps/api`, `apps/web` and `packages/shared` (TypeScript, strict mode) and verify `npm install` and `npm run build` succeed
- [x] 1.2 Configure Vitest for api and web, plus a lint script, and verify `npm test` runs with one passing placeholder test
- [x] 1.3 Add SQLite with migrations and a seed script for the specialist, patients and staff, and verify `npm run seed` populates them

## 2. Auth and data layer

- [x] 2.1 Create migrations for `waitlist_entries` (partial unique index on active patient), `slots`, `slot_offers` (partial unique index on outstanding) and `audit_log`, and verify tests that a duplicate active entry and a second outstanding offer both fail at the database level
- [x] 2.2 Implement token auth middleware with `patient` and `staff` roles and verify tests for missing token (401), wrong role (403) and patient scoping to own entry
- [x] 2.3 Implement repository layer for entries, slots, offers and audit with transaction support, and verify repository tests pass
- [x] 2.4 Added during apply: demo-only `POST /demo/login` and `GET /demo/users` (seeded users, no password, mounted only when `DEMO_LOGIN=true`) so 6.2 has a way to sign in, and verify tests for patient and staff sign-in, unknown user, bad request and disabled
- [x] 2.5 Added during apply: staff-only `GET /patients` listing registered patients and whether each is on the waitlist, so 6.5 can pick a patient to add, and verify tests for staff, patient-denied and unauthenticated
- [x] 2.6 Added during apply: `apps/api/src/server.ts` with `npm run dev` so the web app has an API to talk to, and verify the server starts and answers `GET /demo/users`

## 3. Waitlist membership (waitlist-membership)

- [x] 3.1 Implement patient join `POST /waitlist` creating a `waiting` entry, with the registered-patient check, and verify tests for success, unregistered person and confirmation response
- [x] 3.2 Make duplicate join and duplicate staff add return the existing entry and position without creating a row, and verify tests for both paths plus rejoin after `removed` or `booked`
- [x] 3.3 Implement staff add-on-behalf `POST /waitlist/patients/:patientId` and verify the entry behaves like a self-joined one
- [x] 3.4 Implement patient leave and staff remove (`DELETE /waitlist/:entryId`) with ownership and role checks, and verify tests for patient, staff, other patient (rejected), unauthenticated, and removing an already closed entry (no change, told not active)
- [x] 3.5 Write audit records in the same transaction as create and remove with actor type, actor id and timestamp, and verify tests assert attribution for self and staff actions

## 4. Waitlist visibility (waitlist-visibility)

- [x] 4.1 Implement position calculation (FIFO by `joined_at`, tie-break by id, `waiting` and `notified` only) and verify unit tests for ordering, staff-added entries, unchanged position on notify, and move-up when an entry closes as `booked` or `removed`
- [x] 4.2 Implement `GET /me/waitlist` returning the patient's own entry with position as a number, join date and any outstanding offer, with no total count, and verify tests for current position, not-on-waitlist, and denial of other patients' entries
- [x] 4.3 Implement `GET /waitlist` for staff with patient identity, position, status, the offer holder, and closed entries excluded, and verify tests for populated, empty and patient-denied cases

## 5. Slot offers (slot-offers)

- [x] 5.1 Implement staff `POST /offers` (release with slot date and time) that notifies the lowest-position eligible `waiting` patient, and verify tests for position 1 offered, no waiting patients, release blocked while an offer is outstanding, and two concurrent releases producing one offer
- [x] 5.2 Implement returned slots: a declined, unassigned or holder-removed slot stays `open` and release reuses its date and time, skipping patients who declined it, and verify tests for skip-decliner and all-waiting-declined (no release action)
- [x] 5.3 Implement patient `POST /offers/:id/accept` booking the slot and closing the entry as `booked`, and verify tests for booking, entries behind moving up, non-holder rejected, and offer no longer outstanding rejected
- [x] 5.4 Implement patient `POST /offers/:id/decline` returning the entry to `waiting` at the same position with no automatic notification of the next patient, and verify tests for position kept and nobody else notified
- [x] 5.5 Implement staff `POST /offers/:id/pass` moving the holder back to `waiting` and notifying the next eligible patient behind them, and verify tests for next patient notified, only patient on the waitlist (no new offer), and an accept racing a pass-on (one wins)
- [x] 5.6 Close the outstanding offer when its holder is removed (patient or staff) and return the slot to staff, and verify tests that nobody else is notified and the slot can be released again
- [x] 5.7 Write audit records for release, accept, decline, pass-on and closure in the same transaction as each state change, and verify tests assert actor, slot and timestamp, and that a failure mid-transition leaves entry, offer and slot consistent

## 6. Web UI (visual reference: `docs/waitlist-prototype_V2.html`)

- [x] 6.1 Set up shared styles and components (cards, position badge, meta row, stepper, banner, slot card, modal, table, buttons) matching the prototype's colours and type, and verify a rendered component test for each
- [x] 6.2 Build login and role-based routing for patient and staff and verify component tests for each role's landing view
- [x] 6.3 Build patient waitlist view: join, position as "#N" with the "Your place in line" label and join date, no total, leave, the not-on-waitlist empty state, and duplicate-join showing the existing position, and verify component tests with mocked API for each
- [x] 6.4 Build the patient offer banner with slot card, Accept opening the confirmation modal (slot date, time and specialist, Confirm or Cancel) and Decline, plus the booked confirmation, and verify component tests that Cancel makes no API call, Confirm books, Decline keeps the position, and the banner shows only for the offer holder
- [x] 6.5 Build staff waitlist table (position, patient, status, join date) with closed entries excluded, the empty state without a release action, add patient and remove entry, and verify component tests for each action and positions updating after removal
- [x] 6.6 Build staff slot release (date and time input, hidden while an offer is outstanding or nobody is waiting) and pass-on control showing the offer holder, and verify component tests for each visibility state and for both actions

## 7. Integration and documentation

- [ ] 7.1 Add an end-to-end integration test: patient joins, staff views, staff release a slot, patient sees the banner, declines and keeps their position, staff release again and the next patient accepts and confirms, the booked entry leaves the list; verify it passes in CI
- [ ] 7.2 Write the README with setup, seeded users, the staff release flow, and the plan's assumptions awaiting Product Owner confirmation, and verify the documented setup commands run as written

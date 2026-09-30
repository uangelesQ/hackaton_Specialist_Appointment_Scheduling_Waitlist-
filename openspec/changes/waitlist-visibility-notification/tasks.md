# Tasks

## 1. Project scaffolding

- [ ] 1.1 Create monorepo with `apps/api`, `apps/web` and `packages/shared` (TypeScript, strict mode) and verify `npm install` and `npm run build` succeed
- [ ] 1.2 Configure Vitest for api and web, plus a lint script, and verify `npm test` runs with one passing placeholder test
- [ ] 1.3 Add SQLite with migrations and a seed script for patients, specialists and staff, and verify `npm run seed` populates them

## 2. Auth and data layer

- [ ] 2.1 Create migrations for `waitlist_entries` (with partial unique index on active patient+specialist), `notifications` (unique patient+slot_event), `slot_events` and `audit_log`, and verify a test that inserts duplicate active entries fails at the database level
- [ ] 2.2 Implement token auth middleware with `patient` and `staff` roles and verify tests for missing token (401), wrong role (403) and patient-scoping
- [ ] 2.3 Implement repository layer for entries, notifications, slot events and audit, and verify repository tests pass

## 3. Waitlist membership (waitlist-membership)

- [ ] 3.1 Implement `POST /specialists/:id/waitlist` for patient join with registered-patient check and verify tests for success, unregistered patient and confirmation response
- [ ] 3.2 Enforce one active entry per patient per specialist (409 on duplicate) and allow other specialists and rejoin after removal, verified by tests for all three scenarios
- [ ] 3.3 Implement staff add-on-behalf `POST /specialists/:id/waitlist/patients/:patientId` and verify the entry behaves like a self-joined one and duplicates are rejected
- [ ] 3.4 Implement patient self-remove and staff remove (`DELETE /waitlist/:entryId`) with ownership/role checks, and verify tests for patient, staff, other-patient (rejected) and unauthenticated cases
- [ ] 3.5 Write audit records in the same transaction as create/remove with actor type, actor id and timestamp, and verify tests assert attribution for self and staff actions

## 4. Waitlist visibility (waitlist-visibility)

- [ ] 4.1 Implement position calculation (FIFO by `joined_at`, tie-break by id, active entries only) and verify unit tests for ordering, staff-added entries and move-up after removal
- [ ] 4.2 Implement `GET /me/waitlist` returning the patient's own entries with positions and verify tests for current position, stale-free after changes, and not-on-waitlist
- [ ] 4.3 Implement `GET /specialists/:id/waitlist` for staff with patient identity and position and verify tests for populated, empty and patient-denied cases

## 5. Slot availability notification (slot-availability-notification)

- [ ] 5.1 Implement `NotificationChannel` interface and `InAppChannel` and verify a test that delivery persists a notification and no other channel is invoked
- [ ] 5.2 Implement simulated `POST /appointments/:id/cancel` that raises a slot event only for future appointments and verify tests for advance and after-time cancellations
- [ ] 5.3 Implement fan-out to all active entries with idempotency and per-patient failure isolation, and verify tests for multiple entries, inactive excluded, no entries, reprocessing without duplicates and one failing patient
- [ ] 5.4 Verify notification leaves entry active and position unchanged (BR-003) with a test
- [ ] 5.5 Implement `GET /me/notifications` and `PATCH /me/notifications/:id/read` and verify tests for listing and marking read
- [ ] 5.6 Implement staff-only `POST /specialists/:id/slot-events/demo`, registered only when `DEMO_MODE=true` and calling the same service as the cancellation hook, and verify tests for demo mode on, demo mode off (rejected) and patient caller (rejected)

## 6. Web UI (visual reference: `docs/waitlist-prototype_V2.html`)

- [ ] 6.1 Set up shared styles and components (cards, position badge, meta row, banner, table, buttons) matching the prototype's colours and type, and verify a rendered component test for each
- [ ] 6.2 Build login and role-based routing for patient and staff and verify component tests for each role's landing view
- [ ] 6.3 Build patient views: join a specialist's waitlist, position shown as "#N" with the joined date, leave waitlist, and verify component tests with mocked API for each action, the not-on-waitlist empty state, and error states (duplicate join)
- [ ] 6.4 Build patient notification banner and notifications list with mark-as-read and periodic refresh, with no Accept/Decline, and verify a component test that a new notification appears, can be marked read, and shows no booking actions
- [ ] 6.5 Build staff views: specialist waitlist table (position, patient, joined date), add patient, remove entry, and verify component tests for each action, positions updating after removal, and the empty state
- [ ] 6.6 Add the demo-only "Mark next slot open" staff control, shown only in demo mode, and verify a component test that it calls the demo endpoint and is hidden when demo mode is off

## 7. Integration and documentation

- [ ] 7.1 Add an end-to-end integration test: patient joins, staff views, cancellation raises event, patient notified, entry still active, patient leaves; verify it passes in CI
- [ ] 7.2 Write the README with setup, seeded users, the simulated cancellation hook, the demo control and `DEMO_MODE`, and the assumptions awaiting Product Owner confirmation, and verify the documented setup commands run as written

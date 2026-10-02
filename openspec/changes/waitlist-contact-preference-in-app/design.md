# Design

## Context

The previous change (`waitlist-telephone-path-and-slot-rules`) is built and archived. Observed in the code:

- `patients.contact_preference` is a nullable column with a CHECK for `in_app | telephone`. Nothing writes it except the seed. `patientRepository` has `preferenceOf` and `list` but no write.
- The response channel is never stored. `responseChannelOf(preference)` is called on every view and every action (`offerService.channelOf`, `waitlistViewService`), so a change to the column is seen by the next request with no other code. This is what makes BR-017 and BR-021 cheap: nothing caches the channel.
- `waitlistService.join(patientId, actor)` is the one place entries are created, for both `POST /waitlist` (patient) and `POST /waitlist/patients/:patientId` (staff). It returns the existing entry before creating anything.
- `audit_log` has `action`, `entry_id`, `slot_id`, `actor_type`, `actor_id`, `at`. It cannot hold a previous or new value, and a preference change by a patient with no entry has no `entry_id`.
- `routes/preferenceReadOnly.test.ts` asserts that no route writes the preference and that a preference in a request body is ignored. Parts of it become false.
- `demoRouter` (mounted only when `DEMO_LOGIN=true`) lists seeded users and signs in as one. `LoginScreen` shows them as buttons.
- `PatientView` offers "Join waitlist" with no choice; `StaffView`'s add panel is a picker plus an "Add to waitlist" button.
- The web `ApiClient` is an interface that tests replace with a fake.

See proposal.md for motivation, scope and the decisions taken by assumption.

## Goals / Non-Goals

**Goals:**
- Let a patient set and change their own preference, and gate joining and staff adding on having one.
- Keep a saved preference when a join then fails (US-012), and save staff's preference atomically with the entry (US-006).
- Audit every save with previous and new value.
- Add the demo-only registration step behind the existing demo flag.

**Non-Goals:**
- Staff correcting a recorded preference, capturing a phone number, other contact options, passing changes back to hospital registration, any screen that shows change history (PS Section 10).
- Any real identity, password or hospital registration integration.
- A new table, service or dependency.

## Decisions

**The preference stays one column on `patients`; no new table.** One value per patient, read by existing code. Alternative: a `contact_preference_history` table holding every change; rejected because the PS only requires the change to be recorded for audit, and `audit_log` already is that record once it can carry values.

**Audit values go on `audit_log` as three nullable columns (`patient_id`, `previous_value`, `new_value`) in migration `004`.** One action name, `contact_preference_set`, covers first choice (previous is null) and a change. `patient_id` is needed because a patient with no entry has no `entry_id`; for a staff-recorded choice `entry_id` is also set. Alternative: a free-text `detail` JSON column; rejected because typed columns can be queried and constrained. Alternative: a separate `contact_preference_changes` table; rejected as a second audit trail beside the one that exists. Saving the value the patient already has changes nothing and writes no audit row (assumption; the PS says "each change").

**Choosing then joining is two requests, not one.** The web app calls `PUT /me/contact-preference` and then `POST /waitlist`. They are separate transactions, so a failed join leaves the preference saved, which is exactly US-012's failure criterion with no extra code. `POST /waitlist` refuses with 409 `preference_required` when the patient has none, so the gate holds for any client, not just the web app. Alternative: `POST /waitlist` accepting an optional preference and doing both in one transaction; rejected because it would roll the preference back on failure and then need special handling to keep it.

```mermaid
sequenceDiagram
    participant P as Patient (web)
    participant A as API
    P->>A: POST /waitlist
    A-->>P: 409 preference_required
    P->>P: shows the two options
    P->>A: PUT /me/contact-preference (in_app | telephone)
    A-->>P: 200 saved (audited)
    P->>A: POST /waitlist
    A-->>P: 201 entry (or an error; the preference stays saved)
```

**Staff add keeps one request and one transaction.** `POST /waitlist/patients/:patientId` takes an optional `{ contactPreference }`. Inside `waitlistService.join`, in this order: unknown patient is 404; an existing active entry is returned unchanged (nothing recorded); then, if the patient has no preference and none was supplied, 409 `preference_required`; if the patient has one and one was supplied, 409 `preference_already_recorded`; otherwise the preference is written, audited and the entry created in the same transaction. Checking the existing entry first is what makes a legacy waiting patient with no preference untouchable by staff (BR-019, BR-016). Alternative: ignore a supplied preference when one exists; rejected because the staff member would believe it was saved.

**For a patient joining, the same order applies without the supplied value.** Existing entry returned first (so a waiting legacy patient with none can still "join" idempotently), then the gate, then create.

**`PUT /me/contact-preference` is patient-only and uses the token's id.** There is no id in the path, so a patient cannot name another patient (BR-011) and there is nothing to authorise beyond the role. Staff receive 403 from `requireRole('patient')`. `PATCH` and every other previously tested path stay unrouted (404). The body is validated with Zod against `CONTACT_PREFERENCES`; anything else is 400.

**No code is needed for a mid-offer change; tests prove it.** Because the channel is derived on every request, a saved change is seen by the next patient view, staff view, accept, decline and record call. The offer row is not touched, so it keeps its slot, holder and `created_at` (BR-017, BR-007). BR-021 is met by the existing refusals (`response_by_staff` 403, `patient_responds_in_app` 409) now reached by a changed preference. The work is regression tests, and web messages that tell the person the current state.

**The patient view response gains a top-level `contactPreference`.** `MyWaitlistResponse` becomes `{ contactPreference, entry }`. A patient with no entry still needs it (the preference card and the join gate), so it cannot live inside `entry`. Alternative: a separate `GET /me`; rejected as an extra request on a screen that already polls.

**Demo registration is `POST /demo/register`, in the existing demo router.** Mounted only when `demoLogin` is true, so "unavailable outside the demonstration environment" is the same mechanism as demo login and needs no new flag. It trims the name, requires a non-empty name and a valid preference, inserts the patient and the first-choice audit row in one transaction, and returns the same `LoginResponse` as `/demo/login`. A case-insensitive unique index `patients_full_name_unique` on `lower(full_name)` backs the duplicate check, and a unique violation maps to 409 `name_already_registered`. Alternative: check by query only; rejected because two simultaneous registrations could both pass. The seed's six names are distinct, so the index applies cleanly. The audit actor is the new patient.

**Web: the API client gains `setContactPreference`, `register` and an optional preference on `addPatient`.** `describeError` gains messages for `preference_required`, `preference_already_recorded` and `name_already_registered`.

**Web: UI decisions and their basis.** Prototype V4 does not exist; V3 has no preference control, so these extend V3 and are pending UX.
- Patient screen: a "How we contact you" card above the entry card, showing "In-app", "Telephone" or "Not chosen yet" with a change control. Based on V3's patient screen (Card, MetaRow, Button from `ui.tsx`); the control is new.
- Choose-then-join: the "Join waitlist" button on the empty-state card reveals the two options with their descriptions and Confirm and Cancel. Based on V3's empty state; the choice step is new. V3 shows no failure state, so the failure message is new.
- Staff add panel: when the picked caller has no preference, a second select "Contact preference" appears and "Add to waitlist" stays disabled until it is chosen. Based on V3's add panel; the select is new.
- Sign-in: below the seeded-user buttons, a "Register (demo)" form with a name field and two options. Not in V3.
- Not covered by any prototype: the failure messages, the "Not chosen yet" wording, and the notice for a patient who switches mid-offer. Wording is pending UX.

## Risks / Trade-offs

- **The spec is still Draft.** Hospital operations have not confirmed that patients may write the preference or that the most recent write applies (BR-014 – BR-021). If they say no, this change is reverted rather than reworked, since the previous change stays intact beneath it. The archive guidance already asks for a summary of assumptions awaiting confirmation.
- **Another writer is not built.** BR-020 says the latest write wins between hospital registration and this app, but there is no registration integration. Today the app is the only writer after seeding, so the rule is satisfied trivially and not testable beyond two writes through the app.
- **Two-step join can leave a saved preference and no entry.** Intended (US-012), but a patient who abandons after saving is "chosen, not waiting". Harmless: the choice is theirs.
- **Name as identity.** Demo only, stated in the spec. The unique index makes a duplicate impossible, which also means demo data cannot hold two patients with the same name.
- **Existing tests change.** `preferenceReadOnly.test.ts`, tests that join or add patient 5, and the demo walkthrough must be updated; the seeded waitlist (Carlos, Ana) is unaffected because those entries are created directly by `seedDemoWaitlist`, which bypasses the gate.
- **Perf.** One extra indexed lookup per join and per preference save; no polling changes.

## Migration Plan

Migration `004` adds three nullable columns to `audit_log` and a unique index on `lower(full_name)`. `down` drops the index and the columns. Existing rows are unaffected. No data backfill: patients with no preference stay not recorded (BR-019).

## Open Questions

- Hospital operations confirmation of the reversal and of BR-020 (PS Section 14).
- Wording of the choice descriptions and failure messages, pending UX (PS US-012 AC2 is Proposed).

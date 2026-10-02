# Proposal

## Why

The built app treats a patient's contact preference as read-only: hospital registration captures it and nothing in the app can set or change it. PS-001 v2.5 reverses that. Patients choose and change their own preference in the app, a patient with no recorded preference must choose before joining, and staff record one only when adding a caller who has none (US-012, US-013, US-006, BR-014 – BR-021). Without this, the telephone path built in the previous change can only be demonstrated with seeded data, and a patient cannot correct a stale preference. A demo-only registration step (PS Appendix A) lets the whole journey be shown without a hospital registration system.

## What Changes

This is a delta on the built code. It adds only what PS-001 v2.5 introduces.

- **Patients set and change their own contact preference**, at any time they are signed in, including with a booked entry or no entry. Saving it never creates or changes an entry (US-013, BR-015, BR-018).
- **Join gate.** A patient with no recorded preference cannot join until they choose in-app or telephone. Choosing saves the preference, then joins. If the join then fails, the saved preference is kept (US-012, BR-014, BR-015).
- **Staff add gate.** Adding a caller who has no recorded preference requires staff to record the caller's stated choice, which is saved together with the new entry and audited to the staff member. Staff cannot change a preference that is already recorded (US-006, BR-014, BR-016).
- **Waiting patients with no preference** keep their place and are treated as telephone until they choose; they may choose at any time (BR-019).
- **A change while holding an offer takes effect at once.** The offer stays outstanding and follows the new channel: an in-app banner appears or disappears, and staff see the call flag appear or disappear. An action is judged against the preference at the moment it is taken; an action that is no longer available is refused and the person is told the current state. A response already recorded is never affected (US-013, US-008, US-011, BR-017, BR-018, BR-021).
- **Changes are audited.** Each save is recorded with who made it, when, and the previous and new values. The history is recorded only; no screen shows it (US-012, US-013, PS Section 10).
- **Demo registration (PS Appendix A, not Product scope).** When demo login is enabled, the sign-in screen offers a registration step: a name and in-app or telephone creates a patient and signs them in. A name already in use is refused. The step does not exist when demo login is off.
- **Screens.** The patient screen shows the current preference with a way to change it, and asks a patient with none to choose when they join. The staff add panel asks for the preference when the chosen caller has none. The sign-in screen gains the registration form.

Product decisions taken by the Product Owner in v2.5 but not yet confirmed by hospital operations (PS Section 14): patients may write the preference in the app (reversing the v2.0 – v2.4 read-only position), the most recent write applies where hospital registration and this app both write it (BR-020), and the interim assumption that staff obtain the telephone number from hospital records. Nothing here builds a link back to hospital registration.

Decisions taken by assumption (Proposed in PS-001 v2.5 or left open by it):
- Staff recording a preference on adding a caller is one required choice in the add panel, with no further confirmation.
- Where the client sends a preference that staff are not allowed to set (the caller already has one), the request is refused rather than ignored, so the staff member is told.
- A name is the uniqueness key for demo registration, compared case-insensitively after trimming; this is demo-only (PS Appendix A).
- The option descriptions shown when choosing are "In-app: offers appear in the app" and "Telephone: staff will call you" (PS US-012 AC2, Proposed).
- Prototype V4 does not exist yet. UI wording and layout extend prototype V3 and are pending UX.
- The "60 seconds" meaning of "applies at once" (BR-017) relies on the existing 10-second polling.

Deferred or not built (PS-001 v2.5 Section 10): staff correcting an already recorded preference; capturing a telephone number; contact options other than in-app and telephone; passing a changed preference back to hospital registration; showing the change history on any screen; automated out-of-app messaging.

**BREAKING** (internal): `POST /waitlist/patients/:patientId` and `POST /waitlist` now refuse with `preference_required` when the patient has no recorded preference and none is supplied. The previous behaviour "a preference sent in the body is ignored" is replaced. Tests and the demo walkthrough that join Ana Torres (no preference) must record one first, and the seeded waitlist (Carlos and Ana already waiting) is unaffected because those entries predate the gate (BR-019).

## Capabilities

### New Capabilities
- `demo-registration`: the demo-only registration step on the sign-in screen (PS Appendix A): creates a patient with a chosen preference, signs them in, refuses a duplicate name, and is unavailable outside the demo environment.

### Modified Capabilities
- `contact-preference`: the preference is no longer read-only. Patients set and change their own; a patient with none must choose before joining; staff record one only when adding a caller who has none; a change takes effect at once on a held offer; each change is audited with previous and new values; the in-app banner follows the preference at the moment of viewing.
- `waitlist-membership`: joining and staff adding are gated on a recorded preference, and a failed join keeps a saved preference.
- `telephone-offer-response`: staff recording and in-app responses are judged against the preference at the moment of the action, including after a mid-offer change; a recorded response is unaffected by a later change.
- `waitlist-screens`: the patient screen shows and changes the preference and asks for a choice before joining; the staff add panel asks for a preference when the caller has none; the sign-in screen shows the demo registration form.

## Impact

- API (`apps/api`): migration `004` (audit columns for preference changes, case-insensitive unique patient name); patient repository (`setPreference`); audit repository (previous and new values); waitlist service (`join` gate, optional preference on staff add); new preference route (`PUT /me/contact-preference`); demo router (`POST /demo/register`); `waitlistView` (patient view returns the current preference); error codes.
- Shared types (`packages/shared`): `MyWaitlistResponse` gains `contactPreference`; new `SetContactPreferenceResponse` and registration request and response types; `addPatient` accepts an optional preference.
- Web (`apps/web`): `PatientView` (preference card, choose-then-join), `StaffView` (preference choice for a caller with none), `LoginScreen` (registration form), API client and error messages.
- Tests: `preferenceReadOnly.test.ts` is replaced by tests for the new behaviour; tests that join or add a patient with no preference (patients 5 and any no-preference fixtures) must record one first; new web tests for the choose-then-join flow and the registration form.
- Docs: README, `openspec/config.yaml` context (it still says v2.4 / V3 and lists "capturing or editing the contact preference" as out of scope), and the QA test spec and Playwright data, which mirror the seed and the old read-only rule.

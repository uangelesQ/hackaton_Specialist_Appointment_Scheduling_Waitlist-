# Tasks

## 1. Contact preference data (contact-preference)

- [ ] 1.1 Write the migration test first, then add migration `003_contact_preference`: nullable `patients.contact_preference` with a CHECK for `in_app` and `telephone`, and a partial unique index on `slots.starts_at` where `status = 'booked'`. Verify with a schema test that `in_app`, `telephone` and null are accepted, any other value fails, and a second booked slot at the same time fails. *(Contact preference read from the record; A booked slot cannot be released again)*
- [ ] 1.2 Add a repository read of a patient's preference and a single `responseChannelOf` helper mapping `in_app` to `in_app` and `telephone` or null to `staff`. Verify with unit tests for all three values. *(Not recorded is treated as telephone)*
- [ ] 1.3 Seed preferences: patients 1–3 `in_app`, 4 `telephone`, 5 not recorded. Fix existing API and web tests that rely on patients 4 or 5 to respond in-app, by switching them to patients 1–3 or setting the preference in the test. Verify `npm test -w @waitlist/api` and `npm test -w @waitlist/web` pass and the seed test asserts the three preference values. *(Preference is read-only; seed covers all values)*
- [ ] 1.4 Add a test that no route accepts a contact preference change from a patient or staff member (PATCH, PUT and a body field on join and add all leave it unchanged). Verify the test passes without adding any endpoint. *(Preference cannot be changed here)*

## 2. Offer targeting (offer-targeting)

- [ ] 2.1 Write failing tests, then add `excludedPatientIds(slotId)` to the offers repository (declined and passed-on) and use it in `nextEligibleEntry`, dropping the `behind` argument. Verify tests: a declined patient is skipped, a passed-over patient is skipped for the same slot, and both are eligible for a different slot. *(Next in line; Passed-over patient is not offered the same slot again)*
- [ ] 2.2 Update `passOn` to use the new eligibility. Verify tests: pass-on offers the same slot to the next patient in line, the holder returns to `waiting` at the same position, and with no other eligible patient the slot stays open with no new offer. *(Pass-on moves the offer; Only patient is passed over)*
- [ ] 2.3 Make the release rules treat passed-over like declined: no release when every waiting patient declined or was passed over, and a rejected release returns `no_eligible_patient`. Verify tests for the staff view reason and the rejected request. *(Slot returns to staff when no patient is eligible)*
- [ ] 2.4 Reject a release whose date and time match a booked slot with 409 `slot_already_booked`, and keep a returned slot's date and time on re-release. Verify tests for the booked refusal, the booked-slot marking after accept, and the returned slot keeping its time. *(A booked slot cannot be released again)*

## 3. Response channel and staff-recorded responses (telephone-offer-response)

- [ ] 3.1 Refuse in-app accept and decline from patients whose channel is `staff` with 403 `response_by_staff`. Verify tests for a `telephone` patient and a not-recorded patient on both routes, with the offer and entry unchanged. *(In-app response is refused for non-in-app patients)*
- [ ] 3.2 Extract the accept and decline transactions into shared functions that take the actor and a recorded-by-staff flag, and verify the existing offer tests still pass unchanged. *(Staff-recorded responses have the same effect)*
- [ ] 3.3 Add staff-only `POST /offers/:offerId/record-accept` and `/record-decline`, refusing `in_app` holders with 409 `patient_responds_in_app`. Verify tests: record-accept books the slot and moves entries up, record-decline returns the entry to `waiting` at the same position and the slot to staff, both work for a not-recorded patient, a patient token is 403, and an `in_app` holder is refused. *(Staff record acceptance; Staff record decline; Recording is not available for in-app patients)*
- [ ] 3.4 Write audit actions `offer_accepted_by_staff` and `offer_declined_by_staff` with the staff member as actor, and keep patient responses on the existing actions. Verify audit tests for both. *(Staff-recorded responses are attributable and distinguishable)*
- [ ] 3.5 Verify first-action-wins with staff-recorded responses: record after pass-on and pass-on after record both return 409 `offer_not_available` with no change, and two concurrent requests apply exactly one. *(Only one response resolves an offer)*

## 4. Views and contract (contact-preference)

- [ ] 4.1 Extend the shared types and the staff view service with contact preference per entry, `requiresCall` and `createdAt` on the outstanding offer. Verify service and route tests for in-app, telephone and not-recorded holders, and `npm run build` type-checks both apps. *(Staff see contact preference and which offers need a call)*
- [ ] 4.2 Extend the patient view service so `offer` is returned only to an `in_app` holder and other holders get `offer: null`, `holdsOffer: true` and `responseChannel: 'staff'`. Verify service and route tests for all three preferences and for a patient without an offer. *(In-app banner only for in-app patients)*
- [ ] 4.3 Add a test that an `in_app` patient who responds after a pass-on is told the offer is no longer available and nothing changes, and that an unanswered `in_app` offer stays outstanding. Verify both pass. *(An unseen or stale in-app offer is handled)*

## 5. Web UI (contact-preference, telephone-offer-response)

- [ ] 5.1 Add the API client methods for record-accept and record-decline, and write failing component tests for the staff table. Then add the Contact column, the "Call required" pill on the holder, and the time outstanding in the slot control. Verify StaffView tests for the three preferences. *(Staff see contact preference and which offers need a call)*
- [ ] 5.2 Add "Patient accepted by phone" and "Patient declined by phone" actions for telephone and not-recorded holders, each behind the existing confirm modal, and hide them for `in_app` holders. Verify StaffView tests for the confirm step, the calls made, the hidden state, and an error shown when the offer is no longer available. *(Staff record acceptance and decline; no record actions for in-app patients)*
- [ ] 5.3 Show the banner only when `offer` is present and a neutral notice when `holdsOffer` is true without a banner. Verify PatientView tests: in-app banner with accept and decline, no banner or actions for telephone and not-recorded holders, and the notice text. *(In-app banner only for in-app patients)*
- [ ] 5.4 Add a component test that an in-app patient accepts in at most two actions after the offer is shown (Accept, Confirm) and declines in one. Verify the test passes. *(Steps to respond)*

## 6. Verification and documentation

- [ ] 6.1 Add regression tests for rules the built code already satisfies: staff adding an unregistered patient returns 404 and creates no entry or patient (US-006), a patient cannot view or answer another patient's offer (BR-011), and the first action on an offer wins (BR-012). Verify they pass with no source changes; if one fails, stop and report. *(Unregistered caller; patient sees only their own offer)*
- [ ] 6.2 Add an end-to-end test of the telephone path: a telephone patient joins, staff release, the offer is flagged as requiring a call, staff record the acceptance, and the slot is booked and cannot be released again; repeat for a not-recorded patient with a decline then a later release skipping them. Verify the e2e suite passes. *(Telephone path end to end)*
- [ ] 6.3 Manually check the offer view on a throttled 3G browser profile (about 1.6 Mbps) loads within 5 seconds, and confirm the web polling interval is 10 seconds or less so an offer appears within 60 seconds. Record the result in the README section added in 6.4. *(An offer is visible promptly)*
- [ ] 6.4 Document the contact preference, the telephone path, the seed values and the re-seed note in the README, and verify the documented `npm run seed` and `npm run dev` commands run as written. *(Documentation)*
- [ ] 6.5 Run `npm run build`, `npm run lint` and `npm test` from the repo root and report any failure. Verify all three exit with code 0.

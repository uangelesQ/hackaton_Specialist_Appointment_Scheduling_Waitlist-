# Suite Design: Waitlist Telephone Path & Slot Rules

| | |
|---|---|
| **Feature** | Specialist Waitlist — registry → slot release → acceptance, with telephone path |
| **OpenSpec change** | `waitlist-telephone-path-and-slot-rules` |
| **QA test spec** | `docs/qa/test-spec-waitlist-telephone-path-and-slot-rules.md` · v0.3 · based on PS-001 v2.4 |
| **Application** | Web `http://localhost:5173`, API `http://localhost:3001` (local only, current pre-change build) |
| **Date** | 2026-10-01 |
| **Status** | Design v0.3 — suite built against the **current app** (12 tests pass, 11 `test.fixme`). The app is not modified. Locators for unbuilt behaviour are unverified |

---

## 0. Environment

| Check | Result | Detail |
|---|---|---|
| Runtime (Node, npm) | Pass | Node 24.21.0, npm 11.19.0 via `nvm use 24`. The default shell Node is still 21.7.3, so every terminal needs `nvm use 24` |
| Dependencies installed | Partial | Root `npm ci` done. `playwright-suite/` has only `@playwright/test` 1.63.0; Allure, dotenv and TypeScript are not installed |
| Build | Pass | `npm run build` exits 0 |
| Implementation state of the OpenSpec change | **Fail** | 0 of 30 tasks done. Not built: contact preference, call-required flag, time outstanding, record-by-phone actions, passed-over exclusion, booked-slot refusal, V3 seed, hidden position / Leave / Remove / Joined column |
| Seeded actors match the QA spec | **Fail** | Seed is Ana Torres, Ben Carter, Chloe Nguyen, David Okafor, Eva Lindqvist (patients) and Sam Patel, Maria Gomez (staff), clinic Dermatology. The QA spec expects Maria Gómez, Carlos Mendoza, Ana Torres, Jorge Ramírez, Cardiology |
| API and web answer | Pass | `GET /demo/users` and `GET /` return 200; `/api` proxy works |
| Clean database for the run | Pass (demo) | The demo database `apps/api/data/waitlist.db` was deleted and recreated on 2026-10-01: seed only, empty waitlist. The suite will use its own `data/e2e.db` anyway |

**Data left by the locator capture: reverted.** The capture made changes through the UI (a booking and three waiting entries). On 2026-10-01, with your agreement, I stopped the API, deleted `apps/api/data/waitlist.db`, and restarted the API, which recreated it from the seed. No application file was changed.

Commands used: `source ~/.nvm/nvm.sh && nvm use 24`, `npm run dev -w @waitlist/api`, `npm run dev -w @waitlist/web`. Checked on 2026-10-01.

---

## 1. Scope

- **Automated:** all 20 QA cases (12 UI + API, 3 API, 5 UI). None is Manual: the 3G load check is outside the 20 cases.
- **Runnable against the current app now:** 8 cases. **Partly runnable:** 3 (some steps pass, others depend on unbuilt behaviour). **Blocked on app:** 9.
- **Gap G-15 (second slot):** resolved for this suite. The suite follows the app, where staff type the slot date and time, so a second slot exists (decision 2026-10-01). The QA spec was updated to v0.3 to match. Step 3 of TC-US006-002 (message text) stays blocked on the UI mapping (G-10).
- **Out of scope** (QA spec): deferred stories US-002, US-005, US-007, quality targets (reliability, WCAG), the 3G load time, specialty scoping (G-11).

---

## 2. Layout

```
playwright-suite/
  playwright.config.ts
  package.json
  tsconfig.json
  .env.example
  design/
    suite-design-waitlist-telephone-path-and-slot-rules.md
  tests/
    pageObjects/
      signInPO.ts
      appShellPO.ts
      joinWaitlistPO.ts
      addPatientPO.ts
      viewWaitlistPO.ts
      releaseSlotPO.ts
      respondToOfferPO.ts
      recordPhoneResponsePO.ts
    helpers/
      authHelper.ts
      apiHelper.ts
      waitlistFlow.ts
      allureMeta.ts
    fixtures/
      baseTest.ts
    data/
      testData.json
    specs/
      joinWaitlist.spec.ts
      addPatient.spec.ts
      viewWaitlist.spec.ts
      releaseSlot.spec.ts
      respondToOffer.spec.ts
      passOnOffer.spec.ts
      recordPhoneResponse.spec.ts
      offerResolution.spec.ts
      bookedSlot.spec.ts
      offerAccess.spec.ts
```

`signInPO` and `appShellPO` are shared screen objects with no spec of their own. Every other page object is owned by the spec with the same name. `passOnOffer.spec.ts` uses `releaseSlotPO` (same staff slot control); `offerResolution.spec.ts` uses `respondToOfferPO`, `releaseSlotPO` and `recordPhoneResponsePO`; `bookedSlot.spec.ts` uses `releaseSlotPO`; `offerAccess.spec.ts` is API only and has no page object.

---

## 3. Page objects

**Labels (decision 2026-10-01):** controls the app already has keep the app's current labels (`Release slot`, `No response — offer to next patient`, `Cancel`). Controls that do not exist yet take the prototype's labels (`They accepted`, `They declined`, `Contact preference`, `Requires a call`). All labels are kept in `testData.json` under `labels`, so a rename is a one-line change.

Evidence status is `verified` (exactly one match in the captured state), `blocked on app` (the behaviour is not built), or `needs DOM` (the state was not captured). All locators below use role plus accessible name or label; the app has no `data-testid`.

### signInPO (shared)

| Kind | Name | Strategy | Status |
|---|---|---|---|
| Locator getter | `getUserButton(name)` | role button, name = user | verified |
| Locator getter | `getSignInHeading()` | role heading, name `Sign in` | verified |
| Action | `signInAs(name): Promise<void>` | clicks the user's button | n/a |

### appShellPO (shared)

| Kind | Name | Strategy | Status |
|---|---|---|---|
| Locator getter | `getSignOutButton()` | role button, name `Sign out` | verified |
| Locator getter | `getSignedInLabel(name, role)` | text `Signed in as <name> (<role>)` | verified |
| Action | `signOut(): Promise<void>` | clicks Sign out, waits for the sign-in heading | n/a |

### joinWaitlistPO (patient screen) — spec: `joinWaitlist.spec.ts`

| Kind | Name | Strategy | Status |
|---|---|---|---|
| Locator getter | `getNotJoinedHeading()` | heading `You're not on the waitlist yet` | verified |
| Locator getter | `getJoinButton()` | role button `Join waitlist` | verified |
| Locator getter | `getOnWaitlistHeading()` | heading `You're on the waitlist` | verified |
| Locator getter | `getWaitingNotice()` | text `We'll notify you here the moment a slot opens…` | verified (wording may change in V3) |
| Locator getter | `getPositionBadge()` | text `Your place in line` | verified (to be asserted **absent** after the change) |
| Locator getter | `getLeaveButton()` | role button `Leave waitlist` | verified (to be asserted **absent** after the change) |
| Action | `joinWaitlist(): Promise<void>` | clicks Join, waits for the on-waitlist heading | n/a |
| Query | `readJoinedDate(): Promise<string>` | reads the Joined meta value | needs DOM (`Joined Oct 1` is a text node in a meta row; no label link) |

### addPatientPO (staff add panel) — spec: `addPatient.spec.ts`

| Kind | Name | Strategy | Status |
|---|---|---|---|
| Locator getter | `getPatientPicker()` | role combobox `Patient to add` | verified |
| Locator getter | `getAddButton()` | role button `Add to waitlist` | verified |
| Locator getter | `getAddConfirmation()` | message with the added patient and preference | blocked on app |
| Locator getter | `getAlreadyOnWaitlistMessage()` | message `…already on the waitlist` | blocked on app |
| Locator getter | `getNotRegisteredMessage()` | message `…not registered… must register` | blocked on app |
| Action | `addPatient(name): Promise<void>` | selects the option, clicks Add | n/a |

### viewWaitlistPO (staff table) — spec: `viewWaitlist.spec.ts`

| Kind | Name | Strategy | Status |
|---|---|---|---|
| Locator getter | `getEmptyMessage()` | text `No patients are currently waiting.` | verified |
| Locator getter | `getRowByPatient(name)` | role row, name matching the patient | verified (names must not be substrings of each other) |
| Locator getter | `getStatusCell(name)` | within the row, role cell `Waiting`/`Notified` | verified |
| Locator getter | `getPositionCell(name)` | within the row, the first cell | verified; no accessible name, so read via the row's cells, not `nth` on the table |
| Locator getter | `getContactPreferenceCell(name)` | within the row, role cell | blocked on app |
| Locator getter | `getRequiresCallFlag(name)` | within the row, text `Requires a call` | blocked on app |
| Locator getter | `getJoinedColumnHeader()` / `getRemoveButton(name)` | role columnheader `Joined`; role button `Remove <name>` | verified (to be asserted **absent** after the change) |
| Query | `readPositions(): Promise<string[]>` | patient names in table order | verified via row accessible names |

### releaseSlotPO (staff slot control) — spec: `releaseSlot.spec.ts`

| Kind | Name | Strategy | Status |
|---|---|---|---|
| Locator getter | `getSlotInput()` | label `Slot date and time` | verified (present only when no returned slot) |
| Locator getter | `getReleaseButton()` | role button `Release slot` | verified (the app label is used) |
| Locator getter | `getWaitingOnText()` | text `Waiting on <name>'s response…` | verified |
| Locator getter | `getPassOnButton()` | role button `No response — offer to next patient` | verified (the app label is used; the prototype's `Couldn't reach them — pass to next` is not built) |
| Locator getter | `getReturnedSlotText()` | text `A returned slot is ready to release` | verified |
| Locator getter | `getNoEligibleText()` | text `No eligible patient remains for this slot.` | blocked on app (current text: `Every waiting patient has already declined…`, state not captured) |
| Locator getter | `getTimeOutstanding()` | text with elapsed time | blocked on app |
| Action | `releaseSlot(startsAt?): Promise<void>` | fills the slot input when it is shown (no returned slot), clicks Release | n/a |
| Action | `passOnOffer(): Promise<void>` | clicks the pass-on button | n/a |

### respondToOfferPO (patient offer) — spec: `respondToOffer.spec.ts`

| Kind | Name | Strategy | Status |
|---|---|---|---|
| Locator getter | `getBanner()` | role status, text `A slot just opened for you` | verified |
| Locator getter | `getAcceptButton()` / `getDeclineButton()` | role button `Accept` / `Decline` | verified |
| Locator getter | `getConfirmDialog()` | role dialog `Book this appointment?` | verified |
| Locator getter | `getConfirmButton()` | within the dialog, role button `Confirm` | verified |
| Locator getter | `getCancelButton()` | within the dialog, role button `Cancel` | verified (the app label is used; the QA spec and prototype call it `Go back`) |
| Locator getter | `getBookedHeading()` | heading `You're booked` | verified |
| Locator getter | `getStaffContactNotice()` | notice for telephone / not-recorded holders | blocked on app |
| Locator getter | `getUnansweredNote()` | text `staff can pass an unanswered offer on` | blocked on app (current text: `It can be offered to the next patient`) |
| Action | `acceptOffer(): Promise<void>` | Accept, then Confirm | n/a |
| Action | `declineOffer(): Promise<void>` | clicks Decline, waits for it to disappear | n/a |

### recordPhoneResponsePO (staff record actions) — spec: `recordPhoneResponse.spec.ts`

| Kind | Name | Strategy | Status |
|---|---|---|---|
| Locator getter | `getRecordAcceptedButton()` | role button `They accepted` | blocked on app |
| Locator getter | `getRecordDeclinedButton()` | role button `They declined` | blocked on app |
| Action | `recordAccepted(): Promise<void>` | one click | n/a |
| Action | `recordDeclined(): Promise<void>` | one click | n/a |

Page objects hold locators and actions only. Assertions stay in the specs.

### Locator evidence

All captures are from the running current app on 2026-10-01 using the Playwright MCP, counting matches with `locator.count()`.

| Page object | Locator | State captured | Matches | Strategy | Result |
|---|---|---|---|---|---|
| signInPO | user button `Ana Torres` | signed out | 1 | role button, name | verified |
| signInPO | user button `Ricardo Salazar` | signed out | 1 | role button, name | verified |
| appShellPO | `Signed in as Ana Torres (patient)` | patient signed in | 1 | text | verified |
| joinWaitlistPO | not-joined heading | patient, not on list | 1 | role heading, name | verified |
| joinWaitlistPO | Join waitlist button | patient, not on list | 1 | role button, name | verified |
| joinWaitlistPO | Leave waitlist button | patient, waiting | 1 | role button, name | verified |
| addPatientPO | patient picker | staff, any state | 1 | role combobox, name | verified |
| addPatientPO | Add to waitlist | staff, any state | 1 | role button, name | verified |
| viewWaitlistPO | empty message | staff, empty list | 1 | text | verified |
| viewWaitlistPO | row `Ana Torres` | staff, two waiting | 1 | role row, name | verified |
| viewWaitlistPO | row `Diego Herrera` | staff, two waiting | 1 | role row, name | verified |
| viewWaitlistPO | `Notified` in Ana's row | staff, offer outstanding | 1 | within row, text | verified |
| viewWaitlistPO | Remove button in Ana's row | staff, two waiting | 1 | within row, role button, name | verified (absent after change) |
| releaseSlotPO | slot input | staff, no offer, no returned slot | 1 | label | verified |
| releaseSlotPO | slot input | staff, returned slot | 0 | label | verified (correctly absent) |
| releaseSlotPO | Release slot | staff, empty list | 0 | role button, name | verified (correctly absent) |
| releaseSlotPO | Release slot | staff, two waiting | 1 | role button, name | verified |
| releaseSlotPO | Release slot | staff, offer outstanding | 0 | role button, name | verified (correctly absent) |
| releaseSlotPO | pass-on button | staff, offer outstanding | 1 | role button, name regexp | verified |
| releaseSlotPO | returned-slot text | staff, after decline | 1 | text regexp | verified |
| releaseSlotPO | `Waiting on David Okafor` | staff, after pass-on | 1 | text regexp | verified |
| respondToOfferPO | banner text | patient, notified | 1 | text | verified |
| respondToOfferPO | Accept | patient, notified | 1 | role button, name | verified |
| respondToOfferPO | Decline | patient, notified | 1 | role button, name | verified |
| respondToOfferPO | confirm dialog | patient, accept clicked | 1 | role dialog, name | verified |
| respondToOfferPO | Confirm in dialog | patient, accept clicked | 1 | within dialog, role button | verified |
| respondToOfferPO | Cancel in dialog | patient, accept clicked | 1 | within dialog, role button | verified |
| respondToOfferPO | booked heading | patient, booked | 1 | role heading, name | verified |
| viewWaitlistPO | row `Ana Torres` | staff, after her booking | 0 | role row, name | verified (booked entries not listed) |

Observations from the capture that affect the design:
- The page has no `data-testid`. Role plus name worked for every control that exists today.
- The row accessible name contains the Remove button's label, so `getRowByPatient` must match by patient name only and stay unique per name.
- The status pill and position are plain cells with no accessible name. They are read from the row's cells; do not use `nth` on the table.
- Current evidence that contradicts the target spec: after the last pass-on the returned slot is released again and the passed-over patients are eligible (S7 capture). The BR-005 passed-over exclusion is **not** built, so TC-US010-001 and TC-US010-002 will fail on the current app.
- The app formats the slot as `Friday, Oct 2 · 10:30 AM`. 2 October 2026 is a Friday; the prototype's "Thursday" is wrong.

---

## 4. Helpers and fixtures

| File | Responsibility | Inputs | Outputs |
|---|---|---|---|
| `authHelper.ts` | Signs an actor in through the UI (via `signInPO`) or obtains an API token with `POST /demo/login` | role, actor id or name | token, or a signed-in page |
| `apiHelper.ts` | Wraps the Playwright `request` context. Setup: join as a patient, add as staff, release, accept, decline, pass on. Reads: staff waitlist and a patient's own entry (for audit-like and rejection assertions). Cleanup | token, ids, slot time | plain responses |
| `waitlistFlow.ts` | Multi-step flows built on page objects: sign in as staff, add the actors, release, return the offer | actor aliases | the offer id |
| `allureMeta.ts` | One call that sets epic, feature, story, severity, tag and the TMS link from the QA case fields | QA case id, story, severity, tag | nothing |

Fixtures in `baseTest.ts`: `signIn`, `appShell`, `joinWaitlist`, `addPatient`, `viewWaitlist`, `releaseSlot`, `respondToOffer`, `recordPhoneResponse`, `api`, `auth`.

App routes used by the helpers, all read from the source: `POST /demo/login` body `{ role, id }`; `POST /waitlist` (patient join); `POST /waitlist/patients/:patientId` (staff add); `DELETE /waitlist/:entryId` (staff remove, used for cleanup); `GET /waitlist` (staff view); `GET /me/waitlist`; `POST /offers` with `{ startsAt }`; `POST /offers/:offerId/accept`, `/decline`, `/pass`; `GET /patients`. After the change: `POST /offers/:offerId/record-accept` and `/record-decline`.

---

## 5. Data

- `tests/data/testData.json` holds stable shared values: base URL and API URL keys (read from the environment), the demo actors by **role alias**, and fixed slot times.
- Role aliases keep the tests independent of the seed: `inApp1`, `inApp2`, `inApp3`, `telephone1`, `notRecorded1`, `telephone2`, `unregistered`, `staff1`. Today they map to the current seed (Ana, Ben, Chloe for in-app; David and Eva exist but have no preference field, so `telephone1` and `notRecorded1` are `blocked on app`). After the change they map to Maria, Ben, Chloe, Carlos, Ana, Jorge and Sofía Reyes (unregistered).
- Per test: slot times are unique (a base time plus an offset from `Date.now()`) so that a booked slot from an earlier run cannot collide with a new release.
- No tokens or credentials are stored. The demo login is passwordless, and the base URLs come from `.env` (see `.env.example`).

---

## 6. Setup and cleanup per test

**Decision 2026-10-01: the suite reverts its own changes through Playwright and the API, and the application is not modified** (no reset endpoint, no app code or config change).

The app has no reset, a returned slot is reused by the next release, decline records stay on the patient, and removal marks an entry `removed` instead of deleting it. So cleanup works at two levels:

1. **Per test (`afterEach`, API):** pass on or have the holder decline any outstanding offer, then remove every active entry with `DELETE /waitlist/:entryId`. Each test uses actors and a slot time of its own where the seed allows (slot time = a base plus an offset from `Date.now()`).
2. **Per spec file (Playwright, test database only):** a worker-scoped fixture stops and restarts the API process with a fresh `DATABASE_FILE` (for example `data/e2e.db`, deleted first), so no data survives from one spec file to the next. The suite owns this database. It never touches the demo database `apps/api/data/waitlist.db` and changes no application file.

Residual risk, accepted: inside one spec file, a returned slot and decline records persist between tests. Tests in the same file that return or decline a slot must use different actors and a unique slot time, and the order of tests in such a file is fixed. Which actors are available is limited by the seed (five patients today).

| Spec | Setup | Cleanup |
|---|---|---|
| All | API helper adds the actors needed, gets tokens with `POST /demo/login` | Level 1 after each test; level 2 between spec files |
| `releaseSlot`, `respondToOffer`, `passOnOffer`, `recordPhoneResponse`, `offerResolution`, `bookedSlot` | Unique slot time per test | Same, plus a distinct actor set per test inside the file |
| `viewWaitlist` (empty list case) | Needs an empty database | Guaranteed by level 2 |

## 7. Spec files and traceability

Readiness: **Now** = runs against the current app. **Partly** = some steps run now. **Blocked** = depends on unbuilt behaviour.

| QA case | Spec file | Test title | Class | Severity | Allure feature | Readiness |
|---|---|---|---|---|---|---|
| TC-US001-001 | `joinWaitlist.spec.ts` | A registered in-app patient joins and sees her status, with no queue position | UI + API | critical | US-001 Join the specialty waitlist | Partly (join and staff-list steps now; "no position / count / Leave" depends on the change) |
| TC-US001-002 | `joinWaitlist.spec.ts` | Joining twice does not create a second entry | API | normal | US-001 | Now |
| TC-US006-001 | `addPatient.spec.ts` | Staff add a registered telephone patient and the preference is shown | UI + API | critical | US-006 Add a patient on their behalf | Blocked (telephone actor and preference pill) |
| TC-US006-002 | `addPatient.spec.ts` | Staff cannot add a person who is not registered, and nothing is created | API | critical | US-006 | Now for the API steps; message step blocked (G-10, G-12) |
| TC-US004-001 | `viewWaitlist.spec.ts` | The staff table shows position order, contact preference and a call flag, and no deferred controls | UI | critical | US-004 View the waitlist | Blocked |
| TC-US004-002 | `viewWaitlist.spec.ts` | An empty waitlist shows a message and no release action | UI | normal | US-004 | Now (needs an empty database) |
| TC-US009-001 | `releaseSlot.spec.ts` | Releasing a slot offers it to the next patient in line only | UI + API | critical | US-009 Release an open slot | Blocked (telephone holder and call flag are not built) |
| TC-US009-002 | `releaseSlot.spec.ts` | Only one offer can be outstanding at a time | UI + API | critical | US-009 | Partly (logic runs now with the current actors; names depend on the seed) |
| TC-US003-001 | `respondToOffer.spec.ts` | An in-app patient sees the offer banner and other patients see none | UI | critical | US-003 Be notified of a slot offer | Now (note wording differs from V3) |
| TC-US008-001 | `respondToOffer.spec.ts` | An in-app patient accepts after a confirm step and the slot is booked | UI + API | critical | US-008 Accept or decline an offered slot | Now |
| TC-US008-002 | `respondToOffer.spec.ts` | Going back from the confirm step changes nothing | UI | normal | US-008 | Now (uses the app's `Cancel`; same behaviour as `Go back`) |
| TC-US008-003 | `respondToOffer.spec.ts` | Declining returns the slot to staff and the decliner is not offered it again | UI + API | critical | US-008 | Now (release label differs) |
| TC-US010-001 | `passOnOffer.spec.ts` | Passing on moves the offer to the next in line and the passed-over patient is not re-offered | UI | critical | US-010 Pass an unanswered offer on | Blocked (BR-005 passed-over exclusion not built). Step 3 uses a second typed slot |
| TC-US010-002 | `passOnOffer.spec.ts` | Nobody eligible leaves the slot with staff and offers no release action | UI + API | critical | US-010 | Blocked (not built). Step 4 uses a second typed slot |
| TC-US011-001 | `recordPhoneResponse.spec.ts` | Staff record a telephone patient's acceptance and the audit shows it was staff-entered | UI + API | critical | US-011 Record a telephone patient's response | Blocked |
| TC-US011-002 | `recordPhoneResponse.spec.ts` | Staff record a not-recorded patient's decline | UI + API | critical | US-011 | Blocked |
| TC-BR001-001 | `recordPhoneResponse.spec.ts` | Each patient answers in exactly one place | UI + API | critical | BR-001 One response channel | Blocked |
| TC-BR012-001 | `offerResolution.spec.ts` | Only the first action on an offer is applied | UI + API | critical | BR-012 First action wins | Partly (steps 1 and 2 run now: pass-on then a late patient accept; steps 3 and 4 need the record actions) |
| TC-BR013-001 | `bookedSlot.spec.ts` | A booked slot cannot be released again | UI + API | critical | BR-013 Booked slot | Blocked (not built). Step 4 uses a second typed slot |
| TC-BR011-001 | `offerAccess.spec.ts` | A patient cannot view or answer another patient's offer | API | critical | BR-011 Patients see only their own offer | Now |

Counts: Now 8 (TC-US001-002, TC-US004-002, TC-US003-001, TC-US008-001, TC-US008-002, TC-US008-003, TC-BR011-001, and the API steps of TC-US006-002), Partly 3 (TC-US001-001, TC-US009-002, TC-BR012-001), Blocked 9 (all because the behaviour is not built).

Every QA case ID appears once. Cases blocked on unbuilt behaviour are written as `test.fixme` with the gap ID or task number in a one-line comment, and are switched on when the OpenSpec change lands. Severity maps from the QA priority: High = critical, Medium = normal.

---

## 8. Allure

- **Packages** (latest on npm at design time): `allure-playwright` 3.13.0, `allure-js-commons` 3.13.0, `allure-commandline` 2.46.1. `allure-playwright` 3.x uses the `allure-js-commons` API, which is what the metadata helper calls. `@playwright/test` is already 1.63.0 in the scaffold.
- **Reporter:** `['list']` and `['allure-playwright', { resultsDir: 'allure-results', detail: true, environmentInfo }]`. The environment info lists base URL, API URL and Node version, with no secrets.
- **Folders and scripts:** `allure-results`, `allure-report`, `test-results`, `playwright-report` and `.env` go in the ignore list. Scripts: `test`, `typecheck`, `allure:generate`, `allure:open`.
- **Metadata (one call per test via `allureMeta.ts`):** epic `Specialist Waitlist`; feature from the table above; story the rule or scenario; severity from the QA priority; tag the QA type; TMS link to the QA case ID in `docs/qa/test-spec-waitlist-telephone-path-and-slot-rules.md`. `test.fixme` cases also get the gap ID as a tag.
- **Steps:** page object action methods wrap their body in an `allure.step` named after the action. Locator calls are not wrapped.
- **History:** kept locally by copying `allure-report/history` into `allure-results/history` before generating. Publishing in CI is not designed here.

---

## 9. Run configuration

- **Browser:** Chromium only. The scaffold's Firefox and WebKit projects are removed. Mobile viewports are not designed because no QA case needs them.
- **Parallelism:** `fullyParallel: false`, `workers: 1`. The app has one specialist and one outstanding offer at a time, and a shared database, so tests must run in series.
- **Retries and timeouts:** 0 locally and 1 in CI. Default timeout 30 s; expect timeout 10 s, which covers the app's 10-second polling where a test must observe a change made by another actor. Prefer reloading or waiting on the control over `waitForTimeout`.
- **Artifacts:** trace `retain-on-failure`, screenshot `only-on-failure`.
- **Labels:** the strings used in locators come from `testData.json` (`labels`).
- **Base URLs:** from `BASE_URL` and `API_URL` in `.env` (placeholders in `.env.example`: `http://localhost:5173`, `http://localhost:3001`).
- **Starting the app:** a `webServer` entry in `playwright.config.ts` starts the web dev server, and a worker-scoped fixture starts and restarts the API with `DEMO_LOGIN=true` and the suite's own `DATABASE_FILE`. The web app proxies `/api` to port 3001, so the API must use that port and no other process may hold it while the suite runs. It requires Node 24 in the shell.
- **Reset:** per section 6. The suite owns `data/e2e.db`; the demo database is never used by the suite.

---

## 10. Risks and open questions

| # | Item | Why it matters | Needed from |
|---|---|---|---|
| 1 | **Reset between tests: decided.** No app change. The suite cleans up through Playwright and the API and restarts its own API with a fresh database per spec file (section 6). | Tests inside one spec file are not fully independent (returned slot, decline records). | Residual risk accepted |
| 2 | **G-15: decided.** The suite follows the app, with staff-typed date and time. | The QA spec was updated to v0.3 to match (G-01, G-15, labels and the three previously blocked steps). | Done |
| 3 | **Labels: decided.** Existing controls keep the app labels; new controls take the prototype labels. The prototype's `Couldn't reach them — pass to next` and `Go back` are not used because the app has `No response — offer to next patient` and `Cancel`. | If the build later renames a control, only `labels` in `testData.json` changes. The QA spec text should use the app labels. | You |
| 4 | **Database left in a dirty state:** resolved. The demo database was deleted and recreated on 2026-10-01 with the seed only (empty waitlist). | None | Done |
| 5 | **Polling.** The staff and patient screens refresh every 10 seconds. | A test observing another actor's change can wait up to ~10 s; use reload or a wait on the expected control, never a fixed sleep | Design decision made: no fixed sleeps |
| 6 | **Actor aliases** rely on the V3 seed (task 1.3). | Until it lands, 9 cases cannot be run | OpenSpec implementation |
| 7 | **TypeScript 7.0.2** is the latest on npm; Playwright and the Allure packages may expect 5.x. | Type-check or runtime errors in Build mode | Check at install; pin to the version Playwright supports |
| 8 | The suite creates data through the API with the demo login. | Fine for a local demo; refuse any other database or URL | Guardrail already in the skill |

---

## 11. Suggested additions (not in the QA spec)

These are proposals only and are not designed above.

- A smoke test that signs in as each seeded role and sees the expected landing screen. It would catch a broken seed before the other cases run.
- A case for the offline in-app patient (US-003 AC5, US-010 AC3), which the QA spec left out for the 20-case limit.
- A case that the patient screen and API never reveal queue length (the earlier requirement, now hidden by decision).

---

## Change log

| Version | Date | Based on | Change |
|---|---|---|---|
| 0.1 | 2026-10-01 | QA spec v0.2; current running app (pre-change); OpenSpec change `waitlist-telephone-path-and-slot-rules` | First design against the current app |
| 0.2 | 2026-10-01 | Same | Decisions applied: no app change and suite-owned cleanup (section 6), typed slot date and time (G-15 resolved for the suite), app labels for existing controls and prototype labels for new ones. Counts: 8 now, 3 partly, 9 blocked |
| 0.3 | 2026-10-01 | Same | Build mode: suite written under `tests/`. Result on the current app: 12 passed, 11 skipped (`test.fixme`), 23 tests for the 20 QA cases (TC-BR012-001 has three tests, TC-US001-001 two). Deviations from this design: `readPatientOrder` and the page objects use `nth` only to read a known column; the suite API is stopped through a pid file because teardown runs in another process |
| 0.4 | 2026-10-02 | QA specs `test-spec-waitlist-telephone-path-and-slot-rules.md` v0.3 and `test-spec-waitlist-contact-preference-in-app.md` v0.1; app built for PS v2.5 | Suite updated: new seed names and staff, the 11 skipped tests switched on, 26 new cases added (46 QA case IDs covered, 50 tests, all passing; one is an expected failure for a screen defect). Locators for the new screens proven with the Playwright MCP on Node 24. Pass-on label is now the prototype label. Audit rows are read with the sqlite3 command |


# Suite Design: <feature name>

| | |
|---|---|
| **Feature** | <feature, from the QA spec header> |
| **OpenSpec change** | `<change>` |
| **QA test spec** | `docs/qa/test-spec-<change>.md` · version <n> · based on PS <version> |
| **Application** | <apps and URLs under test> |
| **Date** | <date> |
| **Status** | Draft design — no code written (or `Blocked on environment`) |

## 0. Environment

| Check | Result | Detail |
|---|---|---|
| Runtime (Node, npm) | | |
| Dependencies installed | | |
| Build | | |
| Implementation state of the OpenSpec change | | tasks done / total; QA cases that cannot pass yet |
| Seeded actors match the QA spec | | |
| API and web answer | | URLs and ports |
| Clean database for the run | | file and reset method |

Commands used to start the app: <list>. Checked on: <date>.

## 1. Scope

- Automated here: <classes and counts>
- Manual: <TC IDs and reason>
- Blocked (`test.fixme`): <TC IDs and gap IDs>
- Out of scope: <quoted from the QA spec>

## 2. Layout

```
playwright-suite/
  ...
```

## 3. Page objects

One subsection per page object.

### <Screen>PO (`tests/pageObjects/<screen>PO.ts`)

| Kind | Name | Strategy | DOM status |
|---|---|---|---|
| Locator getter | `getReleaseButton()` | role button, name `...` | verified / needs DOM / blocked on app |
| Action | `releaseNextSlot(): Promise<void>` | clicks the release button | n/a |
| Query | `readStatusOf(name): Promise<string>` | reads the status cell of a row | needs DOM |

Used by: <spec files>

### Locator evidence

| Page object | Locator | State captured | Matches | Strategy | Result |
|---|---|---|---|---|---|
| | `getReleaseButton()` | staff, no offer outstanding | 1 | role button, name | verified |

Every locator in section 3 appears here. A locator is `verified` only with exactly one match in the state where the test uses it, no run-dependent text, and a role, label or test id strategy.

## 4. Helpers and fixtures

| File | Responsibility | Inputs | Outputs |
|---|---|---|---|
| `authHelper.ts` | | | |
| `apiHelper.ts` | | | |

Fixtures in `baseTest.ts`: <list>

## 5. Data

- `testData.json` holds: <list>
- Created per test: <list, with how uniqueness is guaranteed>
- Secrets: environment variables <names>, documented in `.env.example`

## 6. Setup and cleanup per test

| Spec | Setup | Cleanup |
|---|---|---|

## 7. Spec files and traceability

| QA case | Spec file | Test title | Class | Severity | Allure feature | Notes |
|---|---|---|---|---|---|---|

Every QA case ID appears once. Blocked cases are `test.fixme`. Manual cases have no spec.

## 8. Allure

Package versions, results and report folders, metadata convention, steps policy, history, publishing.

## 9. Run configuration

Projects, base URL and API URL, retries, timeouts, workers and why, trace and screenshot policy, how the app and database are started and reset before a run.

## 10. Risks and open questions

| # | Item | Why it matters | Needed from |
|---|---|---|---|

## 11. Suggested additions (not in the QA spec)

Cases the QA spec does not list but the design suggests. These are proposals only and are not designed above.

## Change log

| Version | Date | Based on | Change |
|---|---|---|---|

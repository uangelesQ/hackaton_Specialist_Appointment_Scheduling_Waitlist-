# Allure reporting

Used by `SKILL.md`. Allure turns each run into a browsable report with steps, attachments, history and links back to the QA test cases.

## Packages

| Package | Role |
|---|---|
| `allure-playwright` | Playwright reporter that writes `allure-results/` |
| `allure-js-commons` | Metadata API for tests (epic, feature, story, severity, links, steps) |
| `allure-commandline` | Generates and opens the HTML report |

Check the installed versions before writing metadata calls. `allure-playwright` 3.x uses the `allure-js-commons` API shown here; older versions export an `allure` object from `allure-playwright` instead. Use whichever matches the installed version, and state the version in the design.

## Reporter configuration

In `playwright.config.ts`:

```ts
reporter: [
  ['list'],
  ['allure-playwright', {
    resultsDir: 'allure-results',
    detail: true,
    suiteTitle: false,
    environmentInfo: {
      baseUrl: process.env.BASE_URL,
      apiUrl: process.env.API_URL,
      node: process.version,
    },
  }],
],
```

Do not put secrets in `environmentInfo`.

## Scripts

```json
"allure:generate": "allure generate allure-results --clean -o allure-report",
"allure:open": "allure open allure-report"
```

Run order: `npm test`, then `npm run allure:generate`, then `npm run allure:open`. Add `allure-results`, `allure-report` and `test-results` to `.gitignore`.

For history across runs, copy `allure-report/history` into `allure-results/history` before generating. In CI, publish `allure-report` as a build artifact.

## Metadata convention

Every automated test carries the same metadata, derived from the QA test spec, so the report groups the way the QA spec does.

| Allure field | Source |
|---|---|
| epic | The feature in the QA spec header (for example `Specialist Waitlist`) |
| feature | The story group (for example `US-009 Release an open slot`) |
| story | The business rule or scenario the case verifies |
| severity | QA spec priority: High = `critical`, Medium = `normal`, Low = `minor` |
| tag | The QA type (`positive`, `negative`, `concurrency`, `permission`) |
| link (TMS) | The QA test case ID, for example `TC-US009-001`, pointing at `docs/qa/test-spec-<change>.md` |
| parameter | Actor names or slot used, when it clarifies a failure |

Template (inside the test body, first lines):

```ts
import * as allure from 'allure-js-commons'

test('Releasing a slot offers it to the next patient in line', async ({ api, releaseSlot }) => {
  await allure.epic('Specialist Waitlist')
  await allure.feature('US-009 Release an open slot')
  await allure.story('BR-006 next in line')
  await allure.severity('critical')
  await allure.tag('positive')
  await allure.link('docs/qa/test-spec-<change>.md', 'TC-US009-001', 'tms')

  await allure.step('Seed two waiting patients', async () => {
    await api.seedWaiting([testData.patients.carlos, testData.patients.ana])
  })
})
```

Put the repeated metadata calls in a small helper (`tests/helpers/allureMeta.ts`) that takes the QA fields, so each test makes one call. The helper takes plain arguments and is not a page object.

## Steps

Wrap meaningful user-visible phases in `allure.step`. Page object action methods can wrap their body in a step named after the action, so the report reads like the QA spec's action column. Do not wrap every locator call.

## Attachments

- On failure Playwright attaches the screenshot and trace automatically; the Allure reporter includes them.
- Attach API responses that explain an assertion (for example a rejected release) with `allure.attachment`. Do not attach tokens or full patient records.

## Blocked and manual cases

- A `test.fixme` case appears in the report as skipped. Add its gap ID as a tag (for example `G-15`) so the report shows why.
- A Manual case has no test. List it in the design traceability table and in the run notes, not in the report.

## Design document section

The design must state: Allure package versions, results and report folders, the metadata convention above, the steps policy, whether history is kept, and where the report is published.

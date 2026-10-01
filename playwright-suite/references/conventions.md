# Conventions and templates

Used by `SKILL.md`. These are templates for Build mode and examples for the design document. They are not part of a suite yet. The code examples follow the rules: no semicolons, no comment longer than one line, comments only when the why is not obvious.

## Folder layout

```
playwright-suite/
  playwright.config.ts
  package.json
  tsconfig.json
  .env.example
  design/
    suite-design-<change>.md
  tests/
    pageObjects/
      releaseSlotPO.ts
      acceptOfferPO.ts
    helpers/
      authHelper.ts
      apiHelper.ts
      waitlistFlow.ts
    fixtures/
      baseTest.ts
    data/
      testData.json
    specs/
      releaseSlot.spec.ts
      acceptOffer.spec.ts
```

Naming: tests are `camelCase.spec.ts` and each has a matching `camelCasePO.ts` (`releaseSlot.spec.ts` pairs with `releaseSlotPO.ts`). If several specs act on the same screen, put the shared locators and actions in the page object of the first spec and import it; do not duplicate it. The design lists which spec owns each page object.

| Concern | Lives in |
|---|---|
| Locator getters (`get*` returning a `Locator`) and actions on one screen | `tests/pageObjects/*PO.ts` |
| Multi-step workflows shared by several specs (sign-in, create-and-release) and API setup or cleanup | `tests/helpers/*.ts` |
| Shared values: URLs, stable users, seeded names | `tests/data/testData.json` |
| Per-test values | Inline `const`, unique with `Date.now()` |
| Custom fixtures that build page objects and helpers | `tests/fixtures/baseTest.ts` |

## Page object rules

- The constructor takes `Page` and nothing else.
- Locators are exposed through `get*` getters and are not stored in constructor properties that go stale after navigation.
- Actions are methods named verb-noun for the user's intent, with an explicit return type unless obvious (`Promise<void>` is written out).
- Methods may call other methods on the same page object. They do not assert.
- A method returns data (text, count) when the spec needs to assert on it; the assertion stays in the spec.
- No hard waits. Use Playwright auto-waiting, web-first assertions in the spec, and `waitForResponse` for backend data.
- Locator choice, in order: `getByRole` with name, `getByLabel`, `getByTestId`, then text. Each locator must be proven against the live page first: exactly one match, no run-dependent text, scoped to a container when repeated (see step 3 of `SKILL.md`). Never `nth(0)` or `nth(1)` where a prior action can remove the row. Never `exact: true` on text with nested children.
- One comment line at most, only for a non-obvious why.

Template:

```ts
import { type Locator, type Page } from '@playwright/test'

export class ReleaseSlotPO {
  constructor(private readonly page: Page) {}

  getReleaseButton(): Locator {
    return this.page.getByRole('button', { name: 'Release next slot' })
  }

  getRowByPatient(name: string): Locator {
    return this.page.getByRole('row', { name })
  }

  async open(): Promise<void> {
    await this.page.goto('/')
    await this.page.getByRole('tab', { name: 'Staff view' }).click()
  }

  async releaseNextSlot(): Promise<void> {
    await this.getReleaseButton().click()
  }

  async readStatusOf(name: string): Promise<string> {
    return (await this.getRowByPatient(name).getByRole('cell').nth(3).innerText()).trim()
  }
}
```

The `nth(3)` above reads a fixed column of one known row and is not a sequential mutation. Prefer a column test id when the DOM has one. Locators in this template are examples; real ones must come from the DOM.

## Spec rules

- Test titles read as a sentence describing observable behaviour (`Releasing a slot offers it to the next patient in line`), not `Test1`.
- Tag each test with its QA test case ID, using Allure metadata (see `allure.md`) so the report links back to `docs/qa`.
- Each test creates its data, runs, and cleans up in `afterEach` through the API helper.
- Assertions use web-first `expect`. No `waitForTimeout`.
- A case the QA spec marks Blocked is written as `test.fixme('<title>', ...)` with a one-line comment naming the gap ID.
- A case classed Manual has no test; it appears in the traceability table only.

Template:

```ts
import { test, expect } from '../fixtures/baseTest'
import testData from '../data/testData.json'

test.describe('Release a slot', () => {
  test.afterEach(async ({ api }) => {
    await api.resetWaitlist()
  })

  test('Releasing a slot offers it to the next patient in line', async ({ api, releaseSlot }) => {
    await api.seedWaiting([testData.patients.carlos, testData.patients.ana])
    await releaseSlot.open()

    await releaseSlot.releaseNextSlot()

    await expect(releaseSlot.getRowByPatient(testData.patients.carlos)).toContainText('Notified')
    await expect(releaseSlot.getRowByPatient(testData.patients.ana)).toContainText('Waiting')
  })
})
```

## Helpers

- `authHelper.ts`: signs a given actor in (UI or API token) and returns what the spec needs. Reads credentials from environment variables, never from the repo.
- `apiHelper.ts`: wraps Playwright's `request` context. Setup (`seedWaiting`), reads for assertions the UI cannot show (audit, rejected requests) and cleanup (`resetWaitlist`). Cleanup is API-based and idempotent.
- `waitlistFlow.ts`: a multi-step flow reused by several specs, built on page objects.
- A helper takes plain arguments and returns plain values or page objects. It does not assert.

## Fixtures

`baseTest.ts` extends `@playwright/test` with fixtures for page objects and helpers so specs receive them by name and do not construct them. Keep each fixture small.

```ts
import { test as base } from '@playwright/test'
import { ReleaseSlotPO } from '../pageObjects/releaseSlotPO'
import { ApiHelper } from '../helpers/apiHelper'

type Fixtures = {
  releaseSlot: ReleaseSlotPO
  api: ApiHelper
}

export const test = base.extend<Fixtures>({
  releaseSlot: async ({ page }, use) => {
    await use(new ReleaseSlotPO(page))
  },
  api: async ({ request }, use) => {
    await use(new ApiHelper(request))
  },
})

export { expect } from '@playwright/test'
```

## Network interception

When a test depends on dynamic backend data, read it from the response:

```ts
const response = await page.waitForResponse(r => r.url().includes('/offers'))
const offer = (await response.json()).offer
```

Then assert with `offer.slotStartsAt` instead of a hard-coded value.

## Data

`tests/data/testData.json` holds stable shared values only:

```json
{
  "baseUrl": "http://localhost:5173",
  "patients": {
    "carlos": "Carlos Mendoza",
    "ana": "Ana Torres",
    "maria": "Maria Gómez"
  }
}
```

Secrets, tokens and passwords are never stored here. Use `process.env` and document the names in `.env.example` with placeholders.

## Config

```ts
import { defineConfig } from '@playwright/test'
import 'dotenv/config'

export default defineConfig({
  testDir: './tests/specs',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['allure-playwright', { resultsDir: 'allure-results' }],
  ],
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
})
```

Set `fullyParallel` to true only when the design shows that each test uses its own isolated data. The Waitlist app has one specialist and one outstanding offer at a time, so the design should justify any parallelism.

## Scripts (`package.json`)

```json
{
  "scripts": {
    "test": "playwright test",
    "typecheck": "tsc --noEmit",
    "allure:generate": "allure generate allure-results --clean -o allure-report",
    "allure:open": "allure open allure-report"
  }
}
```

## `.gitignore` additions

```
allure-results
allure-report
test-results
playwright-report
.env
```

## Self-check before reporting Build mode done

- No semicolons: search for `;` at line ends in `tests/`, `playwright.config.ts`.
- No comment spans more than one line, and no comment restates the next line.
- No `nth(`, `Math.random`, `exact: true`, `waitForTimeout`.
- Every test has an independent data setup and an API cleanup.
- Every automated QA test case ID appears in exactly one test, and every Blocked ID is a `test.fixme`.

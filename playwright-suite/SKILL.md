---
name: playwright-suite-design
description: Design a Playwright test suite in TypeScript from a QA test specification, using the Page Object model, with Allure reporting. Use when the user (QA) asks to plan, design or structure a Playwright suite, to turn docs/qa/test-spec-<change>.md into automation, or to decide page objects, helpers, fixtures and spec files before writing tests. Produces a suite design document first and writes no test code until the user explicitly asks to build it. Follows the team's AGENTS.md conventions.
---

# Playwright Suite Design

Turn a QA test spec into a reviewed design for a Playwright suite (TypeScript, Page Object model, Allure), then build it only when the user says so.

Location of this skill and its output: `playwright-suite/` at the repository root.

| Artifact | Path |
|---|---|
| This skill | `playwright-suite/SKILL.md` |
| Reference: code conventions and templates | `playwright-suite/references/conventions.md` |
| Reference: Allure setup and metadata | `playwright-suite/references/allure.md` |
| Reference: app readiness check (the app runs locally) | `playwright-suite/references/app-readiness.md` |
| Reference: design document template | `playwright-suite/references/design-template.md` |
| Design output | `playwright-suite/design/suite-design-<change>.md` |
| Suite code (Build mode only) | `playwright-suite/tests/`, `playwright-suite/playwright.config.ts`, `playwright-suite/package.json` |

To make Claude Code list this as a project skill, copy or link this folder to `.claude/skills/playwright-suite-design/`. Ask the user before doing it.

## Modes

- **Design mode (default).** Write only `playwright-suite/design/suite-design-<change>.md`. Write no test code, no page objects, no config.
- **Build mode.** Only when the user explicitly asks to build, scaffold or write the suite, after the design is approved. Follow `references/conventions.md` exactly.

Never switch from Design to Build on your own, even if the original request mentions both.

## Rules that always apply

Read the nearest `AGENTS.md` first (for example `../AGENTS.md` or the repo root). Where it and this skill differ, `AGENTS.md` wins. The rules below restate it and add the user's requirements.

- **Language:** TypeScript, strict. Explicit return types on page object methods where the type is not obvious.
- **No semicolons** anywhere in the suite code, including config and helpers.
- **Page Object model:** locators and the actions on them live in the page object as methods. Pure locator getters are named `get*` and return a `Locator`. Action methods are verb-noun and intent-driven (`selectQuestionBank(name)`, not `clickBank(name)`). Assertions stay in the spec, not in the page object.
- **Comments:** write none by default. A comment is allowed only when the why is not obvious (a workaround, a stage quirk, a hidden invariant), and it is **one line, never more**. Never restate the next line. Remove TODOs when done.
- **Independent tests:** each test creates its own data and cleans up, preferably through the API in `afterEach`. No `beforeAll` data setup if more than one test mutates it. No test depends on another.
- **Data:** shared values (URLs, stable users, seeded names) in `tests/data/testData.json`. Per-test values inline, made unique with `Date.now()`.
- **Selectors:** never invent a locator. Take it from the real rendered page (see step 3). Every locator must be **reliable**: it resolves to exactly one element, it does not depend on position, generated class names, CSS structure or text that changes between runs (dates, counts, names created per test), and it survives the state changes the test causes. Prefer role with accessible name, then label, then test id. Do not use `nth(0)`, `nth(1)` for sequential mutations where a click can remove the row. Do not use `exact: true` on text with nested children.
- **Network:** when a test depends on dynamic backend data, wait for the response and use its data instead of hard-coding (`waitForResponse`).
- **Never** use `Math.random()` for test data unless the seed is logged. Never commit `.env` or secrets; read them from environment variables and provide `.env.example` with placeholders.
- **Search first:** before proposing a structure, search the repo for an existing suite and follow its pattern. Do not invent a new layout when one exists.
- **When unsure between two approaches, ask** instead of picking one.

## Workflow (Design mode)

### 1. Intake

1. Ask which QA test spec to use if the user has not named one. Otherwise default to the newest `docs/qa/test-spec-*.md` and say which file you chose. Read its header for the PS version and status, its gap log, its test data conventions and every test case.
2. Read the OpenSpec change it names (`proposal.md`, `specs/**/spec.md`, `design.md`) for routes, error codes and API behaviour that setup, cleanup and assertions can use.
3. Search the repo for an existing Playwright suite (`**/playwright.config.*`, `**/*PO.ts`, `tests/`). If one exists, read its config, one page object, one helper and one spec, and follow them. If none exists, say so and use `references/conventions.md`.
4. Read the application source that renders the screens under test (for the Waitlist app: `apps/web/src/screens`, `apps/web/src/api`) so that screens, labels and API routes are named correctly in the design.

### 2. Check the app is initialized and running locally

The application is not hosted. It must be installed, built, seeded and started on the user's machine before it can be inspected or tested. Run the checks in `references/app-readiness.md` before anything else in this step: runtime, installed dependencies, build, implementation state of the OpenSpec change, seeded data against the QA spec, health of the API and web URLs, and a clean database for the run.

- Ask the user before starting servers, installing packages or deleting a database file.
- If a check fails, stop, say exactly what is missing and the command that fixes it, and do not continue to the DOM step. Set the design status to `Blocked on environment`.
- If the app runs but the OpenSpec change it depends on is not implemented, say which QA cases cannot pass yet, and continue only if the user asks to design against the current app. Mark the affected locators `blocked on app`.
- Record the results in the design's **Environment** section.

### 3. Get the DOM and prove the locators

Do not suggest locators without checking the actual DOM.

**Preferred: the Playwright MCP server.** If the tools `mcp__playwright__browser_*` are available, use them: `browser_navigate` to open the app, `browser_snapshot` to read the accessibility tree (roles, accessible names, states), `browser_click` and `browser_fill_form` to reach each state, and `browser_find` or `browser_evaluate` to check a locator. Ask the user for the app URL and for how to start it and sign in if you do not know. Do not enter real credentials; use the demo or seeded actors named in the QA spec.

**Fallback:** if the MCP tools are not available, ask the user to paste the relevant HTML for each screen state. If neither is possible, list every locator as `needs DOM` and ask for the HTML before the design is finished.

**For every screen the QA cases touch, capture each state the cases need**, not just the first one. For the Waitlist app that means, for example, patient not joined, waiting, notified (banner), booked; staff with empty list, waiting entries, outstanding offer for an in-app holder, and outstanding offer for a telephone or not-recorded holder.

**A locator is accepted into the design only when all of these are shown:**
1. It resolves to exactly one element in the state where the test uses it (check with `browser_find` or `browser_evaluate` counting matches).
2. Its strategy is role plus accessible name, label, or test id, in that order. CSS, XPath and `nth` are not accepted unless no accessible alternative exists, and then the reason is written in the design.
3. It does not contain data that changes between runs. Names created per test are passed in as parameters; dates and elapsed times are not part of a locator.
4. It still resolves, or correctly stops resolving, after the action under test (for example the release button after an offer exists).
5. It is scoped to a container when the same control appears more than once (for example a row's button is found inside that row, found by the patient's name).

Record the evidence in the design's **Locator evidence** table: locator, state captured, match count, strategy. If the page has no accessible name or test id for an element a test needs, do not work around it with a fragile selector: add it to the open questions as a request for a `data-testid` or an accessible name, and keep the locator marked `blocked on app`. Do not edit the app yourself.

### 4. Classify the test cases

For every test case in the QA spec, decide and record:

| Class | Meaning |
|---|---|
| UI | Driven through the browser |
| API | Driven through the API request fixture, no browser |
| UI + API | Browser for the action, API for setup, cleanup or an assertion the UI cannot show (audit, rejected request) |
| Manual | Not automatable here (for example a throttled 3G load check, or a visual judgement) |
| Blocked | The QA spec marks it Blocked, or it depends on an open gap. Plan it as `test.fixme` with the gap ID, not as a guess |

State the reason in one line per case. Do not automate a case whose expected result the QA spec leaves undefined.

### 5. Design the suite

Produce the design using `references/design-template.md`. It must contain an **Environment** section (from step 2) and:

1. **Layout:** the folder tree, using `tests/pageObjects/*PO.ts`, `tests/helpers/*.ts`, `tests/data/testData.json`, `tests/specs/*.spec.ts`, `tests/fixtures/`, plus `playwright.config.ts`, `package.json`, `.env.example`. Files are camelCase: `editAssignment.spec.ts` pairs with `editAssignmentPO.ts`.
2. **Page objects:** for each screen, the locator getters (name, strategy, evidence status: `verified`, `needs DOM`, or `blocked on app`) and the action methods (verb-noun, parameters, return type). Keep a method on the page object that is used by only one spec only if it is tightly scoped to that screen.
3. **Helpers:** multi-step workflows shared by several specs (sign-in, create-and-release flow, API cleanup) with their inputs and outputs.
4. **Data:** what goes in `testData.json` and what is created per test.
5. **Setup and cleanup per test:** how each test creates its own data and how it is removed, API-first.
6. **Spec files:** one file per story or rule group, with the test titles written as sentences describing observable behaviour and the QA test case IDs each covers.
7. **Traceability table:** every QA test case ID mapped to a spec file and test title, its class, and its Allure metadata (epic, feature, story, severity, TC link).
8. **Allure:** reporter config, results directory, scripts, metadata convention and the environment info to publish. See `references/allure.md`.
9. **Run configuration:** projects, base URL and API URL from environment variables, retries, timeouts, workers, trace and screenshot policy, and how the app and database are started and reset before a run.
10. **Risks and open questions:** flaky areas (polling, concurrency), data reset strategy, anything blocked.

Keep the design to what the QA spec needs. Do not add cases the QA spec does not list. If you see a missing case, propose it as a suggestion at the end; do not add it silently.

### 6. Review with the user

After writing the design file, do one consolidated review. Do not walk through every case.

1. Summarise: cases by class, number of page objects, helpers and spec files, blocked and manual counts.
2. Ask at most eight targeted questions that change the design (for example how the app is reset between runs, how to authenticate, where the DOM can be inspected). Put the rest in the design's open questions.
3. Apply the answers to the design file.
4. Offer Build mode as the next step, and wait.

### 7. Build mode (only on explicit request)

1. Confirm the approved design file and that the user wants code written now. Re-run the checks in `references/app-readiness.md`; the app must be running and seeded before any test is run.
2. Scaffold `playwright-suite/` with `@playwright/test`, `allure-playwright`, `allure-js-commons`, `allure-commandline` and TypeScript, following `references/conventions.md` and `references/allure.md`.
3. Write the page objects first, then helpers and data, then specs, one spec file at a time. Write locators only from the verified entries in the Locator evidence table, and re-check any locator that fails in a run against the live page with the Playwright MCP before changing it.
4. After each spec file: run `npx tsc --noEmit` and the spec, fix failures caused by the code you wrote, and report failures that come from the application as defects rather than weakening an assertion.
5. At the end: run the full suite, generate the Allure report, and report pass, fail, skipped (`fixme`) and manual counts against the design.
6. Check the suite against the Rules section: grep for semicolons, comments longer than one line, `nth(`, `Math.random`, and `exact: true`.
7. If the work revealed a convention worth keeping, propose the addition to `AGENTS.md`; do not edit it unprompted.

## Guardrails

- In Design mode, write only to `playwright-suite/design/`.
- Never edit the application code, the Product Specification, the OpenSpec change or the QA test spec. If the QA spec has a defect, report it to the user.
- Do not invent expected results. The QA spec is the source of truth for what to assert; the application source informs how, not what.
- Do not store credentials, tokens or real patient data. Use the fictional actors named in the QA spec.
- Do not install packages or run the application without telling the user, except in Build mode after the user asked to build. Browsing the running app with the Playwright MCP to read it is allowed in Design mode once the user has given the URL; do not submit forms that create or change real data except with the seeded demo actors the QA spec names.

---
name: qa-test-spec
description: Create or update a QA test specification from a Product Specification (PS) and its OpenSpec technical specs. Use when the user (QA) asks for test cases, a test spec, a QA spec or a test plan for a feature, wants to analyse a PS for testability, or says a PS has a new version and the test spec must be updated. Produces docs/qa/test-spec-<change>.md with specific, traceable test cases (pre-conditions, steps, action, expected result) that guide later test automation. Does not write automation code.
---

# QA Test Spec

Turn a Product Specification into a QA test specification the user can refine, then use as a guide before writing automated tests. Every test case must be specific and traceable. No generic cases.

Output: `docs/qa/test-spec-<change>.md` where `<change>` is the OpenSpec change name (for example `waitlist-visibility-notification`). Create `docs/qa/` if missing.

Do NOT generate Playwright or other automation code. Do not invent behaviour: if the spec is silent, log it as a gap, not as an expected result.

## Workflow

### 1. Intake

1. Ask which PS to use if the user has not named one. Otherwise default to the highest-versioned `docs/PS-*.md` and say which file you chose. Read the header for its version and status, and tell the user both.
2. Find the OpenSpec change: run `openspec list --json`. If exactly one change exists use it, otherwise ask. Read its `proposal.md`, `specs/**/spec.md` and `design.md`.
3. If the PS mentions a prototype or UI reference, read it for labels and screen text to use in expected results.
4. If `docs/qa/test-spec-<change>.md` already exists, go to **Re-run mode** below.
5. Check the implementation state, read-only: count the checked and unchecked tasks in the change's `tasks.md`, and note which behaviour the test cases will rely on that is not built yet. The application is not hosted; it runs locally. Do not start it or install anything from this skill. If the user wants the cases run or automated, point them to `playwright-suite/references/app-readiness.md` (skill `playwright-suite-design`), which checks that the app is initialized and running.
6. Precedence when sources disagree: the PS is authoritative, then the OpenSpec specs, then the design, then the prototype. Record every disagreement as a gap (see step 2).

### 2. Analysis (show this before writing test cases)

Present, concisely:

1. **Testable inventory:** every user story with its acceptance criteria, and every business rule, each with its ID. Include any status model as a state-transition table.
2. **Gap and ambiguity log:** anything that cannot be tested without a decision. Give each an ID (`G-01`, ...), the source (PS section, spec requirement), what is unclear, and what the test case would need. Include:
   - open decisions in the PS,
   - assumptions the OpenSpec change makes where the PS is silent,
   - conflicts between the PS, specs and prototype,
   - acceptance criteria that cannot be verified by observation, and stories with no acceptance criteria.
3. **Risk ranking:** which areas need the deepest coverage (for example concurrency, state transitions, permissions, data loss), with one line of reasoning each.

### 3. Test design

Use these techniques, only where the spec supports them:

- **State transition:** cover every valid transition in the status model, and the illegal ones (attempting an action from a status where it is not allowed).
- **Boundary and edge:** first, last, only and empty cases (for a queue: position 1, last position, single entry, empty list, removal mid-queue).
- **Negative and permission:** wrong role, other user's data, unauthenticated, invalid input.
- **Concurrency and consistency:** simultaneous actions on the same resource, and partial-failure states.
- **Audit and attribution:** who, what and when are recorded, where the spec requires it.
- **Business-rule checks:** one or more cases per rule that show the rule holds and, where testable, that violating it is prevented.
- **UI behaviour:** only what the spec or the referenced prototype states (labels, banners, confirmation steps, hidden controls).

**Non-generic rules (a case must satisfy all):**
- It cites at least one acceptance criterion or business rule ID, and the technical spec requirement and scenario where one exists.
- Pre-conditions state a concrete data state, with named actors, positions and statuses, for example "Carlos #1 `waiting`, Maria #2 `waiting`, no outstanding offer". "A patient exists" is not acceptable.
- Every step has an **Action** and its own **Expected result**. Expected results are observable (what is displayed, what status, what position, what is rejected), never "works correctly".
- Test data is self-contained: each case sets up its own data and does not depend on another case running first.
- Anything the spec does not define is marked **Blocked** with the gap ID, not guessed.

Do not pad. Skip a technique if the spec gives nothing to test with it. Do not write two cases that verify the same thing.

### 4. Write the test spec

Write the file with these sections:

1. **Header:** feature, change name, PS file and version, technical spec source, implementation status (tasks done of total, and what is not built yet), date, status `Draft`.
2. **Scope and approach:** what is covered, what is out of scope (quote the PS), techniques used.
3. **Gap and ambiguity log:** from the analysis.
4. **Test data conventions:** named actors and base data shared across cases (take them from the prototype or seed data where they exist, for example the prototype's patients and specialist). Each case still sets up its own state.
5. **Test cases:** grouped by story, in the format below.
6. **Coverage matrix:** every acceptance criterion and business rule against the test case IDs that verify it. Uncovered items are listed with the reason (gap ID or "out of scope").
7. **Change log:** one row per version of this test spec, with the PS version it was based on.

**Test case format:**

```
### TC-US009-003: <title as a sentence describing observable behaviour>

- **Traces to:** US-009 AC-1, BR-006, BR-007 · spec: slot-offers / "Staff releases an open slot"
- **Type / Priority:** Positive · State transition / High
- **Pre-conditions:**
  - <concrete state 1>
  - <concrete state 2>
- **Test data:** <actors, slot date and time, etc.>

| # | Action | Expected result |
|---|---|---|
| 1 | <what the actor does> | <what is observable> |
| 2 | ... | ... |

- **Clean-up:** <how to reset the data this case created>
- **Status:** Draft | Reviewed | Blocked (G-xx)
- **Notes:** <optional, open questions for automation>
```

ID scheme: `TC-<story>-<nnn>`, for example `TC-US009-003`. Cross-cutting cases use the rule ID (`TC-BR007-001`). IDs are stable once assigned; never renumber, only add new IDs or mark cases Obsolete.

### 5. Guide the refinement

After writing, do one consolidated review with the user (do not loop through every case):

1. Give a short summary: number of cases by story, by type, blocked count, coverage gaps.
2. Ask the targeted questions that matter most, at most eight, each tied to a gap or a decision the user can make (for example "G-03: if every waiting patient has declined the slot, what should staff see? Options: ..."). Put the rest in the file's gap log.
3. List suggested checks for the user to do on the file: cases that are the highest risk, cases that assume behaviour from the OpenSpec specs rather than the PS, and any expected result that quotes prototype text.
4. Apply the user's answers: update cases, unblock them, and mark reviewed ones `Reviewed`.
5. Offer a short list of questions for the Product Owner, taken from the open gaps, as text the user can copy.

### Re-run mode (existing test spec and a new PS version)

1. Read the existing `docs/qa/test-spec-<change>.md` and its header to get the PS version it was based on. Compare the old PS (the file named in the header, if it still exists; otherwise use the file versions in `docs/` or `git log`) with the new PS. If the old version is not available, say so and review every case instead.
2. Produce a **delta report** before editing:
   - new, changed and removed stories, acceptance criteria and business rules,
   - gaps now resolved, gaps still open, new gaps,
   - each existing test case marked **Unaffected**, **Needs update** (what changed), **Obsolete** (why) or **Unblocked**,
   - new behaviour with no test case.
3. After the user agrees, apply it: update affected cases, mark obsolete ones `Obsolete` (keep them, with the reason and the PS version), add new cases with new IDs, refresh the coverage matrix and gap log, bump the header to the new PS version, and add a change-log row.
4. Do not silently delete or renumber cases.

## Guardrails

- Planning and documentation only: write to `docs/qa/` and nothing else. Never edit the PS, the OpenSpec artifacts or any code.
- Do not invent expected results. If two sources disagree, follow the precedence in step 1 and log the gap.
- Do not include secrets, real patient data or real credentials in test data. Use the named fictional actors from the prototype or seed data.
- Keep the file readable: no more detail than needed to execute or automate the case.
- Ask rather than pick arbitrarily when two readings of the spec are both reasonable.

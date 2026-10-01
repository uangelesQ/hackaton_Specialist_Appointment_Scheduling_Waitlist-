# PS-001 Iteration Log and Readiness Review — v2.0 to v2.4

| Field | Value |
|---|---|
| Specification | PS-001 Specialist Waitlist Visibility, Notification & Slot Offer |
| Versions covered | v2.0 → v2.1 → v2.2 → v2.3 → v2.4 |
| Latest version | `docs/PS-001-Specialist-Waitlist-v2.4.md` |
| Date | 2026-10-01 |
| Latest readiness score | **52 / 65 — 🟡 Minor Revisions Needed** (v2.1 scored 46 / 65) |
| Latest spec-critic verdict | **Requires Refinement** (section 7) |

Each version is a separate file in `docs/`. Earlier versions are unchanged, so any step can be diffed.

---

## 1. Version history

| Version | File | What changed | Trigger |
|---|---|---|---|
| v2.0 | `PS-001-Specialist-Waitlist-v2.0.md` | Baseline, self-assessed "Ready with Minor Refinement" | — |
| v2.1 | `PS-001-Specialist-Waitlist-v2.1.md` | Fixes for the first spec-critic review; Product Owner assumptions recorded | Spec-critic review of v2.0 |
| v2.2 | `PS-001-Specialist-Waitlist-v2.2.md` | Scope narrowed to the agreed flow | Team decision |
| v2.3 | `PS-001-Specialist-Waitlist-v2.3.md` | Consistency fixes and glossary | Spec-critic and readiness review of v2.1 |
| v2.4 | `PS-001-Specialist-Waitlist-v2.4.md` | Product Owner decisions applied | Answers to open questions |

---

## 2. v2.0 → v2.1 — review fixes and assumptions

**Product Owner assumptions recorded**

| Assumption | Treatment |
|---|---|
| Patient is registered and prefers in-app notification | Scoped to the digitally reachable cohort only. Telephone-preference and not-recorded patients use the telephone path |
| Patient has access to an internet connection | Scoped to the same cohort. An in-app patient who is offline is handled as an unanswered offer (US-003, US-010) |

**Review findings and fixes**

| # | Finding in v2.0 | Fix in v2.1 |
|---|---|---|
| 1 | Must story US-011 depended on Should story US-006 | US-006 raised to Must |
| 2 | Quality attributes had no measurable targets | Targets proposed in Section 9, US-002 and US-003 |
| 3 | No rule for a missing contact preference | BR-001 extended: not recorded is treated as telephone |
| 4 | "Booking is completed" undefined | BR-013 added |
| 5 | No acceptance criteria for stale or conflicting offers | BR-012 added (first action wins) and criteria added to affected stories |
| 6 | Pass-on semantics ambiguous | BR-005 extended to passed-over patients; US-009 and US-010 updated |
| 7 | Staff scoping hidden in Section 9 | BR-011 added |
| 8 | Status labels inconsistent | Status set to Requires Refinement |
| 9 | "Banner" wording and TBC success targets | Not changed (recorded Product decision; targets need Product Owner input) |

---

## 3. v2.1 → v2.2 — scope narrowing

Agreed flow: **Registry → Appointment management / slot release → Acceptance of the new appointment.**
"Registry" is the process of registering a new appointment request, which places the
patient on the waitlist. It is not patient registration in hospital records.

| Flow step | Stories in scope |
|---|---|
| Registry | US-001 join, US-006 staff add, US-004 view the waitlist |
| Appointment management / slot release | US-009 release a slot, US-010 pass on an unanswered offer |
| Acceptance of the new appointment | US-003 notify, US-008 accept or decline, US-011 record a telephone response |

**Deferred:** US-002 patient-facing position, US-005 staff removal, US-007 patient leaving,
BR-009 and the `removed` status. A successor spec, "Waitlist Self-Service & Removal", is listed.

**Result:** 11 stories (9 Must) became 8 stories, all Must. This removed the removal-related
gaps: the Must-depends-on-Should/Could problem, the BR-007 and status model omissions, and the
stale-offer criteria for removal.

**New risks recorded:** without patient-facing position, status-chasing calls may persist; without
removal, an entry that no longer represents demand stays until the patient declines or staff pass it on.

---

## 4. v2.2 → v2.3 — consistency fixes

| Finding | Fix |
|---|---|
| "First in line" and "position 1" contradicted the BR-005 skip rule | Glossary defines *eligible patient* and *next in line*; US-003, US-009, US-010 and the status model use them |
| "Outstanding offer" and "same slot" undefined | Defined in the glossary; a slot is identified by specialist, date and time |
| Section 10 listed quality targets as deferred while Section 9 proposed them | Section 10 now defers only the Product Owner's confirmed values |
| Section 18 ticked Quality Attributes complete while Section 16 said partial | Aligned |
| "Time outstanding (US-004)" had no matching criterion | Added to US-004 |
| BR-003 cited by no story | Cited from US-009 |
| BR-005 Proposed in Section 16 but not marked in Section 8 | Marked |
| Section 14 referred to a risk that did not exist | Notification-centre risk added to Section 13 |
| Section 19 "PO confirmation Yes/No" column ambiguous | Renamed "Needs PO confirmation" |

---

## 5. v2.3 → v2.4 — Product Owner decisions

| Decision | Applied in |
|---|---|
| A booked slot is marked taken in the (mocked) calendar and cannot be released again | BR-013, US-009 (new criterion), dependencies in Sections 5 and 12, Section 14 |
| A patient sees only their own record | New US-008 criterion; BR-011 cited from US-008 |
| An unregistered caller is not added and nothing is created | New US-006 criterion; Section 14 |
| The telephone call is an ordinary call made outside the system; nothing is built for it | BR-001, Section 5 (Out of Scope), new US-008 criterion, Section 14 |
| Thresholds accepted: connection of at least 3G (about 1.6 Mbps down); offer view loads in 5 seconds or less on a throttled 3G profile; a first-time user accepts or declines in 3 steps or fewer | Section 5 (Actors, Assumptions), Section 9, US-003 |

**Reading applied for telephone patients:** each patient has exactly one response channel —
in-app for an in-app preference, a staff-recorded response for telephone or not recorded. The
Product Owner said the call is outside the system but did not state this explicitly, so it is an
interpretation that is easy to reverse.

**Still needing Product Owner confirmation:** the reliability target (99% within 60 seconds), the
WCAG 2.1 AA level, and the items marked *Proposed* (not-recorded handling in BR-001, passed-over
handling in BR-005, BR-012, the remaining BR-013 wording, US-006 as Must, US-010 staying in scope).

---

## 6. Spec readiness review — PS-001 v2.4

Skill: `spec-readiness-review:assess-spec-quality` · Standard basis: ISO/IEC/IEEE 29148 · IEEE 830 · SDD Readiness

The deterministic lint pass ran: 194 passive-voice hits (mostly legitimate state-transition
wording) and 14 weasel-word hits. The score reflects the current draft, including unconfirmed
*Proposed* items.

### Overall score: 52 / 65 — 🟡 Minor Revisions Needed

| Layer | Dimension | v2.4 score |
|---|---|---|
| 1 | Correctness | 4/5 |
| 1 | Unambiguousness | 4/5 |
| 1 | Completeness | 4/5 |
| 1 | Consistency | 4/5 |
| 1 | Verifiability | 4/5 |
| 1 | Traceability | 4/5 |
| 1 | Feasibility | 4/5 |
| 1 | Priority / Ranking | 4/5 |
| 2 | Bounded Scope | 4/5 |
| 2 | Explicit Acceptance Criteria | 5/5 |
| 2 | Defined Terms | 4/5 |
| 2 | Sufficient Context | 3/5 |
| 2 | No Implicit Knowledge | 4/5 |
| | **Total** | **52/65** |

Bands: 59–65 ✅ SDD-Ready · 46–58 🟡 Minor Revisions Needed · 33–45 🟠 Significant Revisions Needed · below 33 🔴 Not Ready

**Progress against the v2.1 assessment (46/65):** Consistency, Completeness, Feasibility and
Defined Terms improved after the scope narrowing and the consistency and decision rounds.
Unambiguousness improved once the connection, load-time and usability thresholds were set.

### Layer 1 — Standards Quality

**Correctness — 4/5**
> 🔍 *Observation:* Requirements trace to the Use Case and recorded Product Owner decisions. Several rules remain unconfirmed *Proposed* items: not-recorded handling (BR-001), passed-over handling (BR-005), BR-012, the remaining BR-013 wording, US-006 as Must, and the reliability and WCAG targets.
> 💡 *Suggestion:* Record the Product Owner's answer for each Proposed item and remove the marker as each is confirmed.

**Unambiguousness — 4/5**
> 🔍 *Observation:* The earlier vague phrases ("sufficient connection", "slow connection", "without staff assistance", "first in line") now carry thresholds or glossary definitions. Remaining lint hits are benign: "reliable internet" (lines 131, 152), "Simple" in a rationale (line 785), "appropriate" (lines 842, 929) and "sufficient" in change-log text (lines 1023, 1056). "In-app banner" is UI-prescriptive but is a recorded Product decision.
> 💡 *Suggestion:* Keep the glossary terms as the only wording for targeting an offer; avoid re-introducing "first in line" in later edits.

**Completeness — 4/5**
> 🔍 *Observation:* Happy path, alternate paths, stale-offer handling, the unregistered caller and the booked-slot case are covered. Success measure targets are still TBC, and the Data Quality target left with the deferred US-002 without a replacement for the staff view.
> 💡 *Suggestion:* Add one staff-view data-quality target, e.g. "the staff waitlist reflects a booking within 5 seconds of it occurring", or state that none is needed in this iteration.

**Consistency — 4/5**
> 🔍 *Observation:* "Next in line" now governs US-003, US-009, US-010 and the status model, and the deferred stories are stubbed rather than half-removed. Sections 19–22 still reference deferred stories, which is correct as history but can confuse a reader who expects a current-state view.
> 💡 *Suggestion:* Move the change-log sections out of the normative spec (see Layer 3).

**Verifiability — 4/5**
> 🔍 *Observation:* Nearly every criterion is Given/When/Then. The 99%-within-60-seconds reliability target is not statistically testable over a one-week pilot with few offers.
> 💡 *Suggestion:* Restate it as a pass/fail test: "every offer in the pilot is visible on the patient's waitlist view within 60 seconds of release".

**Traceability — 4/5**
> 🔍 *Observation:* Story IDs, rule IDs and the traceability table are present, and previously orphaned rules (BR-003, BR-011) are now cited. BR-009 is deferred but still counted in the BR-001 – BR-013 range in Section 15.
> 💡 *Suggestion:* Show "BR-001 – BR-013 (BR-009 deferred)" in Section 15.

**Feasibility — 4/5**
> 🔍 *Observation:* Eight stories and twelve active rules are plausible for the one-week, 30–40 person-hour window, though WCAG 2.1 AA and the telephone path still add load. The delivery risk now names the narrowed scope.
> 💡 *Suggestion:* Name a fallback cut line, e.g. "if the window is exceeded, WCAG AA is reduced to keyboard and contrast checks".

**Priority / Ranking — 4/5**
> 🔍 *Observation:* Every story is labelled and the deferred ones are marked Deferred. All eight in-scope stories are Must, so ranking no longer helps sequence the work.
> 💡 *Suggestion:* Add a build order within Must, e.g. US-001/US-006/US-009 first, then US-003/US-008/US-011, then US-004/US-010.

### Layer 2 — SDD Readiness

**Bounded Scope — 4/5**
> 🔍 *Observation:* Stories are mostly atomic. US-003 still bundles in-app, telephone, not-recorded, offline and stale-view behaviour.
> 💡 *Suggestion:* Split US-003 into "In-app offer notification" and "Telephone and not-recorded offer flagging".

**Explicit Acceptance Criteria — 5/5**
> 🔍 *Observation:* Every in-scope story has Given/When/Then criteria, including the patient-side access check (BR-011), the unregistered caller (US-006) and the booked slot (US-009).

**Defined Terms — 4/5**
> 🔍 *Observation:* The glossary defines slot, outstanding offer, eligible patient and next in line. "Digitally reachable cohort" and "passed over" are defined only in context.
> 💡 *Suggestion:* Add those two terms to the Section 5 glossary.

**Sufficient Context — 3/5**
> 🔍 *Observation:* Actors, dependencies and boundaries are clear and slot identity is now defined. Still missing: a short data model (waitlist entry, slot, offer and their fields), how staff and patients are authenticated, and the in-app target environment (web or mobile).
> 💡 *Suggestion:* Add a short entities list and a one-line statement of authentication and platform, marked as assumed if not yet decided.

**No Implicit Knowledge — 4/5**
> 🔍 *Observation:* Assumptions and rationale are explicit. Two remain implicit: the claim that some patients were "registered before preference was captured" has no operations confirmation, and the staff-to-specialty assignment behind BR-011 is not listed as a dependency.
> 💡 *Suggestion:* List both under Dependencies as assumed.

### Layer 3 — Structural notes

- Title, ID, version, owner and date are present.
- The document is 1,079 lines with 22 sections and no Table of Contents.
- Sections 19–22 are an iteration and review log, not specification. They interleave meta-content with the normative spec, and the header's version note is growing with each version.
- Readiness is stated twice (Sections 16 and 18), and open items sit in two registers (Section 14 and the Section 16 Outstanding Actions).
- No embedded directive-like text was found.

**Human Readability & Reviewability**
> 🔍 *Observation:* A Table of Contents is triggered. The spec covers a single feature, so there is no feature bundling. The separable content is the change log (Sections 19–22).
>
> 📑 *Suggested Table of Contents:* 1 Delivery Context · 2 Overview · 3 Business Context · 4 Business Value · 5 Scope · 6 Supporting Product Artefacts · 7 Functional Behaviour (US-001 – US-011) · 8 Cross-cutting Business Rules · 9 Cross-cutting Quality Attributes · 10 Deferred Behaviour · 11 Success Measures · 12 Dependencies · 13 Risks · 14 Open Decisions · 15 Traceability · 16 Product Readiness Assessment · 17 Engineering Handoff Notes · 18 Product Specification Completion · 19–22 Review and iteration history
>
> ✂️ *Suggested split plan:* Move Sections 19–22 to a separate change-log file (this document already serves that role). This lets business reviewers read a current-state spec in one pass while the history stays available for audit.

### 🏁 Top 3 Priority Actions

1. **Add the missing technical context.** A short entities list (waitlist entry, slot, offer), authentication for staff and patients, and the in-app platform.
2. **Close the Proposed items and make the reliability target testable.** Get the Product Owner's answer on each *Proposed* marker, and restate the 99% target as a pass/fail pilot test.
3. **Separate the change log and add a Table of Contents.** Move Sections 19–22 out of the spec, merge the duplicate readiness statements (Sections 16 and 18) and the two open-item registers (Sections 14 and 16).

### Remediation status

Interactive remediation was offered, not started. Nothing in v2.4 has been changed as a result of this review.

| Item | Status |
|---|---|
| Top 3 Priority Actions | Open |
| Remaining dimensions scoring below 5 | Open |
| Suggested Table of Contents | Offered, not applied |
| Split of Sections 19–22 into a change-log file | Offered, not applied |

---

## 7. Spec-critic review — PS-001 v2.4

Agent: `story-navigator:spec-critic` · Verdict: **Requires Refinement.** The header status is
correct. Most earlier findings are closed, but the spec cannot be certified Engineering Ready.

### Status of previously reported issues

| Issue | Status |
|---|---|
| First-in-line vs skip rule | Mostly resolved; one residue in the status model (finding 4) |
| Status model | Partly resolved; `waiting` exit still incomplete (finding 4) |
| BR-007 | Resolved |
| Slot identity | Partly resolved; how staff choose a slot to release is undefined (finding 1) |
| Booking boundary (BR-013) | Resolved in substance; still partly Proposed and bundles four rules (finding 2) |
| Telephone patient in-app behaviour | Mostly resolved; US-003 still conflicts (finding 3) |
| Measurable quality targets | Partly resolved (finding 5) |
| Cross-references | Mostly resolved; BR-002 cited by no story, BR-011 cited by US-006 with no criterion |
| Readiness-tick consistency | Partly resolved; Sections 10, 16 and the version note are stale (finding 6) |
| Must depends on Should/Could | Resolved |

### Findings, most material first

1. **US-009 and Section 5 — the release action has no defined input.** No story says how
   staff identify the slot they release (pick from the calendar, type it in, or choose from
   a list of free slots). The slot-identity definition is never used by the core Must action,
   and the decline and pass-on re-offer rules depend on "this slot".
2. **BR-001, BR-005 and BR-013 — rules governing core behaviour are still unconfirmed and
   compound.** Proposed parts: not-recorded handling (BR-001), passed-over patients (BR-005),
   BR-012, the remaining BR-013 wording, US-006 as Must. Criteria in US-003, US-008, US-009,
   US-010 and US-011 depend on them. Each of BR-001, BR-005 and BR-013 bundles three or four
   rules. Section 16 ticks Acceptance Criteria and Business Rules as complete, which overstates
   readiness. Suggested fix: split the rules and qualify the two ticks. This is the largest
   blocker.
3. **US-003 AC6 vs BR-001 and US-008 AC7 — telephone patient's in-app behaviour.** AC6 says any
   patient who opens the waitlist view sees an outstanding offer with accept and decline
   actions, while US-008 AC7 says in-app accept and decline are not available to telephone or
   not-recorded patients. AC6 is not scoped to in-app patients.
4. **Status model — the `waiting` exit omits pass-on.** US-010 also moves a `waiting` patient to
   `notified`, and the `notified` entry row includes it, so the rows disagree. Related: under
   BR-005 a passed-over patient keeps their position and is next in line for the following slot.
   The spec does not say whether this is intended (for example for a repeatedly unreachable
   patient); record it as a PO-confirmed consequence or a risk.
5. **Quality targets not fully measurable.**
   - Data Quality has no target, yet Sections 10 and 16 refer to one.
   - Reliability (99% within 60 seconds) covers only the in-app banner; the telephone path has
     no target for how quickly the offer is flagged to staff.
   - "3 steps or fewer" does not define a step. US-008 alone needs open the app, open the offer,
     accept, then confirm. The attribute is also not attached to any story and is labelled both
     "Proposed" and "Accepted by the PO".
   - The 3G connection is a patient property the system cannot observe; state that its only
     testable form is the throttled load-time profile.
6. **Stale text after v2.4.**
   - The version note says v2.4 applies "three" decisions; Section 22 records five.
   - Section 10 still defers confirmation of the usability and data quality targets although
     usability and load time are accepted.
   - Section 16 says all targets are unconfirmed.
   - Section 20 still lists "Still open" items that v2.3 and v2.4 resolved, and defines
     "Registry" twice. Section 21's "Not changed" list is superseded.
   - US-003's quality attributes line has a typo ("and and").
7. **Traceability and rule hygiene.** BR-002 is cited by no story. BR-011 is cited by US-006
   with no criterion (the only specialty-scoping criterion is in US-004). BR-009 is a
   placeholder counted in "BR-001 – BR-013". BR-002 and BR-003 largely overlap. BR-013 embeds
   "mocked" calendar wording, a delivery constraint rather than policy. "Banner", "in-app" and
   "throttled 3G profile" are UI or test-method wording (the banner is a recorded decision).
8. **Deferred stubs and naming.** The full text of US-002, US-005 and US-007 lives only in v2.1,
   which the spec does not reference by path. The Feature name "Specialist Waitlist Visibility…"
   no longer matches the scope. The QA test spec and OpenSpec artefacts have not been reviewed
   against v2.2–v2.4.
9. **Success Measures.** Most targets are still TBC; the 40% target cannot be assessed against
   mocked data. Already logged as an Outstanding Action.

### Treated as assumptions, not failures

Contact preference captured at first registration (confirmed with hospital operations);
patient registration records and the specialist calendar available (calendar mocked); the
Product Owner decisions in section 5 of this log; the pilot specialty (demo data only); and
the intentionally deferred behaviour.

---

## 8. Combined view of both reviews

| Theme | Readiness review | Spec-critic |
|---|---|---|
| Unconfirmed Proposed rules | Top 3 action 2 | Finding 2 (largest blocker) |
| Slot selection / data model | Sufficient Context 3/5 | Finding 1 |
| Quality targets not testable | Verifiability, Completeness | Finding 5 |
| Stale or duplicated text, change log inside the spec | Layer 3, Top 3 action 3 | Finding 6 |
| Telephone patient in-app behaviour | Not flagged | Finding 3 |
| Status model | Not flagged | Finding 4 |

**Open work, in suggested order:** (1) split BR-001, BR-005 and BR-013 and get the Product Owner's
answer on each Proposed marker; (2) define how staff select the slot to release; (3) scope US-003
AC6 to in-app patients and add pass-on to the `waiting` exit; (4) make the quality targets testable
and fix the stale text; (5) add the technical context and separate the change log.

# Spec Readiness Review — PS-001 v2.1

| Field | Value |
|---|---|
| Document reviewed | `docs/PS-001-Specialist-Waitlist-v2.1.md` |
| Skill | `spec-readiness-review:assess-spec-quality` |
| Assessment date | 2026-10-01 |
| Standard basis | ISO/IEC/IEEE 29148 · IEEE 830 · SDD Readiness |
| Overall score | **46 / 65 — 🟡 Minor Revisions Needed** |

The score is at the bottom of the 46–58 band, so a few fixes would move it up a
label. It reflects the current draft, including its unconfirmed *Proposed* items.

The deterministic lint pass ran. It found 168 passive-voice hits (mostly legitimate
state-transition wording) and 14 weasel-word hits.

**Score bands:** 59–65 ✅ SDD-Ready · 46–58 🟡 Minor Revisions Needed ·
33–45 🟠 Significant Revisions Needed · below 33 🔴 Not Ready

---

## Score summary

| Layer | Dimension | Score |
|---|---|---|
| 1 | Correctness | 4/5 |
| 1 | Unambiguousness | 3/5 |
| 1 | Completeness | 3/5 |
| 1 | Consistency | 3/5 |
| 1 | Verifiability | 4/5 |
| 1 | Traceability | 4/5 |
| 1 | Feasibility | 3/5 |
| 1 | Priority / Ranking | 4/5 |
| 2 | Bounded Scope | 4/5 |
| 2 | Explicit Acceptance Criteria | 4/5 |
| 2 | Defined Terms | 3/5 |
| 2 | Sufficient Context | 3/5 |
| 2 | No Implicit Knowledge | 4/5 |
| | **Total** | **46/65** |

---

## Layer 1 — Standards Quality (IEEE 830 / ISO 29148)

### Correctness — 4/5

> 🔍 *Observation:* Requirements trace to the Use Case and the Product Owner's
> decisions, and the 40% target is honestly flagged as leadership-stated. Several
> rules (BR-001 not-recorded handling, BR-005, BR-012, BR-013, US-006 as Must) are
> still unconfirmed *Proposed* items.
>
> 💡 *Suggestion:* Mark BR-005 and US-006 as *Proposed* in Sections 7 and 8, as the
> others already are. Then record the Product Owner's answers.

### Unambiguousness — 3/5

> 🔍 *Observation:* Most lint hits are benign: "reliable internet" at lines 114 and
> 135, "Simple" at line 782 in a rationale, and "appropriate" at line 834. Real
> vagueness remains:
> - "sufficient" connection (lines 134 and 196)
> - "slow connection"
> - "without staff assistance"
> - "first in line", which means position 1 in some places and the first eligible
>   patient in others
>
> 💡 *Suggestion:* Replace with testable wording, e.g. "usable on a 3G connection
> (≥ 1.6 Mbps down)", and define "first in line" once as "the lowest-position
> waiting patient who has not declined or been passed over for that slot".

**Lint findings cited (weasel categories)**

| Line | Category | Text |
|---|---|---|
| 112 | quantity | Some |
| 114 | quality | reliable |
| 134 | quantity | sufficient |
| 135 | quality | reliable |
| 196 | quantity | sufficient |
| 456 | quality | secure |
| 603 | performance | fast |
| 668 | weasel | several |
| 782 | ux / quantity | Simple / sufficient |
| 834 | quantity | appropriate |
| 862 | weasel | several |
| 916 | weasel / quantity | clearly / appropriate |

Line numbers refer to the file as assessed.

### Completeness — 3/5

> 🔍 *Observation:* The happy path, alternate paths and stale-offer handling are
> covered. Gaps:
> - Success measures are all TBC.
> - Whether a telephone patient can answer in-app is undefined.
> - There is no behaviour for an unregistered caller in US-006.
> - There is no path for a telephone patient who no longer wants the appointment
>   (removal is Should or Could).
> - Slot identity is not specified.
>
> 💡 *Suggestion:* Add one AC to US-006, "Given a caller who is not registered, Then
> no entry is created and staff are told registration is required". State
> explicitly whether in-app response is available to telephone-preference patients.

### Consistency — 3/5

> 🔍 *Observation:* The "first in line" wording in US-003 and US-009 conflicts with
> the skip rule in BR-005 and US-009 AC4.
> - The status model says `notified` is entered only via US-009, but US-010 also
>   does it.
> - The status model exits omit removal.
> - BR-007 lists accept, decline and pass-on but not removal.
> - Section 10 still lists the quality targets as deferred while Section 9 proposes
>   them.
>
> 💡 *Suggestion:* Reword BR-007 to "until it is accepted, declined, passed on, or
> closed by removal or leaving". Add US-010 to the `notified` "Entered when" cell,
> and removal to the `waiting` and `notified` exits.

### Verifiability — 4/5

> 🔍 *Observation:* Nearly every AC is Given/When/Then and testable. The Proposed
> quality targets are partly vague, the 99%-within-60-seconds target is untestable
> over a one-week pilot, and the Data Quality target sits only in US-002.
>
> 💡 *Suggestion:* Restate Reliability as "every offer is visible within 60
> seconds" so a single test can fail it. Define "usable on a slow connection" as a
> throttled-network test.

### Traceability — 4/5

> 🔍 *Observation:* Story IDs, BR IDs and a traceability table are present, but some
> references are broken:
> - "Time outstanding (US-004)" exists only in US-010 AC5.
> - US-007 AC4 cites BR-012 for a closed entry, which BR-012 doesn't cover.
> - BR-003 is cited by no story.
> - BR-011 has no patient-side AC.
>
> 💡 *Suggestion:* Add the time-outstanding criterion to US-004. Cite BR-004 or
> BR-002 in US-007 AC4. Add a patient-side AC for BR-011: "a patient can retrieve
> only their own entry".

### Feasibility — 3/5

> 🔍 *Observation:* The constraint is one week and about 30–40 person-hours. Nine of
> eleven stories are now Must, plus 13 business rules and WCAG 2.1 AA. The Section 13
> delivery risk wasn't revisited after the scope grew.
>
> 💡 *Suggestion:* Re-state the delivery risk with the new load and name a fallback
> cut line, e.g. "if the window is exceeded, US-006 and US-011 remain, and WCAG AA is
> reduced to keyboard and contrast checks".

### Priority / Ranking — 4/5

> 🔍 *Observation:* Every story is ranked Must, Should or Could with a priority key.
> A Must story (US-011) still relies on a Should or Could story (US-005, US-007) for
> the patient who declines the appointment altogether.
>
> 💡 *Suggestion:* Either allow US-011 to record "no longer wanted" and remove the
> entry, or raise US-005 to Must.

---

## Layer 2 — SDD Readiness

### Bounded Scope — 4/5

> 🔍 *Observation:* Stories are mostly atomic. US-003 bundles three delivery paths
> (in-app, telephone, not-recorded) plus offline and stale handling.
>
> 💡 *Suggestion:* Split US-003 into "In-app offer notification" and "Telephone and
> not-recorded offer flagging".

### Explicit Acceptance Criteria — 4/5

> 🔍 *Observation:* All 11 stories carry Given/When/Then criteria. Gaps are BR-011 on
> the patient side, BR-011 on US-005 and US-006, and the unregistered caller.
>
> 💡 *Suggestion:* Add the BR-011 ACs named under Traceability, and the
> unregistered-caller AC under Completeness.

### Defined Terms — 3/5

> 🔍 *Observation:* "Active", "slot" and the statuses are defined. These are not:
> - "outstanding offer"
> - "passed over"
> - "eligible"
> - "same slot", which has no slot identity or reference
> - "digitally reachable"
> - "sufficient connection"
>
> 💡 *Suggestion:* Add a short glossary after Section 5. For example, "Outstanding
> offer: an offer whose entry is `notified` and which has not been accepted,
> declined, passed on or closed".

### Sufficient Context — 3/5

> 🔍 *Observation:* Actors, dependencies and boundaries are well described. Missing:
> - a data model, including slot identity and what staff select when releasing a slot
> - how staff and patients are authenticated
> - the in-app target environment
> - whether a `booked` slot is marked taken in the calendar, since BR-013 hands
>   write-back to a spec that doesn't claim it, so a double offer is possible
>
> 💡 *Suggestion:* Add a short entities list (Waitlist Entry, Slot, Offer) with their
> key fields. Decide whether the mocked calendar flags a slot as taken, and say so in
> BR-013.

### No Implicit Knowledge — 4/5

> 🔍 *Observation:* Assumptions and rationale are explicit. Two are implicit:
> patients "registered before preference was captured" isn't backed by the operations
> confirmation, and the staff-to-specialty assignment behind BR-011 isn't listed as a
> dependency.
>
> 💡 *Suggestion:* Add both to Dependencies, marked as assumed.

---

## Layer 3 — Structural Notes

- Title, ID, version, owner and date are present. The header's single-line status is
  now consistent with Sections 16 and 18, but Section 18 still ticks "Quality
  Attributes complete" while Section 16 says partial.
- Open items sit in two registers (Section 14 and the Section 16 Outstanding
  Actions), and the Section 19 "PO confirmation Yes/No" column is ambiguous.
- Section 14 refers to an exposure "recorded in Risks" for the dropped notification
  centre, but no such risk entry exists.
- "In-app banner" and the "#2" position format are UI-prescriptive. The banner is a
  recorded Product decision, but the "#2" format is not.
- No embedded directive-like text was found.

### Human Readability & Reviewability

> 🔍 *Observation:* The document is about 970 lines with 19 sections and no Table of
> Contents, so a TOC is triggered. It covers a single feature, so there is no
> bundling and no split is proposed. Section 19 is a review log and could live in its
> own change-log file if the spec should stay purely normative.

**Suggested Table of Contents (from existing headers)**

1. Delivery Context
2. Overview
3. Business Context
4. Business Value
5. Scope
6. Supporting Product Artefacts
7. Functional Behaviour (US-001 – US-011)
8. Cross-cutting Business Rules (BR-001 – BR-013, status model)
9. Cross-cutting Quality Attributes
10. Deferred Behaviour
11. Success Measures
12. Dependencies
13. Risks
14. Open Decisions
15. Traceability
16. Product Readiness Assessment
17. Engineering Handoff Notes
18. Product Specification Completion
19. Review Findings & Resolution

---

## 🏁 Top 3 Priority Actions

1. **Make the offer-targeting rules consistent.** Define "first in line" and
   "eligible" once, then align US-003, US-009, US-010, BR-005, BR-007 and the status
   model, including removal and pass-on transitions.
2. **Define slot identity and the booking boundary.** Specify what a slot is and what
   staff select. Decide whether the mocked calendar marks a booked slot as taken
   (BR-013), so a booked slot can't be re-released.
3. **Make the quality targets and connectivity testable.** Replace "sufficient
   connection", "slow connection" and "without staff assistance" with measurable
   thresholds. Align Sections 9, 10 and 16.

---

## Remediation status

Interactive remediation was offered but not started. Nothing in
`PS-001-Specialist-Waitlist-v2.1.md` has been changed as a result of this review.

| Item | Status |
|---|---|
| Top 3 Priority Actions | Open |
| Remaining dimensions scoring below 5 | Open |
| Suggested Table of Contents | Offered, not applied |

Related review of the same document: the spec-critic's findings on v2.1 (verdict
Requires Refinement) cover overlapping ground. Its additional points include the
telephone patient's in-app behaviour, the Must-on-Could dependency for removal, the
broken cross-references and the readiness-tick inconsistencies.

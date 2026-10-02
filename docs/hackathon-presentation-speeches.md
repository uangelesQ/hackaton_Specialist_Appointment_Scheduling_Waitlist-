# Team 7 — Speeches by person

Draft for `docs/hackathon-presentation.html` (10 slides). Everything below comes from the readout (`hackathon-readout.pdf`) and the project docs. Nothing is added that the docs do not support.

## Who speaks where

| Slide | Topic | Speaker |
|---|---|---|
| 1 | Title | Julio |
| 2 | Our team | Everyone, one line each |
| 3 | The problem | Julio (BA) |
| 4 | Our process, end to end | Julio (steps 1–2), Fernanda (step 3), Juan (step 4), Uriel (steps 5–6) |
| 5 | How we applied the pillars | Julio (Governance, Living Agility), Fernanda (Alignment, Adaptability), Uriel (Quality) |
| 6 | What the reviews and tests say | Uriel (QA) |
| 7 | Demo | Fernanda narrates the journey, Juan runs the app |
| 8 | What didn't go as expected | Julio (1), Juan (2 and 3, and Telephone path), Uriel (Spec status) |
| 9 | The spec as a living record | Julio (BA) |
| 10 | Thank you | Everyone |

Roles come from the readout. The split of slides is a proposal based on those roles, so swap anything that does not match who really did the work. Challenges 2 and 3 are given to Juan, because nobody remembers who found them and the team agreed the developer takes them.

Timing is about 130 words per minute. Total is around 8 minutes.

---

## Julio Flores — BA

*Slides 1, 2, 3, 4 (steps 1–2), 5 (Governance, Living Agility), 8 (challenge 1), 9, 10 · about 380 words, 3 minutes*

**[Slide 1]**
Good morning. We are Team 7, and this is our Cardiology Specialist Waitlist, built with spec driven development.

**[Slide 2, your line]**
I'm Julio Flores, the business analyst. I wrote the Product Spec: the user stories, the acceptance criteria and the business rules.

**[Slide 3 — The problem]**
Let me start with the problem. A public hospital with eight specialties still runs its scheduling by phone. Cardiology and oncology waitlists regularly exceed six weeks, and the hospital wants to reduce call volume by 40 percent.

Our first interpretation, before we found the full brief, was a single private clinic with one specialist. That was wrong. The real scope is one pilot specialty, cardiology, inside a much larger hospital system. And a meaningful share of its patients are not digitally reachable at all. That last point changed everything we wrote after it.

**[Slide 4 — Process, steps 1 and 2]**
Our process starts with the problem and the PRD. From there the Product Spec, PS-001, went through nine versions: v0.1 to v0.4, then v2.0 to v2.4 after we found the real brief.

**[Slide 5 — Pillars]**
Two pillars are mine to show.

Governance. The AI suggested that urgent cases should jump the waitlist. We overruled it. Real clinics absorb emergencies as same-day delays, not as queue reordering, so we locked in strict first-in, first-out. It is business rule BR-006, and it is recorded as a resolved decision in the spec.

Living Agility. A Confluence brief we had missed, found in the middle of the hackathon, reframed our entire scope. We rewrote the spec to match the real problem, not the other way around. That is the step from v0.4 to v2.0.

**[Slide 8 — Challenge 1]**
Our first challenge was exactly that brief. On day 3 we discovered the document with the full, real problem statement. Our scope had been an assumption, not a fact, for two days. We did not patch the old spec. We rewrote it.

**[Slide 9 — The spec as a living record]**
To close, here is how the spec changed between day 1 and today.

On day 1 it assumed one private clinic, showed patients a live position, allowed removal, and was digital only. Today it is one pilot specialty in an eight-specialty hospital, confirmed. Position display and removal are deferred, explicitly out of this iteration. And the telephone path is a primary path, not an edge case.

Below you can see the trail: v2.0 realigned the spec, v2.1 fixed the review findings, v2.2 narrowed the scope to registry, slot release and acceptance, v2.3 fixed consistency, and v2.4 applied the Product Owner's decisions. That trail is the evidence that the spec stayed alive.

**[Slide 10]**
Thank you.

---

## Fernanda Hernández — UX

*Slides 2, 4 (step 3), 5 (Alignment, Adaptability), 7 (Demo), 10 · about 270 words, 2 minutes plus the demo*

**[Slide 2, your line]**
I'm Fernanda Hernández, UX. I built the journey maps, kept the decisions log, and made the working HTML prototype.

**[Slide 4 — Process, step 3]**
Step three is the journey maps and the prototype. We kept both in step with the spec, all the way to version 3.

**[Slide 5 — Pillars]**
Alignment. I built the journey maps and the working prototype. Julio and Uriel folded every open decision into the Product Spec. After each round of feedback, the prototype and the spec were both updated before the next build pass.

Adaptability. We kept the prototype as one HTML page with internal tabs, not several pages. We did that on purpose, because our dev needed to build fast. We calibrated to the real constraint of the week and did not gold-plate it.

**[Slide 7 — Demo]**
Now the demo. The idea is one shared record, with two ways in: the web, or a phone call.

*(Suggested walkthrough, taken from the V3 demo script. Juan runs the app.)*

*Act 1, registry.* Maria Gómez signs in, she is already in hospital records, and joins the waitlist. On the staff side her entry appears instantly, no phone call and no notebook. Not everyone can self-join, so staff can add a patient on their behalf. Jorge Ramírez is added and appears tagged as telephone. When staff try to add Sofía Reyes, she is rejected, because she is not registered in hospital records. Staff cannot create a phantom patient.

*Act 2, slot release.* A slot opens and staff release it. It goes to the next patient in line. Carlos Mendoza has a telephone preference, so he is flagged "requires a call". There is no banner, because he has no app. Staff call him, and when he declines, the offer closes. It does not jump to the next person on its own. Staff release again, and Ana Torres is notified, with no preference recorded. When staff cannot reach her, they pass the offer on in one click. A confirmed no and an unreachable patient are different outcomes, so they behave differently.

*Act 3, acceptance.* Maria now has the offer. She sees the banner, taps Accept, and confirms. The two steps are on purpose, so nobody books by an accidental tap. On the staff side she shows as booked, and the others move up automatically.

**[Slide 10]**
Thank you.

---

## Juan Carlos Abarca — BE / FE Dev

*Slides 2, 4 (step 4), 7 (runs the demo), 8 (challenges 2 and 3, and Telephone path), 10 · about 330 words, 2.5 minutes plus the demo*

**[Slide 2, your line]**
I'm Juan Carlos Abarca, back-end and front-end development. I worked on the data model, on whether the spec could really be built, and on supporting the build.

**[Slide 4 — Process, step 4]**
Step four is the OpenSpec technical spec. The MVP change was built with all 32 of its 32 tasks done. For the new spec, v2.4, we have a second change planned. It has 30 tasks, and none are done yet.

**[Slide 7 — Demo]**
*(Run the app locally while Fernanda narrates each act. Say only what is on screen: the staff view, the patient view, and the three acts of the walkthrough.)*

**[Slide 8 — Challenge 2]**
Our second challenge was a rule we had built wrong. Our own prototype auto-advanced the waitlist on a decline, which directly contradicted a business rule we had written ourselves. We caught it by re-reading the spec against the build, and we fixed it before it reached the team.

**[Slide 8 — Challenge 3]**
Our third challenge was a bug that only the script found. When we wrote the literal demo script, not just clicked around, it surfaced a queue-ordering bug that nobody had noticed in casual testing.

**[Slide 8 — Still open: Telephone path]**
One thing is still open, and I want to be direct about it. The telephone path is specified, but it is not built yet. That second change has 0 of 30 tasks done, so the contact preference, the "requires a call" flag and the staff-recorded responses are not in the build yet. The automated tests for those features are waiting for it.

**[Slide 10]**
Thank you.

---

## Uriel Angeles — QA

*Slides 2, 4 (steps 5–6), 5 (Quality), 6, 8 (Spec status), 10 · about 410 words, 3 minutes*

**[Slide 2, your line]**
I'm Uriel Angeles, QA. I reviewed the business rules, looked for edge cases, and checked that the spec and the build stayed aligned.

**[Slide 4 — Process, steps 5 and 6]**
Step five is the QA test spec: 20 test cases, each traced to acceptance criteria and business rules, with a gap log and a coverage matrix. Step six is reviews and automation. We ran the spec-readiness-review and spec-critic on the spec, and we built a Playwright suite with an Allure report.

**[Slide 5 — Pillars: Quality]**
Quality. We caught our own prototype contradicting our own business rule. A decline was auto-cascading to the next patient, when the spec required a separate staff action. We fixed it before it reached the team.

We also questioned the AI's own spec. The reviews flagged "first in line" as contradicting the skip rule, and we fixed that in v2.3.

**[Slide 6 — What the reviews and tests say]**
Here are the numbers. These are our own runs, not the official evaluation.

The spec-readiness-review scored spec v2.1 at 46 out of 65, and spec v2.4 at 52 out of 65. Both are in the "Minor Revisions Needed" band. SDD-Ready starts at 59, so we are not there. The spec-critic still says "Requires Refinement" for v2.4, with open Product Owner confirmations.

The QA test spec has 20 cases, which is the agreed maximum. We logged 15 gaps, and the Product Owner has resolved 6 of them.

The Playwright suite, on today's build, has 12 tests passing and 11 skipped. The skipped ones wait for the telephone path to be built.

**[Slide 8 — Still open: Spec status]**
One more thing is still open. Version 2.0 called itself "Ready with Minor Refinement". The review said "Requires Refinement". We corrected the status, and v2.4 still carries open confirmations. We would rather show that than hide it.

**[Slide 10]**
Thank you. We are happy to take questions.

---

## Facts to have at hand

Each is taken from the docs. If a number comes up in questions, use these.

| Topic | Fact | Source |
|---|---|---|
| Hospital | 8 specialties; cardiology and oncology waits above 6 weeks; 40% call-volume reduction goal | Readout, PRD |
| Spec | 9 versions: v0.1 to v0.4 and v2.0 to v2.4 | PS-001 version note |
| Spec v2.4 | 11 stories defined, 8 in scope; 13 business rules, BR-009 deferred | PS-001 v2.4 |
| Deferred | Patient-facing position, patient leaving, staff removal | PS-001 v2.4, section 10 |
| Readiness | v2.1: 46/65; v2.4: 52/65; both "Minor Revisions Needed" | `spec-readiness-review-PS-001-v2.1.md`, `spec-iteration-log-PS-001-v2.0-to-v2.4.md` |
| QA test spec | 20 cases; 15 gaps; 6 resolved | `docs/qa/test-spec-waitlist-telephone-path-and-slot-rules.md` |
| Playwright | 23 tests for the 20 cases: 12 passed, 11 skipped | `playwright-suite/` |
| OpenSpec | MVP change 32 of 32 tasks done; new change 0 of 30 | `openspec/changes/` |

## Open points before you present

1. **Who did what beyond the readout.** Challenges 2 and 3 are with Juan because nobody remembers who found them. The "In this deck" lines on slide 2 name only artifacts that fit each role.
2. **Which build the demo uses.** The Demo talk track follows the V3 prototype walkthrough, which shows the telephone path. The built app does not have that path yet, so if you demo the app, cut the telephone steps (Carlos, Ana and Jorge) or say clearly that they are prototype-only.
3. **Pilot specialty.** The readout says cardiology. PS v2.4 still lists cardiology or oncology as an open decision. Be ready for that question.

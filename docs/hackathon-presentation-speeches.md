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
| 8 | What didn't go as expected | Julio (1), Juan (2, 3 and Test evidence), Uriel (Spec status) |
| 9 | The spec as a living record | Julio (BA) |
| 10 | Thank you | Everyone |

Roles come from the readout. The split of slides is a proposal based on those roles, so swap anything that does not match who really did the work. Challenges 2 and 3 are given to Juan, because nobody remembers who found them and the team agreed the developer takes them.

Timing is about 130 words per minute. Total is around 8 minutes. Updated on 2026-10-02 for spec v2.5 and the built contact preference.

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
Our process starts with the problem and the PRD. From there the Product Spec, PS-001, went through ten versions: v0.1 to v0.4, then v2.0 to v2.5 after we found the real brief. The latest, v2.5, is still a Draft.

**[Slide 5 — Pillars]**
Two pillars are mine to show.

Governance. The AI suggested that urgent cases should jump the waitlist. We overruled it. Real clinics absorb emergencies as same-day delays, not as queue reordering, so we locked in strict first-in, first-out. It is business rule BR-006, and it is recorded as a resolved decision in the spec.

Living Agility. A Confluence brief we had missed, found in the middle of the hackathon, reframed our entire scope. We rewrote the spec to match the real problem, not the other way around. That is the step from v0.4 to v2.0.

**[Slide 8 — Challenge 1]**
Our first challenge was exactly that brief. On day 3 we discovered the document with the full, real problem statement. Our scope had been an assumption, not a fact, for two days. We did not patch the old spec. We rewrote it.

**[Slide 9 — The spec as a living record]**
To close, here is how the spec changed between day 1 and today.

On day 1 it assumed one private clinic, showed patients a live position, allowed removal, and was digital only. Today it is one pilot specialty in an eight-specialty hospital, confirmed. Position display and removal are deferred, out of this iteration. The telephone path is a primary path, built and tested. And patients now choose and change their own contact preference, which is the newest change, and still a Draft.

Below you can see the trail: v2.0 realigned the spec, v2.1 fixed the review findings, v2.2 narrowed the scope to registry, slot release and acceptance, v2.3 and v2.4 fixed consistency and applied the Product Owner's decisions, and v2.5 made the contact preference settable in the app. v2.5 reverses a position that hospital operations had confirmed, that the app only reads the preference, so we marked it as proposed until they confirm it. That trail is the evidence that the spec stayed alive.

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
Now the demo. The idea is one shared record, with two ways in: the web, or a phone call. And now the patient chooses which one.

*(Suggested walkthrough, taken from the built app and the README. Juan runs the app after `npm run seed`. Cut any act if time is short.)*

*Act 0, registration (demo only).* On the sign-in screen, a new person registers with a name and a choice, in-app or telephone, and is signed in. A name already in use is refused. This step exists only for the demo, because there is no hospital registration system here.

*Act 1, registry.* A patient with no recorded preference must choose one before joining. They pick in-app or telephone, each with a short description, confirm, and join. On the staff side the entry appears instantly, no phone call and no notebook. Maria Gómez, already in-app, joins directly. Staff can also add a caller on their behalf. When the caller has no preference, staff record the caller's stated choice in the same step. When staff try to add Sofía Reyes, she is rejected, because she is not registered in hospital records. Staff cannot create a phantom patient.

*Act 2, slot release.* A slot opens and staff release it. It goes to the next patient in line. Carlos Mendoza has a telephone preference, so he is flagged "requires a call". There is no banner, because he has no app. Staff call him, and when he declines, the offer closes. It does not jump to the next person on its own. Staff release again, and Ana Torres, who has no preference recorded, is treated as telephone until she chooses. When staff cannot reach her, they pass the offer on in one click. A confirmed no and an unreachable patient are different outcomes, so they behave differently.

*Act 3, acceptance, and a change of mind.* Maria now has the offer. She sees the banner, taps Accept, and confirms. The two steps are on purpose, so nobody books by an accidental tap. On the staff side she shows as booked, and the others move up automatically. If a patient who holds an offer changes their preference, the offer stays and follows the new channel: the banner appears or disappears, and the staff call flag follows.

**[Slide 10]**
Thank you.

---

## Juan Carlos Abarca — BE / FE Dev

*Slides 2, 4 (step 4), 7 (runs the demo), 8 (challenges 2 and 3, and Test evidence), 10 · about 330 words, 2.5 minutes plus the demo*

**[Slide 2, your line]**
I'm Juan Carlos Abarca, back-end and front-end development. I worked on the data model, on whether the spec could really be built, and on supporting the build.

**[Slide 4 — Process, step 4]**
Step four is the OpenSpec technical spec. We have three changes, and all are built: 32 of 32 tasks, 30 of 30, and 25 of 25, so 87 of 87. The last one, for spec v2.5, is built and tested but not archived yet.

**[Slide 7 — Demo]**
*(Run the app locally while Fernanda narrates each act. Say only what is on screen: the staff view, the patient view, and the three acts of the walkthrough.)*

**[Slide 8 — Challenge 2]**
Our second challenge was a rule we had built wrong. Our own prototype auto-advanced the waitlist on a decline, which directly contradicted a business rule we had written ourselves. We caught it by re-reading the spec against the build, and we fixed it before it reached the team.

**[Slide 8 — Challenge 3]**
Our third challenge was a bug that only the script found. When we wrote the literal demo script, not just clicked around, it surfaced a queue-ordering bug that nobody had noticed in casual testing.

**[Slide 8 — Still open: Test evidence]**
The telephone path that was open in our last draft is now built, with the contact preference, the "requires a call" flag and the staff-recorded responses. The Playwright suite has 50 tests written and none skipped. I want to be direct about one thing: the full run on the final build is the last check before we present, so confirm the pass count before you say it.

**[Slide 10]**
Thank you.

---

## Uriel Angeles — QA

*Slides 2, 4 (steps 5–6), 5 (Quality), 6, 8 (Spec status), 10 · about 410 words, 3 minutes*

**[Slide 2, your line]**
I'm Uriel Angeles, QA. I reviewed the business rules, looked for edge cases, and checked that the spec and the build stayed aligned.

**[Slide 4 — Process, steps 5 and 6]**
Step five is the QA test specs: 46 test cases in two specs, 20 for the telephone path and 26 for spec v2.5, each traced to acceptance criteria and business rules, with gap logs and coverage matrices. The second spec is a delta, so it only covers what v2.5 changed. Step six is reviews and automation. We ran the spec-readiness-review and spec-critic on the spec, and we built a Playwright suite of 50 tests with an Allure report.

**[Slide 5 — Pillars: Quality]**
Quality. We caught our own prototype contradicting our own business rule. A decline was auto-cascading to the next patient, when the spec required a separate staff action. We fixed it before it reached the team.

We also questioned the AI's own spec. The reviews flagged "first in line" as contradicting the skip rule, and we fixed that in v2.3. For v2.5 the QA review logged 11 new gaps, for example that hospital operations have not confirmed the change.

**[Slide 6 — What the reviews and tests say]**
Here are the numbers. These are our own runs, not the official evaluation.

The spec-readiness-review scored spec v2.1 at 46 out of 65, and spec v2.4 at 52 out of 65. Both are in the "Minor Revisions Needed" band. SDD-Ready starts at 59, so we are not there. We have not scored v2.5 yet. The spec-critic still says "Requires Refinement" for v2.4.

The two QA test specs have 46 cases, 20 plus 26 for v2.5. We logged 26 gaps, 15 plus 11, and the Product Owner has resolved 6 of them. The 11 new ones are all still open.

The Playwright suite now has 50 tests, up from 23, and none are skipped, because the telephone path and the preference are built. *(Run the suite and say the real pass count. Stop the demo API on port 3001 first, or the suite refuses to start.)*

**[Slide 8 — Still open: Spec status]**
One more thing is still open. Spec v2.5 is a Draft. It reverses the read-only preference that hospital operations confirmed in v2.0 to v2.4, and they have not confirmed the change yet. If they refuse, the OpenSpec change is reverted. Earlier, version 2.0 called itself "Ready with Minor Refinement" and the review said "Requires Refinement", and we corrected it. We would rather show that than hide it.

**[Slide 10]**
Thank you. We are happy to take questions.

---

## Facts to have at hand

Each is taken from the docs. If a number comes up in questions, use these.

| Topic | Fact | Source |
|---|---|---|
| Hospital | 8 specialties; cardiology and oncology waits above 6 weeks; 40% call-volume reduction goal | Readout, PRD |
| Spec | 10 versions: v0.1 to v0.4 and v2.0 to v2.5; v2.5 is a Draft | PS-001 v2.5 version note |
| Spec v2.5 | 13 stories defined (US-001 to US-013), 10 in scope, 3 deferred; 21 business rules, BR-009 deferred | PS-001 v2.5 |
| Deferred | Patient-facing position, patient leaving, staff removal, staff correcting a recorded preference, telephone numbers | PS-001 v2.5, section 10 |
| Readiness | v2.1: 46/65; v2.4: 52/65; both "Minor Revisions Needed"; v2.5 not scored | `spec-readiness-review-PS-001-v2.1.md`, `spec-iteration-log-PS-001-v2.0-to-v2.4.md` |
| QA test specs | 20 + 26 = 46 cases; 15 + 11 = 26 gaps; 6 resolved | `docs/qa/test-spec-waitlist-telephone-path-and-slot-rules.md`, `docs/qa/test-spec-waitlist-contact-preference-in-app.md` |
| Playwright | 50 tests written, none skipped; pass count to confirm with a full run | `playwright-suite/tests/specs/` |
| OpenSpec | 32 of 32, 30 of 30 and 25 of 25 tasks done; the contact preference change is not archived | `openspec/changes/` |

## Open points before you present

1. **Who did what beyond the readout.** Challenges 2 and 3 are with Juan because nobody remembers who found them. The "In this deck" lines on slide 2 name only artifacts that fit each role.
2. **Which build the demo uses.** The built app now has the telephone path and the contact preference, so the demo can run on it. Prototype V4 does not exist, so the screens are the built app's, not a prototype's. Run `npm run seed` first, so Carlos and Ana are already waiting.
3. **Pilot specialty.** The readout says cardiology. The PS still lists cardiology or oncology as an open decision. Be ready for that question.
4. **Playwright numbers.** The 50 tests and 0 skipped come from counting the specs. The full run could not start in this session because the demo API was using port 3001, so no pass count is confirmed. Run the suite and update slide 6 before presenting.
5. **v2.5 is a Draft.** Hospital operations have not confirmed it, and the Product Owner's position changed from v2.4. Say it is proposed, not agreed.

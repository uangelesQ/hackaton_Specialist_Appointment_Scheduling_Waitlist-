# Specialist Appointment Scheduling & Waitlist

A digital waitlist for one high-demand specialist. Patients join the list and are told in the app when a slot opens. Patients who cannot use the app are reached by a staff call, and staff record their answer, so everyone is on the same waitlist.

This is the product in `docs/PS-001-Specialist-Waitlist-v2.4.md` with the screens of `docs/waitlist-prototypeV3.html`. It was built in two steps, and both are in `openspec/`:

- `openspec/specs/` holds the behaviour of the first step (join, view, release, accept, decline, pass-on). Its proposal and tasks are in `openspec/changes/archive/`.
- `openspec/changes/waitlist-telephone-path-and-slot-rules/` is the current step: contact preference, the telephone path, slot targeting rules and the V3 screens.

## What it does

- A patient joins the waitlist and sees a **status** (Joined, Waiting, Notified, Booked), not a queue position. The patient screen has no leave control.
- Every patient has a **contact preference** that decides how they are reached: `in_app`, `telephone`, or not recorded. It is read from the patient record and cannot be changed here.
- Staff see the whole list with each patient's contact preference, add a patient who phoned in, and **release** an open slot. The slot goes to the patient who is **next in line**.
- If that patient is **in-app**, they get a banner and can **Accept** (after a confirm step) or **Decline**.
- If they are **telephone or not recorded**, the staff screen flags the offer **Requires a call**. Staff phone them and press **They accepted** or **They declined**. If they cannot be reached, staff press **Couldn't reach them — pass to next**.
- Declining or being passed over keeps the patient's place. The next patient is **not** notified automatically, and nobody is offered a slot they declined or were passed over for. A booked slot cannot be released again.
- Every join, release, accept, decline, pass-on and staff-recorded response records who did it and when.
- The API still has position, leave and remove. Only their screens are hidden in this step, because the product spec defers them.

## Requirements

Node.js 24 and npm 11 (what it was built and tested with).

## Set up

```bash
npm install
npm run build   # type-checks every package and builds the web app
npm test        # API and web tests
npm run lint
```

## Run it

Load the sample data first, then use two terminals:

```bash
npm run seed                   # sample people, plus Carlos and Ana already waiting
npm run dev -w @waitlist/api   # API on http://localhost:3001, demo sign-in on
npm run dev -w @waitlist/web   # web app on http://localhost:5173
```

Open <http://localhost:5173>. The web app sends `/api/...` requests to the API through the Vite dev server.

`npm run dev` sets `DEMO_LOGIN=true` inline, which works on macOS and Linux. On Windows, set `DEMO_LOGIN=true` in your shell and run `npm run start -w @waitlist/api` instead.

**Start over:** stop the API, delete `apps/api/data/waitlist.db`, and run `npm run seed` again.

**Re-seeding an existing database.** Running `npm run seed`, or starting the dev server, updates the people in an existing database by id, so a database made by an older version gets the new names and contact preferences. It does **not** clear the waitlist. Only `npm run seed` adds Carlos and Ana to the waitlist (and only if they are not already on it). A fresh `npm run dev` without it starts with the six people and an empty waitlist.

## Seeded users

The specialist is **Dr. Elena Ruiz** (Cardiology). Sign in by choosing a name; there are no passwords.

| Patient | Contact preference | After `npm run seed` |
|---|---|---|
| Maria Gómez | In-app | Not on the waitlist |
| Diego Herrera | In-app | Not on the waitlist |
| Valeria Tapia | In-app | Not on the waitlist |
| Carlos Mendoza | Telephone | Waiting, position 1 |
| Ana Torres | Not recorded | Waiting, position 2 |
| Jorge Ramírez | Telephone | Not on the waitlist |

Staff: **Ricardo Salazar** and **Guadalupe Ortega**.

**Sofía Reyes** is deliberately not seeded. She stands for a person who is not registered in hospital records.

These are made-up demo records. Sign-in is a **demo stand-in** for a real identity provider: anyone who can reach the API can sign in as anyone. Never enable `DEMO_LOGIN` anywhere real.

## Contact preference and the telephone path

The preference is captured by hospital registration, outside this app. The app only reads it, and no screen or route changes it. A patient with **no recorded preference is treated as telephone** everywhere.

Each patient has exactly one way to answer an offer:

| Preference | Banner in the app | Who answers | Staff screen |
|---|---|---|---|
| In-app | Yes: Accept and Decline | The patient | Only "pass to next" |
| Telephone | No. A notice says the team will contact them | Staff, after a call | "Requires a call", They accepted, They declined, pass to next |
| Not recorded | Same as telephone | Staff, after a call | Same as telephone |

An in-app answer from a telephone patient is refused, and staff cannot record an answer for an in-app patient. A staff-recorded response has the same effect as the patient's own and is audited as entered by staff. The first action on an offer wins: anything that arrives after is told the offer is no longer available.

## Try it: the V3 demo script

After `npm run seed`, `docs/prototype-walkthroughV3.md` maps onto the app like this. There is no Patient/Staff tab switcher: **sign out** and sign in as someone else.

| Walkthrough step | In the app |
|---|---|
| 1–2. Maria signs in and joins | Sign in as **Maria Gómez**, press **Join waitlist**. She sees the Waiting status, no position. |
| 3. Switch to the staff view | Sign out, sign in as **Ricardo Salazar**. The table lists Carlos, Ana, Maria. |
| 4–5. Add Jorge, who phoned in | In "Add a patient on their behalf", choose **Jorge Ramírez**, press **Add to waitlist**. He appears tagged **Telephone**. |
| 7. Release the next slot | Enter a date and time and press **Release slot**. Carlos is notified and flagged **Requires a call**. |
| 8. They declined | Press **They declined** (one click). Carlos goes back to Waiting at position 1 and the offer does **not** move on by itself. |
| 9. Release again | Press **Release slot**. The returned slot is reused, so it asks for no date. Ana is notified, also flagged. |
| 10. Couldn't reach them | Press **Couldn't reach them — pass to next**. Maria is notified. |
| 11–12. Maria accepts | Sign in as **Maria**. She sees the banner. Press **Accept**, then **Confirm**. |
| 13. Back to the staff view | Maria is gone from the list. Carlos and Ana are back at the top, renumbered automatically. |
| Off-script: Maria declines | Press **Decline** instead. She stays on the list and staff release again. |

**What does not map, and why:**

- **Step 6, Sofía Reyes rejected.** She is not in the add panel, because the panel lists only registered patients (the hospital lookup is out of scope). The "not registered" message exists and is tested: an unknown person gets a 404 and the screen text "…is not registered in hospital records. They must register before joining the waitlist." You can see the API refuse her: `POST /waitlist/patients/7` with a staff token.
- **Reset demo.** Not built. Use "Start over" above.
- **Fixed slot time.** The prototype hard-codes "Thursday, Oct 2 · 10:30 AM". Staff type the date and time of a new slot here.
- **Booked rows in the staff table.** The prototype keeps Maria listed as Booked. The product spec says closed entries are not listed, so she disappears.
- **The "(you)" label.** Prototype-only; not built.

## Try it: the unreachable and booked-slot rules

- Press **Release slot**, then pass the offer on to everyone until nobody is left. The screen says **No eligible patient remains for this slot.** and offers no release.
- Book a slot, then try to release the same date and time. The release is refused with "That slot is already booked."
- To try the same steps in a different order, delete the database and run `npm run seed` again.

## Configuration

Set these as environment variables for the API.

| Variable | Default | Meaning |
|---|---|---|
| `DEMO_LOGIN` | off | `true` enables passwordless sign-in and seeds the sample people on start |
| `JWT_SECRET` | none | Signing secret. Required unless `DEMO_LOGIN=true` (a built-in demo secret is used then) |
| `PORT` | `3001` | API port |
| `DATABASE_FILE` | `data/waitlist.db` | SQLite file, relative to `apps/api` |

## API

All routes need a bearer token except the two `/demo` routes.

| Route | Who | Does |
|---|---|---|
| `POST /demo/login`, `GET /demo/users` | anyone (demo only) | Sign in as a seeded user; list them |
| `POST /waitlist` | patient | Join. Joining again returns the existing entry |
| `GET /me/waitlist` | patient | Own status, offer banner data (in-app holders only), `holdsOffer`, `responseChannel`, and position |
| `DELETE /waitlist/:entryId` | owner or staff | Leave / remove (no screen uses it in this step) |
| `GET /waitlist` | staff | Active entries with contact preference, the outstanding offer (`requiresCall`, `createdAt`), and whether release is possible |
| `POST /waitlist/patients/:patientId` | staff | Add a patient on their behalf |
| `GET /patients` | staff | Registered patients with their contact preference, for the add form |
| `POST /offers` | staff | Release a slot (`startsAt`, unless a returned slot is waiting) |
| `POST /offers/:id/accept`, `.../decline` | the offer holder, in-app only | Answer an offer in the app |
| `POST /offers/:id/record-accept`, `.../record-decline` | staff | Record a telephone or not-recorded patient's answer |
| `POST /offers/:id/pass` | staff | Pass an unanswered offer to the next patient |

## Project layout

- `apps/api`: Express, Zod and SQLite (through Knex) behind a repository layer.
- `apps/web`: React, Vite and React Query.
- `packages/shared`: the response types both sides use.
- `openspec/`: the specs, and the proposal, design and tasks of the current change.
- `docs/`: the product specifications, PRD and prototypes.

## Performance check

Two targets from the spec, measured on a production build with the API running (Chrome 154, headless, driven over the DevTools protocol, cache cleared before every run). **This was automated, not done by hand**, so repeat it in a real browser if you need a formal sign-off.

| Target | Result |
|---|---|
| The offer view is usable within **5 seconds** on a throttled 3G profile (about 1.6 Mbps) | **2.26 s**, the same in 5 of 5 runs. "Usable" means the banner is showing and Accept is present. Chrome's "Fast 3G" preset (1.6 Mbps, 562 ms round trip) was applied. About 142 KB was transferred. |
| An offer appears in the holder's open screen within **60 seconds**, with no refresh | **8.5 s** in 5 of 5 runs. The web app polls every **10 seconds** (`POLL_MS` in `PatientView.tsx` and `StaffView.tsx`). |

Caveats: the preview server uses plain HTTP, so a real HTTPS connection adds two round trips (about 1.1 s on this profile), which is still under 4 seconds. Google Fonts were loaded as a real visitor would; blocking them made no measurable difference. The tab icon (`apps/web/public/els-logo.png`, 316 KB) was not among the requests completed when the view became usable, but it costs mobile data, so a favicon-sized image would be kinder to slow connections.

## Assumptions waiting for the Product Owner

The product spec left these open, so the plan chose a behaviour. Please confirm or change each.

**Contact preference and responding**
- **Not recorded is treated as telephone.**
- **One response channel per patient.** An in-app answer from a telephone or not-recorded patient is refused, and staff cannot record for an in-app patient. This is this plan's reading of the spec, not a stated decision.
- **Staff recording is one click** (as in the prototype), with no confirmation. A mis-click books or releases a slot and cannot be undone; the audit trail names the staff member.
- **Wording.** The notice shown to a telephone or not-recorded patient who holds an offer, and the staff button labels, are pending UX.
- **Quality targets.** 5 seconds on 3G and three steps to respond were accepted by the Product Owner. The 99% within 60 seconds target and accessibility (WCAG 2.1 AA) are still *Proposed*, and no accessibility work was done.

**Slots and targeting**
- **A passed-over patient is not offered that same slot again**, and keeps their position.
- **Slot date and time.** Staff type it when they release a new slot. A slot that comes back (declined, passed on, or its holder removed) stays open with the same date and time, and the next release reuses it.
- **Everyone declined or passed over.** No release action is offered and the slot stays open.
- **Booking is complete** when the slot is recorded against the patient, marked taken, and the entry closes as booked. The calendar is mocked: the slot table is the calendar.
- **Past dates.** A slot date and time in the past is accepted.

**Screens and data**
- **Specialty.** The demo is Cardiology, as in the prototype. The pilot specialty is still an open decision.
- **Time zone.** Dates show in the viewer's time zone, and a staff-entered slot time is read in the staff member's time zone. The clinic's own time zone is not modelled.
- **The "You're booked" screen** shows once, right after accepting. A later visit shows the patient as not on the waitlist.
- **Compliance.** The data-protection framework is still undecided. Baseline controls are in place (sign-in, patients see only their own record, an audit trail, no names in logs), but nothing has been checked against a specific framework.

## Known limits

- One specialist, one clinic.
- In-app only: no email or SMS, no timer, no automatic pass-on, and the phone call itself happens outside the app.
- The audit trail is stored but there is no screen or endpoint to read it.
- Patient position, leaving the waitlist and staff removal are not on any screen in this step (the API has them).
- SQLite suits the MVP, not horizontal scaling. The repository layer is where a production database would plug in.
- Rescheduling and cancelling a booking are out of scope. The booked screen says to contact the office.

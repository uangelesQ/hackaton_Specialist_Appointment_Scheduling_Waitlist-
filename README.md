# Specialist Appointment Scheduling & Waitlist

A digital waitlist for one high-demand specialist. Patients join the list, see their place in line, and are told in the app when a slot opens, so nobody has to phone the office. Staff keep the same list instead of a manual one and release slots to it.

This is the MVP in `docs/PS-001-Waitlist-Visibility-NotificationV2.md`. The design and the task list it was built from are in `openspec/changes/waitlist-visibility-notification/`.

## What it does

- A patient joins the waitlist, sees their position as **#N** (never a total), and can leave.
- Staff see the whole list, add a patient who phoned in, and remove a patient.
- Staff **release** an open slot. The first patient in line is notified with a banner and can **Accept** (after a confirm step) or **Decline**.
- Declining keeps the patient's place and gives the slot back to staff. The next patient is **not** notified automatically.
- If a patient does not answer, staff can **pass the offer on** to the next patient. There is no timer.
- Every join, removal, release, accept, decline and pass-on is recorded with who did it and when.

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

Use two terminals:

```bash
npm run dev -w @waitlist/api   # API on http://localhost:3001, demo sign-in on, sample data seeded
npm run dev -w @waitlist/web   # web app on http://localhost:5173
```

Open <http://localhost:5173>. The web app sends `/api/...` requests to the API through the Vite dev server.

`npm run dev` sets `DEMO_LOGIN=true` inline, which works on macOS and Linux. On Windows, set `DEMO_LOGIN=true` in your shell and run `npm run start -w @waitlist/api` instead.

To start over with a clean demo, stop the API and delete `apps/api/data/waitlist.db`.

To load the sample data without starting the server: `npm run seed`.

## Seeded users

The specialist is **Dr. Elena Ruiz** (Dermatology). Sign in by choosing a name; there are no passwords.

| Role | Users |
|---|---|
| Patient | Ana Torres, Ben Carter, Chloe Nguyen, David Okafor, Eva Lindqvist |
| Staff | Sam Patel, Maria Gomez |

These are made-up demo records. Sign-in is a **demo stand-in** for a real identity provider: anyone who can reach the API can sign in as anyone. Never enable `DEMO_LOGIN` anywhere real.

## Try the staff release flow

1. Sign in as **Ana Torres** and choose **Join waitlist** (she is #1). Sign out, then do the same as **Ben Carter** (he is #2).
2. Sign in as **Sam Patel** (staff). The table lists Ana then Ben. Under **Release slot**, enter a date and time and press **Release slot**.
3. Ana is now *Notified* in the table, and the control shows that staff are waiting on her answer. Release is hidden while an offer is waiting.
4. Sign in as **Ana**. A banner shows the slot. Either:
   - **Decline**: she stays #1, Ben is not notified, and staff get the slot back; or
   - **Accept**, then **Confirm** in the dialog: the slot is booked and she leaves the list. **Cancel** in the dialog changes nothing.
5. Back as staff, after a decline: the control shows the returned slot's date and time. **Release slot** offers it again, skipping Ana (she declined it) and going to Ben.
6. If a patient never answers, staff press **No response — offer to next patient**. If nobody is left behind them, the slot goes back to staff.
7. Removing a patient who holds an offer closes the offer and returns the slot to staff.

## Configuration

Set these as environment variables for the API.

| Variable | Default | Meaning |
|---|---|---|
| `DEMO_LOGIN` | off | `true` enables passwordless sign-in and seeds the sample data on start |
| `JWT_SECRET` | none | Signing secret. Required unless `DEMO_LOGIN=true` (a built-in demo secret is used then) |
| `PORT` | `3001` | API port |
| `DATABASE_FILE` | `data/waitlist.db` | SQLite file, relative to `apps/api` |

## API

All routes need a bearer token except the two `/demo` routes.

| Route | Who | Does |
|---|---|---|
| `POST /demo/login`, `GET /demo/users` | anyone (demo only) | Sign in as a seeded user; list them |
| `POST /waitlist` | patient | Join. Joining again returns the existing entry |
| `GET /me/waitlist` | patient | Own position, join date, and any outstanding offer |
| `DELETE /waitlist/:entryId` | owner or staff | Leave / remove |
| `GET /waitlist` | staff | Active entries in position order, the outstanding offer, and whether release is possible |
| `POST /waitlist/patients/:patientId` | staff | Add a patient on their behalf |
| `GET /patients` | staff | Registered patients, for the add form |
| `POST /offers` | staff | Release a slot (`startsAt`, unless a returned slot is waiting) |
| `POST /offers/:id/accept`, `.../decline` | the offer holder | Answer an offer |
| `POST /offers/:id/pass` | staff | Pass an unanswered offer to the next patient |

## Project layout

- `apps/api`: Express, Zod and SQLite (through Knex) behind a repository layer.
- `apps/web`: React, Vite and React Query.
- `packages/shared`: the response types both sides use.
- `openspec/`: the proposal, specs, design and tasks.
- `docs/`: the product specification, PRD and the prototype this UI follows.

## Assumptions waiting for the Product Owner

The product spec left these open, so the plan chose a behavior. Please confirm or change each.

- **Slot date and time.** Staff type the date and time when they release a new slot. A slot that comes back (declined, passed on with nobody behind, or its holder removed) stays open with the same date and time, and the next release reuses it.
- **Everyone declined.** If every waiting patient has declined the returned slot, no release action is offered and the slot stays open.
- **Who is "next" after a pass-on.** The next waiting patient behind the one passed over, in line order, who has not declined that slot.
- **Past dates.** A slot date and time in the past is accepted.
- **Time zone.** Dates show in the viewer's time zone, and a staff-entered slot time is read in the staff member's time zone. The clinic's own time zone is not modelled.
- **Compliance.** The data-protection framework is still undecided. Baseline controls are in place (sign-in, patients see only their own record, an audit trail, no names in logs), but nothing has been checked against a specific framework.
- **Booked screen.** The "You're booked" confirmation shows once, right after accepting. A later visit shows the patient as not on the waitlist.

## Known limits

- One specialist, one clinic.
- In-app only: no email or SMS, no timer, no automatic pass-on.
- The audit trail is stored but there is no screen or endpoint to read it.
- SQLite suits the MVP, not horizontal scaling. The repository layer is where a production database would plug in.
- Rescheduling and cancelling a booking are out of scope. The booked screen says to contact the office.

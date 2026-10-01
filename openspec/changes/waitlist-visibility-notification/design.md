# Design

## Context

Greenfield: the repo has no application code. Stack is TypeScript, Node (API) and React (UI). Scope is one specialist in one clinic (PS-001 v0.4). Patient registration records exist outside this feature, so the MVP uses a seeded patient, specialist and staff store. Cancellations happen outside this feature; staff release a free slot. See proposal.md for scope and the decisions the plan made where the PS is silent.

## Goals / Non-Goals

**Goals:**
- Small, testable API with clear module boundaries: entries, offers, audit.
- Position derived from current data, never stored, so it cannot go stale.
- Entry status and offer state always consistent, including under concurrent actions.

**Non-Goals:**
- Timer or automatic cascade, self-service slot browsing, staff-confirmed booking.
- Email/SMS or any out-of-app channel, a notification centre.
- Real identity provider, real calendar/booking integration, multi-specialist support.
- Choosing a compliance framework (still open).

## Decisions

**Monorepo with `apps/api`, `apps/web` and `packages/shared` types.** Keeps API contracts typed on both sides. Alternative: separate repos; rejected as overhead.

**API: Express + Zod validation, Vitest + Supertest.** Minimal and familiar. Alternative: NestJS; heavier than the scope needs. Web: React + Vite + React Query.

**Persistence: SQLite behind a repository layer (Drizzle or Knex).** Real transactions and unique indexes with no ops; a production database can replace it later.

**Single specialist.** One seeded specialist; routes are not parameterised by specialist (`/waitlist`, `/offers`). The staff role is tied to that specialist. Adding specialists later means adding a `specialist_id` column and a path parameter. Alternative: model specialists now; rejected as not required by the PS.

**Tables:** `patients`, `staff`, `specialist`, `waitlist_entries(id, patient_id, status waiting|notified|booked|removed, joined_at, closed_at, created_by_type, created_by_id)`, `slots(id, starts_at, status open|offered|booked)`, `slot_offers(id, slot_id, entry_id, status outstanding|accepted|declined|passed_on|closed, created_at, resolved_at, released_by)`, `audit_log(id, action, entry_id, slot_id, actor_type patient|staff, actor_id, at)`.

**One active entry per patient via a partial unique index** on `(patient_id) WHERE status IN ('waiting','notified')`. A duplicate join is not an error: the service catches the conflict and returns the existing entry and position (200), for self-join and staff add. Rejoin after closing inserts a new row with a new `joined_at`.

**One outstanding offer via a partial unique index** on `slot_offers(status) WHERE status='outstanding'` (one row at most, single specialist). A concurrent release fails the insert and the service returns a conflict. Every transition (release, accept, decline, pass-on, removal of the holder) runs in one transaction that updates the entry status, the offer and the slot together and writes the audit record, so they cannot disagree. Accept and pass-on race on the same offer row: the update is conditional on `status='outstanding'`, and the loser is rejected.

**Position computed on read:** rank among entries with status `waiting` or `notified` by `(joined_at, id)`. Ties break by id. Alternative: stored position column; rejected because every close would need renumbering and could go stale (BR-008).

**Slot identity and returned slots.** On first release staff enter a date and time, which creates an `open` slot. Decline, pass-on without a next patient, and removal of the holder close the offer and leave the slot `open`, so staff release it again with the same date and time. A decline is recorded as an offer row with the decliner's entry, and release selects the lowest-position `waiting` entry that has no `declined` offer for that slot. If none qualifies, no release action is offered and the slot stays open. Pass-on selects the next eligible `waiting` entry behind the holder in position order.

**Banner derived from the outstanding offer.** `GET /me/waitlist` returns the entry, position, join date and, if present, the outstanding offer with slot date and time. The UI shows the banner from that. There is no notification table, no channel abstraction and no mark-as-read, because the PS provides no notification centre. Persisting the offer before responding to release is what makes the offer visible whenever the patient next opens the app. If a channel is added later, it can be built on offer creation.

**Accept confirmation is a UI step.** The API has `accept` and `decline` on the outstanding offer. The confirm-or-go-back step is in the UI and makes no API call until the patient confirms, so going back changes nothing.

**Auth: signed token (JWT) with roles `patient` and `staff`, seeded users.** Middleware scopes patients to their own entry and requires the staff role for staff routes. A real identity provider can replace this without changing handlers.

**Audit log written in the same transaction as each action**, recording actor type and id plus timestamp. Logs and errors must not include patient names or other personal data; this is the baseline while the compliance framework is open.

**Demo login and patient lookup (added during apply).** The design says "seeded users" but no task created a way to sign in, and staff "add patient" needs a list to pick from. `POST /demo/login` and `GET /demo/users` sign in as any seeded patient or staff member with no password and exist only when `DEMO_LOGIN=true`; a real identity provider replaces that router and nothing else. `GET /patients` (staff only) lists registered patients with an `onWaitlist` flag. `apps/api/src/server.ts` starts the API; without `DEMO_LOGIN=true` it requires `JWT_SECRET`. API response types live in `@waitlist/shared`, so the API and web share one contract.

**React UI:** `docs/waitlist-prototype_V2.html` is the visual reference for layout and styling (cards, position badge, meta row, stepper, notification banner, slot card, confirmation modal, staff table, buttons, colours and type).
- Patient views: join, position as "#N" with the join date and the "Your place in line" label, leave, the offer banner with slot card, Accept (opens the confirmation modal) and Decline, and the booked confirmation.
- Staff views: waitlist table (position, patient, status, join date), add patient, remove entry, slot release (date and time input), and pass-on of the outstanding offer with the holder shown.
- Leave, staff add and staff remove are not in V2. They are built in V2's style, pending UX wireframes, which are not a dependency.
- Where V2 differs from the PS, the PS wins: decline does not cascade to the next patient (staff release again), and booked entries are not shown in the staff table. V2's "Reset demo" and its fixed slot time are prototype-only and are not built.
- The booked confirmation keeps V2's "contact the office" text for changes, as the PS defers out-of-app channels and rescheduling.

## Risks / Trade-offs

- Choices the PS is silent on (slot entered by staff, returned-slot behaviour, all-declined case, next eligible patient) → recorded in the proposal; the PO must confirm, and they are isolated in the release and pass-on selection.
- Compliance framework unknown → baseline controls (authn/authz, audit, no personal data in logs); revisit when decided.
- A patient not viewing the app may miss the banner, and staff must notice an unanswered offer since there is no timer → accepted by the PS (Risks section); the staff view shows the outstanding offer and its holder, and the offer stays answerable.
- Simulated auth and seeded records are not production-ready → kept behind narrow interfaces and called out in the README.
- SQLite limits horizontal scaling → acceptable for the MVP; the repository layer allows migration.
- No cancellation integration → staff enter free slots manually, as the PS assumes.

## Open Questions

- How staff learn of a free slot is outside this feature; the plan assumes they enter its date and time on release.

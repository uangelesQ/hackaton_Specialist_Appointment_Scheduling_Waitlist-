# Design

## Context

Greenfield: the repo has no application code. Stack is TypeScript, Node (API) and React (UI). Patient registration records exist outside this feature, so the MVP uses a seeded patient/specialist/staff store. The booking system that cancels appointments is also external; the MVP exposes an endpoint that simulates a cancellation. See proposal.md for scope and the resolved open decisions.

## Goals / Non-Goals

**Goals:**
- Small, testable API with clear module boundaries: entries, positions, notifications, audit.
- Position always derived from current data, never stored, so it cannot go stale.
- Notification fan-out that is idempotent and isolates per-patient failures.

**Non-Goals:**
- Slot claim/booking, response windows, cascading offers.
- Email/SMS delivery, real identity provider, real booking integration.
- Choosing a compliance framework (still open).

## Decisions

**Monorepo with `apps/api` and `apps/web`, shared types package.** Keeps API contracts typed on both sides. Alternative: separate repos; rejected as overhead for an MVP.

**API: Express + Zod validation, Vitest + Supertest for tests.** Familiar, minimal. Alternative: NestJS; rejected as heavier than the scope needs. Web: React + Vite + React Query for server state.

**Persistence: SQLite via a repository layer (Drizzle or Knex).** Zero-ops for the MVP, real transactions and unique indexes, and the repository interface lets a production database replace it. Alternative: in-memory store; rejected because uniqueness and audit need durable, transactional behaviour.

**Tables:** `patients`, `specialists`, `staff`, `waitlist_entries(id, patient_id, specialist_id, status active|removed, joined_at, removed_at, created_by, removed_by)`, `notifications(id, patient_id, specialist_id, slot_event_id, slot_time, status unread|read, delivery_state, created_at)`, `slot_events(id, specialist_id, slot_time, processed_at)`, `audit_log(id, action, entry_id, actor_type patient|staff, actor_id, at)`.

**One active entry per patient per specialist via a partial unique index** on `(patient_id, specialist_id) WHERE status='active'`. The database enforces the rule under concurrent requests; the service maps the violation to a 409. Rejoin after removal inserts a new row with a new `joined_at`, preserving history.

**Position computed on read:** `COUNT(active entries for specialist with (joined_at, id) <= this entry's)`. Ties on `joined_at` break by `id`. Alternative: stored position column; rejected because every removal would need renumbering and could go stale.

**Auth: simple signed-token (JWT) with roles `patient` and `staff`, seeded users.** Authorization is middleware-enforced: patients are scoped to their own patient id; staff routes require the `staff` role. A real identity provider replaces this later without changing handlers.

**Cancellation → event → notifications, in one transaction per patient.** `POST /appointments/:id/cancel` (simulated booking hook) records a `slot_event` only if the appointment time is in the future. Fan-out inserts one notification per active entry, with a unique constraint on `(patient_id, slot_event_id)` making reprocessing idempotent. Each patient's insert is independent, so one failure is logged to `delivery_state=failed` and does not stop the others. Alternative: a message queue; rejected as unnecessary for MVP volumes (a few slots per day per specialist).

**Channel interface `NotificationChannel.send(notification)` with an `InAppChannel` implementation** that persists the notification for the portal to fetch. Email/SMS can be added later by implementing the interface.

**Audit log written in the same transaction as entry create/remove**, recording actor type and id plus timestamp. Logs and errors must not include patient names or other PII, as a baseline until the compliance framework is chosen.

**Demo slot trigger:** `POST /specialists/:id/slot-events/demo`, staff role only, registered only when `DEMO_MODE=true`. It calls the same service function as the cancellation hook, so there is one slot-event path. Alternative: a manual-slot feature for staff; rejected because PS-001 allows advance cancellation as the only slot source.

**React UI:** `docs/waitlist-prototype_V2.html` is the visual reference for layout and styling (cards, position badge, meta row, notification banner, staff table, buttons, colours and type). Patient views: join, position shown as "#N" with the joined date, leave, notifications list with mark-read. Staff views: specialist waitlist (position, patient, joined date), add patient, remove entry, and the demo-only "Mark next slot open" control. The prototype has no leave, add or remove controls, no specialist selector and no login screen; these are built in the same style and are pending UX wireframes, which are not a dependency.

**Not built from the prototype:** Accept/Decline with the "Book this appointment?" modal, the Booked status and confirmation screen, "No response, offer to next patient", one-at-a-time notification, and per-patient status pills beyond entry state. These belong to the deferred claim flow and need an updated PS-001 before they are planned.

## Open Questions

- Which slot time does the demo control use? The prototype hard-codes "Thursday, Oct 2 · 10:30 AM"; this design assumes a configured demo slot time until the Product Owner says otherwise.

## Risks / Trade-offs

- Open decisions confirmed by assumption only (FIFO, in-app, one per specialist) → documented in the proposal; the PO must confirm, and the isolated ordering query and channel interface limit the cost of change.
- Compliance framework unknown → baseline controls (authn/authz, audit, no PII in logs); revisit when decided.
- Simulated auth and booking hook are not production-ready → kept behind narrow interfaces and called out in the README.
- SQLite limits horizontal scaling → acceptable for the MVP; repository layer allows migration.
- Notifications only appear when the patient opens the portal (no push) → matches the in-app-only decision; polling on an interval keeps it reasonably fresh.

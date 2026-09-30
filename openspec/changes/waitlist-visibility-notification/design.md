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

**React UI:** patient views (join, my positions, notifications list with mark-read) and staff views (specialist waitlist, add patient, remove entry). The prototype in `docs/waitlist-prototype.html` is the visual reference; UX wireframes are not yet available and are not a dependency.

## Risks / Trade-offs

- Open decisions confirmed by assumption only (FIFO, in-app, one per specialist) → documented in the proposal; the PO must confirm, and the isolated ordering query and channel interface limit the cost of change.
- Compliance framework unknown → baseline controls (authn/authz, audit, no PII in logs); revisit when decided.
- Simulated auth and booking hook are not production-ready → kept behind narrow interfaces and called out in the README.
- SQLite limits horizontal scaling → acceptable for the MVP; repository layer allows migration.
- Notifications only appear when the patient opens the portal (no push) → matches the in-app-only decision; polling on an interval keeps it reasonably fresh.

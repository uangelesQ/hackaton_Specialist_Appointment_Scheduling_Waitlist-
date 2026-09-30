# Technical spec iterations

History of the technical specs created with OpenSpec: the change `openspec/changes/waitlist-visibility-notification/` (proposal, specs, design, tasks). Each iteration matches a git commit, so it can be compared with `git show <commit>`.

| Iteration | Commit | Driven by | Specs in the change |
|---|---|---|---|
| TS V1 | `d54bc43` Technical Specs | PS-001 v0.2 (`...V2.md`) | `waitlist-membership`, `waitlist-visibility`, `slot-availability-notification` |
| TS V2 | `4ebe34c` Update technical specs | Prototype V2 (`waitlist-prototype_V2.html`) | same three |
| TS V3 | `0c35156` Updated technical specs V3 | PS-001 v0.4 (`...V3.md`) | `waitlist-membership`, `waitlist-visibility`, `slot-offers` |

The product spec file names (`V1`/`V2`/`V3`) do not match their internal versions: file V2 is v0.2 and file V3 is v0.4.

---

## TS V1 (from PS v0.2)

**Scope:** visibility plus notification only. Slot claim and booking were deferred in the PS.

**Decisions taken in the plan** (the PS had four open decisions; these were answered by the user):

| Open decision | Plan decision |
|---|---|
| Ordering | FIFO by join time |
| Notification channel | In-app only, behind a channel interface |
| Multiple entries (BR-004) | One active entry per patient per specialist; a duplicate join is rejected |
| Compliance framework | Left open; baseline controls only |
| Tech stack | TypeScript, Node API, React |

**Specs**
- `waitlist-membership`: join, one active entry per patient per specialist, staff add, patient and staff removal, audit attribution, authorised actors only.
- `waitlist-visibility`: FIFO position, patient views own position, staff views a specialist's waitlist, access control.
- `slot-availability-notification`: slot event raised only on advance cancellation, every active entry notified, notification leaves the entry active (BR-003), reliable and idempotent delivery, pluggable channel with in-app as the only one.

**Design:** monorepo (`apps/api`, `apps/web`, `packages/shared`), Express + Zod, SQLite behind a repository layer, position computed on read, partial unique index for one active entry, JWT with patient and staff roles, tables `notifications` and `slot_events`, notification fan-out with per-patient failure isolation and a `NotificationChannel` interface.

**Tasks:** seven groups. The slot source was a simulated cancellation endpoint. The UI referenced `waitlist-prototype.html`.

## TS V2 (prototype V2 review)

`waitlist-prototype_V2.html` was read against the v0.2 spec. Where it conflicted with the spec, the claim-related behaviour was held back, because claim and booking were not defined in the PS.

| Prototype V2 behaviour | Outcome in TS V2 |
|---|---|
| Notifies one patient at a time, then cascades on "No response" | Not adopted (contradicted US-003 and BR-001) |
| Accept/Decline, confirm modal, Booked status, per-patient status pills | Not adopted (claim/booking deferred; BR-003) |
| Staff "Mark next slot open" button | Adopted as a demo-only control that calls the same cancellation hook |
| Position without a total | Adopted: "#N" only |
| No leave, staff add or staff remove; no specialist selector or login | Built in the prototype's style, pending UX wireframes |

**Changes against TS V1**
- `proposal.md`: prototype V2 named as the UI reference; demo trigger and held claim flow recorded.
- `waitlist-visibility`: position as "#N" with the join date; new scenario that positions update without manual renumbering.
- `slot-availability-notification`: new requirement for the demo-only staff control, available only with `DEMO_MODE`, staff only.
- `design.md`: demo endpoint `POST /specialists/:id/slot-events/demo`; UI description based on V2; list of prototype behaviours not built; open question about the demo slot time.
- `tasks.md`: task 5.6 (demo endpoint); the UI group split into 6.1 to 6.6; README task mentions `DEMO_MODE`.

## TS V3 (from PS v0.4)

PS v0.4 brought accept/decline into scope, made staff release the only slot trigger, and resolved the held items. TS V2's slot trigger, notification model and lifecycle no longer matched, so most artifacts were rewritten.

**What changed against TS V2**

| Area | TS V2 | TS V3 |
|---|---|---|
| Slot trigger | Simulated cancellation hook plus demo staff button | Staff release a slot with a date and time they enter (cancellations are outside the feature) |
| Who is notified | Every active entry | Only the lowest-position eligible `waiting` patient |
| Notification | Persisted notifications, mark-as-read list, channel interface | In-app banner derived from the outstanding offer; no notification table or channel |
| Entry lifecycle | Active or removed | `waiting`, `notified`, `booked`, `removed` |
| Duplicate join | Rejected | Existing entry and position returned, no duplicate created |
| Accept/decline | Not built | Accept with confirm or go back, decline keeps position, decliner skipped for that slot |
| Staff actions | View, add, remove, demo release | View, add, remove, release, pass on an unanswered offer |
| Removal | Entry inactive | Others move up; removing the offer holder closes the offer and returns the slot |
| Specialist scope | Specialist in routes | Single specialist; no specialist parameter |
| Concurrency | Idempotent notification on retry | One outstanding offer by unique index; atomic transitions; accept racing pass-on has one winner |

**Artifacts**

| Artifact | Change |
|---|---|
| `proposal.md` | Rewritten; `slot-availability-notification` replaced by `slot-offers`; cancellation hook and demo control removed |
| `specs/waitlist-membership` | Status model; duplicate handling; removal effects and closed-entry removal |
| `specs/waitlist-visibility` | FIFO by join date; "#N" without total; staff status column, closed entries excluded, outstanding offer holder shown |
| `specs/slot-offers` (new) | Release, one outstanding offer, banner, accept with confirm, decline, pass on, returned slots, removal of holder, reliability and audit |
| `specs/slot-availability-notification` | Deleted |
| `design.md` | `slot_offers` and `slots` tables, unique index on the outstanding offer, slot identity and returned-slot rules, UI from V2 with the PS taking precedence |
| `tasks.md` | Seven groups; offer tasks 5.1 to 5.7; UI tasks for modal, banner, release and pass-on |

**Assumptions made where PS v0.4 is silent** (pending Product Owner confirmation, also listed in `proposal.md`):
1. Staff enter the slot date and time on release; a returned slot keeps them.
2. If every waiting patient has declined the current slot, no release action is offered and the slot stays open.
3. After a pass-on, "the next patient" is the next eligible waiting patient behind the holder who has not declined that slot.
4. No notification table, mark-as-read list or channel interface.

---

## Still open

- Compliance framework for waitlist data (baseline controls only).
- Whether slot availability extends to same-day no-shows (PS open decision).
- The four TS V3 assumptions above.
- UX wireframes: leave, staff add and staff remove are built in V2's style meanwhile.
- No iteration has been implemented yet; `tasks.md` is entirely unchecked.

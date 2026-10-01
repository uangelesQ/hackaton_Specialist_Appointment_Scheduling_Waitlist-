# Demo script — Cardiology waitlist prototype

**File:** `waitlist-prototype.html`

This is written to be talked over live, not read aloud. Each beat has a line to say, a click to make, and the payoff to point at. Total run time: about 3 minutes.

---

## The cast

| Name | Contact preference | Role in the story |
|---|---|---|
| **Carlos Mendoza** | Telephone | Already waiting at #1 — shows the "staff must call" path |
| **Maria Gómez** | In-app | The patient we follow start to finish — labeled "(you)" in the staff table |
| **Ana Torres** | Not recorded | Already waiting — shows what happens when preference is unknown |
| **Jorge Ramírez** | — | Added live during the demo, to show staff adding a caller |
| **Sofía Reyes** | — | Also "calls in" live — but she isn't actually registered |

---

## Act 1 — Registry: how people get on the list

**Say:** "Today, every one of these people reaches the hospital by phone, and every one of them gets written into a notebook or a spreadsheet. Here's the same moment, digitally."

1. Open on **Patient view**. Point out the login screen — *"this patient already exists in hospital records, she's just signing in."* Click **Continue as Maria Gómez**.
2. She's not on the waitlist yet. Click **Join waitlist**.
3. Switch to **Staff view**. *"Same record, both sides — Maria's entry just appeared here instantly, no phone call, no notebook."*

**Say:** "But not everyone can self-join — a lot of this hospital's patients don't have a smartphone or reliable data. That's not an edge case here, it's the primary case."

4. Point at the **"Add a patient"** panel. *"This stands in for a patient lookup the hospital already has — we're not rebuilding that, just reading from it."*
5. Select **Jorge Ramírez — calling in** → **Add to waitlist**. He appears, already tagged **Telephone**.
6. Select **Sofía Reyes — calling in** → **Add to waitlist**. *"And here's the guardrail —"* she's rejected, because she isn't actually in hospital records yet. *"Staff can't accidentally create a phantom patient — this has to fail safely."*

---

## Act 2 — Slot release: two different ways an offer gets resolved

**Say:** "A slot just opened — someone cancelled. Staff release it, and it goes to whoever's actually next, not whoever we pick."

7. Click **Release next slot**. Carlos is notified — flagged **"requires a call."** *"No banner anywhere — he doesn't have the app, so the system doesn't pretend to notify him."*

**Say:** "Staff calls him. Say he says no."

8. Click **They declined**. Carlos returns to waiting — *"notice the offer just closes. It does not automatically jump to the next person — a staff member has to make that call, literally and figuratively."*
9. Click **Release next slot** again. Ana is notified — **"not recorded,"** same call-required flag.

**Say:** "This time, say staff just can't reach her after a couple of tries."

10. Click **Couldn't reach them — pass to next**. *"Watch — this one moves straight to the next person, one click. That's deliberate: a confirmed 'no' and an 'unreachable' are different business outcomes, so they behave differently."*

---

## Act 3 — Acceptance: the moment that matters

Maria is now notified.

11. Switch to **Patient view**. *"She gets the banner, same as any app. This is the only moment in the whole flow where a patient acts for themselves."*
12. Click **Accept**, then **Confirm** in the modal. *"That two-step is deliberate too — nobody books an appointment with one accidental tap."*
13. Switch to **Staff view**. Maria shows **Booked**. Carlos and Ana are back at the top, **repositioned automatically** — nobody renumbered this list by hand.

**Say:** "Same record, the whole way through. A phone call for Carlos, a phone call for Ana, a tap for Maria — and staff never touched a notebook once."

---

## If you want to go off-script

- Click **Decline** on Maria's offer instead of Accept — she stays on the list, and staff will need to release the slot again.
- **Reset demo** (top right) restarts everything cleanly for another run.

## What this deliberately doesn't do

- No patient-facing position number — deferred to a future spec, not an oversight.
- No real push/SMS/email — in-app banner only, by design.
- Only Maria has an interactive patient view. Carlos, Ana and Jorge are staff-side only — representing patients without the app is the point, not a shortcut.
- Rescheduling a booked appointment isn't built — the confirmation screen just says "contact the office," same as the real product would for now.

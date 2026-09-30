# How to use the waitlist prototype

**File:** `waitlist-prototype.html`

It's one page. The "Patient view" / "Staff view" tabs at the top switch between the two perspectives — both are reading the same underlying data, so actions in one show up in the other.

---

## The cast

| Name | Role in the demo |
|---|---|
| **Maria Gomez** | The patient perspective you can interact with — labeled "(you)" in the staff table |
| Carlos Mendoza | Already on the waitlist at #1 when the page loads |
| Ana Torres, Luis Fernández | Already waiting further down the list, for realism — not part of the scripted path |

Only Maria's side is clickable as a patient. The other three are staff-only entries — that's a deliberate scope choice for demo reliability, not a limitation of the data model.

---

## Guided walkthrough (~1 minute)

1. **Start on Patient view.** You'll see "You're not on the waitlist yet." Click **Join waitlist**.
   → Maria now shows "Position 2 of 4" (Carlos is already #1).

2. **Switch to Staff view.** You'll see all four patients listed, in order, with live status.
   → Click **Mark next slot open**.
   → Carlos moves to "Notified" status. The control area now says "Waiting on Carlos Mendoza's response."

3. **Click "No response — offer to next patient."**
   → Carlos returns to "Waiting" (he keeps his spot — a notification alone doesn't remove him from the list). Maria becomes "Notified."

4. **Switch to Patient view.**
   → You'll see the notification banner and a slot card with **Accept** / **Decline**.
   → Click **Accept**.
   → Maria's screen confirms the appointment, with a stepper showing Joined → Waiting → Notified → Booked, all complete.

5. **Switch back to Staff view.**
   → Maria now shows "Booked." Carlos is back at #1, and Ana/Luis have each moved up one position automatically.

That last step is the one worth pausing on when you show this to anyone: nobody re-numbered the list by hand. That's the shared-data-model requirement from the PRD, made visible.

---

## Things worth exploring beyond the script

- Click **Decline** instead of Accept at step 4 — Maria stays on the list, and staff will need to offer the slot to the next patient.
- Click **Reset demo** (top right) any time to start over — useful for repeated run-throughs.

---

## What this deliberately doesn't do (so nobody's surprised in review)

- Only Maria is interactive as a patient — Carlos/Ana/Luis exist only in the staff table.
- No backend, no persistence — refreshing the page resets everything (use Reset demo instead of refreshing mid-demo).
- No email/SMS — notification is in-app only (bell + banner), matching the resolved decision in PS-001.
- Rescheduling an already-booked appointment isn't built — the confirmation screen just says "contact the office," same as it would in the real product.

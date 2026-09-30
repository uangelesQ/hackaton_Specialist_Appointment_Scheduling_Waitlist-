# PRD: Specialist Appointment Scheduling & Waitlist

**Author:** Fernanda Hernandez (ELS-MEX) — compiled by Uriel
**Date:** September 29, 2026
**Status:** Draft for hackathon prototype

---

## 1. Problem Statement

High-demand specialty appointments are still managed by phone and manual waitlists spanning weeks. Patients have no visibility into their position on the waitlist, and scheduling staff spend significant time on coordination calls.

The waitlist currently runs up to two weeks out because specialist capacity is limited relative to demand: each specialist can see roughly 3 patients per day, working 3 days a week. There is no system patients or staff can check for live open slots — staff must call each patient individually to notify them of an opening, which is slow and error-prone (double bookings, missed notifications, patients lost from the list).

## 2. Goals

- Give patients real-time visibility into their waitlist position, without calling the office.
- Notify patients automatically when a slot opens.
- Give staff a single admin view to manage the waitlist and slots, replacing manual phone-call coordination.
- Reduce staff time spent on coordination calls and reduce booking errors (double-booking, lost patients).

## 3. Non-Goals (for this prototype)

- Full EHR / billing integration.
- Multi-clinic or multi-region scheduling logic.
- Payment processing.
- Production-grade authentication (a lightweight/mock login is sufficient for the demo).

## 4. Users

| User | Description | Key need |
|---|---|---|
| **Patient** | Person waiting for a specialist appointment | See waitlist position; get notified when a slot opens; book without calling |
| **Staff** | Scheduling/admin staff managing the specialist's calendar | See and manage the waitlist; open/assign slots; avoid manual phone calls |

## 5. Current State (Observed, Not Assumed)

- Waitlist tracking today is informal: staff receive phone calls and administer the waitlist manually (no shared system of record).
- Specialist capacity: ~3 slots/day, 3 days/week.
- Waitlist length: routinely 2+ weeks in the first instance.
- Staff must call patients individually to notify them of any opening — no batch or automated notification exists today.

## 6. Cost of Inaction

- **User frustration:** patients don't know where they stand, leading to lost trust and potential churn to other providers.
- **Operational risk:** double bookings and booking errors from manual coordination.
- **Reputational risk:** bad reviews tied to poor communication/visibility.
- **Staff time:** significant hours per week spent on individual phone outreach that a system could automate.

*(Quantified cost of inaction — e.g. $/hour or # patients lost per month — is open / TBD; flag as a follow-up data point to validate with the specialist office.)*

## 7. Proposed Solution (Prototype Scope)

A two-sided web prototype:

### 7.1 Patient View
- Patient logs in (mock auth is fine) and sees:
  - Their current position in the waitlist for a given specialist.
  - Estimated wait / next likely opening (based on slot cadence).
  - Notification (in-app and/or simulated email/SMS) when a slot opens for them.
  - Ability to accept or decline an offered slot directly in the app.

### 7.2 Staff Admin View
- Staff logs in and sees:
  - The full waitlist for a specialist, in order, with contact info and time added.
  - Available/open slots (based on the 3-slots/day, 3-days/week cadence).
  - A way to assign an open slot to the next eligible patient (manually override order if needed, e.g. urgency).
  - Status tracking per patient: waiting, notified, booked, expired/no-response.
  - This view replaces the manual phone-call workflow — no calls needed to notify or confirm.

### 7.3 Shared / System Logic
- A shared waitlist data model (single source of truth) that both views read from and write to, so patient and staff views stay in sync in real time (or near real time for the prototype).
- Automated notification trigger when a slot opens (simulated for the prototype — e.g., in-app banner or a mock email log — rather than a real SMS/email integration).

## 8. Acceptance Criteria

- A patient can see their waitlist position and receive an update when a slot opens — without calling the office.
- A staff member can view the full waitlist and open slots, and assign/notify a patient without making a phone call.
- Waitlist position updates are reflected consistently between the patient and staff views.

## 9. Frequency / Magnitude (Context for Design)

- Specialist availability: 3 slots/day, 3 days/week (9 slots/week).
- Waitlist churn/notifications: expected to happen at least daily, as slots free up or new patients join.
- Design should assume the waitlist is checked/updated at least twice a day by staff.

## 10. Risks & Unknowns

- **Staff adoption:** time investment for staff to learn a new process/tool; learning-curve training needed.
- **User error:** risk of staff missing information in the new tool during the transition from phone-based tracking.
- **Cost of inaction is not yet quantified** — needs a follow-up data point (support tickets, no-show rates, or lost-patient counts) with an owner and date to validate real impact.
- **Evidence base:** current pain points are based on stakeholder input (Fernanda Hernandez, ELS-MEX); no formal support-ticket or analytics data has been reviewed yet. Recommend validating with real operational data before/after the hackathon if this moves beyond prototype.
- **Edge cases not yet defined:** cancellations, patients who no-show after being notified, priority/urgency overrides, and multi-specialist waitlists are open questions.

## 11. Success Metrics (Prototype Demo)

For the hackathon demo, success looks like:
- A working click-through (or lightly functional) flow showing a patient seeing their position and getting notified.
- A working staff view showing the waitlist and the ability to assign an open slot without a phone call.
- A clear before/after narrative: manual phone coordination → self-service visibility + one-click staff assignment.

## 12. Open Questions

- What is the real cost of inaction in $ or hours/week? (owner: TBD)
- Should patients be able to self-select an open slot, or only accept/decline what staff offers?
- How should urgent/priority cases jump the queue?
- What's the real notification channel post-prototype (SMS, email, patient portal push)?

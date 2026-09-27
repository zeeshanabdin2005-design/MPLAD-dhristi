# MPLADS-DRISHTI Contractor Portal

## What was added
- Dedicated `/contractor-login` authentication page.
- Contractor registration stores `role: CONTRACTOR`, company name, contact and location in `users/{uid}`.
- Contractor-only `/contractor` workspace.
- Project access request workflow: contractor requests -> officer approves/rejects in **Contractor Network**.
- Weekly progress submission per project and week.
- Physical progress (0-100%), weekly expenditure, work completed, blockers, next-week plan and notes.
- Optional weekly site photo stored in the private Supabase `mplads-evidence` bucket under `projects/{projectId}/contractor-updates/...`.
- One submission per project/week using a stable Firestore document ID.
- Contractor cannot decrease the reported progress below the latest recorded contractor update in the UI.
- Officer-only **Contractor Updates** review page.
- Contractor weekly submissions are displayed in Project Detail as a separate evidence stream and do not overwrite the authoritative project record automatically.
- Audit event `CONTRACTOR_WEEKLY_UPDATE_SUBMITTED` is recorded.
- Supabase upload preparation validates that a contractor has an ACTIVE assignment before issuing a signed upload URL.

## Firebase setup
Deploy the updated `firestore.rules` to the same Firestore database used by the application.

Existing user profiles created before this feature may not have a `role` field. The rules retain backward compatibility for those profiles as officer accounts. New officer registrations explicitly write `role: OFFICER`; new contractor registrations write `role: CONTRACTOR`.

## Demo flow
1. Open **Contractor Login**.
2. Register a contractor account and verify the email.
3. Open the contractor workspace.
4. Select a project under **Request Project Access**.
5. Log in as an officer and open **Contractor Network**.
6. Approve the pending request.
7. Return to the contractor account and submit the weekly progress update.
8. Officer can review it from **Contractor Updates** or the individual Project Detail page.

## Data governance
Contractor submissions are explicitly treated as reported field evidence. They are not automatically promoted to the authoritative MPLADS project dataset and should be reviewed by the responsible officer before being used for official project-status decisions.

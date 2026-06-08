# SlugFound — Known Bugs

A running list of confirmed bugs that are not yet fixed. Add new entries at the top. When a bug is fixed, move it to the "Resolved" section at the bottom with the commit/PR that closed it.

Status key: 🔴 Open · 🟡 In progress · ✅ Resolved

---

## Open bugs

### BUG-001 — Photo is dropped when a posting is submitted before a location is set

**Status:** 🔴 Open
**Area:** Create posting / image upload
**Severity:** High — users lose their uploaded photo without any error.

**Steps to reproduce**

1. Start a new posting.
2. Upload a photo.
3. Submit the form *without* setting a location.
4. The form blocks submission and prompts for a location.
5. Set the location, then submit the posting again.

**Expected:** The posting publishes with the photo uploaded in step 2.

**Actual:** The posting publishes successfully but with no photo attached. The image uploaded before the failed first submit is lost.

**Notes / suspected cause:** The uploaded photo appears to be tied to the first (rejected) submission attempt and is not carried over when the form is re-submitted after the location is added. Likely the image reference/state is cleared or not re-attached on the second submit. Needs investigation in the create-posting flow and the form's image-state handling.

---

### BUG-002 — Messaging does not update in real time on Vercel deployment

**Status:** 🔴 Open
**Area:** Messaging / real-time
**Severity:** High — messages don't appear live for deployed users.

**Description:** Messaging has real-time issues when running on the Vercel-deployed connection. The database does not update over the deployed connection, so new messages don't sync live the way they do locally. Still needs to be fixed.

**Expected:** New messages appear in real time on the deployed (Vercel) environment, matching local behavior.

**Actual:** On the deployed connection the database isn't updating, so messages don't sync in real time.

**Notes:** Works as expected locally; the failure is specific to the Vercel deployment. Investigate the real-time subscription/connection (e.g. Supabase realtime channel behavior) under Vercel's serverless environment.

---

## Resolved

_None yet._

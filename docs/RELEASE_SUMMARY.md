# Release Summary

**Product:** SlugFound — a lost-and-found platform for UC Santa Cruz students
**Team:** Team SlugFound · CMPS 115 – Software Methodology
**Members:** Bardia Nasab (Scrum Master), Colin Posat (Developer, UI/UX Lead), Sam Madinya (Developer), Aidan Nguyen (Developer)
**Release:** 1.0 (first release)
**Date:** June 2, 2026

---

## 1. Overview

SlugFound lets UC Santa Cruz students post lost items, browse found ones, pin item
locations on a campus map, search by photo, and message each other directly — all in
one place. It is built with Next.js 16, React 19, Tailwind CSS v4, and Supabase
(Auth, Postgres, Storage). This document summarizes the shipped functionality, the
acceptance criteria an evaluator can test against, the known problems in this release,
and the prioritized backlog for a follow-on project.

> **Note for reviewers:** there will be no penalty for system failures during the
> project review that are due to the known problems listed in Section 3. Several
> optional features (AI, email) require API keys and post-deploy webhook setup that
> are not active in a default local run.

---

## 2. Key user stories and acceptance criteria

The stories below are the core flows an acceptance tester should walk through to
validate the release. Each story is **Done** only when every item in the team's
[Definition of Done](./DOD.md) is also satisfied (live data, RLS ownership,
error handling, responsive UI, tests passing, merged to `main`).

### US 2.1 — Sign up with a UCSC email

*As a UCSC student, I want to create an account with my school email so that only
verified students can use the platform.*

Acceptance criteria:

- A visitor can register with name, email, password, and password confirmation.
- Only `@ucsc.edu` email addresses are accepted; non-UCSC emails are rejected both in
  the form (Zod) and at the database (CHECK constraint).
- Password must be at least 8 characters with one uppercase letter and one number; a
  strength meter reflects the rules as the user types.
- On success a profile row is created automatically and the user lands on `/lost`.

### US 2.2 — Sign in / sign out

*As a registered student, I want to log in and out so I can access and protect my
account.*

Acceptance criteria:

- Valid credentials sign the user in and redirect to `/lost`.
- Distinct, clear error messages are shown for invalid credentials vs. an
  unconfirmed email.
- Logout ends the session and redirects to `/login`.
- Unauthenticated users hitting a protected route (`/lost`, `/found`, `/messages`,
  `/create`, `/profile`) are redirected to `/login`.

### US 2.4 — Create a lost or found post

*As a student, I want to post an item I lost or found, with a photo and location, so
others can identify it.*

Acceptance criteria:

- The form captures type (lost/found), title, description, category, location, and an
  optional photo.
- Photos are validated (JPEG/PNG/WebP, ≤ 5 MB) before upload and stored under the
  uploader's own folder (`item-images/<user_id>/…`).
- Location is selected on an interactive campus map (14 UCSC presets plus
  click-to-drop a custom pin); the coordinates are saved with the post.
- Invalid input is rejected with a clear error and never reaches the database; a
  successful post appears in the matching listing.

### US 2.5 — Browse, search, and filter listings

*As a student, I want to browse and search lost/found items so I can find what I'm
looking for.*

Acceptance criteria:

- `/lost` and `/found` list items newest-first, with active items shown before
  claimed/resolved ones.
- Text search matches against title and description; category and location filters
  work and combine.
- Filters are reflected in the URL so a filtered view can be deep-linked and shared.
- A Map/List toggle (US 4.7) shows geotagged items as pins; flagged/reported items are
  hidden from listings.

### Messaging — Direct messages about an item (Sprint 3)

*As a student, I want to message the person who posted an item so we can arrange a
return.*

Acceptance criteria:

- A non-owner can start a conversation from an item; opening a chat with the same
  person about the same item reuses the existing conversation rather than creating a
  duplicate.
- Messages send and appear in real time for both participants without a manual
  refresh.
- Unread counts update live, and opening a conversation marks it read.
- Only the two participants can read or post to a conversation (enforced by RLS).

### US 4.1 — Canonical item detail page

*As a student, I want a dedicated page for each item so I can see full details and the
right actions.*

Acceptance criteria:

- Each item has a canonical page at `/items/[id]`; old `/lost/[id]` and `/found/[id]`
  links permanently redirect there.
- A missing or invalid item id renders a friendly not-found page, not a crash.
- Owners see Edit and status controls; non-owners see Message and a Report option.
- If the item has coordinates, a read-only map with a pin is shown.

### US 4.2 — Edit and delete your own item

*As the owner of a post, I want to edit or delete it so I can keep it accurate.*

Acceptance criteria:

- The edit page is owner-only; a non-owner reaching it directly gets a 403 message,
  never the form.
- Editing can replace the photo — the new image is uploaded and the old object is
  deleted from Storage.
- Deleting requires a confirmation and removes both the row and its stored image.
- `updated_at` is refreshed automatically on edit.

### US 4.3 — Claim / resolve status

*As an item owner, I want to mark an item as claimed or resolved so the board stays
current.*

Acceptance criteria:

- Status transitions follow the rules: active → claimed or resolved, claimed →
  resolved, resolved is terminal.
- Non-active items are visually muted and badged on cards and the detail page.
- Listings sort active items first and support an "Active only" toggle (default on).

### US 4.5 — Edit profile and avatar

*As a user, I want to edit my display name and profile photo so my identity is clear
to others.*

Acceptance criteria:

- Display name (≤ 40 chars) and avatar (≤ 2 MB, stored in the `avatars` bucket) can be
  updated inline; the old avatar object is removed on replacement.
- Changes persist and propagate to the sidebar, item cards, item detail, and message
  views, with an initials fallback when no avatar is set.

### US 4.6 — Report an inappropriate item

*As a student, I want to report a problematic post so the community stays safe.*

Acceptance criteria:

- Non-owners can report an item with a reason and optional notes.
- A second report of the same item by the same user is rejected with an "already
  reported" message (unique constraint).
- Once an item reaches 3+ reports it is auto-flagged, hidden from listings, and shows a
  warning banner on its detail page.

---

## 3. Known problems

This release ships with the issues below, drawn from the team's tracked
[Known gaps](./DOCS.md#13-known-gaps). They are grouped as major bugs, omissions
(missing functionality / unhandled edge cases), and design shortcuts.

### 3.1 Major bugs and configuration risks

- **Email confirmation is disabled** (Supabase Auth, dev setting). Must be re-enabled
  before a production launch — currently anyone can sign up without verifying the
  inbox. *(Critical)*
- **New-message email notifications are not wired by default.** The webhook
  (`0010_message_webhook.sql`) is a template; emails only send after it is applied with
  a public app URL and shared secret. The in-app messaging itself works regardless.
  *(High)*
- **`AuthContext` signup race.** Immediately after signup the profile can be `null` for
  ~100 ms until the database trigger commits, briefly showing incomplete profile state.
  *(High)*
- **Leaked-password protection disabled** (Supabase Auth). The HaveIBeenPwned check
  should be enabled before launch. *(Medium / security)*

### 3.2 Omissions (missing functionality and edge cases)

- **No password reset flow.** The login form's "Forgot password?" link points to `#`,
  so locked-out users cannot self-recover. *(High)*
- **"Change password" button does nothing** on the profile page — an affordance with no
  backing action. *(Medium)*
- **College preference is UI-only** and does not persist (the email-notification toggle
  does persist). *(Medium)*
- **Listings are not real-time.** New posts appear only on the next refresh, unlike
  messaging which is live. *(Medium)*
- **Public Storage buckets allow listing.** `item-images` and `avatars` SELECT policies
  are public; low risk given UUID names and public data, but flagged by the advisor as a
  WARN and could be scoped down. *(Medium / security)*

### 3.3 Design shortcuts

- **Landing-page stats are hardcoded.** Copy such as "48 items recovered" is static
  text, not a live count. *(Low)*
- **Create-form photo preview shows the file name but no thumbnail** (the edit form does
  render a thumbnail). *(Medium / UX)*
- **Create-form toast errors fire on every render** in React StrictMode — cosmetic
  noise; the profile and report forms use the cleaner transition pattern. *(Low)*
- **Dead code:** the `AppNav` component is not imported anywhere and should be deleted.
  *(Medium / cleanup)*

> No separate Test Report file exists for this release; the tracked Known gaps list
> above is the authoritative source of known defects. Automated tests live in
> `__tests__/` (Jest + React Testing Library, TDD); async Server Components are covered
> by E2E rather than unit tests.

---

## 4. Product backlog

Prioritized work for a follow-on project, highest value first.

### High priority

1. **Password reset flow** — implement the "Forgot password?" path end to end
   (Supabase reset email + reset page) so locked-out users can recover.
2. **Wire and verify email notifications in production** — deploy with a public URL,
   apply the message webhook, and confirm new-message emails and one-click unsubscribe.
3. **Re-enable email confirmation and leaked-password protection** before launch, and
   verify the full confirmed-signup flow.
4. **Functional "Change password"** — back the existing button with a real action.
5. **Persist college preference** — store and read the college field like the other
   profile settings.
6. **Real-time listings** — subscribe `/lost` and `/found` to `postgres_changes` so new
   posts appear without a manual refresh (US 2.5 stretch).

### Medium priority

7. **Harden Storage SELECT policies** — scope down public bucket listing per the
   advisor warning while keeping card/avatar images readable.
8. **Create-form photo thumbnail preview** — match the edit form's behavior.
9. **Fix the StrictMode toast double-fire** on the create form (adopt the transition
   pattern used elsewhere).
10. **Replace hardcoded landing-page stats** with live counts from the database.
11. **Delete dead code** (`AppNav`) and finish general refactor cleanup.

### Lower priority / enhancements

12. **Radius / proximity search** using the existing `items_coords_idx` (lat/lng) to
    find items near a location.
13. **Matching suggestions** — surface likely lost↔found matches via the stored image
    embeddings.
14. **Notification preferences expansion** — more granular per-event email/in-app
    controls beyond the single toggle.

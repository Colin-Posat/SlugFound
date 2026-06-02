# Definition of Done — SlugFound

A user story is **Done** only when every applicable item below is true. This is the
general checklist distilled from the per-story Definition of Done sections across our
sprint plans. Individual stories may add story-specific acceptance criteria, but none
may waive the universal items in this list.

Use it three ways: as acceptance criteria when planning a story, as a self-check before
opening a PR, and as a reviewer checklist before approving one.

---

## 1. Functionality

- [ ] The behavior described in the user story works end to end, exactly as written.
- [ ] Every acceptance criterion in the story's own Definition of Done is met.
- [ ] Feature works for the real, intended user — not just the happy path in development.

## 2. Data & Backend

- [ ] All displayed data is pulled live (from Supabase) — **no hardcoded or mock data**.
- [ ] Reads use the correct joins/queries; related data (e.g. profile fields) is fetched, not stubbed.
- [ ] Writes (`insert` / `update` / `delete`) target the right rows and persist correctly.
- [ ] Any schema change ships with a migration; new columns/tables/enums are reflected in the DB.
- [ ] After an update, dependent views reflect new values on next fetch — **no stale cached joins**.
- [ ] Storage uploads write to the correct path; replaced files have their old object deleted.

## 3. Security & Access Control

- [ ] Row Level Security (RLS) enforces ownership — users can only mutate their own rows.
- [ ] Storage policies restrict uploads to the user's own folder where applicable.
- [ ] Owner-only controls are rendered only for the owner; other users do not see them.
- [ ] Direct-URL access by an unauthorized user is blocked (e.g. a 403 page, not the form).
- [ ] No secrets or API keys appear in the client bundle or browser network traffic.

## 4. Error Handling & Edge Cases

- [ ] Missing records render a friendly not-found / 404 state, never a crash.
- [ ] Invalid input (wrong file type, oversized file, empty required field) is rejected with a clear error toast.
- [ ] Validation runs before any backend call; invalid submits do not hit the database.
- [ ] Duplicate or conflicting actions are guarded (e.g. unique constraints, "already done" messaging).
- [ ] Empty states (no results, no coordinates, no avatar) are handled gracefully.

## 5. UX & Responsiveness

- [ ] Loading states are shown during async work (skeletons for fetches, spinners on action buttons).
- [ ] Success and failure feedback is visible to the user (toasts / inline messages).
- [ ] Layout is responsive and usable on both desktop and mobile.
- [ ] Conditional UI (badges, overlays, buttons) reflects the correct state for the current user.

## 6. Code Quality & Process

- [ ] Tests were written first (TDD) and the suite passes (`npm test`) — red → green.
- [ ] Code reviewed via `/code-review`; raised issues are resolved.
- [ ] Dead code cleaned up (`/refactor-clean`); no leftover scaffolding or console noise.
- [ ] Docs updated where relevant (README / DOCS / CODETOUR / inline comments).
- [ ] **All code merged to `main` on GitHub with a passing build.**

---

> The final item — merged to `main` with a passing build — applies to every story without
> exception. A story is not Done until it is on `main`, building green.

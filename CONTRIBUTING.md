# Contributing to SlugFound

Team workflow for developing features and fixes. Follow this process every time.

---

## The Flow

```
1. Plan     → /plan "feature description"
2. Test     → Write failing tests first (Jest) — red
3. Code     → Write implementation until tests pass — green
4. Review   → /code-review, fix issues
5. Document → Update README/DOCS/CODETOUR/comments as needed
6. Cleanup  → /refactor-clean to catch dead code
7. Merge    → Create PR, get approval, merge
```

---

## 1. Before Writing Code

Always start with a plan.

```bash
/plan Add user notifications feature
```

This creates a step-by-step implementation plan before you write anything. Review the plan with the team, ask clarifying questions, and only start coding once you're aligned.

The plan should cover:
- What files will change
- What new components/utilities are needed
- Any architectural decisions
- Edge cases to handle
- Testing strategy

---

## 2. While Writing Code

### Write tests first (TDD)

Before implementing anything, write a failing test. This forces you to think through the interface before the implementation.

```
1. Create __tests__/<module>.test.ts mirroring the file you're about to write
2. Write tests that describe the expected behaviour — run npm test to confirm they fail (red)
3. Write the minimum implementation to make them pass (green)
4. Refactor freely — tests catch regressions
```

Example:
```typescript
// __tests__/format.test.ts — written BEFORE editing app/lib/format.ts
import { timeAgo } from '@/lib/format'

test('returns "just now" for timestamps within 60 seconds', () => {
  const recent = new Date(Date.now() - 30_000).toISOString()
  expect(timeAgo(recent)).toBe('just now')
})
```

> **Async Server Components** cannot be unit-tested with Jest. Write E2E tests for those instead.

### Test rules

**File naming** — mirror the source path under `app/`:
```
app/lib/format.ts            → __tests__/lib/format.test.ts
app/components/item-card.tsx → __tests__/components/item-card.test.tsx
```

**Imports** — always use the `@/` alias, never relative paths.

**React Testing Library query priority:**
1. `getByRole` — gold standard
2. `getByLabelText` — for form fields
3. `getByText` — for content
4. `getByTestId` — last resort only, never for interactive elements

**Test behaviour, not implementation** — test what the user sees and does, not internal state or private functions.

**Supabase** — never make real network calls in tests. Mock the client:
```ts
jest.mock('@/lib/supabase/client')
```

**Structure** — use `describe` to group related cases, one concept per `it`/`test`. Name tests as sentences: `it('shows an error when the email is missing')`.

**TypeScript** — all test files must be `.test.ts` or `.test.tsx`. No `any` types.

**Coverage target** — 80%+ on `app/lib/` utilities and `'use client'` components. Run `npm run test:coverage` to check.

### Follow the codebase patterns

Read the existing code in `app/components/` and `app/lib/` before writing new code. The app uses:
- **Server components by default** — add `'use client'` only when you need hooks or event handlers
- **Immutable state updates** — always use spread operator, never mutate
- **Tailwind CSS v4** — all styling via utilities, no CSS files
- **Zod for validation** — use it in server actions and form logic
- **TypeScript strict** — no `any` types

### Naming conventions

- Components: `PascalCase` (e.g. `MessageThread`)
- Functions / variables: `camelCase` (e.g. `handleSend`)
- Types / interfaces: `PascalCase` (e.g. `ChatMessage`)
- Constants: `UPPER_SNAKE_CASE` (e.g. `CURRENT_USER_ID`)
- Booleans: `is*` / `has*` / `can*` prefixes (e.g. `isActive`, `hasUnread`)

### File size limits

- Components: max ~200 lines
- Utilities: max ~400 lines
- If a file exceeds limits, extract reusable pieces into new files

### Error handling

Every operation that can fail must have explicit error handling:
- Network requests → try/catch
- User input → Zod validation + clear error messages
- Database operations → catch and log with context

### No hardcoded values

Use constants for thresholds, delays, magic numbers:

```typescript
// ❌ Bad
const timeout = 5000

// ✅ Good
const SESSION_TIMEOUT_MS = 5000
```

---

## 3. After Writing Code

Run code review immediately.

```bash
/code-review
```

Fix all issues flagged as **CRITICAL** or **HIGH** before moving on. Address **MEDIUM** issues when possible. Only skip **LOW** issues if you have a specific reason.

Common issues to catch:
- Hardcoded secrets (API keys, passwords, tokens)
- Missing error handling
- Unused imports / dead code
- Type safety violations (`any`, unchecked nulls)
- Mutation patterns (should be immutable)
- No comments on complex logic

---

## 4. Update Documentation

After code changes, update these docs:

### README.md

Update if:
- Setup steps change (dependencies, env variables)
- How to run the app changes
- New demo credentials are added

Example: "If you add a database, document the connection string in README under Environment variables."

### DOCS.md

Update if:
- A new feature is added (add to § "Feature guides")
- An existing feature changes behavior
- A known gap is resolved (move from "Known gaps" to the relevant feature section)
- Architecture changes significantly

Example: "If you add image upload, document it in DOCS.md § "Create a listing" and remove it from the High priority gaps table."

### CODETOUR.md

Update if:
- Folder structure changes
- A new top-level module is created
- The routing structure changes
- Major components are added/removed

Example: "If you add `app/services/`, add it to the folder structure section."

### Inline comments

Add comments whenever you write:
- Complex state updates (immutable patterns, derived values)
- Non-obvious conditional logic
- Server-specific code (cookie handling, middleware logic)
- Performance optimizations

Keep comments brief and explain the *why*, not the *what*:

```typescript
// ❌ Bad
// Set the count to zero
clearUnread(id)

// ✅ Good
// Clear the unread badge when conversation is opened so Sidebar updates immediately
useEffect(() => {
  clearUnread(activeId)
}, [activeId, clearUnread])
```

---

## 5. Before Merging a PR

Clean up dead code and unused imports.

```bash
/refactor-clean
```

This catches:
- Unused imports
- Unreachable code
- Dead functions/components
- Duplicate code

Fix any issues found. Aim for zero unused code in every commit.

---

## 6. Code Style Checklist

Before pushing a commit, verify:

- [ ] TypeScript `npx tsc --noEmit` passes (zero errors)
- [ ] ESLint `npm run lint` passes
- [ ] Tests pass `npm test` (no regressions)
- [ ] No hardcoded secrets (API keys, database URLs, etc.)
- [ ] Immutable patterns used (no mutation)
- [ ] Complex logic has inline comments
- [ ] Error handling is explicit
- [ ] No `console.log` statements (except temporary debug)
- [ ] Function files stay under 400 lines, components under 200
- [ ] No deep nesting (>4 levels of indentation)
- [ ] Tests exist for new features (80%+ coverage)

---

## 7. Commit Message Format

```
<type>: <description>

<optional body with more context>
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

**Examples:**

```
feat: add unread message badges to nav

Introduces UnreadContext to share unread counts between Sidebar and MessagesView.
Closing a conversation automatically clears the badge.

fix: middleware is not active because file is named proxy.ts

Rename proxy.ts → middleware.ts and export function as middleware() to activate.

docs: update DOCS.md with messaging feature guide

Adds § "Feature guides > Messages" covering mobile/desktop behavior and state management.
```

---

## 8. PR Review Process

1. **Self-review first** — does the code pass your own checklist above?
2. **Run `/code-review`** — fix any issues before requesting review
3. **Run `/refactor-clean`** — catch dead code
4. **Create PR** with a clear title and summary of what changed
5. **Await review** — address feedback from teammates
6. **Once approved** — merge to main

---

## 9. Questions?

When you're stuck:
1. Check `DOCS.md` first — it covers architecture, patterns, and common gotchas
2. Read existing similar code — patterns in the codebase are intentional
3. Check the `proxy.ts` warning in `DOCS.md § "The middleware file"` — this one trips people up
4. Ask in the team Slack or raise an issue

---

## 10. Key Files to Read

Start here if you're new:

| File | Why |
|---|---|
| `README.md` | Setup, env vars, how to run |
| `DOCS.md` | Architecture, patterns, known gaps |
| `CODETOUR.md` | Guided walkthrough of the codebase |
| `app/lib/definitions.ts` | All shared types — read this first |
| `app/(app)/layout.tsx` | How the authenticated section is wired |
| `app/lib/session.ts` | How auth/JWT works |
| `proxy.ts` | Route protection (currently inactive) |

---

## 11. Red Flags

If you see any of these, stop and ask before proceeding:

- **Hardcoded secrets** — never commit API keys, database URLs, or tokens
- **Using `any` type** — use `unknown` + narrowing or generics instead
- **Mutation patterns** — always use spread operator for state updates
- **Deep nesting** — refactor early returns if you hit >4 levels
- **No error handling** — every async operation needs try/catch or .catch()
- **Large functions** — split anything over 50 lines into smaller pieces
- **No tests** — new features need tests (aim for 80%+ coverage)

---

## 12. Deploying Changes

When you're ready to ship:

1. Merge to `main` via PR (see § "PR Review Process")
2. All checks must pass (lint, type check, tests)
3. All CRITICAL issues from `/code-review` must be fixed
4. Update CHANGELOG (create one if it doesn't exist)
5. Tag a release: `git tag -a v0.2.0 -m "Release v0.2.0"`
6. Deployment is handled separately (see DevOps docs or ask the team)

---

Last updated: April 2026  
For questions about the workflow, open an issue or ask in Slack.

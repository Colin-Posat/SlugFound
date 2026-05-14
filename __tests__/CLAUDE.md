# Test Writing Rules

These rules apply whenever writing or editing files in `__tests__/`.

## TDD cycle

Write a failing test first, then write the minimum implementation to make it pass. Never write implementation code before a test exists for it.

```
1. Write test → run npm test → confirm it fails (red)
2. Write implementation → run npm test → confirm it passes (green)
3. Refactor → run npm test → confirm it still passes
```

## File naming

Mirror the source file path under `app/`:

```
app/lib/format.ts              → __tests__/lib/format.test.ts
app/components/item-card.tsx   → __tests__/components/item-card.test.tsx
app/actions/auth.ts            → __tests__/actions/auth.test.ts
```

## Imports

Always use the `@/` alias — never relative paths:

```ts
// ✅
import { timeAgo } from '@/lib/format'

// ❌
import { timeAgo } from '../../app/lib/format'
```

## React Testing Library query priority

Prefer accessible queries in this order:

1. `getByRole` — gold standard, matches what assistive technology sees
2. `getByLabelText` — for form fields
3. `getByText` — for visible text content
4. `getByTestId` — last resort only; never use for interactive elements

## Test behaviour, not implementation

Test what the user sees and does — not internal state, private functions, or component internals.

```ts
// ✅ Tests behaviour
expect(screen.getByRole('alert')).toHaveTextContent('Email is required')

// ❌ Tests implementation detail
expect(component.state.errors.email).toBe('Email is required')
```

## Supabase mocking

Never make real network calls in unit tests. Mock Supabase at the module boundary:

```ts
jest.mock('@/lib/supabase/client')
jest.mock('@/lib/supabase/server')
```

## Async Server Components

Cannot be unit tested with Jest — they depend on server-only APIs. Write E2E tests (Playwright) for those instead.

## Test structure

Use `describe` to group related cases. Keep one concept per `it`/`test` block. Name tests as readable sentences:

```ts
describe('timeAgo', () => {
  it('returns "just now" for timestamps within 60 seconds', () => { … })
  it('returns "Xh ago" for timestamps within 24 hours', () => { … })
})
```

## TypeScript

All test files must be `.test.ts` or `.test.tsx`. No `any` types.

## Coverage target

Aim for 80%+ coverage on:
- Utility functions in `app/lib/`
- Client components (`'use client'`)

Run `npm run test:coverage` to check.

# SlugFound — Contributor Guide

Everything a new contributor needs before touching the code. Read top to bottom once. After that, use this as a reference.

---

## Table of Contents

1. [Architecture overview](#1-architecture-overview)
2. [Route groups and layouts](#2-route-groups-and-layouts)
3. [Server vs. client components](#3-server-vs-client-components)
4. [Next.js 16 specifics](#4-nextjs-16-specifics)
5. [Auth and sessions (Supabase)](#5-auth-and-sessions-supabase)
6. [The proxy file](#6-the-proxy-file)
7. [Database](#7-database)
8. [Storage (image uploads)](#8-storage-image-uploads)
9. [State management](#9-state-management)
10. [Feature guides](#10-feature-guides)
11. [Component conventions](#11-component-conventions)
12. [Adding a new page](#12-adding-a-new-page)
13. [Known gaps](#13-known-gaps)

---

## 1. Architecture overview

SlugFound is a **Next.js 16 App Router** app backed by **Supabase** for auth, the database, and image storage.

```
Browser ──► Next.js (App Router)
              │
              ├── Server Components  → read cookies, fetch from Supabase
              ├── Client Components  → call Supabase via the browser client
              └── Server Actions     → mutations (signup, login, createItem)
                       │
                       ▼
              Supabase project
              ├── auth.users        (Supabase Auth)
              ├── public.profiles   (1:1 with auth.users via trigger)
              ├── public.items      (lost/found posts)
              └── storage.objects   (item-images bucket)
```

There are no separate API routes. Server Actions handle all mutations, and Server Components handle all reads.

---

## 2. Route groups and layouts

Next.js route groups apply different layouts to different page sets without affecting URLs.

```
app/
  (public)/          →  public layout (sticky header, sign in / sign up)
    page.tsx         →  / (landing)
    login/page.tsx   →  /login
    signup/page.tsx  →  /signup

  (app)/             →  authenticated layout (sidebar, AuthProvider, UnreadProvider)
    lost/page.tsx    →  /lost
    found/page.tsx   →  /found
    messages/page.tsx →  /messages
    create/page.tsx  →  /create
    profile/page.tsx →  /profile
```

### Layouts

- **`app/layout.tsx`** — root, sets `<html>` and `<body>`, mounts the global `<Toaster>` (sonner)
- **`app/(public)/layout.tsx`** — public header with Sign in / Sign up buttons
- **`app/(app)/layout.tsx`** — server-fetches the current user + profile, hydrates `<AuthProvider>`, mounts `<Sidebar>` and `<UnreadProvider>`

---

## 3. Server vs. client components

**Default is server.** A file is a server component unless it has `'use client'` at the top.

| Rule | Reason |
|---|---|
| Page files default to server | They need to read `searchParams`, `cookies`, and run async DB queries |
| Interactive UI (state, events) must be `'use client'` | React hooks don't run on the server |
| Server can import client | The client component becomes a leaf node |
| Client cannot import server | Breaks the boundary; Next will error |

### The split-page pattern

When a page needs URL params + interactivity, split it:

```
(server) page.tsx        → reads searchParams, fetches data, passes as props
(client) feature-view.tsx → handles UI state and interactions
```

Examples:
- `(app)/messages/page.tsx` + `components/messages/messages-view.tsx`
- `(app)/create/page.tsx` + `(app)/create/create-form.tsx`
- `(app)/profile/page.tsx` + `(app)/profile/profile-view.tsx`
- `(app)/lost/page.tsx` + `components/items-filter.tsx`

---

## 4. Next.js 16 specifics

### `searchParams` is a Promise

You must `await` it in async server components. This is a breaking change from Next 14/15.

```typescript
// ✅ Correct
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
}
```

Pages that do this in this codebase:
- `app/(app)/messages/page.tsx`
- `app/(app)/create/page.tsx`
- `app/(app)/lost/page.tsx`
- `app/(app)/found/page.tsx`

### `cookies()` is a Promise

Same as above — already handled inside `app/lib/supabase/server.ts`.

### Middleware is now `proxy`

In Next.js 16 the file convention was renamed from `middleware.ts` to `proxy.ts`. The function name was renamed from `middleware` to `proxy`. Using the old names still works but emits a deprecation warning.

> Read the relevant guide in `node_modules/next/dist/docs/` before writing any Next-specific code — this version has multiple breaking changes.

---

## 5. Auth and sessions (Supabase)

Authentication is handled entirely by **Supabase Auth** (email/password). Server-side, we use `@supabase/ssr` to read/write the auth cookie.

### Flow

```
User submits signup form (signup-form.tsx, client component)
  → signup() server action (app/actions/auth.ts)
    → Zod validates: @ucsc.edu email + password rules + match
    → supabase.auth.signUp({ email, password, options: { data: { display_name } }})
      → Supabase writes auth.users row
        → trigger handle_new_user() inserts public.profiles row using metadata
    → Supabase sets the session cookie
    → revalidatePath('/', 'layout') + redirect('/lost')

Login flow:
  login() server action → supabase.auth.signInWithPassword() → redirect

Every request:
  proxy.ts → updateSession() → supabase.auth.getUser() refreshes the cookie if needed
                            → enforces route protection (redirects unauth → /login)

Logout:
  logout() server action → supabase.auth.signOut() → redirect('/login')
```

### The two clients

| File | When to use |
|---|---|
| `app/lib/supabase/client.ts` | Inside `'use client'` components — calls `createBrowserClient` |
| `app/lib/supabase/server.ts` | Inside server components and server actions — calls `createServerClient` with cookies |
| `app/lib/supabase/proxy.ts` | Inside `proxy.ts` only — refreshes the session cookie on every request |

Both clients read the same auth cookie, so signing in via a server action immediately propagates to the browser.

### AuthContext

`app/lib/auth-context.tsx` exposes `{ user, profile, loading, refreshProfile }` to any client component via `useAuth()`. It's mounted in `(app)/layout.tsx` with server-fetched initial data so there's no flash of "logged out" on first paint.

The provider also subscribes to `supabase.auth.onAuthStateChange` so the UI updates in real time when the user signs in/out from another tab.

### `@ucsc.edu` enforcement

Two layers:
1. **Client-side** — Zod schema in `app/actions/auth.ts` rejects non-`@ucsc.edu` emails before signup
2. **Database-side** — `profiles.email` has a CHECK constraint enforcing the same regex (migration 0001). This is a safety net in case validation is bypassed.

### Password rules (US 2.1)

- Minimum 8 characters
- At least one uppercase letter
- At least one number

The signup form shows a 4-bar strength meter that fills in as the password matches more rules.

---

## 6. The proxy file

`proxy.ts` at the project root runs on every request. Two responsibilities:

1. **Refresh the session cookie.** Supabase access tokens are short-lived (1h). Without a refresh-on-every-request middleware, signed-in users would get logged out unexpectedly.
2. **Route protection.** Unauthenticated users hitting `/lost`, `/found`, `/messages`, `/create`, or `/profile` are redirected to `/login`. Signed-in users hitting `/login` or `/signup` are redirected to `/lost`.

The actual logic lives in `app/lib/supabase/proxy.ts` so it can be tested independently.

> ⚠️ **Critical rule for the proxy:** never put any code between `createServerClient(...)` and `supabase.auth.getUser()`. An early return between them breaks session refresh and users get randomly logged out.

---

## 7. Database

### Schema

All schema lives in `/supabase/migrations/` and is applied in order:

| Migration | What it adds |
|---|---|
| `0001_profiles.sql` | `profiles` table, RLS, `handle_new_user()` trigger, `set_updated_at()` helper |
| `0002_items.sql` | `items` table with `item_type` and `item_status` enums, RLS, indexes |
| `0003_storage.sql` | `item-images` Storage bucket + RLS policies |

### Tables

**`public.profiles`** — one row per registered user, linked to `auth.users.id`.
Created automatically on signup by the `handle_new_user()` trigger.

**`public.items`** — lost/found posts.

```
id          uuid (PK)
user_id     uuid → profiles.id
type        'lost' | 'found'
title       text (1-120 chars)
description text (1-1000 chars)
category    text (constrained to a fixed list)
location    text
status      'active' | 'claimed' | 'resolved'
image_url   text (nullable)
emoji       text (nullable, optional visual flair)
created_at  timestamptz
updated_at  timestamptz (auto-bumped via trigger)
```

### Row Level Security (RLS)

Every table has RLS enabled. The policies are:

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | anyone authenticated | self only (`auth.uid() = id`) | self only | — |
| `items` | anyone authenticated | self only (`auth.uid() = user_id`) | self only | self only |

This means: even if a malicious client fakes the `user_id` field on insert, RLS will reject it because `auth.uid()` won't match.

### Indexes

```sql
items_type_created_idx  on items (type, created_at desc)  -- lost/found list queries
items_category_idx      on items (category)               -- category filter
items_status_idx        on items (status)                 -- status filter
items_user_id_idx       on items (user_id)                -- profile listings
```

### The repository pattern

Don't write inline `supabase.from('items')...` queries everywhere. Use the helpers in `app/lib/items.ts`:

```typescript
listItems({ type: 'lost', search, category, location })  // for /lost and /found
getItemById(id)                                          // for detail pages
listUserItems(userId)                                    // for profile
getUserItemStats(userId)                                 // for profile stats
```

This keeps query logic in one place and makes it easy to add caching or change implementations.

---

## 8. Storage (image uploads)

The `item-images` Storage bucket is **public-read** (so card images render without signed URLs) but **upload-only-by-owner**.

### Path convention

```
item-images/<user_id>/<random-uuid>.<ext>
```

The first folder MUST match the uploader's `auth.uid()`. The RLS policy enforces this:

```sql
(storage.foldername(name))[1] = auth.uid()::text
```

If you upload to any other path, the request is rejected.

### Constraints

- Max file size: 5 MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
- Both are enforced at the bucket level AND in the `createItem` server action

---

## 9. State management

No global state library. State is managed at three levels:

### URL state (server-driven)

- The active conversation in Messages: `?c=<id>`
- Search/filter on Lost/Found: `?q=…&category=…&location=…`

When these change, the server page re-runs and refetches.

### React Context

| Context | What it shares |
|---|---|
| `AuthContext` | `user`, `profile`, `loading`, `refreshProfile()` |
| `UnreadContext` | unread message counts (still mock data) |

Both are mounted in `(app)/layout.tsx`.

### Local component state

Search inputs, form drafts, open tabs — all `useState` local to the component.

### Debounced search

`ItemsFilter` uses `useTransition` + a 300ms `setTimeout` to debounce search input updates. The debounced value is pushed to the URL via `router.replace()`, which re-runs the server page and re-queries Supabase.

---

## 10. Feature guides

### Sign up (US 2.1)

**Files:** `(public)/signup/page.tsx`, `(public)/signup/signup-form.tsx`, `actions/auth.ts → signup()`

Form with name, email, password, confirm. Zod validates everything; the strength meter is purely UI feedback. On success, Supabase auto-creates the profile row via the `handle_new_user` trigger.

### Sign in (US 2.2)

**Files:** `(public)/login/page.tsx`, `(public)/login/login-form.tsx`, `actions/auth.ts → login()`

Email + password form. Server action calls `supabase.auth.signInWithPassword()` and redirects to `/lost`. Specific error messages for unconfirmed email vs. invalid credentials.

### Lost & Found (US 2.5)

**Files:** `(app)/lost/page.tsx`, `(app)/found/page.tsx`, `components/items-filter.tsx`, `lib/items.ts → listItems()`

Server pages read `searchParams`, call `listItems()`, render `<ItemsFilter>`. Filtering rerouts through URL state so deep-linking works (`/lost?q=airpods&category=Electronics`).

Searches use Postgres ILIKE on `title` + `description` via Supabase's `.or()` filter. Wildcards in user input are escaped to prevent injection.

### Create (US 2.4)

**Files:** `(app)/create/page.tsx`, `(app)/create/create-form.tsx`, `actions/items.ts → createItem()`

Server page reads `?type=lost|found` from searchParams. Form is a client component using `useActionState`. The server action:
1. Validates with Zod
2. If a photo is attached, uploads to `item-images/<user_id>/<uuid>.<ext>` and gets a public URL
3. Inserts into `items` (RLS auto-attaches `user_id` via `auth.uid()` check)
4. `revalidatePath('/lost' | '/found')` + redirect

### Profile (US 2.6)

**Files:** `(app)/profile/page.tsx`, `(app)/profile/profile-view.tsx`, `lib/items.ts → getUserItemStats() + listUserItems()`

Server fetches profile + stats + listings in parallel; client renders interactive tabs. Stats are real counts from the DB (`select count(*) where user_id = …`).

### Messages

Still mock data — see `app/lib/mock-messages.ts`. Wiring messages to Supabase is **not in Sprint 2**; it's tracked as a future deliverable. The UI is fully functional but resets on refresh.

---

## 11. Component conventions

### Toast notifications

Use `sonner`:

```typescript
import { toast } from 'sonner'
toast.success('Item posted!')
toast.error('Upload failed.')
```

The `<Toaster>` is mounted globally in `app/layout.tsx`.

### Badge

`components/ui/badge.tsx` — `'lost' | 'found' | 'active' | 'resolved'`.

### Time formatting

`app/lib/format.ts` exports `timeAgo(iso)` and `initialFromName(name)`.
Always use `timeAgo()` instead of hardcoding "2h ago" strings.

### Styling

- Dark zinc backgrounds, yellow-400 accent
- `rounded-xl` for inputs, `rounded-2xl` for cards
- `border-zinc-800` (default), `border-zinc-700` (hover/focus)
- All Tailwind utilities directly on elements — no separate CSS files

---

## 12. Adding a new page

1. Decide route group: `(app)/` for authenticated, `(public)/` for not
2. Default to a server component; extract a client component if you need state/effects
3. If you need search params, await them: `searchParams: Promise<{ q?: string }>`
4. If the page needs the current user, fetch via the server client:
   ```typescript
   const supabase = await createSupabaseServerClient()
   const { data: { user } } = await supabase.auth.getUser()
   ```
5. Add the route prefix to `PROTECTED_PREFIXES` in `app/lib/supabase/proxy.ts` if it should require auth
6. Add a nav item to `Sidebar` (`components/sidebar.tsx`) if it needs a nav link

---

## 13. Known gaps

These are real issues, not hypothetical. Ordered by severity.

### Critical

| Issue | Where | Impact |
|---|---|---|
| Email confirmation is disabled in dev | Supabase dashboard → Auth | Re-enable for production before launch |

### High

| Issue | Where | Impact |
|---|---|---|
| Item detail pages don't exist | `components/item-card.tsx` links to `/{type}/{id}` | Every card click 404s |
| Messages still mock data | `app/lib/mock-messages.ts` | No real chat between users yet — out of scope for Sprint 2 |
| No password reset flow | login form's "Forgot password?" link goes to `#` | Users locked out can't recover |
| `AuthContext` doesn't re-fetch profile on signup race | `auth-context.tsx` | Profile may be `null` for ~100ms after signup until trigger commits |

### Medium

| Issue | Where | Impact |
|---|---|---|
| `AppNav` component is dead code | `components/app-nav.tsx` | Not imported anywhere — should be deleted |
| Photo preview shows the file name but no thumbnail | `create-form.tsx` | Minor UX — uploaded image is not previewed |
| "Edit profile" button does nothing | `profile-view.tsx` | UI affordance with no action |
| "Change password" button does nothing | `profile-view.tsx` | UI affordance with no action |
| Settings tab is UI-only | `profile-view.tsx` | College + notification preferences don't persist |
| Real-time listings not subscribed | `lost/found pages` | New posts only appear on next refresh (US 2.5 stretch) |

### Low

| Issue | Where | Impact |
|---|---|---|
| No email format hint on the wildcard input | `signup-form.tsx` | Already shows an inline `@ucsc.edu` hint, but no docs link |
| Landing page stats are fake | `(public)/page.tsx` | "48 items recovered" is hardcoded copy |
| Toast errors on Create form trigger on every render | `create-form.tsx` | Cosmetic — fires once per state change but noisy in StrictMode |

# SlugFound — Code Tour

A complete walkthrough of the codebase for new teammates. Read top to bottom once and you should be able to find anything, change anything, and understand why things are the way they are.

---

## Table of Contents

1. [What the app is](#1-what-the-app-is)
2. [Tech stack at a glance](#2-tech-stack-at-a-glance)
3. [Folder structure](#3-folder-structure)
4. [How routing works](#4-how-routing-works)
5. [How auth and sessions work](#5-how-auth-and-sessions-work)
6. [The proxy file](#6-the-proxy-file)
7. [Database layer](#7-database-layer)
8. [Shared types and data models](#8-shared-types-and-data-models)
9. [Feature walkthroughs](#9-feature-walkthroughs)
   - [Lost & Found listings](#lost--found-listings)
   - [Create a listing](#create-a-listing)
   - [Messages](#messages)
   - [Profile](#profile)
10. [Shared UI components](#10-shared-ui-components)
11. [Environment variables](#11-environment-variables)
12. [Known gaps and next steps](#12-known-gaps-and-next-steps)

---

## 1. What the app is

**SlugFound** is a lost-and-found platform for UC Santa Cruz students. Users can:

- Sign up with a `@ucsc.edu` email and create a profile
- Post listings for items they've lost or found on campus, with optional photos
- Browse and filter all active listings (search, category, location)
- Message other users directly about a specific item (still mock — see § 9)
- Track their own posts and stats via a profile page

**Current status (post-Sprint 2):** Auth, items, and image uploads run on a real Supabase backend (Postgres + Auth + Storage). Messaging is still mock data and will be wired up in a future sprint.

---

## 2. Tech stack at a glance

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI library | React 19 |
| Styling | Tailwind CSS v4 |
| Backend | Supabase (Auth, Postgres, Storage) |
| SSR integration | `@supabase/ssr` |
| Validation | Zod 4 |
| Toasts | `sonner` |

---

## 3. Folder structure

```
SlugFound/
├── app/                               # Next.js App Router root
│   ├── layout.tsx                     # Root <html>/<body> + global Toaster
│   ├── globals.css                    # Tailwind base
│   │
│   ├── (public)/                      # Unauthenticated route group
│   │   ├── layout.tsx                 # Public header
│   │   ├── page.tsx                   # / (landing page)
│   │   ├── login/
│   │   │   ├── page.tsx               # /login (server)
│   │   │   └── login-form.tsx         # client form using login() action
│   │   └── signup/
│   │       ├── page.tsx               # /signup (server)
│   │       └── signup-form.tsx        # client form with strength meter
│   │
│   ├── (app)/                         # Authenticated route group
│   │   ├── layout.tsx                 # Sidebar + AuthProvider + UnreadProvider
│   │   ├── lost/page.tsx              # /lost — server, fetches via listItems()
│   │   ├── found/page.tsx             # /found — server, fetches via listItems()
│   │   ├── messages/page.tsx          # /messages?c=id (still mock)
│   │   ├── create/
│   │   │   ├── page.tsx               # /create?type=lost|found (server)
│   │   │   └── create-form.tsx        # client form using createItem() action
│   │   └── profile/
│   │       ├── page.tsx               # /profile (server, fetches profile + stats)
│   │       └── profile-view.tsx       # client view with tabs
│   │
│   ├── actions/                       # Next.js Server Actions
│   │   ├── auth.ts                    # signup, login, logout
│   │   └── items.ts                   # createItem (with image upload)
│   │
│   ├── components/                    # Shared UI
│   │   ├── sidebar.tsx                # Desktop sidebar + mobile tab bar
│   │   ├── item-card.tsx              # Listing card
│   │   ├── items-filter.tsx           # URL-driven search/category/location filter
│   │   ├── messages/                  # All messaging UI (mock)
│   │   └── ui/badge.tsx               # Pill component
│   │
│   └── lib/
│       ├── supabase/
│       │   ├── client.ts              # Browser Supabase client
│       │   ├── server.ts              # SSR Supabase client
│       │   └── proxy.ts               # Session refresh + route guards (used by proxy.ts)
│       ├── auth-context.tsx           # AuthProvider + useAuth hook
│       ├── unread-context.tsx         # Mock unread message counts
│       ├── items.ts                   # Items repository (server-only)
│       ├── definitions.ts             # Shared types + constants
│       ├── format.ts                  # timeAgo, initialFromName helpers
│       └── mock-messages.ts           # Mock message data
│
├── proxy.ts                           # Next.js 16 proxy entry (auth + session refresh)
│
├── supabase/
│   ├── migrations/
│   │   ├── 0001_profiles.sql          # profiles table + auto-create trigger
│   │   ├── 0002_items.sql             # items table + RLS + indexes
│   │   └── 0003_storage.sql           # item-images bucket + RLS
│   └── seed.sql                       # 12 sample items for dev
│
├── public/                            # Static assets
├── README.md                          # Setup + how to run
├── DOCS.md                            # Architecture deep dive
├── CONTRIBUTING.md                    # Team workflow
└── CODETOUR.md                        # This file
```

---

## 4. How routing works

### URL → file map

| URL | File |
|---|---|
| `/` | `app/(public)/page.tsx` |
| `/login` | `app/(public)/login/page.tsx` |
| `/signup` | `app/(public)/signup/page.tsx` |
| `/lost?q=&category=&location=` | `app/(app)/lost/page.tsx` |
| `/found?q=&category=&location=` | `app/(app)/found/page.tsx` |
| `/messages?c=<id>` | `app/(app)/messages/page.tsx` |
| `/create?type=lost\|found` | `app/(app)/create/page.tsx` |
| `/profile` | `app/(app)/profile/page.tsx` |

### Server vs. client

Pages default to **server components** so they can read cookies and run async DB queries. Forms and other interactive UI live in `'use client'` companion files (e.g. `signup-form.tsx`, `create-form.tsx`).

### `searchParams` is a Promise

In Next.js 16, `searchParams` must be `await`ed. Every page that reads URL params is an async server component:

```typescript
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  // …
}
```

---

## 5. How auth and sessions work

Authentication is delegated entirely to **Supabase Auth**. We use `@supabase/ssr` to integrate Supabase with Next.js cookies.

### Three Supabase clients

| File | Used by | Why |
|---|---|---|
| `app/lib/supabase/client.ts` | Client components | `createBrowserClient` — reads cookies via document.cookie |
| `app/lib/supabase/server.ts` | Server components, server actions | `createServerClient` — reads cookies via Next's `cookies()` |
| `app/lib/supabase/proxy.ts` | `proxy.ts` only | Special variant that mirrors cookie writes onto the response |

All three read the same auth cookie, so signing in via a server action immediately propagates everywhere.

### Sign up flow

```
User submits the form
  ↓ signup-form.tsx (client) calls useActionState
  ↓ signup() server action validates with Zod
  ↓ supabase.auth.signUp({ email, password, options: { data: { display_name } } })
  ↓ Supabase writes auth.users
  ↓ Postgres trigger handle_new_user() inserts public.profiles using metadata
  ↓ Session cookie set
  ↓ revalidatePath('/', 'layout') + redirect('/lost')
```

### Login flow

```
User submits login form
  ↓ login() server action validates email + password format
  ↓ supabase.auth.signInWithPassword()
  ↓ Cookie set, redirect to /lost
```

### Every request

The `proxy.ts` middleware runs on every page request:

```
proxy.ts (root) → updateSession() in app/lib/supabase/proxy.ts
  → reads existing cookie
  → calls supabase.auth.getUser() (auto-refreshes if needed)
  → writes refreshed cookie back
  → if route is protected and user is null → redirect to /login
  → if route is /login or /signup and user is set → redirect to /lost
```

### AuthContext

`app/lib/auth-context.tsx` exposes `{ user, profile, loading, refreshProfile }` to any client component:

```typescript
const { user, profile } = useAuth()
```

Mounted in `(app)/layout.tsx` with server-fetched initial values, so there's no flash of "logged out" on first paint. It also subscribes to `supabase.auth.onAuthStateChange()` so the UI updates in real time.

---

## 6. The proxy file

`proxy.ts` at the project root is the Next.js 16 proxy entry point.

> **Naming gotcha:** In Next.js 16 the file convention was renamed from `middleware.ts` to `proxy.ts` (and the function from `middleware` to `proxy`). The old name still works but emits a deprecation warning. Earlier versions of this codebase had it confused — the original `proxy.ts` was correct all along.

The actual logic lives in `app/lib/supabase/proxy.ts`. It:
1. Refreshes the Supabase session cookie on every request (Supabase access tokens expire after 1 hour)
2. Enforces route protection: `/lost`, `/found`, `/messages`, `/create`, `/profile` require auth
3. Redirects signed-in users away from `/login` and `/signup`

> ⚠️ Never put any code between `createServerClient(...)` and `supabase.auth.getUser()` in the proxy. An early return between them breaks session refresh and users get randomly logged out.

---

## 7. Database layer

### Schema

Three tables in Postgres (Supabase manages it):

| Table | Purpose |
|---|---|
| `auth.users` | Managed by Supabase Auth — never edit directly |
| `public.profiles` | One row per user, linked to `auth.users.id` via FK |
| `public.items` | Lost/found posts, linked to `profiles.id` via FK |

Plus a Storage bucket `item-images` for uploaded photos.

All schema is defined in `/supabase/migrations/` — apply in order via the Supabase SQL editor.

### Row Level Security (RLS)

Every table has RLS enabled:

- **profiles:** authenticated users can read all rows; users can only insert/update their own
- **items:** authenticated users can read all rows; users can only insert/update/delete their own
- **storage.objects (item-images):** anyone can read; authenticated users can upload only into a folder named after their `auth.uid()`

This means a malicious client can't fake `user_id` on insert — RLS rejects the request because `auth.uid()` won't match.

### The repository pattern

Don't write inline `supabase.from('items')...` queries everywhere. Use the helpers in `app/lib/items.ts`:

```typescript
listItems({ type, search, category, location })  // for /lost and /found
getItemById(id)                                  // for detail pages
listUserItems(userId)                            // for profile
getUserItemStats(userId)                         // for profile stats
```

### Storage path convention

```
item-images/<user_id>/<random-uuid>.<ext>
```

The first folder MUST equal the uploader's `auth.uid()` — RLS enforces this.

---

## 8. Shared types and data models

All types are in `app/lib/definitions.ts`:

```typescript
ItemType        = 'lost' | 'found'
ItemStatus      = 'active' | 'claimed' | 'resolved'
ItemCategory    = (one of ITEM_CATEGORIES)

Item {
  id, user_id, type, title, description,
  category, location, status, image_url,
  emoji, created_at, updated_at,
  profile?: { id, display_name, avatar_url } | null
}

Profile {
  id, display_name, email, avatar_url,
  college, created_at, updated_at
}

// Messaging types — still mock data
MessageUser, ChatMessage, Conversation
```

Auth-related types (`AuthFormState`, `LoginFormSchema`, `SignupFormSchema`) live with the actions in `app/actions/auth.ts`.

---

## 9. Feature walkthroughs

### Lost & Found listings

**Files:** `app/(app)/lost/page.tsx`, `app/(app)/found/page.tsx`, `app/components/items-filter.tsx`, `app/lib/items.ts`

The server pages read `?q=&category=&location=` from `searchParams` and call `listItems()`, which builds a Supabase query with:
- `.eq('type', 'lost'|'found')`
- `.or('title.ilike.%term%,description.ilike.%term%')` for search
- `.eq('category', x)` if category set
- `.ilike('location', '%x%')` if location set
- `.order('created_at', { ascending: false })`
- profile join: `select('*, profile:profiles(id, display_name, avatar_url)')`

Results pass to `<ItemsFilter>` which renders the UI and updates URL searchParams on filter changes (using `router.replace()` + `useTransition`). The 300ms debounce on the search input prevents hammering Supabase on every keystroke.

### Create a listing

**Files:** `app/(app)/create/page.tsx`, `app/(app)/create/create-form.tsx`, `app/actions/items.ts`

The server page reads `?type=lost|found` and passes `initialType` to the client form. The form uses `useActionState` to call the `createItem` server action.

The action:
1. Verifies the user is signed in (RLS would also catch this)
2. Validates with Zod
3. If a photo is attached, uploads to `item-images/<user_id>/<uuid>.<ext>` and grabs the public URL
4. Inserts the item row (RLS verifies `user_id = auth.uid()`)
5. Calls `revalidatePath('/lost' | '/found')` and redirects

### Messages

**Files:** `app/(app)/messages/page.tsx`, `app/components/messages/messages-view.tsx`, all of `app/components/messages/`

**Still backed by mock data** in `app/lib/mock-messages.ts`. The URL parameter `?c=<id>` drives which thread is open. The server page reads it and passes `activeId` down. New messages are appended in client state; they don't persist across page refreshes.

Wiring messages to Supabase is **out of scope for Sprint 2** and tracked as a future deliverable.

### Profile

**Files:** `app/(app)/profile/page.tsx`, `app/(app)/profile/profile-view.tsx`, `app/lib/items.ts → getUserItemStats() + listUserItems()`

The server page fetches:
- The current user's `auth.users` record
- Their `profiles` row
- Counts of `total / active / reunited` items
- The user's listings (limit 50)

These pass to the client view, which renders a tabbed UI (My Listings / Saved / Settings). The Saved and Settings tabs are UI-only — they don't persist anything. Sign out uses a `<form action={logout}>` to call the server action.

---

## 10. Shared UI components

### Badge — `components/ui/badge.tsx`

Pill component for `'lost' | 'found' | 'active' | 'resolved'`:

```typescript
<Badge variant="lost">lost</Badge>
```

### ItemCard — `components/item-card.tsx`

Renders one item. Shows the uploaded image if present, otherwise a large emoji placeholder. Displays the poster's display name from the joined profile.

### ItemsFilter — `components/items-filter.tsx`

URL-driven search/filter UI shared by `/lost` and `/found`. State is mirrored to URL searchParams which re-runs the server page.

### Sidebar — `components/sidebar.tsx`

Desktop sidebar + mobile tab bar from a single `navItems` array. Reads `useAuth()` for the user card at the top and `useUnread()` for the Messages badge.

### Toaster (sonner)

Mounted globally in `app/layout.tsx`. Use anywhere:

```typescript
import { toast } from 'sonner'
toast.success('Item posted!')
toast.error('Upload failed.')
```

### Time formatting — `app/lib/format.ts`

```typescript
timeAgo('2026-04-27T...')  // "2h ago", "3d ago", "just now"
initialFromName('Sam Slug') // "S"
```

---

## 11. Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Project URL from Supabase Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Public anon key — RLS protects the data |

Both are required at runtime. The browser client and server client read both — the `NEXT_PUBLIC_` prefix is what makes them available client-side.

> The legacy `SESSION_SECRET` (used by the pre-Sprint-2 JWT auth) is no longer needed and can be removed from `.env.local`.

---

## 12. Known gaps and next steps

These are real issues, not hypothetical. See [DOCS.md § "Known gaps"](./DOCS.md#13-known-gaps) for the full prioritized list.

**The big ones:**

1. **Item detail pages don't exist** — every card click 404s. Build `app/(app)/lost/[id]/page.tsx` and `app/(app)/found/[id]/page.tsx`.
2. **Messaging is still mock data** — `app/lib/mock-messages.ts` is hardcoded. A future sprint should add `messages` and `conversations` tables and wire them up.
3. **No password reset flow** — login form's "Forgot password?" link goes to `#`.
4. **`AppNav` component is dead code** — `components/app-nav.tsx` is not imported anywhere. Safe to delete.
5. **Email confirmation is disabled in dev** — re-enable in Supabase dashboard before production.

---

**Welcome to the codebase.** If anything in this tour is wrong or unclear, fix it as part of your PR.

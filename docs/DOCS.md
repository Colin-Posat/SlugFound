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
              ├── Server Actions     → mutations (signup, items, profile, reports…)
              └── Route Handlers     → AI (photo-search, scan-item) + email webhooks
                       │
                       ▼
              Supabase project
              ├── auth.users         (Supabase Auth)
              ├── public.profiles    (1:1 with auth.users via trigger)
              ├── public.items       (lost/found posts)
              ├── public.conversations + public.messages  (real-time messaging)
              ├── public.reports + public.notification_log
              └── storage.objects    (item-images, avatars buckets)
```

Most mutations are Server Actions and most reads are Server Components. A few
things genuinely need an HTTP endpoint and live under `app/api/` as Route
Handlers: AI photo search, AI item scan, and the email notification +
unsubscribe webhooks (the Supabase DB webhook POSTs to one of them).

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
    lost/page.tsx        →  /lost
    found/page.tsx       →  /found
    found/photo-search/  →  /found/photo-search (AI photo search)
    items/[id]/page.tsx  →  /items/[id]       (canonical item detail)
    items/[id]/edit/     →  /items/[id]/edit  (owner-only edit/delete)
    messages/page.tsx    →  /messages
    create/page.tsx      →  /create
    profile/page.tsx     →  /profile

app/api/                 →  Route Handlers (no layout)
  photo-search/          →  POST /api/photo-search
  ai/scan-item/          →  POST /api/ai/scan-item
  notifications/new-message/   →  POST (Supabase webhook target)
  notifications/unsubscribe/   →  GET  (one-click email opt-out)
```

> `/lost/[id]` and `/found/[id]` still exist but now permanently redirect to the
> canonical `/items/[id]` (US 4.1), so old links keep working.

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
| `0004_embeddings.sql` | `items.image_embedding` (jsonb) for photo similarity |
| `0005_item_coordinates.sql` | `items.lat` / `items.lng` for the map picker |
| `0006_messaging.sql` | `conversations` + `messages` tables, RLS, Realtime |
| `0007_email_notifications.sql` | `profiles.email_notifications` + `unsubscribe_token`; `notification_log` |
| `0008_avatars_storage.sql` | `avatars` Storage bucket + RLS policies |
| `0009_reports.sql` | `reports` table + `report_reason` enum + RLS; `items.reported_flag` + auto-flag trigger |
| `0010_message_webhook.sql` | **Template** — DB webhook → email route (apply after deploy; needs URL + secret) |
| `0011_harden_functions.sql` | Pin `set_updated_at` search_path; revoke RPC EXECUTE on definer trigger functions |

### Tables

**`public.profiles`** — one row per registered user, linked to `auth.users.id`.
Created automatically on signup by the `handle_new_user()` trigger. Columns:
`display_name`, `email` (UCSC CHECK), `avatar_url`, `college`,
`email_notifications` (bool, default true), `unsubscribe_token` (uuid, for
one-click email opt-out).

**`public.items`** — lost/found posts.

```
id            uuid (PK)
user_id       uuid → profiles.id
type          'lost' | 'found'
title         text (1-120 chars)
description   text (1-1000 chars)
category      text (constrained to a fixed list)
location      text
status        'active' | 'claimed' | 'resolved'
image_url     text (nullable)
emoji         text (nullable, optional visual flair)
lat, lng      double precision (nullable, map coordinates)
reported_flag boolean (default false; true once 3+ reports)
created_at    timestamptz
updated_at    timestamptz (auto-bumped via trigger)
```

**`public.conversations` / `public.messages`** — real-time messaging (0006). A
conversation links two users + one item (`user_a < user_b` CHECK prevents
duplicates); messages belong to a conversation. Realtime is enabled on
`messages`.

**`public.reports`** — one row per (item, reporter); write-only for users
(0009). **`public.notification_log`** — (conversation, recipient) → last email
time, for rate limiting; service-role only.

### Row Level Security (RLS)

Every table has RLS enabled. The policies are:

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | anyone authenticated | self only (`auth.uid() = id`) | self only | — |
| `items` | anyone authenticated | self only (`auth.uid() = user_id`) | self only | self only |
| `conversations` | participants only | participants only | participants only | — |
| `messages` | conversation participants | participants (as sender) | — | — |
| `reports` | — (no policy) | self only (`auth.uid() = reporter_id`) | — | — |
| `notification_log` | — | — | — | — (service role only) |

This means: even if a malicious client fakes the `user_id` field on insert, RLS will reject it because `auth.uid()` won't match. `reports` and `notification_log` have RLS enabled with no (or insert-only) policies, so clients can't read others' data — only the service role (email routes / admin) can.

### Indexes

```sql
items_type_created_idx  on items (type, created_at desc)  -- lost/found list queries
items_category_idx      on items (category)               -- category filter
items_status_idx        on items (status)                 -- status filter
items_user_id_idx       on items (user_id)                -- profile listings
items_coords_idx        on items (lat, lng) WHERE lat IS NOT NULL  -- future radius filter
```

The `items` table also has nullable `lat DOUBLE PRECISION` and `lng DOUBLE PRECISION` columns (migration `0005`) that store precise pin coordinates from the map location picker. Existing rows have `NULL` coordinates and are unaffected.

### The repository pattern

Don't write inline `supabase.from('items')...` queries everywhere. Use the helpers in `app/lib/items.ts`:

```typescript
listItems({ type: 'lost', search, category, location, activeOnly })  // /lost, /found
getItemById(id)            // detail pages — wrapped in React cache() (deduped per request)
listUserItems(userId)      // profile listings
getUserItemStats(userId)   // profile stats (reunited = claimed + resolved)
```

`listItems` orders active items first (then claimed/resolved), excludes
`reported_flag = true` items, and honours the `activeOnly` toggle (US 4.3/4.6).
Conversation/message reads live in `app/lib/conversations.ts`. This keeps query
logic in one place and makes it easy to add caching or change implementations.

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

### The `avatars` bucket (US 4.5)

A second bucket, `avatars` (migration 0008), follows the exact same pattern —
public-read, upload-only-by-owner at `avatars/<user_id>/<uuid>.<ext>` — with a
**2 MB** cap. The `updateProfile` server action uploads the new avatar and
removes the old object. `updateItem` and `deleteItem` do the same cleanup for
item images via `storagePathFromPublicUrl()` in `app/lib/storage.ts`.

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
| `UnreadContext` | unread message counts (live from Supabase) |

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

### Map location picker

**Files:** `(app)/create/create-form.tsx`, `components/location-map-picker.tsx`, `components/location-map-picker-dynamic.tsx`, `actions/items.ts → createItem()`

The location `<select>` dropdown was replaced by an interactive Leaflet map. Preset markers for 14 UCSC campus locations are shown; users can also click anywhere on the map to place a custom pin. The selected coordinates are submitted as hidden form inputs (`lat`, `lng`) alongside the text label (`location`).

On the item detail page, if an item has coordinates, a read-only map with a pin is shown below the description. Items posted before this feature have `null` coordinates and continue to display the text location only.

The map component must be dynamically imported with `{ ssr: false }` because Leaflet uses browser APIs (`window`, `document`).

### Profile (US 2.6)

**Files:** `(app)/profile/page.tsx`, `(app)/profile/profile-view.tsx`, `lib/items.ts → getUserItemStats() + listUserItems()`

Server fetches profile + stats + listings in parallel; client renders interactive tabs. Stats are real counts from the DB (`select count(*) where user_id = …`).

### Messages (Sprint 3)

**Files:** `(app)/messages/page.tsx`, `components/messages/*`, `actions/messages.ts`, `lib/conversations.ts`, `lib/use-realtime-messages.ts`

Real Supabase-backed chat. The active conversation is URL state (`/messages?c=<id>`). `findOrCreateConversation()` (sorts the two user ids so `user_a < user_b`) opens/reuses a conversation; `use-realtime-messages` subscribes to `postgres_changes` on `messages` for live updates. `markConversationRead()` bumps the per-side `last_read_at` used for unread counts.

### Item detail (US 4.1)

**Files:** `(app)/items/[id]/page.tsx` (+ `loading.tsx`, `not-found.tsx`), `components/item-detail.tsx`

Canonical detail route. The server page fetches via `getItemById` (React-cached so the page + `generateMetadata` share one query), 404s via `notFound()`, and computes `isOwner`. `generateMetadata` sets a dynamic `<title>`/`<meta description>`. Owners see Edit + status buttons; non-owners see Message + a Report menu.

### Edit & delete (US 4.2)

**Files:** `(app)/items/[id]/edit/page.tsx` + `edit-form.tsx`, `actions/items.ts → updateItem() / deleteItem()`

The edit page is owner-only (non-owners get a 403 message, never the form). `updateItem` swaps the photo (upload new, delete old) and re-checks ownership; `deleteItem` removes the row + Storage image behind a confirmation modal. `updated_at` is auto-bumped by the trigger from migration 0002.

### Claim / resolve status (US 4.3)

**Files:** `components/item-detail.tsx`, `components/item-card.tsx`, `lib/item-status.ts`, `lib/items.ts`, `components/items-filter.tsx`

`nextStatuses()` encodes the rules (active → claimed/resolved, claimed → resolved, resolved terminal). Cards mute + badge non-active items; `listItems` sorts active-first and supports an "Active only" toggle (default on; `?all=1` shows everything).

### Profile editing (US 4.5)

**Files:** `(app)/profile/profile-view.tsx`, `actions/profile.ts → updateProfile()`, `lib/profile-schemas.ts`

Inline form on the Account page edits `display_name` (≤40) + avatar (≤2 MB → `avatars` bucket). On save it calls `useAuth().refreshProfile()`. Avatars render (with initials fallback) in the sidebar, item cards, item detail, and message list/thread.

### Reports (US 4.6)

**Files:** `components/report-menu.tsx`, `actions/reports.ts`, `lib/reports-schemas.ts`

Non-owners get a "⋯ → Report" modal (reason + optional notes). Inserts into `reports`; a duplicate (unique `item_id, reporter_id`) returns "already reported". At 3+ reports a trigger sets `items.reported_flag`, which hides the item from listings and shows a warning banner on its detail page.

### Map view (US 4.7)

**Files:** `components/items-map.tsx`, `components/items-map-dynamic.tsx`, `lib/geo.ts`, `components/items-filter.tsx`

A Map/List toggle on the listings pages. The map (react-leaflet, UCSC center) drops a pin per geotagged item with a popup (thumbnail, title, category, View item). Server-side filters keep pins in sync with the list; an info bar shows geotagged-vs-total. Like the picker, it's dynamically imported with `{ ssr: false }`.

### Email notifications (US 4.4)

**Files:** `api/notifications/new-message/route.ts`, `api/notifications/unsubscribe/route.ts`, `lib/email/*`, `lib/supabase/admin.ts`, `actions/profile.ts → updateEmailNotifications()`

A Supabase DB webhook (template `0010_message_webhook.sql`) POSTs each new message to the notification route, which verifies a shared secret, resolves the recipient via the **service-role** admin client, honours their `email_notifications` opt-out, enforces a 10-minute per-conversation rate limit (`notification_log`), and sends a branded email via Resend. The footer's one-click unsubscribe hits `/api/notifications/unsubscribe?token=<unsubscribe_token>`.

**Setup (not fully wired from localhost):** set `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NOTIFY_WEBHOOK_SECRET`, `EMAIL_FROM`, and `NEXT_PUBLIC_APP_URL` (a public URL — cloud Supabase can't reach localhost). Then fill the placeholders in `0010_message_webhook.sql` and apply it, or create the webhook via the Supabase Dashboard → Database → Webhooks UI.

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

`components/ui/badge.tsx` — `'lost' | 'found' | 'active' | 'claimed' | 'resolved' | 'match-high' | 'match-medium' | 'match-low'`.

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
| Email webhook not wired by default | `0010_message_webhook.sql` (template) | New-message emails only send after the webhook is applied with a public URL + secret (US 4.4) |
| No password reset flow | login form's "Forgot password?" link goes to `#` | Users locked out can't recover |
| `AuthContext` doesn't re-fetch profile on signup race | `auth-context.tsx` | Profile may be `null` for ~100ms after signup until trigger commits |

### Medium

| Issue | Where | Impact |
|---|---|---|
| `AppNav` component is dead code | `components/app-nav.tsx` | Not imported anywhere — should be deleted |
| Photo preview shows the file name but no thumbnail | `create-form.tsx` | Minor UX (the edit form does show a thumbnail) |
| "Change password" button does nothing | `profile-view.tsx` | UI affordance with no action |
| College preference is UI-only | `profile-view.tsx` settings | College select doesn't persist (email-notification toggle now does) |
| Real-time listings not subscribed | `lost/found pages` | New posts only appear on next refresh (US 2.5 stretch) |
| Leaked-password protection disabled | Supabase Auth settings | Enable HaveIBeenPwned check before launch (one-click in dashboard) |
| Public buckets allow listing | `item-images`, `avatars` SELECT policies | Low risk (public data, UUID names); advisor WARN — could scope SELECT down |

### Low

| Issue | Where | Impact |
|---|---|---|
| Landing page stats are fake | `(public)/page.tsx` | "48 items recovered" is hardcoded copy |
| Toast errors on Create form trigger on every render | `create-form.tsx` | Cosmetic — noisy in StrictMode (the profile + report forms use the transition pattern instead) |

> **Resolved this sprint (4):** item detail pages now live at `/items/[id]`;
> messages are real-time (Sprint 3); edit/delete, claim/resolve, profile +
> avatar editing, reporting, map view, and email notifications all shipped.

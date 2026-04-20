# SlugFound — Contributor Guide

Everything a new contributor needs before touching the code. Read top to bottom once. After that, use this as a reference.

---

## Table of Contents

1. [Architecture overview](#1-architecture-overview)
2. [Route groups and layouts](#2-route-groups-and-layouts)
3. [Server vs. client components](#3-server-vs-client-components)
4. [Next.js 16 breaking changes](#4-nextjs-16-breaking-changes)
5. [Auth and session system](#5-auth-and-session-system)
6. [The middleware file](#6-the-middleware-file)
7. [State management](#7-state-management)
8. [Data layer](#8-data-layer)
9. [Feature guides](#9-feature-guides)
10. [Component conventions](#10-component-conventions)
11. [Adding a new page](#11-adding-a-new-page)
12. [Known gaps](#12-known-gaps)

---

## 1. Architecture overview

SlugFound is a **Next.js 16 App Router** application. The frontend is the only thing that works right now — all data is hardcoded mock arrays. Auth (login/logout) works end-to-end using JWT cookies.

```
Browser ──► Next.js server (App Router)
               │
               ├── Server Components  (render HTML, read cookies, await searchParams)
               ├── Client Components  (interactive UI, useState, useEffect)
               └── Server Actions     (form submissions, cookie writes, redirects)
```

There is no separate API server. All server-side logic runs inside Next.js via Server Actions and Server Components.

---

## 2. Route groups and layouts

Next.js route groups let you apply different layouts to different sets of pages without the group name appearing in the URL.

```
app/
  (public)/          →  public layout (sticky header, sign in / sign up nav)
    page.tsx         →  / (landing page)
    login/page.tsx   →  /login
    signup/page.tsx  →  /signup

  (app)/             →  authenticated layout (sidebar, unread context)
    lost/page.tsx    →  /lost
    found/page.tsx   →  /found
    messages/page.tsx →  /messages
    create/page.tsx  →  /create
    profile/page.tsx →  /profile
```

### Layouts

- **`app/layout.tsx`** — root layout, sets `<html>` and `<body>`, loads Geist font. Wraps everything.
- **`app/(public)/layout.tsx`** — adds the sticky public header (Sign in / Sign up buttons).
- **`app/(app)/layout.tsx`** — adds `<Sidebar>` and wraps the entire page in `<UnreadProvider>`.

> **`app/components/app-nav.tsx`** exists in the codebase but is not used by any layout or page. It was likely replaced by `Sidebar`. It can be deleted.

---

## 3. Server vs. client components

**Default is server.** A file is a server component unless it has `'use client'` at the top.

| Rule | Reason |
|---|---|
| Page files (`page.tsx`) default to server | They need to read `searchParams` and `cookies`, which require server context |
| Interactive UI (state, events, effects) must be `'use client'` | React hooks don't run on the server |
| A server component **can** import a client component | The client component becomes a leaf node |
| A client component **cannot** import a server component | This would break the server/client boundary |

### The server-reads, client-renders pattern

When a page needs both URL params and interactivity, split it:

```
(server) page.tsx        →  reads searchParams, passes resolved values as props
(client) feature-view.tsx →  receives plain values, handles all UI state
```

Examples in this codebase:
- `(app)/messages/page.tsx` + `components/messages/messages-view.tsx`
- `(app)/create/page.tsx` + `(app)/create/create-form.tsx`

---

## 4. Next.js 16 breaking changes

**`searchParams` is now a Promise.** You must `await` it in async server components. This is a breaking change from Next.js 14/15.

```typescript
// ✅ Correct in Next.js 16
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  // ...
}

// ❌ Will break in Next.js 16
export default function Page({ searchParams }: { searchParams: { q?: string } }) {
  const { q } = searchParams  // searchParams is a Promise — this is wrong
}
```

Every page that reads `searchParams` must be an async server component and must `await` it.

Current pages that do this:
- `app/(app)/messages/page.tsx`
- `app/(app)/create/page.tsx`

**`cookies()` is also a Promise** in Next.js 15+. The session utility already handles this — `session.ts` uses `await cookies()`.

> Before writing any Next.js-specific code, read the relevant guide in `node_modules/next/dist/docs/` — this version has multiple breaking changes from earlier releases.

---

## 5. Auth and session system

### Flow

```
User submits login form
  → login() server action (app/actions/auth.ts)
    → Zod validates email + password format
    → getUserByEmail() looks up user (stub — hardcoded array)
    → bcrypt.compare() verifies password
    → createSession(userId) writes a signed JWT to an httpOnly cookie
    → redirect('/lost')

Every page load (app route):
  → middleware reads 'session' cookie
  → decrypt() verifies JWT signature + expiry
  → redirects to /login if invalid/missing

Logout:
  → logout() server action
    → deleteSession() deletes the cookie
    → redirect('/login')
```

### Cookie settings

The session cookie is set with:
- `httpOnly: true` — JavaScript cannot read it (XSS protection)
- `secure: true` in production only — HTTPS only in prod, HTTP allowed locally
- `sameSite: 'lax'` — sent on same-site navigations and top-level cross-site GET requests
- `expires` — 7 days from creation

### JWT payload

```typescript
type SessionPayload = {
  userId: string
  expiresAt: Date
}
```

The token is signed with HS256 using `SESSION_SECRET`. If the secret changes, all existing sessions become invalid.

### Signing up

**The signup form (`/signup`) is UI-only** — it has no server action wired up. Submitting it does nothing. This needs to be implemented before the app goes live. See [Known gaps](#known-gaps).

### Replacing the demo user

`getUserByEmail` in `app/actions/auth.ts` is a stub that returns a hardcoded user. When you add a database, replace the entire function body with a real query:

```typescript
// Replace this:
async function getUserByEmail(email: string) {
  const DEMO_HASH = await bcrypt.hash('Password1!', 10) // ⚠️ hashes on every call
  const users = [{ id: '1', email: 'demo@example.com', password: DEMO_HASH }]
  return users.find((u) => u.email === email) ?? null
}

// With something like:
async function getUserByEmail(email: string) {
  return db.query.users.findFirst({ where: eq(users.email, email) })
}
```

> ⚠️ The current stub calls `bcrypt.hash()` on **every login attempt**, even ones that will fail. This is intentional for a demo but would be a serious performance issue in production (bcrypt is slow by design). Fix it when wiring up a real DB by storing the hash once at registration time.

---

## 6. The middleware file

Route protection is defined in `proxy.ts` at the project root. **It does not work right now.**

Next.js middleware must be in a file named `middleware.ts` (or `middleware.js`) at the project root, and the exported function must be named `middleware`. The current file is named `proxy.ts` and exports a function named `proxy` — Next.js ignores it entirely.

### How to activate it

```bash
# 1. Rename the file
mv proxy.ts middleware.ts

# 2. In the new file, rename the exported function
export default async function middleware(req: NextRequest) { ... }
```

### What it does once active

| Route | Unauthenticated | Authenticated |
|---|---|---|
| `/lost`, `/found`, `/messages`, `/create`, `/profile` | → redirect to `/login` | allowed |
| `/login`, `/signup` | allowed | → redirect to `/lost` |
| Everything else (static, API) | passes through | passes through |

> Until this is activated, **all routes are publicly accessible** — anyone can visit `/lost` or `/messages` without logging in.

---

## 7. State management

There is no global state library. State is managed at three levels:

### URL state (server-driven)

The active conversation in Messages is stored in the URL as `?c=<conversationId>`. The server page reads it and passes it as a prop. This means deep-linking and browser back/forward work for free.

### React Context

`UnreadProvider` (`app/lib/unread-context.tsx`) shares unread message counts between `Sidebar` (which shows the badge) and `MessagesView` (which clears it). It is mounted in `(app)/layout.tsx` so it wraps the entire authenticated section.

The context exposes:
```typescript
{
  unreadCounts: Record<string, number>  // per-conversation counts
  clearUnread: (id: string) => void     // called when a thread is opened
  totalUnread: number                   // derived sum, used for the nav badge
}
```

`clearUnread` is wrapped in `useCallback` so its reference is stable across renders — this prevents the `useEffect` in `MessagesView` (which depends on `clearUnread`) from re-running unnecessarily on every render.

### Local component state

Everything else — search inputs, active filters, form drafts, open tabs — is `useState` local to the component.

---

## 8. Data layer

**There is no database.** All data is hardcoded in source files.

| File | What it contains |
|---|---|
| `app/(app)/lost/page.tsx` | 8 lost item listings (inline `lostItems` array) |
| `app/(app)/found/page.tsx` | 8 found item listings (inline `foundItems` array) |
| `app/(app)/profile/page.tsx` | Hardcoded user profile, 3 listings, stats |
| `app/lib/mock-messages.ts` | 5 mock users, 5 conversations, chat histories |
| `app/actions/auth.ts` | 1 hardcoded demo user (`demo@example.com`) |

When you add a database, each of these needs to be replaced:
1. Lost/found items → query a `listings` table
2. Profile data → query a `users` table
3. Messages → query `conversations` and `messages` tables
4. Auth → query `users` table in `getUserByEmail`

### Shared types

All types are in `app/lib/definitions.ts`:

```typescript
Item           // lost/found listing
SessionPayload // JWT payload shape
FormState      // login form error state (Zod-derived)
MessageUser    // user in a conversation
ChatMessage    // a single message
Conversation   // a conversation thread with metadata
```

`CURRENT_USER_ID = 'me'` is a constant used to identify the logged-in user's messages in mock data. Remove it when real auth is wired to the messaging system.

---

## 9. Feature guides

### Lost & Found listings

**Pages:** `/lost`, `/found`  
**Files:** `(app)/lost/page.tsx`, `(app)/found/page.tsx`, `components/items-filter.tsx`, `components/item-card.tsx`

Both pages are server components that hold hardcoded item arrays and render `<ItemsFilter>`. The filter component is a client component that handles search, category pills, and location dropdown entirely in local state — no server round-trip on filter changes.

Filtering logic (in `items-filter.tsx`):
- Search: case-insensitive substring match against `title` and `description`
- Category: exact match (or "All" to skip)
- Location: case-insensitive substring match (e.g. "Kresge" matches "Kresge College")

### Create a listing

**Page:** `/create`  
**Files:** `(app)/create/page.tsx`, `(app)/create/create-form.tsx`

`page.tsx` is an async server component that reads `?type=lost|found` from `searchParams` and passes `initialType` to the client form. This is necessary because `searchParams` is a Promise in Next.js 16 and can only be awaited in an async server context.

The form is UI-only — **the submit button does nothing**. No server action is wired to the form. Implement a `createListing` server action when adding a database.

### Messages

**Page:** `/messages?c=<id>`  
**Files:** `(app)/messages/page.tsx`, `components/messages/messages-view.tsx`, and all files in `components/messages/`

The URL parameter `?c=<conversationId>` drives which thread is open. The server page reads it and passes `activeId` down.

**Mobile vs. desktop behavior:**  
On mobile, only one panel is visible at a time — either the conversation list or the open thread. On desktop, both panels are visible side by side. This is controlled by Tailwind `hidden md:flex` / `flex` conditional classes in `MessagesView`.

**Message state:**  
Messages are stored in client state (`messagesByConversation` in `MessagesView`), seeded from `MOCK_MESSAGES` on first render. New messages sent during the session are appended immutably:

```typescript
setMessagesByConversation((prev) => ({
  ...prev,
  [newMessage.conversationId]: [...(prev[newMessage.conversationId] ?? []), newMessage],
}))
```

Messages do not persist across page refreshes — they will be reset to mock data. This is intentional until a database is added.

**Unread badge clearing:**  
When a conversation is opened, `useEffect` fires and calls `clearUnread(activeId)`. This zeros the count in `UnreadContext`, which propagates to the `Sidebar` badge immediately without a page reload.

**Height calculation:**  
The messages container uses `h-[calc(100dvh-80px)] md:h-screen`. On mobile, the `(app)` layout adds `pb-20` to the main content area (matching the 80px tab bar height), so the chat UI never renders behind the tab bar.

### Profile

**Page:** `/profile`  
**File:** `(app)/profile/page.tsx`

The profile page is a client component with three tabs (My Listings, Saved, Settings) driven by `useState<Tab>`. All data is hardcoded. Sign out calls the `logout` server action via a `<form action={logout}>` — this is intentional because server actions require a form or `startTransition` from the client.

---

## 10. Component conventions

### Badge

`components/ui/badge.tsx` — renders a colored pill for item types and statuses.

```typescript
type BadgeVariant = 'lost' | 'found' | 'active' | 'resolved'

<Badge variant="lost">lost</Badge>
<Badge variant="resolved">resolved</Badge>
```

### ItemCard

`components/item-card.tsx` — renders a single listing card. Links to `/${item.type}/${item.id}` (those detail pages don't exist yet).

### ItemsFilter

`components/items-filter.tsx` — client component. Takes `items`, `type`, and `reportHref` as props. Handles all filtering internally. Used by both `/lost` and `/found`.

### Sidebar

`components/sidebar.tsx` — renders the desktop sidebar and the mobile bottom tab bar from the same `navItems` array. Reads `totalUnread` from `UnreadContext` to show the Messages badge.

### Styling conventions

- **Design system:** dark zinc background (`zinc-950`), yellow-400 accent
- **Rounded corners:** `rounded-xl` for inputs/pills, `rounded-2xl` for cards/panels
- **Border color:** `border-zinc-800` (default), `border-zinc-700` (hover/focus)
- **Text hierarchy:** `text-white` (headings), `text-zinc-400` (body), `text-zinc-500/600` (meta/labels)
- **Interactive states:** `transition-colors` on links/buttons, `hover:bg-zinc-900` for nav items
- No separate CSS files — all styling is Tailwind utility classes directly on elements

---

## 11. Adding a new page

1. **Choose the right route group.** Authenticated page → `app/(app)/`. Public page → `app/(public)/`.

2. **Default to a server component.** Only add `'use client'` if the page itself needs hooks or event handlers. If only part of the page is interactive, extract a client component child.

3. **If you need URL search params**, make the page `async` and `await searchParams`:
   ```typescript
   export default async function MyPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
     const { q } = await searchParams
     // ...
   }
   ```

4. **Add the route to `proxy.ts`** (remember: rename to `middleware.ts` first) if it should be protected.

5. **Add a nav item to `Sidebar`** (`components/sidebar.tsx`, `navItems` array) if it needs a nav link.

---

## 12. Known gaps

These are real issues, not hypothetical. Ordered by how badly they'll bite you.

### Critical

| Issue | Where | Impact |
|---|---|---|
| `proxy.ts` is not active | `proxy.ts` | All routes are publicly accessible — no auth protection at all |
| Signup has no server action | `(public)/signup/page.tsx` | Submitting the signup form does nothing |
| Create listing has no server action | `(app)/create/create-form.tsx` | Submitting the create form does nothing |

### High

| Issue | Where | Impact |
|---|---|---|
| No database | All data files | Nothing persists; item listings and messages reset on reload |
| `getUserByEmail` rehashes on every request | `app/actions/auth.ts` | bcrypt.hash runs even for failed logins — slow and wasteful |
| Item detail pages don't exist | `components/item-card.tsx` links to `/{type}/{id}` | Every card click 404s |
| Messages not wired to real auth | `app/lib/mock-messages.ts` | `CURRENT_USER_ID = 'me'` is hardcoded; chat won't reflect the logged-in user |

### Medium

| Issue | Where | Impact |
|---|---|---|
| `AppNav` component is dead code | `components/app-nav.tsx` | Not imported anywhere — should be deleted |
| Photo upload has no backend | `create-form.tsx` | File is selected client-side but never sent anywhere |
| "Edit profile" button does nothing | `profile/page.tsx` | UI affordance with no action |
| "Change password" button does nothing | `profile/page.tsx` | UI affordance with no action |
| Profile data is hardcoded | `profile/page.tsx` | Shows "Sam Slug" for every user |
| Settings tab changes are not persisted | `profile/page.tsx` | College and notification preferences reset on reload |
| "Forgot password?" link goes to `#` | `login-form.tsx` | No password reset flow |
| Message state resets on page refresh | `messages-view.tsx` | Expected until DB is added, but worth noting |

### Low

| Issue | Where | Impact |
|---|---|---|
| No input validation on signup | `signup/page.tsx` | The password hint says "8+ chars, one number, one special character" but nothing enforces it |
| No UCSC email enforcement on login | `auth.ts` | Any email format passes Zod validation — not restricted to `@ucsc.edu` |
| Landing page stats are fake | `(public)/page.tsx` | "48 items recovered" is hardcoded copy |

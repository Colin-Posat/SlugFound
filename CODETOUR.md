# SlugFound — Code Tour

A complete walkthrough of the codebase for new teammates. Read top to bottom once and you should be able to find anything, change anything, and understand why things are the way they are.

---

## Table of Contents

1. [What the app is](#1-what-the-app-is)
2. [Tech stack at a glance](#2-tech-stack-at-a-glance)
3. [Folder structure](#3-folder-structure)
4. [How routing works](#4-how-routing-works)
5. [How auth and sessions work](#5-how-auth-and-sessions-work)
6. [The middleware file (and its current gotcha)](#6-the-middleware-file-and-its-current-gotcha)
7. [Database layer — current state](#7-database-layer--current-state)
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

- Post listings for items they've lost or found on campus
- Browse and filter all active listings
- Message other users directly about a specific item
- Track their own posts and account settings via a profile page

Access requires a `@ucsc.edu` email address (enforced at signup — not yet implemented — but the auth layer is ready for it).

**Current status:** The entire app is frontend-only with hardcoded mock data. The UI, routing, auth flow, and session management are all real and working. The database layer is stubbed — all item data is in-file arrays and the "database" is a single hardcoded demo user.

---

## 2. Tech stack at a glance

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI library | React 19 |
| Styling | Tailwind CSS v4 |
| Auth | JWT via `jose` + `bcryptjs` stored in an `httpOnly` cookie |
| Validation | Zod (login form only so far) |
| No database | All data is mock arrays in source files |

---

## 3. Folder structure

```
SlugFound/
├── proxy.ts                  ← Route protection logic (see §6 — has a naming gotcha)
├── next.config.ts            ← Empty Next.js config (no customisation yet)
├── tsconfig.json             ← Strict TypeScript, path alias @/* → root
├── .env.local                ← SESSION_SECRET lives here (git-ignored)
│
└── app/
    ├── layout.tsx            ← Root HTML shell (<html>, <body>, globals.css)
    ├── globals.css           ← Tailwind import + any global overrides
    │
    ├── (public)/             ← Route group: unauthenticated pages
    │   ├── layout.tsx        ← Public layout: sticky top nav with Sign in / Sign up
    │   ├── page.tsx          ← Landing page (hero, gated preview, features, CTA)
    │   ├── login/
    │   │   ├── page.tsx      ← Login page shell
    │   │   └── login-form.tsx← Client component — wired to login() server action
    │   └── signup/
    │       └── page.tsx      ← Signup form UI (not yet wired to a server action)
    │
    ├── (app)/                ← Route group: authenticated pages
    │   ├── layout.tsx        ← App layout: sidebar + mobile tab bar + UnreadProvider
    │   ├── lost/page.tsx     ← Browse lost items — server component, uses ItemsFilter
    │   ├── found/page.tsx    ← Browse found items — same pattern
    │   ├── create/
    │   │   ├── page.tsx      ← Server component: reads ?type param, renders CreateForm
    │   │   └── create-form.tsx ← Client component: the actual form with state
    │   ├── messages/
    │   │   └── page.tsx      ← Server component: awaits searchParams, renders MessagesView
    │   └── profile/
    │       └── page.tsx      ← Client component: profile, stats, tabs, settings
    │
    ├── actions/
    │   └── auth.ts           ← Server actions: login() and logout()
    │
    ├── components/
    │   ├── sidebar.tsx       ← Desktop sidebar + mobile tab bar (client, uses useUnread)
    │   ├── item-card.tsx     ← Reusable card for a single lost/found listing
    │   ├── items-filter.tsx  ← Client component: search, category pills, location filter
    │   ├── app-nav.tsx       ← Unused alternative nav (can be deleted)
    │   ├── ui/
    │   │   └── badge.tsx     ← Shared Badge: variants lost/found/active/resolved
    │   └── messages/
    │       ├── messages-view.tsx       ← Orchestrator: layout, URL state, message state
    │       ├── conversation-list.tsx   ← Left panel: search + conversation rows
    │       ├── conversation-list-item.tsx ← Single conversation row
    │       ├── message-thread.tsx      ← Right panel: header + bubbles + composer
    │       ├── message-bubble.tsx      ← Single chat bubble (sent = yellow, received = zinc)
    │       ├── message-composer.tsx    ← Textarea + send button
    │       └── empty-thread.tsx       ← Placeholder when no conversation is selected
    │
    └── lib/
        ├── definitions.ts    ← All shared TypeScript types + Zod schemas
        ├── session.ts        ← JWT encrypt/decrypt + cookie create/delete (server-only)
        ├── mock-messages.ts  ← Mock users, conversations, messages for the Messages feature
        └── unread-context.tsx← React context: unread counts shared between Sidebar and Messages
```

> **Route groups** — the `(public)` and `(app)` folder names are wrapped in parentheses. Next.js strips them from the URL, so they exist purely to share different layouts: the public layout has a top nav, the app layout has the sidebar.

---

## 4. How routing works

### URL → file mapping

Next.js App Router maps folders to URLs automatically. A file at `app/(app)/lost/page.tsx` becomes the route `/lost`. The `(app)` group name is invisible to the URL.

```
/                 → app/(public)/page.tsx
/login            → app/(public)/login/page.tsx
/signup           → app/(public)/signup/page.tsx
/lost             → app/(app)/lost/page.tsx
/found            → app/(app)/found/page.tsx
/create           → app/(app)/create/page.tsx
/create?type=found → same file, searchParams.type = 'found'
/messages         → app/(app)/messages/page.tsx
/messages?c=conv-1 → same file, searchParams.c = 'conv-1'
/profile          → app/(app)/profile/page.tsx
```

### Server vs. client components

By default every `page.tsx` and `layout.tsx` is a **server component** — it runs on the server, has no browser APIs, and can `await` data. To use React hooks (`useState`, `useEffect`, etc.) a file must declare `'use client'` at the top.

The pattern used throughout this app:

```
page.tsx (server)         ← reads searchParams Promise, passes data down as props
  └── some-form.tsx (client) ← uses useState, event handlers, useRouter
```

Example: `app/(app)/create/page.tsx` awaits `searchParams` and passes the resolved `initialType` to `CreateForm`, which handles all the interactive state.

### searchParams are Promises in Next.js 16

This is a breaking change from earlier versions. In any async server component page:

```typescript
// CORRECT (Next.js 16)
export default async function Page({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams
}

// WRONG — will throw in Next.js 16
export default function Page({ searchParams }: { searchParams: { c?: string } }) {
  const { c } = searchParams  // searchParams is a Promise, not a plain object
}
```

---

## 5. How auth and sessions work

### The full login flow

```
User submits LoginForm
  │
  ▼
login() server action  (app/actions/auth.ts)
  │  1. Validates email + password with Zod (LoginFormSchema)
  │  2. Looks up user by email (getUserByEmail — currently a stub)
  │  3. Compares password hash with bcrypt.compare()
  │  4. Calls createSession(user.id)
  │  5. redirect('/lost')
  │
  ▼
createSession()  (app/lib/session.ts)
  │  1. Builds a JWT payload: { userId, expiresAt: now + 7 days }
  │  2. Signs it with HS256 using SESSION_SECRET from .env.local
  │  3. Writes the signed JWT to an httpOnly cookie named 'session'
  │     - httpOnly: true  → JS on the page cannot read it
  │     - secure: true in production
  │     - sameSite: 'lax'
  │     - expires: 7 days
```

### Checking a session

`decrypt()` in `session.ts` verifies the JWT signature and returns the payload (or `null` if invalid/expired). It is called in `proxy.ts` on every request to determine if the user is authenticated.

### Logout

```typescript
export async function logout() {
  await deleteSession()   // deletes the 'session' cookie
  redirect('/login')
}
```

Called via a `<form action={logout}>` in the sidebar and profile page. Using a form + server action (rather than a `<Link>`) is important — it triggers a real POST which clears the cookie server-side.

### Demo credentials

The `getUserByEmail` stub in `auth.ts` hard-codes one user:

```
Email:    demo@example.com
Password: Password1!
```

When a real database is wired up, replace this function with an ORM query.

---

## 6. The middleware file (and its current gotcha)

Route protection logic lives in `proxy.ts` at the project root. It should block unauthenticated users from accessing `/lost`, `/found`, `/create`, `/profile`, and `/messages`, and redirect already-authenticated users away from `/login` and `/signup`.

**The gotcha:** Next.js only recognises middleware when the file is named `middleware.ts` (or `middleware.js`) **and** the exported function is named `middleware`. The current file is named `proxy.ts` with a function named `proxy` — so **it is not currently active**. The redirect logic exists but is never called.

To activate it, rename the file and its export:

```bash
mv proxy.ts middleware.ts
```

```typescript
// middleware.ts
export default async function middleware(req: NextRequest) { ... }
//                            ^^^^^^^^^^^ must be this name
```

Until that rename happens, any URL is reachable without authentication.

---

## 7. Database layer — current state

**There is no database.** All data is hardcoded in TypeScript source files:

| Data | Location |
|---|---|
| Lost items | `app/(app)/lost/page.tsx` — `lostItems` array |
| Found items | `app/(app)/found/page.tsx` — `foundItems` array |
| Users (auth) | `app/actions/auth.ts` — `getUserByEmail()` stub |
| Profile listings | `app/(app)/profile/page.tsx` — `userListings` array |
| Message users | `app/lib/mock-messages.ts` — `MOCK_USERS` |
| Conversations | `app/lib/mock-messages.ts` — `MOCK_CONVERSATIONS` |
| Messages | `app/lib/mock-messages.ts` — `MOCK_MESSAGES` |

### Wiring up a real database

The `getUserByEmail` function in `auth.ts` already has a comment showing the pattern:

```typescript
// Replace this stub:
async function getUserByEmail(email: string) { ... }

// With something like (using Drizzle ORM + Postgres):
// const user = await db.query.users.findFirst({ where: eq(users.email, email) })
```

For items, replace the in-file arrays with async data fetches at the top of each page:

```typescript
// app/(app)/lost/page.tsx
export default async function LostPage() {
  const items = await db.query.items.findMany({ where: eq(items.type, 'lost') })
  // ...
}
```

---

## 8. Shared types and data models

All shared TypeScript types live in `app/lib/definitions.ts`. Here's everything defined there:

```typescript
// ── Auth ──────────────────────────────────
LoginFormSchema   // Zod: { email: string, password: string }
FormState         // Server action return type: { errors?, message? }
SessionPayload    // JWT payload: { userId: string, expiresAt: Date }

// ── Item listings ─────────────────────────
Item              // { id, type: 'lost'|'found', title, category, location, time, description, emoji }

// ── Messaging ─────────────────────────────
MessageUser       // { id, name, initial, college? }
ChatMessage       // { id, conversationId, senderId, body, sentAt }
Conversation      // { id, otherUser, itemId, itemTitle, itemEmoji, itemType, lastMessagePreview, lastMessageAt, unreadCount }
CURRENT_USER_ID   // constant 'me' — identifies the logged-in user's messages
```

---

## 9. Feature walkthroughs

### Lost & Found listings

**Files:** `app/(app)/lost/page.tsx`, `app/(app)/found/page.tsx`, `app/components/items-filter.tsx`, `app/components/item-card.tsx`

Both pages are **server components** that pass their hardcoded item arrays to `ItemsFilter`. The pages themselves are minimal — just a header and a CTA button.

`ItemsFilter` is a **client component** that owns all interactivity:
- `search` state → filters `item.title` and `item.description` case-insensitively
- `activeCategory` state → exact match against `item.category`
- `activeLocation` state → partial match against `item.location`
- Shows a "No items match" empty state with a Clear filters button when the filtered result is empty

`ItemCard` renders a single item. It uses the `Badge` component for the lost/found type indicator and has a subtle lift hover (`-translate-y-0.5 + shadow`).

**Adding a new category:** add it to the `CATEGORIES` constant at the top of `items-filter.tsx`.

**Adding a new location:** add it to the `LOCATIONS` constant in the same file.

---

### Create a listing

**Files:** `app/(app)/create/page.tsx`, `app/(app)/create/create-form.tsx`

`page.tsx` is a **server component** that reads the `?type` query param (a Promise in Next.js 16) and passes `initialType: 'lost' | 'found'` to `CreateForm`. This means clicking "+ Report Found Item" on the Found page correctly pre-selects the "I found something" toggle.

`CreateForm` is a **client component** with two pieces of local state:
- `type: 'lost' | 'found'` — controls the toggle, placeholder text, submit button label, and the "Back" / "Cancel" links
- `selectedFile: File | null` — tracks the chosen photo; shows filename + size + Remove button after selection

The form is grouped into three visual card sections:
1. **What happened?** — type toggle + found-item tip
2. **About the item** — name, category, location, date, description
3. **Photo** — upload dropzone / file preview

**The form does not submit yet.** The `<form>` has no `action` — wiring it up means creating a server action in `app/actions/` following the same pattern as `login()`.

---

### Messages

**Files:** `app/(app)/messages/page.tsx`, `app/components/messages/*`, `app/lib/mock-messages.ts`, `app/lib/unread-context.tsx`

This is the most complex feature. Here's how it hangs together:

#### Data flow

```
MOCK_CONVERSATIONS + MOCK_MESSAGES  (mock-messages.ts)
  │
  ├─→ UnreadProvider  (unread-context.tsx, mounted in (app)/layout.tsx)
  │     Holds: unreadCounts per conversation, totalUnread
  │     Exposes: clearUnread(id) — called when a thread is opened
  │
  └─→ MessagesPage  (server component)
        awaits searchParams → extracts activeId (the ?c= param)
        renders MessagesView with conversations + activeId
          │
          ├─→ ConversationList  (client)
          │     Receives: conversations, activeId, unreadCounts (from context)
          │     Has: local search state
          │     Renders: ConversationListItem rows (each is a <Link href="/messages?c=id">)
          │
          └─→ MessageThread  (client)  — only if activeId is set
                Receives: conversation, messages, onSend, onBack
                Renders: header + scrollable bubble list + MessageComposer
```

#### URL-driven navigation

Conversations are opened by navigating to `/messages?c=<conversationId>`. Next.js re-runs the server page, extracts the new `activeId` from `searchParams`, and passes it down. React preserves all client state (`messagesByConversation`) because the component tree structure is unchanged.

#### Sending a message

`MessagesView` owns `messagesByConversation: Record<string, readonly ChatMessage[]>` in local state, seeded from `MOCK_MESSAGES`. When `handleSend` is called:

```typescript
setMessagesByConversation((prev) => ({
  ...prev,                                    // immutable spread
  [newMessage.conversationId]: [
    ...(prev[newMessage.conversationId] ?? []),
    newMessage,                               // append new message
  ],
}))
```

The new message is visible immediately. It does **not** persist across page refreshes (there's no database yet).

#### Unread badge clearing

When `activeId` changes, `MessagesView` runs a `useEffect` that calls `clearUnread(activeId)` from the `UnreadContext`. This sets that conversation's count to 0, which causes the Sidebar's `totalUnread` to decrement and the badge to update.

#### Mobile vs. desktop layout

`MessagesView` uses a two-column grid on `md:` (≥768px) screens. On mobile, only one panel is visible at a time:
- No `activeId` → show `ConversationList` only
- `activeId` present → show `MessageThread` only (with a ← back button that calls `router.push('/messages')`)

---

### Profile

**Files:** `app/(app)/profile/page.tsx`

The profile page is a **client component** (it needs `useState` for tabs). It has three tabs:

| Tab | Content |
|---|---|
| My Listings | Table of `userListings` with `Badge` components for type and status |
| Saved | Empty state with Browse links (feature not built yet) |
| Settings | College dropdown + notification preference checkboxes |

The **Sign out** button uses `<form action={logout}>` — this properly calls the `logout` server action which deletes the session cookie and redirects to `/login`. Do not change it to a `<Link>` (which would only navigate, not clear the session).

---

## 10. Shared UI components

### `app/components/ui/badge.tsx`

```typescript
type BadgeVariant = 'lost' | 'found' | 'active' | 'resolved'
<Badge variant="lost">lost</Badge>
```

Variants:
- `lost` — red tint
- `found` — green tint
- `active` — neutral zinc
- `resolved` — yellow tint

Use `Badge` any time you need a type or status indicator. Do not copy-paste the inline class strings.

### `app/components/items-filter.tsx`

Client component. Accepts `items: readonly Item[]`, `type: 'lost' | 'found'`, and `reportHref: string`. Handles all search/filter/empty-state UI. Both the Lost and Found pages delegate entirely to this component.

### `app/components/item-card.tsx`

Accepts an `Item` from `app/lib/definitions.ts`. Renders a linked card. Uses `Badge` internally. No state.

### `app/components/sidebar.tsx`

Client component. Uses `usePathname()` for active-route highlighting and `useUnread()` for the Messages unread count. Renders two separate layouts: a desktop sidebar (`hidden md:flex`) and a mobile bottom tab bar (`fixed bottom-0 md:hidden`).

---

## 11. Environment variables

One variable is required:

| Variable | File | Purpose |
|---|---|---|
| `SESSION_SECRET` | `.env.local` | Signs and verifies JWT session tokens |

`.env.local` is git-ignored. When setting up a fresh clone:

```bash
echo "SESSION_SECRET=some-long-random-string-here" > .env.local
```

If `SESSION_SECRET` is missing, `session.ts` will import `undefined` as the key and all JWTs will be signed with an empty key — login will appear to work but `decrypt()` will always return null.

---

## 12. Known gaps and next steps

This section is a prioritised punch list of what needs to happen before the app can be considered production-ready.

### Critical (must fix before real users)

| Issue | File | Notes |
|---|---|---|
| `proxy.ts` not active | `proxy.ts` | Rename to `middleware.ts`, rename function to `middleware`. Without this any URL is publicly accessible. |
| No real database | `app/actions/auth.ts`, list pages | Replace `getUserByEmail` stub and in-file item arrays with database queries. |
| Signup form has no server action | `app/(public)/signup/page.tsx` | Create `signup()` server action following the same pattern as `login()` in `auth.ts`. |
| Create form has no server action | `app/(app)/create/create-form.tsx` | Create `createListing()` server action to persist new items. |

### Important (before shipping)

| Issue | Notes |
|---|---|
| No `@ucsc.edu` email validation | Add `.refine(v => v.endsWith('@ucsc.edu'))` to `LoginFormSchema` and the future signup schema. |
| No item detail pages | `ItemCard` links to `/{type}/{id}` but those routes don't exist yet. |
| No real messaging backend | Messages are in-memory and reset on refresh. Need a database table and server actions. |
| No photo storage | The photo upload UI exists but the file is never sent anywhere. |
| `SESSION_SECRET` at startup | Add a check in `session.ts` that throws if the variable is missing. |

### Nice to have

| Issue | Notes |
|---|---|
| `app/components/app-nav.tsx` | Unused file — delete it. |
| Password reset flow | "Forgot password?" link in `login-form.tsx` currently goes to `#`. |
| Message persistence | Currently lost on refresh since all state is in-memory React `useState`. |
| `TOTAL_UNREAD` in sidebar | Seeded from mock data at module load; will need to pull live from DB once messages are persisted. |

---

*Last updated: April 2026 — reflects the codebase after the initial frontend build and polish pass.*

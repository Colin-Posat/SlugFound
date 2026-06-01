# SlugFound

A lost-and-found platform for UC Santa Cruz students. Post lost items, browse found ones, and message other students directly — all in one place.

Built with Next.js 16, React 19, Tailwind CSS v4, and Supabase (Auth, Postgres, Storage).

---

## Prerequisites

- **Node.js 18+** (check with `node -v`)
- **npm** (comes with Node — `npm -v` to verify)
- **A Supabase project** (free tier is fine — see step 2 below)

---

## Getting started

### 1. Clone and install

```bash
git clone <repo-url>
cd SlugFound
npm install
```

### 2. Create the Supabase project

1. Go to https://supabase.com/dashboard and click **"New project"**
2. Name: `slugfound` · Region: `West US (North California)` · Plan: Free
3. Save the database password — you'll need it later if you use the Supabase CLI
4. Once provisioned (~2 min), go to **Project Settings → API** and copy:
   - **Project URL** (`https://xxxxxx.supabase.co`)
   - **anon public** key (long JWT — safe for the browser, RLS protects the data)

### 3. Run the database migrations

The schema, RLS policies, indexes, triggers, and Storage bucket all live in
`/supabase/migrations/`. Apply them in order:

1. Open the SQL editor: `https://supabase.com/dashboard/project/<your-project-ref>/sql/new`
2. Paste each file's contents in numeric order, **clicking "Run" between each**:
   - `0001_profiles.sql` · `0002_items.sql` · `0003_storage.sql`
   - `0004_embeddings.sql` · `0005_item_coordinates.sql` · `0006_messaging.sql`
   - `0007_email_notifications.sql` · `0008_avatars_storage.sql` · `0009_reports.sql`
   - `0011_harden_functions.sql`

> `0010_message_webhook.sql` is a **template**, not a ready-to-run migration. It
> wires the new-message email webhook and needs your deployed app URL +
> `NOTIFY_WEBHOOK_SECRET` filled in first — see the email notifications section
> in [`DOCS.md`](./DOCS.md). Apply it only after the app is deployed.

> Optional: After signing up your first user, you can run `supabase/seed.sql` in
> the SQL editor to load sample items for development.

### 4. Disable email confirmation for local dev

In production you want email confirmation on. For local development, turn it off:

1. Go to **Auth → Providers → Email** in the Supabase dashboard
2. Toggle **"Confirm email"** OFF
3. Save

### 5. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Only the two Supabase keys are required to run the core app. The AI and email
keys enable optional features (photo search, AI scan, message emails).

> ⚠️ **Never commit `.env.local`.** It's already in `.gitignore`.
> The `anon` key is safe to ship to the browser. `SUPABASE_SERVICE_ROLE_KEY`,
> `RESEND_API_KEY`, and `NOTIFY_WEBHOOK_SECRET` are **server-only secrets** —
> they're read only in Server Actions / Route Handlers, never in client code.

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **"Get started"**,
sign up with a `@ucsc.edu` email, and you're in.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Project URL from Supabase Settings → API. Used by the browser and server clients. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Public anon key. Safe for the browser — RLS protects data. |
| `SUPABASE_SERVICE_ROLE_KEY` | Email only | Service role key (bypasses RLS). **Server-only.** Used by the email notification + unsubscribe routes (US 4.4). |
| `GEMINI_API_KEY` | AI only | Google Gemini key for photo search + embeddings. |
| `GROQ_API_KEY` | AI only | Groq key for the AI item scan on the create form. |
| `RESEND_API_KEY` | Email only | Resend API key for sending new-message emails. **Server-only.** |
| `EMAIL_FROM` | Email only | From address for emails (defaults to Resend's test sender). |
| `NOTIFY_WEBHOOK_SECRET` | Email only | Shared secret the Supabase webhook sends and the route verifies. **Server-only.** |
| `NEXT_PUBLIC_APP_URL` | Email only | Public base URL of the deployed app, used in email links + as the webhook target. |

> See [`.env.example`](./.env.example) for a copy-paste template. The old
> `SESSION_SECRET` (pre-Sprint-2 JWT auth) is no longer used.

---

## Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Next.js dev server with hot reload |
| `npm run build` | Production build (outputs to `.next/`) |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint across the project |
| `npm test` | Run Jest test suite once |
| `npm run test:watch` | Run Jest in watch mode (re-runs on file change) |
| `npm run test:coverage` | Run Jest with v8 coverage report (output in `coverage/`) |

---

## Testing

Tests live in `__tests__/` at the project root and use Jest + React Testing Library. Write tests **before** the implementation (TDD).

```bash
npm test                 # run all tests once
npm run test:watch       # watch mode — re-runs on save
npm run test:coverage    # generate coverage report (output in coverage/)
```

> Async Server Components cannot be unit-tested with Jest. For those, use E2E tests. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the full testing strategy.

---

## Project structure

```
app/
  (public)/          # Unauthenticated pages — landing, login, signup
  (app)/             # Authenticated pages — lost, found, items/[id], messages, create, profile
  actions/           # Next.js Server Actions (auth, items, messages, profile, reports)
  api/               # Route Handlers — photo-search, ai/scan-item, notifications/*
  components/        # Shared UI components
    messages/        # Messaging UI (real-time, Supabase-backed)
    ui/              # Primitive components (Badge)
  lib/
    supabase/        # Supabase client wrappers (browser, server, admin, proxy)
    email/           # Resend wrapper + new-message email template
    auth-context.tsx # React context exposing the current user/profile
    items.ts         # Items repository (server-side query helpers)
    item-status.ts   # Status transition rules; geo.ts, storage.ts — pure helpers
    definitions.ts   # Shared types
    format.ts        # Display helpers (timeAgo, initials)
proxy.ts             # Next.js 16 proxy — refreshes Supabase session + route guards
supabase/
  migrations/        # SQL migrations (apply in order)
  seed.sql           # Optional development seed data
```

See [`DOCS.md`](./DOCS.md) for the architecture deep dive.
See [`CODETOUR.md`](./CODETOUR.md) for a guided narrative tour.
See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the team workflow.

---

## Tech stack

| Technology | Version | Role |
|---|---|---|
| Next.js | 16.2.x | Framework (App Router) |
| React | 19.2.4 | UI |
| Tailwind CSS | v4 | Styling |
| Supabase | latest | Auth, Postgres, Storage, Realtime |
| `@supabase/ssr` | latest | Server-side rendering integration |
| `react-leaflet` / `leaflet` | 5.x / 1.9 | Maps (location picker + map view) |
| `resend` | latest | Transactional email (new-message notifications) |
| `@google/generative-ai` / `groq-sdk` | latest | AI photo search + item scan |
| `zod` | 4.x | Form validation |
| `sonner` | latest | Toast notifications |
| TypeScript | 5.x | Type safety |
| Jest | 30.x | Unit testing + coverage |
| React Testing Library | 16.x | Component testing |

---

## Contributing

Before making any changes, please read our [Contributing Guide](CONTRIBUTING.md) for the team workflow, coding standards, and documentation requirements.

**Quick checklist:**
- Run `/plan` before starting any feature
- Run `/code-review` after writing code
- Update relevant docs (DOCS.md, CODETOUR.md, README.md) based on what changed
- Run `/refactor-clean` before opening a PR

For the full workflow see [CONTRIBUTING.md](CONTRIBUTING.md).

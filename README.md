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
2. Paste each file's contents, **clicking "Run" between each**:
   - `supabase/migrations/0001_profiles.sql`
   - `supabase/migrations/0002_items.sql`
   - `supabase/migrations/0003_storage.sql`

> Optional: After signing up your first user, you can run `supabase/seed.sql` in
> the SQL editor to load 12 sample items for development.

### 4. Disable email confirmation for local dev

In production you want email confirmation on. For local development, turn it off:

1. Go to **Auth → Providers → Email** in the Supabase dashboard
2. Toggle **"Confirm email"** OFF
3. Save

### 5. Set up environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... your anon key here
```

> ⚠️ **Never commit `.env.local`.** It's already in `.gitignore`.
> The `anon` key is safe to ship to the browser; the `service_role` key is **not** — never put that in `.env.local` for a Next.js client app.

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
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Project URL from Supabase Settings → API. Used by both the browser and server clients. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Public anon key from Supabase Settings → API. Safe for the browser — Row Level Security policies protect data. |

> The old `SESSION_SECRET` (used by the pre-Sprint-2 JWT auth) is no longer
> required and can be removed from `.env.local`.

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
  (app)/             # Authenticated pages — lost, found, messages, create, profile
  actions/           # Next.js Server Actions (auth, items)
  components/        # Shared UI components
    messages/        # All messaging UI sub-components (still mock data)
    ui/              # Primitive components (Badge)
  lib/
    supabase/        # Supabase client wrappers (browser, server, proxy)
    auth-context.tsx # React context exposing the current user/profile
    items.ts         # Items repository (server-side query helpers)
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
| Next.js | 16.2.3 | Framework (App Router) |
| React | 19.2.4 | UI |
| Tailwind CSS | v4 | Styling |
| Supabase | latest | Auth, Postgres, Storage |
| `@supabase/ssr` | latest | Server-side rendering integration |
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

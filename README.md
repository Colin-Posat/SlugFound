# SlugFound

A lost-and-found platform for UC Santa Cruz students. Post lost items, browse found ones, and message other students directly — all in one place.

Built with Next.js 16, React 19, Tailwind CSS v4, and JWT-based sessions.

---

## Prerequisites

- **Node.js 18+** (check with `node -v`)
- **npm** (comes with Node — `npm -v` to verify)

---

## Getting started

### 1. Clone and install

```bash
git clone <repo-url>
cd SlugFound
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the project root:

```bash
cp .env.local.example .env.local   # if an example file exists
# — or create it manually:
touch .env.local
```

Open `.env.local` and add:

```env
SESSION_SECRET=your-secret-key-here
```

**For local development** any string works — for example:

```env
SESSION_SECRET=slugfound-local-dev-secret-change-in-production
```

> ⚠️ **Never commit `.env.local` to git.** It's already listed in `.gitignore`.  
> For production, generate a strong random secret: `openssl rand -hex 32`

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `SESSION_SECRET` | **Yes** | Secret key used to sign and verify JWT session tokens. Must be the same value across restarts — changing it invalidates all active sessions. |

That's the only variable the app needs right now. As the backend grows (database, email, storage) more will be added here.

---

## Demo credentials

The app ships with a hardcoded demo account for local development:

| Field | Value |
|---|---|
| Email | `demo@example.com` |
| Password | `Password1!` |

> This is defined in `app/actions/auth.ts` → `getUserByEmail`. Replace it when you wire up a real database.

---

## Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Next.js dev server with hot reload |
| `npm run build` | Production build (outputs to `.next/`) |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint across the project |

---

## Project structure

```
app/
  (public)/          # Unauthenticated pages — landing, login, signup
  (app)/             # Authenticated pages — lost, found, messages, create, profile
  actions/           # Next.js Server Actions (auth)
  components/        # Shared UI components
    messages/        # All messaging UI sub-components
    ui/              # Primitive components (Badge)
  lib/               # Utilities, types, mock data, session helpers
proxy.ts             # Route-guard middleware — ⚠️ see DOCS.md before touching
```

See [`DOCS.md`](./DOCS.md) for a full contributor guide and architecture walkthrough.  
See [`CODETOUR.md`](./CODETOUR.md) for a guided narrative tour of the codebase.

---

## Current state

The app is **frontend-only**. There is no database — all item listings and messages are hardcoded mock arrays in `app/lib/`. Authentication works (JWT sessions via `jose`), but the user lookup is a stub.

See the [Known gaps](./DOCS.md#known-gaps) section in DOCS.md for what's next.

---

## Tech stack

| Technology | Version | Role |
|---|---|---|
| Next.js | 16.2.3 | Framework (App Router) |
| React | 19.2.4 | UI |
| Tailwind CSS | v4 | Styling |
| `jose` | 6.x | JWT signing / verification |
| `bcryptjs` | 3.x | Password hashing |
| `zod` | 4.x | Form validation |
| TypeScript | 5.x | Type safety |

---

## Contributing

Before making any changes, please read our [Contributing Guide](CONTRIBUTING.md) for the team workflow, coding standards, and documentation requirements.

**Quick checklist:**
- Run `/plan` before starting any feature
- Run `/code-review` after writing code
- Update relevant docs (DOCS.md, CODETOUR.md, README.md) based on what changed
- Run `/refactor-clean` before opening a PR

For the full workflow see [CONTRIBUTING.md](CONTRIBUTING.md).

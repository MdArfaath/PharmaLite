# PharmaLite

Mobile-first, multi-tenant SaaS for small pharmacies. Simple and fast — inventory and sales in under 5 seconds. Built with Next.js (App Router) + TypeScript + Supabase.

> **Single source of truth:** see `PROJECT.md` for the full architecture, schema, business rules, conventions, and module status. Read it before changing anything.

## Tech stack

- **Next.js 14 (App Router) + TypeScript** — UI + API routes
- **Supabase** — Postgres, Auth, Row Level Security (multi-tenant isolation)
- **Tailwind CSS** — styling (teal brand accent; amber/red/green semantic states)
- **TanStack Query** — server state; **Zustand** — small client state (later modules)
- **React Hook Form + Zod** — forms and validation
- **Lucide** — icons; **sonner** — toasts; **date-fns** — dates

## Prerequisites

- Node.js 18.18+ (or 20+)
- A Supabase project (free tier is fine)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create the database.** In your Supabase project's SQL editor, run the
   migrations in order (or use the Supabase CLI):

   ```
   supabase/migrations/0001_init_tenancy.sql
   supabase/migrations/0002_inventory.sql
   supabase/migrations/0003_sales.sql
   supabase/migrations/0004_rls_policies.sql
   supabase/migrations/0005_functions.sql
   supabase/migrations/0006_views.sql
   ```

   (Optional dev data: `supabase/seed.sql` — requires an auth user first; the
   normal path is to sign up through the app.)

3. **Configure environment.** Copy `.env.example` to `.env.local` and fill in
   your project URL and anon key (Supabase → Project Settings → API):

   ```bash
   cp .env.example .env.local
   ```

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

   The service-role key is only needed for future privileged tasks; leave it
   unset for now.

4. **Run**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000 → you'll be redirected to `/login`. Create a shop
   from `/signup`.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run typecheck` — TypeScript check (no emit)
- `npm run lint` — Next.js/ESLint

## Project layout

```
src/
  app/            # routes: (auth) shell + (app) shell + dashboard/settings/…
  components/     # ui primitives, layout shell, common states
  features/       # domain hooks + Zod schemas (auth, dashboard, …)
  lib/            # supabase clients, db types, utils, constants
  providers/      # React Query + Toaster
  middleware.ts   # session refresh + route guards
supabase/
  migrations/     # database as code (0001–0006)
  seed.sql        # dev-only seed
```

## Notes

- **Multi-tenant from day one.** Every row carries `shop_id`; Postgres RLS scopes
  every read/write to the caller's shop. See `PROJECT.md` §16.
- **`@supabase/supabase-js` is pinned** to `2.49.4` for compatibility with
  `@supabase/ssr@0.6.1`. Don't bump it without re-checking the typed client.
- Fonts use a system stack (no external font fetch at build time).

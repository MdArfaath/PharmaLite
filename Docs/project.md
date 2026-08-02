# PROJECT.md — PharmaLite (working title)

> **Single source of truth** for this project. Every architectural decision, naming
> convention, business rule, and module status lives here. Update this file whenever a
> decision is made. If it isn't in PROJECT.md, it isn't decided.

---

## 0. Document Status

| Field | Value |
|---|---|
| Version | 1.0 (Architecture — pending approval) |
| Stage | Design only. **No application code written yet.** |
| Last updated | 2026-07-30 |
| Owner | You (product) + Claude (architect) |

---

## 1. Project Vision

**What it is:** A mobile-first SaaS for small pharmacies to manage inventory and sales.

**First customer:** A single-owner medical shop (your uncle), no employees, used mostly on an Android phone.

**Product feel:** As simple as WhatsApp or Google Keep. Every common operation (sell a medicine, add stock, check low stock) completes in **under 5 seconds**.

**Non-goals for v1 (explicitly out of scope):** barcode scanning, billing/invoices, GST, AI, reports/analytics, employee/role management, purchase orders, accounting, ERP features.

**Long-term:** Multi-tenant SaaS sold to many pharmacy owners, with subscription plans. Therefore the data model and security are built multi-tenant **from day one**, even though only one shop exists at launch.

**Guiding tension:** _Simple UX, serious architecture._ The screens are dumb-simple; the foundation underneath (tenancy, security, extensibility) is production-grade.

---

## 2. Core Principles (the "why" behind everything)

1. **Mobile-first, thumb-first.** Design for a 360px-wide Android screen held in one hand. Desktop is a bonus, never the primary target.
2. **Speed is a feature.** Fewer taps > more options. Sensible defaults > configuration. Optimistic UI where safe.
3. **Multi-tenant from line one.** Every business row carries `shop_id`. No query ever runs without a tenant boundary. This is enforced at the **database** layer (Row Level Security), not just in app code, so a bug in the app can never leak another shop's data.
4. **Least privilege by default.** The client talks to the DB with the user's own identity; the database itself decides what they can see.
5. **Boring, proven tech.** Next.js + Supabase + Postgres. No exotic dependencies. Easy to hire for, easy to maintain.
6. **Don't overengineer.** No microservices, no event bus, no GraphQL, no Redux. Add complexity only when a real need appears.
7. **Extensible, not speculative.** We leave clean seams for future plans/features (subscriptions, suppliers, multi-user) but do not build them in v1.

---

## 3. Tech Stack (decided)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | SSR/edge + one codebase for UI and API routes. App Router gives Server Components (less JS shipped to a phone), layouts, and route groups. TypeScript catches whole classes of bugs before runtime — essential for a product sold to others. |
| Styling | **Tailwind CSS** | Utility-first = fast, consistent, tiny bundle, trivial to keep mobile-first with responsive prefixes. No CSS files to maintain. |
| Backend / DB / Auth | **Supabase (Postgres + Auth + RLS + Storage)** | One managed backend: relational DB, authentication, row-level security, auto-generated APIs, realtime. Removes an entire tier of custom backend code. Postgres RLS is the killer feature for multi-tenancy. |
| Hosting | **Vercel** | First-class Next.js host, edge network, zero-config deploys, preview environments per PR. |
| Server state / data fetching | **TanStack Query (React Query)** | Caching, background refetch, optimistic updates, retries — exactly what a data-heavy CRUD app needs. Keeps components clean. |
| Client/UI state | **Zustand** (only where needed) | Tiny, unopinionated global store for the few pieces of true client state (e.g. the in-progress "cart" of a sale, UI toggles). We deliberately avoid Redux. |
| Forms | **React Hook Form** | Minimal re-renders (great on low-end phones), simple API. |
| Validation | **Zod** | One schema reused for form validation **and** server/API validation **and** TypeScript types. Single source of truth for shapes. |
| Icons | **Lucide React** | Clean, consistent, tree-shakeable. |
| Dates | **date-fns** | Lightweight, tree-shakeable date math for expiry logic. |
| Notifications/toasts | **sonner** | Tiny, accessible toast lib for the "Sold ✓" / "Saved ✓" feedback that makes the app feel fast. |
| Tables/lists | Native + **@tanstack/react-virtual** (only if lists get long) | Virtualize inventory only when needed; don't pull it in prematurely. |

**Rejected alternatives (and why):**
- _Redux Toolkit_ — too heavy for this app's tiny amount of global state.
- _Prisma_ — redundant with Supabase's generated client + RLS; adds a second source of schema truth and complicates RLS. We use Supabase's typed client instead.
- _NextAuth_ — Supabase Auth already integrates with RLS via JWT; using NextAuth would fight the RLS model.
- _GraphQL_ — unnecessary indirection for straightforward CRUD.

---

## 4. High-Level Software Architecture

```
                         ┌──────────────────────────────┐
                         │         Android phone         │
                         │   (Chrome / installed PWA)    │
                         └───────────────┬───────────────┘
                                         │ HTTPS
                                         ▼
                ┌───────────────────────────────────────────────┐
                │                 Vercel Edge/CDN                │
                │        Next.js App Router application          │
                │                                                │
                │  ┌───────────────┐      ┌───────────────────┐  │
                │  │ Server         │      │ Client Components │  │
                │  │ Components     │      │ (interactive UI)  │  │
                │  │ (render, read) │      │  + React Query    │  │
                │  └──────┬─────────┘      └─────────┬─────────┘  │
                │         │                          │            │
                │  ┌──────▼──────────────────────────▼────────┐  │
                │  │  Data Access Layer (lib/db, lib/supabase) │  │
                │  │  - server client (RLS via user JWT)       │  │
                │  │  - browser client (RLS via user JWT)      │  │
                │  │  - admin client (service role, server-    │  │
                │  │    only, used ONLY for privileged tasks)  │  │
                │  └──────────────────┬────────────────────────┘ │
                └─────────────────────┼──────────────────────────┘
                                      │  Supabase JS SDK (PostgREST + GoTrue)
                                      ▼
        ┌───────────────────────────────────────────────────────────────┐
        │                          SUPABASE                              │
        │                                                                │
        │   ┌────────────┐   ┌─────────────────────────────────────────┐ │
        │   │  GoTrue     │   │              PostgreSQL                 │ │
        │   │  (Auth)     │   │                                         │ │
        │   │  issues JWT │──▶│  Row Level Security on EVERY table      │ │
        │   │  w/ shop_id │   │  Tables: shops, profiles, medicines,    │ │
        │   └────────────┘   │  sales, sale_items, suppliers, plans...  │ │
        │                    │  Functions/Triggers, Views, Policies     │ │
        │                    └─────────────────────────────────────────┘ │
        └───────────────────────────────────────────────────────────────┘
```

**Key idea:** The Next.js app is mostly a smart UI. The *authority on who-can-see-what lives in Postgres RLS*. The app never needs to remember to filter by `shop_id`; the database enforces it on every read and write.

**Three DB access modes (strict rules):**
- **Browser client** — uses the logged-in user's JWT. RLS applies. Used for all normal reads/writes from client components.
- **Server client** — created per-request in Server Components / Route Handlers using the user's session cookie. RLS applies. Used for SSR reads and mutations that benefit from running on the server.
- **Admin (service-role) client** — bypasses RLS. **Server-only. Never imported into any client bundle.** Used only for narrow privileged operations (e.g. provisioning a shop + profile atomically during signup, or future billing webhooks). Guarded behind explicit, audited functions.

---

## 5. Folder Structure

```
pharmalite/
├─ PROJECT.md                      # THIS FILE — single source of truth
├─ README.md
├─ .env.local                      # local secrets (gitignored)
├─ .env.example                    # documents required env vars
├─ next.config.mjs
├─ tailwind.config.ts
├─ tsconfig.json
├─ package.json
│
├─ supabase/                       # DB as code (version-controlled)
│  ├─ migrations/                  # timestamped SQL migrations
│  │  ├─ 0001_init_tenancy.sql     # shops, plans, profiles
│  │  ├─ 0002_inventory.sql        # medicines, suppliers
│  │  ├─ 0003_sales.sql            # sales, sale_items
│  │  ├─ 0004_rls_policies.sql     # all RLS policies
│  │  ├─ 0005_functions.sql        # helpers, provisioning fn, triggers
│  │  └─ 0006_views.sql            # dashboard/low-stock/expiry views
│  ├─ seed.sql                     # dev seed data
│  └─ config.toml
│
├─ public/
│  ├─ manifest.webmanifest         # PWA (installable on Android)
│  ├─ icons/                       # app icons
│  └─ favicon.ico
│
└─ src/
   ├─ app/                         # Next.js App Router
   │  ├─ layout.tsx                # root layout: fonts, providers, <Toaster/>
   │  ├─ globals.css               # Tailwind base + theme tokens
   │  ├─ page.tsx                  # "/" → redirect to /dashboard or /login
   │  │
   │  ├─ (auth)/                   # route group: unauthenticated screens
   │  │  ├─ layout.tsx             # centered card layout, no bottom nav
   │  │  ├─ login/page.tsx
   │  │  ├─ signup/page.tsx        # creates shop + owner (provisioning)
   │  │  └─ callback/route.ts      # Supabase auth callback handler
   │  │
   │  ├─ (app)/                    # route group: authenticated shell
   │  │  ├─ layout.tsx             # guards session; renders BottomNav + header
   │  │  ├─ dashboard/page.tsx
   │  │  ├─ inventory/
   │  │  │  ├─ page.tsx            # medicine list; search by name/brand/manufacturer
   │  │  │  ├─ new/page.tsx        # add a new medicine
   │  │  │  └─ [medicineId]/
   │  │  │     ├─ page.tsx         # medicine detail
   │  │  │     └─ add-stock/page.tsx
   │  │  ├─ sell/page.tsx          # FAST sell: Recently-Sold chips + search (core flow)
   │  │  ├─ alerts/
   │  │  │  ├─ low-stock/page.tsx
   │  │  │  └─ expiry/page.tsx
   │  │  ├─ sales/
   │  │  │  ├─ page.tsx            # sales history
   │  │  │  └─ [saleId]/page.tsx   # sale detail
   │  │  └─ settings/
   │  │     ├─ page.tsx            # shop profile, thresholds
   │  │     └─ account/page.tsx    # email/password, sign out
   │  │
   │  └─ api/                      # Route Handlers (server-only endpoints)
   │     ├─ health/route.ts
   │     └─ (most data access is direct Supabase; API routes only where
   │         server-side logic/secrets are required, e.g. provisioning,
   │         future Stripe webhooks)
   │
   ├─ components/
   │  ├─ ui/                       # primitives (Button, Input, Sheet, Card…)
   │  ├─ layout/                   # BottomNav, AppHeader, PageContainer
   │  ├─ inventory/                # MedicineCard, StockBadge, ExpiryBadge…
   │  ├─ sell/                     # SellSearch, RecentlySold, QuickAddChip, CartSheet, QtyStepper…
   │  ├─ sales/                    # SaleRow, SaleSummary…
   │  └─ common/                   # EmptyState, ConfirmDialog, Loading…
   │
   ├─ features/                    # feature-scoped logic (hooks + queries)
   │  ├─ auth/
   │  │  ├─ useSession.ts
   │  │  └─ authActions.ts
   │  ├─ inventory/
   │  │  ├─ queries.ts             # React Query hooks (useMedicines…)
   │  │  └─ schema.ts              # Zod schemas for medicine forms
   │  ├─ sell/
   │  │  ├─ queries.ts
   │  │  ├─ schema.ts
   │  │  └─ store.ts               # Zustand cart store
   │  ├─ sales/queries.ts
   │  ├─ alerts/queries.ts
   │  └─ settings/{queries.ts,schema.ts}
   │
   ├─ lib/
   │  ├─ supabase/
   │  │  ├─ client.ts              # browser client (RLS)
   │  │  ├─ server.ts              # server client from cookies (RLS)
   │  │  ├─ admin.ts               # service-role client (server-only!)
   │  │  └─ middleware.ts          # session refresh helper
   │  ├─ db/
   │  │  └─ types.ts               # generated Supabase types
   │  ├─ utils/
   │  │  ├─ dates.ts               # expiry helpers
   │  │  ├─ money.ts               # integer-paise currency helpers
   │  │  └─ format.ts
   │  └─ constants.ts              # thresholds defaults, route names
   │
   ├─ providers/
   │  ├─ QueryProvider.tsx         # TanStack Query client
   │  └─ AppProviders.tsx          # composes providers for root layout
   │
   ├─ hooks/                       # generic reusable hooks (useDebounce…)
   ├─ styles/                      # theme tokens if extracted
   └─ middleware.ts                # Next middleware: refresh session, route guard
```

**Why this shape:**
- **Route groups `(auth)` / `(app)`** give two different shells (login card vs. app-with-bottom-nav) without polluting the URL.
- **`features/` vs `components/`** — components are dumb/presentational and reusable; `features/` holds the data hooks (React Query), Zod schemas, and stores tied to a domain. This keeps screens thin and testable.
- **`supabase/migrations`** — the database is code. Anyone can rebuild the DB from zero. Critical for shipping to many customers later.
- **`lib/supabase/admin.ts` isolated** — makes it obvious and auditable which code path can bypass RLS.

---

## 6. Database Architecture

**Engine:** PostgreSQL (Supabase).
**Tenancy model:** **Shared database, shared schema, row-level isolation via `shop_id` + RLS.** This is the standard SaaS pattern for many small tenants — cheapest to operate, easiest to maintain, and secure when RLS is enforced. (We are *not* using schema-per-tenant or DB-per-tenant; those add operational cost that a many-small-shops product can't justify.)

**Golden rules:**
1. Every business table has a non-null `shop_id uuid references shops(id)`.
2. Every business table has RLS **enabled** with policies that check `shop_id` against the caller's shop.
3. Money is stored as **integer paise** (`bigint`), never floats — no rounding errors.
4. Quantities are integers.
5. Timestamps are `timestamptz`, defaulting to `now()`.
6. Soft-delete via `deleted_at timestamptz null` where history matters (medicines, suppliers). Sales are never deleted.
7. `created_at` / `updated_at` on every table; `updated_at` maintained by trigger.

**How the tenant is known:** On signup we store the user's `shop_id` and `role` in a `profiles` row keyed by `auth.uid()`. A SQL helper `auth_shop_id()` reads the current user's shop. RLS policies call it. (We can additionally stamp `shop_id` into the JWT via a custom access-token hook later for zero-lookup checks; the `profiles`-based helper works from day one.)

---

## 7. Entity Relationship Diagram

```
   ┌───────────────┐          ┌─────────────────┐
   │     plans     │          │   auth.users    │  (managed by Supabase Auth)
   │───────────────│          │─────────────────│
   │ id (pk)       │          │ id (pk)         │
   │ code (unique) │          │ email           │
   │ name          │          └────────┬────────┘
   │ price_paise   │                   │ 1:1
   │ limits (jsonb)│                   ▼
   │ is_active     │          ┌─────────────────┐
   └──────┬────────┘          │    profiles     │
          │ 1:N               │─────────────────│
          ▼                   │ id (pk)=user id │
   ┌───────────────┐  1:N     │ shop_id (fk) ───┼──┐
   │     shops     │◀─────────│ full_name       │  │
   │───────────────│          │ role            │  │
   │ id (pk)       │          │ created_at      │  │
   │ name          │          └─────────────────┘  │
   │ plan_id (fk)  │                                │
   │ owner_user_id │◀───────────────────────────────┘  (owner backref)
   │ phone         │
   │ settings jsonb│   (low_stock_threshold, expiry_window_days, currency…)
   │ status        │
   │ created_at    │
   └──┬───┬───┬────┘
      │   │   │ 1:N to every business table below (all carry shop_id)
      │   │   │
      │   │   └──────────────────────────────┐
      │   │                                   ▼
      │   │                          ┌──────────────────┐
      │   │                          │    suppliers     │
      │   │                          │──────────────────│
      │   │                          │ id (pk)          │
      │   │                          │ shop_id (fk)     │
      │   │                          │ name             │
      │   │                          │ phone            │
      │   │                          │ note             │
      │   │                          │ deleted_at       │
      │   │                          └────────┬─────────┘
      │   │                                   │ 0:N (optional)
      │   ▼                                   ▼
      │  ┌────────────────────────────────────────────┐
      │  │                medicines                    │
      │  │─────────────────────────────────────────────│
      │  │ id (pk)                                     │
      │  │ shop_id (fk) ──────────────► shops          │
      │  │ name                                        │
      │  │ brand / manufacturer                        │
      │  │ unit               (strip, bottle, piece…)  │
      │  │ sku (nullable)                              │
      │  │ supplier_id (fk, nullable) ──► suppliers    │
      │  │ quantity           (int, on-hand)           │
      │  │ low_stock_threshold(int, nullable override) │
      │  │ purchase_price_paise                        │
      │  │ selling_price_paise                         │
      │  │ batch_no (nullable)                         │
      │  │ expiry_date (date, nullable)                │
      │  │ deleted_at                                  │
      │  │ created_at / updated_at                     │
      │  └───────────────┬─────────────────────────────┘
      │                  │ 1:N
      │                  ▼
      │        ┌────────────────────┐
      │        │    sale_items      │
      │        │────────────────────│
      │        │ id (pk)            │
      │        │ shop_id (fk)       │  (denormalized for RLS + fast queries)
      │        │ sale_id (fk) ──────┼──┐
      │        │ medicine_id (fk)   │  │
      │        │ medicine_name      │  │ (snapshot — name at time of sale)
      │        │ quantity           │  │
      │        │ unit_price_paise   │  │ (snapshot — price at time of sale)
      │        │ line_total_paise   │  │
      │        └────────────────────┘  │
      │                                 │ N:1
      ▼                                 ▼
   ┌────────────────────────────────────────────┐
   │                   sales                     │
   │─────────────────────────────────────────────│
   │ id (pk)                                     │
   │ shop_id (fk) ──────────────► shops          │
   │ total_paise                                 │
   │ item_count                                  │
   │ payment_method   (cash/other — free, no GST)│
   │ note (nullable)                             │
   │ sold_by (fk → profiles/auth.uid)            │
   │ created_at                                  │
   └─────────────────────────────────────────────┘

   stock_movements — ACTIVE audit log of every quantity change
   ┌─────────────────────────────────────────────┐
   │ id, shop_id, medicine_id, delta, reason,     │
   │ ref_type(sale/stock/manual), ref_id,         │
   │ created_by, created_at                       │
   └─────────────────────────────────────────────┘
   Written by record_sale / void_sale / add_stock inside their transactions.
```

**Design notes / why:**
- **`sale_items` snapshots name + price.** If a medicine is later renamed or repriced, historical sales stay accurate. This is a hard requirement for anything money-related.
- **`shop_id` denormalized onto `sale_items`.** Lets RLS check tenancy on that table directly and avoids a join on every policy check — faster and simpler policies.
- **`medicines.quantity` is the live on-hand number.** Selling decrements it, adding stock increments it, voiding restores it — always inside a transaction. Every change also writes a `stock_movements` row (**active in v1**), so on-hand stock is fully auditable and voids are clean.
- **Batch/expiry on the medicine row (v1 simplification).** A truly correct system tracks multiple batches per medicine. For a one-owner shop that's overkill and slows data entry. v1: one primary batch/expiry per medicine row. **Known limitation, documented below.** Future: promote batches to their own `medicine_batches` table; `medicines` becomes the catalog, batches hold quantity+expiry. The `stock_movements` seam and snapshotting make that migration safe.
- **`plans` table exists in v1 but is barely used.** One row (`free`/`solo`) seeded; every shop points at it. This is the seam for subscriptions: later add `subscriptions`, Stripe IDs, and enforce `plans.limits` (e.g. max medicines) in RLS or app code. We build the table now so the FK exists and no migration pain later.

---

## 8. Database Tables (v1 spec)

> Column-level DDL will live in `supabase/migrations`. This is the agreed spec.

### `plans`
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| code | text unique | e.g. `solo`, `pro` |
| name | text | |
| price_paise | bigint | 0 for free |
| limits | jsonb | `{ "max_medicines": null, "max_users": 1 }` |
| is_active | boolean | |
| created_at | timestamptz | |

### `shops`
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| name | text not null | |
| plan_id | uuid fk → plans | |
| owner_user_id | uuid fk → auth.users | |
| phone | text | |
| settings | jsonb | `{ low_stock_threshold:10, expiry_window_days:30, currency:"INR" }` |
| status | text | `active` / `suspended` |
| created_at, updated_at | timestamptz | |

### `profiles`  (1:1 with auth.users)
| column | type | notes |
|---|---|---|
| id | uuid pk (= auth.users.id) | |
| shop_id | uuid fk → shops not null | **the tenant key for this user** |
| full_name | text | |
| role | text | `owner` (only role in v1) |
| created_at | timestamptz | |

### `suppliers`
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| shop_id | uuid fk not null | |
| name | text not null | |
| phone | text | |
| note | text | |
| deleted_at | timestamptz null | soft delete |
| created_at, updated_at | timestamptz | |

### `medicines`
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| shop_id | uuid fk not null | |
| name | text not null | |
| brand | text | |
| manufacturer | text | |
| unit | text | strip/bottle/piece/… |
| sku | text null | |
| supplier_id | uuid fk → suppliers null | |
| quantity | int not null default 0 | on-hand |
| low_stock_threshold | int null | overrides shop default when set |
| purchase_price_paise | bigint default 0 | |
| selling_price_paise | bigint default 0 | |
| batch_no | text null | v1: single batch |
| expiry_date | date null | v1: single expiry |
| deleted_at | timestamptz null | |
| created_at, updated_at | timestamptz | |
| indexes | | `(shop_id, name)`, `(shop_id, quantity)`, `(shop_id, expiry_date)`, search index on `lower(name||' '||brand||' '||manufacturer)` (or `pg_trgm`) scoped by shop |

### `sales`
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| shop_id | uuid fk not null | |
| total_paise | bigint not null | |
| item_count | int not null | |
| payment_method | text default 'cash' | |
| note | text null | |
| status | text not null default 'completed' | `completed` / `voided` |
| voided_at | timestamptz null | set when voided |
| voided_reason | text null | free text |
| voids_sale_id | uuid fk → sales null | if this sale is a correction, points to the sale it replaced |
| sold_by | uuid fk → auth.users | |
| created_at | timestamptz | |
| indexes | | `(shop_id, created_at desc)`, `(shop_id, status)` |

> **Void + re-record model:** sales are never edited or deleted in place. Voiding flips `status` to `voided`, restores stock, and keeps the row visible (struck-through). "Edit" = void the old sale + create a new corrected one whose `voids_sale_id` links back. This preserves full money/history integrity.

### `sale_items`
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| shop_id | uuid fk not null | denormalized |
| sale_id | uuid fk → sales not null | on delete cascade |
| medicine_id | uuid fk → medicines | |
| medicine_name | text not null | snapshot |
| quantity | int not null | |
| unit_price_paise | bigint not null | snapshot |
| line_total_paise | bigint not null | |
| indexes | | `(shop_id, medicine_id)`, `(sale_id)` |

### `stock_movements`  (ACTIVE in v1)
Every change to `medicines.quantity` writes one row here, so on-hand stock is always explainable and auditable. Populated by the `add_stock`, `record_sale`, and `void_sale` RPCs inside their transactions.
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| shop_id | uuid fk not null | |
| medicine_id | uuid fk → medicines not null | |
| delta | int not null | +restock, −sale, +void-restore |
| reason | text not null | `restock` / `sale` / `void` / `adjust` |
| ref_type | text null | `sale` / `stock` / `manual` |
| ref_id | uuid null | e.g. the sale id |
| created_by | uuid fk → auth.users | |
| created_at | timestamptz | |
| indexes | | `(shop_id, medicine_id, created_at desc)` |

### Views / search helpers (for fast reads)
- `v_low_stock` — medicines where `quantity <= coalesce(low_stock_threshold, shop.low_stock_threshold)`.
- `v_expiring_soon` — medicines where `expiry_date <= now() + shop.expiry_window_days`.
- `v_dashboard_stats` — counts + today's sales total for the caller's shop.
- `search_medicines(term)` — matches term against **name, brand, manufacturer** (case-insensitive/partial), excludes soft-deleted, scoped by shop; backs both Inventory and Sell search.
- `v_recently_sold` — top medicines by sale frequency/recency (last 30 days, non-voided sales), in-stock only; backs the Sell "Recently Sold" chips.
All views/functions inherit RLS from base tables (or are `security_invoker`).

---

## 9. Relationships (summary)

- `plans (1) ─▶ (N) shops` — a shop is on one plan.
- `shops (1) ─▶ (1) owner` via `owner_user_id`; `shops (1) ─▶ (N) profiles`.
- `auth.users (1) ─▶ (1) profiles` — a user belongs to exactly one shop in v1.
- `shops (1) ─▶ (N) medicines / suppliers / sales / sale_items`.
- `suppliers (1) ─▶ (N) medicines` (optional).
- `medicines (1) ─▶ (N) sale_items`.
- `sales (1) ─▶ (N) sale_items` (cascade delete of items with sale — though sales are never deleted in practice).

**Cardinality decision:** one user ↔ one shop in v1 (simplest, matches the single-owner reality). The `profiles.shop_id` design *allows* future multi-shop or multi-user by making the membership a row, so we can evolve to a `memberships` join table later without breaking anything.

---

## 10. Authentication Flow

**Provider:** Supabase Auth (GoTrue), email + password for v1 (magic link/OTP optional later). Sessions stored in secure httpOnly cookies via the Supabase SSR helpers so both Server Components and the browser share one session.

### Sign-up (new shop provisioning)
```
1. User submits { shopName, fullName, email, password } on /signup.
2. Client calls supabase.auth.signUp(email, password).
3. On success we must atomically create: a shops row + a profiles row.
   → This is done by a SECURITY DEFINER Postgres function `provision_shop(...)`
     called via RPC, OR by a Route Handler using the admin client, so the two
     inserts happen together and RLS can't block the bootstrap step.
   → shops.owner_user_id = auth.uid(); profiles.id = auth.uid();
     profiles.shop_id = new shop id; role = 'owner'; plan = default 'solo'.
4. Email confirmation (optional toggle). Once confirmed → session active.
5. Redirect to /dashboard.
```
**Why a provisioning function:** a brand-new user has no `profiles` row yet, so RLS-guarded inserts would have nothing to check against — a chicken-and-egg. A single `SECURITY DEFINER` function (or admin-client route) breaks the cycle safely and atomically. This is the *only* privileged write in v1.

### Login
```
1. /login → supabase.auth.signInWithPassword.
2. Session cookie set. Middleware refreshes it on each request.
3. Redirect to /dashboard.
```

### Session handling & route protection
- `src/middleware.ts` runs on every `(app)` route: refreshes the Supabase session and, if there's no session, redirects to `/login`.
- `(app)/layout.tsx` additionally fetches the profile/shop server-side; if missing, forces re-provision or logout.
- All data queries carry the user JWT → RLS guarantees they only ever see their `shop_id`.

### Logout
- `supabase.auth.signOut()` → clear cookies → redirect `/login`.

### Password reset
- Standard Supabase reset-email flow → `/(auth)/callback` handles the token → set new password.

---

## 11. API Architecture

**Philosophy: "thin API, thick database."** Because Supabase exposes Postgres safely through PostgREST + RLS, **most reads/writes go directly from the app to Supabase using the typed client** — no hand-written REST layer to maintain. We add Next.js Route Handlers only where we truly need server-side authority or secrets.

**Direct-to-Supabase (the default):**
- Reads: `select` with RLS auto-filtering by shop. Wrapped in React Query hooks in `features/*/queries.ts`.
- Simple writes: `insert`/`update` on medicines, suppliers, settings — RLS enforces tenancy.

**Postgres RPC functions (for multi-step atomic logic):**
- `provision_shop(...)` — signup bootstrap (SECURITY DEFINER).
- `record_sale(items jsonb, payment text, note text, voids_sale_id uuid null)` — **the core transaction.** In one DB transaction it: validates stock, decrements each medicine's quantity, inserts `sales` + `sale_items` (with snapshots), writes a `stock_movements` row (`reason='sale'`) per line, and returns the sale. If `voids_sale_id` is passed (the "edit" path), it stamps the link. Guarantees atomicity (no oversell, no half-written sale).
- `void_sale(sale_id uuid, reason text)` — **the void transaction.** Guards against double-void, flips `status='voided'` + sets `voided_at/voided_reason`, re-increments each sold medicine's quantity, and writes a `stock_movements` row (`reason='void'`) per line. RLS asserts the sale belongs to the caller's shop.
- `add_stock(medicine_id, delta, ...)` — increments quantity and writes a `stock_movements` row (`reason='restock'`).

**Next.js Route Handlers (`app/api/*`) — only when needed:**
- `/api/health` — uptime.
- Future: `/api/stripe/webhook` — must be server-side (verifies signature with secret; uses admin client to update subscriptions).
- Any operation requiring the service-role key stays here, server-only.

**Why not a full custom REST/tRPC API?** It would duplicate what PostgREST+RLS already give us securely, add latency, and add code to maintain — pure overengineering for CRUD. We keep the *option* open (Route Handlers exist) without paying the cost now.

**Validation:** every RPC input and every form is validated with the **same Zod schema** (shared in `features/*/schema.ts`). Client validates for UX; the DB function re-checks the essentials (stock ≥ requested) for safety.

---

## 12. Routing Architecture

**App Router with two route groups:**

| Group | Purpose | Shell |
|---|---|---|
| `(auth)` | login, signup, callback | Centered card, no nav |
| `(app)` | everything after login | Header + **bottom tab nav** (mobile-native feel) |

**Bottom navigation (max 5 tabs — the WhatsApp pattern):**
`Dashboard · Inventory · [ Sell (center, prominent FAB-style) ] · Alerts · More(Settings/Sales)`

The **Sell** action is the visual center and biggest touch target because it's the most frequent, most time-critical operation.

**Route map:**
```
/                         → redirect (session? /dashboard : /login)
/login  /signup  /callback
/dashboard
/inventory
/inventory/new
/inventory/[medicineId]
/inventory/[medicineId]/add-stock
/sell
/alerts/low-stock
/alerts/expiry
/sales                    (list; voided sales shown struck-through)
/sales/[saleId]           (detail; Void action + "Edit as new" action)
/settings
/settings/account
```

**Why:** deep-linkable URLs (shareable, back-button friendly on Android), grouped shells for two UX contexts, dynamic segments for entity detail. Server Components render the first paint fast (good on slow mobile networks); interactivity hydrates on top.

**Rendering strategy per route:**
- Dashboard, inventory list, sales history → **Server Component** initial fetch (fast first paint) + React Query for client refresh.
- Sell screen, forms → **Client Components** (highly interactive, optimistic).

---

## 13. Component Architecture

**Three tiers:**
1. **UI primitives** (`components/ui`) — `Button`, `Input`, `Textarea`, `Select`, `Sheet` (bottom sheet), `Card`, `Badge`, `Dialog`, `Stepper`, `Skeleton`. Style-only, no business logic. Large touch targets baked in (min 44–48px height).
2. **Domain components** (`components/inventory`, `sell`, `sales`, etc.) — compose primitives + show domain data. Examples: `MedicineCard` (always shows qty + unit), `StockBadge`, `ExpiryBadge`, `SellSearch`, `RecentlySold` (quick-add chips), `QuickAddChip`, `CartSheet`, `QtyStepper`, `SaleRow`, `AlertList`.
3. **Screens** (`app/**/page.tsx`) — thin. They wire domain components to `features/*` data hooks. Little logic of their own.

**Shared shell:** `components/layout` → `AppHeader`, `BottomNav`, `PageContainer` (consistent padding, max-width, safe-area insets for phones).

**Cross-cutting:** `EmptyState`, `ConfirmDialog`, `LoadingState`, `ErrorState` in `components/common`.

**Rules:**
- Screens don't call Supabase directly — they use `features/*/queries.ts` hooks. Keeps data logic testable and reusable.
- Presentational components receive data via props; they don't fetch. (Easier to reason about, reuse, and test.)
- Bottom **Sheet** over modal dialogs on mobile (thumb-reachable, native feel).

---

## 13a. Screen Behavior Specs

Precise behaviors for the screens where UX detail matters most. These are binding for implementation.

### Medicine search (Inventory list + Sell search)
- **Fields matched:** search runs across **name, brand, and manufacturer** (case-insensitive, partial match). Typing "cip" surfaces medicines named Ciplox, branded Cipla, or manufactured by Cipla Ltd.
- **Implementation:** a Postgres expression index over `lower(name || ' ' || coalesce(brand,'') || ' ' || coalesce(manufacturer,''))` (or `pg_trgm` for fuzzy matching) scoped by `shop_id`; queried via an RPC/view `search_medicines(term)` so the logic is identical on the Inventory and Sell screens. RLS still enforces tenancy.
- **UX:** debounced input (~200ms) via a `useDebounce` hook; results update live; each result shows name, brand/manufacturer subtitle, on-hand quantity **with unit**, and price. Excludes soft-deleted medicines. Friendly empty state ("No matches — Add medicine?").
- **Query key:** `['medicines', { search }]` — one shared `useMedicineSearch` hook in `features/inventory/queries.ts`, reused by both screens.

### Sell screen — "Recently Sold" quick access
- **Purpose:** one-tap add for the medicines this shop sells most, so the common sale is sub-5-seconds without typing.
- **Content:** a horizontal row / grid of quick-add chips at the top of the Sell screen showing the shop's **most-frequently or most-recently sold** medicines (default: top ~8 by sale frequency over the last 30 days, falling back to most-recent when history is thin).
- **Data source:** a view/RPC `v_recently_sold` — aggregates `sale_items` joined to non-voided `sales`, grouped by `medicine_id`, scoped by `shop_id`, ordered by count/recency, excluding out-of-stock and soft-deleted medicines. Cached by React Query (`['recently-sold']`), refetched after each recorded/voided sale.
- **Interaction:** tapping a chip adds one unit of that medicine to the sell cart (optimistic); tapping again increments quantity. The chip shows the medicine name and current on-hand **with unit**. Below the chips sits the normal search field for everything else.
- **Why:** mirrors how a solo pharmacist actually works — a small set of fast-movers dominates daily sales. This turns the most common task into a single tap.

### Inventory & Sell cards — always show units
- Every place a quantity is displayed (inventory cards, medicine detail, search results, Recently-Sold chips, low-stock/expiry alerts, cart lines) renders the **number *and* the medicine's `unit`**: e.g. **"22 strips"**, **"3 bottles"**, **"5 tubes"** — never a bare "22".
- **Implementation:** a single `formatQty(quantity, unit)` helper in `lib/utils/format.ts` used everywhere, so pluralization and spacing are consistent (`1 strip`, `2 strips`). `unit` is a required field when adding a medicine (sensible default list: strip, bottle, tube, piece, sachet, vial…), so a unit always exists to display.
- **Why:** "22" is ambiguous to a pharmacist mid-sale; "22 strips" is instantly meaningful and prevents dispensing errors.

---

## 14. State Management Strategy

Three kinds of state, three tools — **use the lightest one that fits:**

1. **Server state** (medicines, sales, alerts, settings) → **TanStack Query.**
   - Caching + background refetch keeps screens instant.
   - **Optimistic updates** for Sell and Add-Stock so the UI reacts in <100ms; rollback on error. This is what makes it feel as fast as Google Keep.
   - Query keys are shop-scoped implicitly (RLS filters), e.g. `['medicines', { search }]`, `['sales', { range }]`.

2. **Ephemeral client state** (the in-progress sale "cart", UI toggles like open sheets) → **Zustand.**
   - The cart is a small store: `items[]`, `addItem`, `updateQty`, `clear`, `total`. It's client-only until "Confirm sale" calls the `record_sale` RPC.
   - Chosen over Context to avoid re-render storms and boilerplate.

3. **Local component state** (input values, focus) → `useState` / React Hook Form. No global tool needed.

**Explicitly NOT using Redux** — there is very little global state; Redux would be pure overhead.

---

## 15. Recommended Libraries (final list)

| Purpose | Library |
|---|---|
| Framework | next |
| Language | typescript |
| Styling | tailwindcss |
| DB/Auth SDK | @supabase/supabase-js **(pinned 2.49.4)**, @supabase/ssr (^0.6.1) |
| Server state | @tanstack/react-query |
| Client store | zustand |
| Forms | react-hook-form |
| Validation | zod (+ @hookform/resolvers) |
| Icons | lucide-react |
| Dates | date-fns |
| Toasts | sonner |
| Virtualized lists (only if needed) | @tanstack/react-virtual |
| Testing (later) | vitest, @testing-library/react, playwright |
| Lint/format | eslint, prettier |

Deliberately small. Every addition must justify itself against "does this make the phone app faster/simpler?"

---

## 16. Security Considerations

1. **RLS on every table, deny by default.** No row is readable/writable unless a policy explicitly allows it for the caller's `shop_id`. This is the backbone of tenant isolation.
2. **Tenant checks in the database, not just the app.** Even if the frontend has a bug, Postgres refuses cross-tenant access.
3. **Service-role key never reaches the client.** Only in `lib/supabase/admin.ts`, imported solely by server code. Env var is server-only (not `NEXT_PUBLIC_`).
4. **Only the anon key is public** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) — it's powerless without RLS-passing auth, by design.
5. **Server-side validation** of critical invariants (stock availability, quantities > 0, prices ≥ 0) inside `record_sale` — never trust the client for money/stock.
6. **Snapshots** of price/name on `sale_items` prevent retroactive tampering with historical totals.
7. **Auth session in httpOnly cookies** (via `@supabase/ssr`) → not readable by JS → mitigates XSS token theft.
8. **Input sanitization & typing** everywhere via Zod; parameterized queries via the SDK (no SQL injection).
9. **HTTPS everywhere** (Vercel + Supabase default). Security headers via `next.config`/middleware (CSP, HSTS, X-Frame-Options).
10. **Least-privilege RPCs.** `SECURITY DEFINER` functions are narrow, audited, and assert tenancy internally.
11. **Rate limiting / abuse** — rely on Supabase + Vercel defaults for v1; add per-route limits when opening public signup broadly.
12. **PII discipline.** We store minimal data (medicine info, sale totals). No sensitive customer PII, no card numbers, no government IDs — nothing regulated is collected in v1. (Payment method is a free-text label only.)
13. **Backups** — Supabase automated backups; document restore procedure before onboarding paying customers.
14. **Audit seam** — `stock_movements` + `sold_by` give traceability when we need it.

---

## 17. Scalability Considerations

- **Read scale:** indexes on `(shop_id, …)` for every hot query; dashboard served by pre-shaped views. Each shop's dataset is tiny, so queries stay fast even with thousands of shops.
- **Tenant scale:** shared-schema + `shop_id` scales to *many* small tenants cheaply on one Postgres instance. If a single huge tenant ever appears, we can partition hot tables by `shop_id` or move that tenant to its own DB — the code doesn't change because everything already keys on `shop_id`.
- **App scale:** Vercel edge + mostly-static/SSR pages; Server Components ship less JS to phones.
- **Connection scale:** use Supabase's connection pooler (PgBouncer) for serverless functions to avoid connection exhaustion.
- **Write hot path:** `record_sale` is a single fast transaction; no N+1 writes.
- **Caching:** React Query on the client; HTTP caching / ISR for static-ish pages.
- **Realtime (optional later):** Supabase Realtime can push low-stock updates without polling — deferred.
- **Cost control:** one managed DB, no always-on servers; scales with usage.

---

## 18. Future-Proof Decisions (seams we deliberately left)

| Future need | Seam we built now | So later we can… |
|---|---|---|
| Subscription plans | `plans` table + `shops.plan_id` + `plans.limits jsonb` | add `subscriptions` + Stripe, enforce limits in RLS/app, gate features by plan — no reshaping. |
| Multiple users / staff | membership modeled as a `profiles` row with `shop_id` + `role` | evolve to a `memberships` join table + role-based RLS without touching business tables. |
| Multi-batch inventory | `stock_movements` (designed), price/name snapshots, single `shop_id` keying | promote batches to `medicine_batches`; migrate quantity per batch safely. |
| Audit trail | **`stock_movements` active**, `sold_by`, `created/updated_at`, sale `status` | already logging every quantity change; extend to more event types with zero churn. |
| Billing webhooks | `app/api/` + admin client isolation | add `/api/stripe/webhook` server-side securely. |
| Reports/analytics | clean normalized sales + snapshots + `timestamptz` | build reporting views/materialized views later. |
| Per-tenant scale-out | everything keyed by `shop_id` | partition or relocate a tenant with no app changes. |
| Realtime alerts | Supabase Realtime available | push low-stock/expiry live. |
| Offline (flaky mobile networks) | React Query cache + PWA manifest | add a service worker + write queue later. |

**Principle:** every seam is *cheap to leave open* and *expensive to add retroactively* — we only pre-build those, and nothing else.

---

## 19. Naming Conventions

- **DB:** snake_case tables (plural) & columns; `id` PK uuid; FKs `<entity>_id`; money columns end `_paise`; booleans `is_*`; timestamps `*_at`.
- **TypeScript:** PascalCase types/components; camelCase vars/functions; hooks `useX`; Zod schemas `xSchema`; stores `useXStore`.
- **Files:** components PascalCase (`MedicineCard.tsx`); hooks/utilities camelCase (`useMedicines.ts`); route files lowercase per Next.js (`page.tsx`, `route.ts`).
- **Query keys:** array form, domain-first: `['medicines', filters]`, `['sales', range]`.
- **Env vars:** public → `NEXT_PUBLIC_*`; secrets → no prefix, server-only.
- **Branches/commits:** conventional commits (`feat:`, `fix:`, `chore:`).

---

## 20. Coding Standards

- TypeScript **strict** mode; no `any` without justification.
- Screens are thin; data logic lives in `features/*`.
- Presentational components don't fetch; they take props.
- One Zod schema per shape, reused client + server.
- Never import `admin.ts` into client code (lint rule to enforce).
- Every list has explicit **loading / empty / error** states.
- All money handled as integer paise via `lib/utils/money.ts`.
- Prettier + ESLint enforced in CI.

---

## 21. UI Guidelines

- **Mobile-first**: design at 360px, enhance upward.
- **Touch targets ≥ 44px**; primary actions ≥ 48px, full-width on mobile.
- **Bottom navigation**; **Sell** is the prominent center action.
- **Bottom sheets** instead of center modals.
- **Typography:** one clean sans (system/Inter), few sizes, strong hierarchy.
- **Color:** neutral base + a single brand accent + semantic colors (amber = low stock, red = expiry/expired, green = success). Not "enterprise."
- **Minimal animation** — only functional feedback (sheet slide, toast).
- **Instant feedback:** optimistic UI + "Saved ✓ / Sold ✓" toasts.
- **Empty states** are friendly and action-oriented ("No medicines yet — Add your first").
- **Always show units:** every quantity on every screen reads "22 strips" / "3 bottles" / "5 tubes", never a bare number (via `formatQty`).
- **Sell screen leads with Recently-Sold chips** for one-tap fast sales, search below for everything else.
- **Accessibility:** labels on inputs, sufficient contrast, focus states.
- **PWA installable** so it feels like a native Android app.

---

## 22. Business Rules

1. A user belongs to exactly **one shop** (v1). All their data is that shop's.
2. **Can't oversell:** a sale line's quantity may not exceed on-hand; enforced in `record_sale`.
3. Selling **decrements** `medicines.quantity`; adding stock **increments** it — atomically.
4. **Low stock** = `quantity ≤ (medicine.low_stock_threshold ?? shop.low_stock_threshold)`.
5. **Expiring soon** = `expiry_date ≤ today + shop.expiry_window_days` (default 30); **expired** = `expiry_date < today`.
6. Money stored as **integer paise**; display formatted (₹).
7. `sale_items` capture **name + price snapshots**; editing a medicine never changes past sales.
8. **Sales are append-only** — never edited or deleted in place. Corrections use **void + re-record**: `void_sale` reverses a sale (restores stock, keeps the row as `voided`); an "edit" voids the old sale and records a corrected new one linked via `voids_sale_id`. Every stock change is logged in `stock_movements`. A voided sale cannot be voided again.
9. Medicines/suppliers use **soft delete**; they vanish from lists but preserve sale history references.
10. Shop **settings** (thresholds, expiry window, currency) are per-shop and editable in Settings.
11. Prices/quantities are **non-negative**; quantity is integer.
12. **Every medicine has a `unit`** (required on add). All quantity displays show number **+ unit** via `formatQty` (e.g. "22 strips"), never a bare number.
13. **Search** matches **name, brand, and manufacturer** (case-insensitive, partial), shop-scoped, excluding soft-deleted medicines — same behavior on Inventory and Sell screens.
14. **Recently Sold** on the Sell screen = top ~8 medicines by sale frequency/recency (last 30 days, non-voided sales), in-stock only; one tap adds a unit to the cart.

---

## 23. Module Status

| Module | Status |
|---|---|
| Architecture & PROJECT.md | ✅ Approved |
| DB migrations | ✅ **Complete & validated** (0001–0006 + seed) — applied cleanly on Postgres 16; behavior + tenant-isolation tests pass |
| Auth (login/signup/provisioning) | ✅ **Complete & verified** — login, signup→provision_shop, email-confirm fallback, /callback, sign out; build+typecheck+lint green |
| App shell + bottom nav | ✅ **Complete** — (auth)/(app) route groups, session middleware + guards, header, bottom nav with center Sell |
| Dashboard | ✅ **Complete** — reads v_dashboard_stats via React Query; today's sales + stat cards |
| Inventory (list/detail) | ✅ **Complete & verified** — list w/ debounced name/brand/manufacturer search, add, edit, archive (soft-delete); duplicate-name guard; build+typecheck+lint green; RLS isolation + query paths tested on Postgres |
| Add stock | ✅ **Complete & verified** — /inventory/[medicineId]/add-stock via add_stock RPC; increments qty + logs restock movement; Zod-validated; React Query invalidation; RLS isolation tested |
| Sell (core) | ✅ **Complete & verified** — search→cart→confirm via record_sale RPC; Zustand cart; over-sell blocked (client+server); inventory decrements + snapshots + movements; recently-sold quick-add; React Query invalidation; RLS isolation tested |
| Low-stock alerts | ✅ **Complete & verified** — v_low_stock list w/ qty vs effective_threshold; links to detail + add-stock; auto-refresh via ["medicines"] key nesting; threshold override + shop-default logic tested on Postgres |
| Expiry alerts | ⏳ Pending |
| Sales history | ⏳ Pending |
| Settings | 🟡 Partial — shop info + thresholds (read-only) + account + sign out done; editing thresholds pending |
| PWA polish | ⏳ Pending |

---

## 24. Known Limitations (v1, accepted on purpose)

1. **Single batch/expiry per medicine** — not true multi-batch FEFO. Seam left (`stock_movements`, future `medicine_batches`).
2. **One user per shop** — no staff accounts yet. Membership seam left.
3. **No offline mode** — assumes connectivity; React Query softens brief drops. PWA seam left.
4. ~~No stock-movement audit log~~ — **now active** (needed for clean voids). Every quantity change is logged.
5. **No reports/GST/invoices/billing** — explicitly out of scope.
6. **Manual data entry** — no barcode scanning (by requirement).
7. **Plans not enforced** — `plans` exists but limits aren't gated yet.

---

## 25. Change Log

| Date | Change |
|---|---|
| 2026-07-30 | Initial architecture authored (v1.0). Awaiting approval before any code. |
| 2026-07-30 | Decisions locked: single-batch kept for v1; sales now support **void + re-record** (not in-place edit); **stock_movements activated**. Added `void_sale` RPC, sales `status/voided_*/voids_sale_id` columns, updated business rule #8, sale detail route gains Void / Edit-as-new. |
| 2026-07-30 | UX refinements added (new §13a): search matches **name/brand/manufacturer** (`search_medicines`); Sell screen **"Recently Sold"** quick-add chips (`v_recently_sold`); all quantity displays show **number + unit** via `formatQty`. Added supporting views, medicine search index, `unit` required on add, business rules 12–14, UI guidelines. |
| 2026-07-30 | **DB migrations built & validated.** Wrote 0001–0006 + seed.sql. Verified on real Postgres 16: all migrations apply cleanly; sale math/snapshots, stock decrement, void restore, movement logging, oversell block, double-void block, and full **tenant isolation** (cross-shop read/sell/void all denied by RLS) confirmed by tests. Two ordering/grant bugs found and fixed during validation: (a) `auth_shop_id()` moved to after `profiles` exists; (b) explicit `GRANT`s for the `authenticated` role added to 0004 (tables) and 0006 (views) so the schema is self-contained, not reliant on Supabase default grants. |
| 2026-07-30 | **Auth + App Shell built & verified.** Scaffolded Next.js 14 app: 3 Supabase clients (browser/server RLS + `server-only` admin), session middleware with route guards, login/signup (signup→`provision_shop` RPC with email-confirmation fallback via `ensureProvisioned`), `/callback` handler, (auth)/(app) route shells, bottom nav with center Sell, real dashboard on `v_dashboard_stats`, Settings+Account with sign out, teal design system + touch-friendly primitives, PWA manifest + icons. **No DB changes.** Verified: `npm run build` green, `tsc` clean, `next lint` no warnings. Decisions this module: (1) **`@supabase/supabase-js` pinned to `2.49.4`** — floated `2.111` broke `@supabase/ssr@0.6.1`'s 3-generic `SupabaseClient` (typed rows/RPC args collapsed to `never`); do not bump without re-checking typed client. (2) **System font stack instead of `next/font` Google fetch** — removes build-time network dependency, more reliable/private. (3) **Signup provisioning uses the SECURITY DEFINER `provision_shop` RPC under the user's own JWT**, not the admin client — narrower privilege. (4) DB types hand-written to satisfy postgrest `GenericSchema` (Row/Insert/Update/Relationships; RPC-only tables use `Record<string,never>` Insert/Update; RPC Args non-optional for exact-match resolution). |
| 2026-07-31 | **Inventory module built & verified.** Added: `features/inventory/{schema,queries}.ts` (Zod form schema; React Query hooks: `useMedicineSearch` via `search_medicines` RPC, `useMedicine`, `useCreateMedicine`, `useUpdateMedicine`, `useArchiveMedicine`, plus `DuplicateNameError`); components `inventory/{MedicineCard,Badges,SearchInput,MedicineForm}`; screens for list (`InventoryList`), add (`new/AddMedicineForm`), and detail/edit/archive (`[medicineId]/MedicineDetail`). New shared primitives (reused, not duplicated): `ui/Select`, `common/ConfirmDialog` (bottom sheet), `common/States.ErrorState`, `hooks/useDebounce`. **No DB/auth/middleware/schema changes.** Decisions: (1) **Duplicate-name prevention in app layer** via case-insensitive `ilike` on active rows (no DB unique constraint added — soft-deleted names remain reusable, and a partial unique index wasn't in the approved schema). (2) **Prices entered in rupees, converted to paise** in `queries.toRow` so the DB only ever sees integer paise. (3) **One `MedicineForm`** shared by add + edit (initial prop prefills) to avoid duplication. (4) Archive = soft-delete (`deleted_at`), consistent with business rule 9. Verified: build+typecheck+lint green; on real Postgres confirmed duplicate detection (case-insensitive), insert w/ correct paise, search by brand+manufacturer, empty-search list, archive removes from search + frees the name, and **cross-tenant edit/archive blocked by RLS** (0 rows affected). |
| 2026-07-31 | **Add Stock module built & verified.** Added `features/inventory/addStockSchema.ts` (Zod: positive integer ≥1), `useAddStock` hook in `features/inventory/queries.ts` (calls `add_stock` RPC, seeds detail cache with returned row + invalidates `medicines`/detail/`dashboard-stats`), route `[medicineId]/add-stock/{page,AddStock}.tsx` (mobile-first: current-stock display, quick-add chips 1/5/10/20/50, live new-total preview). Modified `[medicineId]/MedicineDetail.tsx` to add a current-stock row + "Add stock" button entry point. **No DB/auth/middleware/schema/inventory-CRUD-logic changes.** Verified: build+typecheck+lint green; on real Postgres confirmed `add_stock` increments quantity (18→33) and records a `restock` stock_movement (delta +15, ref_type 'stock'), negative-result + bad-reason guards fire, and **cross-tenant add-stock blocked by RLS** ("Medicine not found in this shop"). |
| 2026-07-31 | **Sell (POS) module built & verified.** Added `features/sell/store.ts` (Zustand cart: add/setQty/increment/decrement/remove/clear, totals, over-sell clamp to on-hand), `features/sell/queries.ts` (`useRecentlySold` from `v_recently_sold`, `useRecordSale` calling the `record_sale` RPC + invalidating `medicines`/`dashboard-stats`/`recently-sold`/`sales`), components `sell/{QtyStepper,QuickAddChip,RecentlySold,SellSearch,CartSheet}`, and screen `sell/{page,SellScreen}.tsx` (recently-sold quick-add row, search reusing `useMedicineSearch`, sticky cart bar, cart bottom sheet with steppers/remove/total/confirm). **No DB/auth/inventory/add-stock/middleware/schema/app-shell changes** — reused existing `useMedicineSearch`, `useDebounce`, `SearchInput`, `formatQty`, `formatMoney`. Decisions: (1) **Cart is Zustand ephemeral state** per §14, converted to the `record_sale` `p_items` array only on confirm. (2) **Over-sell prevented twice** — client clamps qty to on-hand at add/step time, and `record_sale` re-validates authoritatively server-side. (3) Cart lines snapshot name/unit/price/available at add-time for display; DB holds the source of truth. Verified: build+typecheck+lint green; on real Postgres confirmed sale header totals + `sale_items` snapshots, immediate inventory decrement (18→15), negative `sale` stock_movements, over-sell + empty-sale guards fire, `v_recently_sold` reflects the sale, and **cross-tenant sell blocked by RLS**. Dev DB restored to pristine after tests. |
| 2026-07-31 | **Low Stock Alerts module built & verified.** Added `features/alerts/queries.ts` (`useLowStock` reading the `v_low_stock` view; `LowStockRow` type), `components/alerts/LowStockCard.tsx` (qty-with-unit via `StockBadge`, current vs `effective_threshold`, links to medicine detail + add-stock), and screen `alerts/low-stock/{page,LowStockList}.tsx` with loading/empty/error states. **No DB/auth/inventory/add-stock/sell/middleware/schema/app-shell changes** — reused `StockBadge`, `formatQty`, `States`. Decisions: (1) **Query key nested as `["medicines","low-stock"]`** so the existing `invalidateQueries({queryKey:["medicines"]})` calls in sell/add-stock/inventory mutations auto-refresh the alerts list without editing those modules (prefix-match verified empirically). (2) Threshold shown is the view's `effective_threshold` (per-medicine override → shop default → 10, business rule 4). (3) Rows sorted lowest-qty-first. Verified: build+typecheck+lint green; on real Postgres confirmed the view returns correct rows (Amoxicillin qty 5 vs threshold 10; excludes Paracetamol qty 18), the per-medicine override path (Paracetamol threshold 20 → appears with effective=20) and shop-default fallback both work, and a `["medicines"]` invalidation matches `["medicines","low-stock"]`. |

---

_End of PROJECT.md. Update on every decision._
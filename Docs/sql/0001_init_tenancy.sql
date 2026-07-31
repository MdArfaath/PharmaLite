-- =====================================================================
-- 0001_init_tenancy.sql
-- Foundation: extensions, shared helpers, and the tenancy tables
-- (plans, shops, profiles). RLS is enabled here but the full policy
-- set lives in 0004_rls_policies.sql. This migration also defines the
-- two functions every policy depends on: auth_shop_id() and the
-- updated_at trigger.
--
-- Tenancy model: shared DB / shared schema / row isolation via shop_id.
-- The tenant a user belongs to is stored in profiles.shop_id and read
-- back by auth_shop_id().
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "pg_trgm";     -- fuzzy medicine search (0002)

-- ---------------------------------------------------------------------
-- Shared trigger: keep updated_at current on every UPDATE
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- NOTE: auth_shop_id() is defined AFTER the profiles table below, because
-- a LANGUAGE sql function validates its referenced relations at creation
-- time and it reads from public.profiles.

-- =====================================================================
-- plans
-- Subscription plans. Seeded with one 'solo' row in v1; the FK + limits
-- jsonb are the seam for future paid tiers (enforced later).
-- =====================================================================
create table public.plans (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  price_paise bigint not null default 0 check (price_paise >= 0),
  limits      jsonb not null default '{}'::jsonb,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.plans is 'Subscription plans. v1 seeds a single free "solo" plan.';

-- Seed the default plan every shop points at in v1.
insert into public.plans (code, name, price_paise, limits, is_active)
values ('solo', 'Solo', 0, '{"max_medicines": null, "max_users": 1}'::jsonb, true);

-- =====================================================================
-- shops
-- The tenant. owner_user_id references the auth user who created it.
-- settings jsonb holds per-shop config (thresholds, expiry window,
-- currency) so we can add settings without migrations.
-- =====================================================================
create table public.shops (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  plan_id       uuid not null references public.plans(id),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  phone         text,
  settings      jsonb not null default
                  '{"low_stock_threshold": 10, "expiry_window_days": 30, "currency": "INR"}'::jsonb,
  status        text not null default 'active' check (status in ('active','suspended')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.shops is 'Tenant root. Every business row carries a shop_id pointing here.';

create trigger trg_shops_updated_at
  before update on public.shops
  for each row execute function public.set_updated_at();

-- =====================================================================
-- profiles
-- 1:1 with auth.users. profiles.shop_id is THE tenant membership used by
-- auth_shop_id(). role is 'owner' in v1 (seam for staff roles later).
-- =====================================================================
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  shop_id    uuid not null references public.shops(id) on delete cascade,
  full_name  text,
  role       text not null default 'owner' check (role in ('owner','staff')),
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per user; profiles.shop_id is the tenant key read by auth_shop_id().';

create index idx_profiles_shop on public.profiles(shop_id);

-- ---------------------------------------------------------------------
-- auth_shop_id(): the tenant key for the current user.
-- Defined here, after profiles exists. Reads the caller's shop_id from
-- profiles. SECURITY DEFINER so it bypasses the caller's own RLS on
-- profiles (avoids recursion), STABLE so the planner can cache it within
-- a statement. Every RLS policy calls this to scope rows to the shop.
-- ---------------------------------------------------------------------
create or replace function public.auth_shop_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select shop_id from public.profiles where id = auth.uid();
$$;

revoke all on function public.auth_shop_id() from public;
grant execute on function public.auth_shop_id() to authenticated;

-- ---------------------------------------------------------------------
-- Enable RLS now (deny-by-default). Policies are defined in 0004.
-- ---------------------------------------------------------------------
alter table public.plans    enable row level security;
alter table public.shops    enable row level security;
alter table public.profiles enable row level security;

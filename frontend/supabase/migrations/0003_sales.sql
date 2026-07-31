-- =====================================================================
-- 0003_sales.sql
-- Sales domain: sales, sale_items, and the ACTIVE stock_movements audit
-- log. sale_items snapshot name + price so history never changes when a
-- medicine is edited. Sales are append-only: void + re-record, never
-- in-place edit (see void_sale in 0005).
-- =====================================================================

-- =====================================================================
-- sales
-- One header row per completed sale. status/voided_* support the
-- void + re-record model; voids_sale_id links a correction back to the
-- sale it replaced.
-- =====================================================================
create table public.sales (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references public.shops(id) on delete cascade,
  total_paise    bigint not null check (total_paise >= 0),
  item_count     int    not null check (item_count >= 0),
  payment_method text   not null default 'cash',
  note           text,
  status         text   not null default 'completed' check (status in ('completed','voided')),
  voided_at      timestamptz,
  voided_reason  text,
  voids_sale_id  uuid references public.sales(id) on delete set null,
  sold_by        uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);

comment on table public.sales is 'Sale headers. Append-only: corrected via void + re-record, never edited in place.';
comment on column public.sales.voids_sale_id is 'If set, this sale is a correction that replaced the referenced (now voided) sale.';

create index idx_sales_shop_created on public.sales(shop_id, created_at desc);
create index idx_sales_shop_status  on public.sales(shop_id, status);

-- =====================================================================
-- sale_items
-- Line items. shop_id denormalized for direct RLS + fast queries.
-- medicine_name and unit_price_paise are SNAPSHOTS taken at sale time.
-- =====================================================================
create table public.sale_items (
  id               uuid primary key default gen_random_uuid(),
  shop_id          uuid not null references public.shops(id) on delete cascade,
  sale_id          uuid not null references public.sales(id) on delete cascade,
  medicine_id      uuid references public.medicines(id) on delete set null,
  medicine_name    text   not null,                         -- snapshot
  quantity         int    not null check (quantity > 0),
  unit_price_paise bigint not null check (unit_price_paise >= 0),  -- snapshot
  line_total_paise bigint not null check (line_total_paise >= 0)
);

comment on table public.sale_items is 'Sale lines with name + price snapshots so history is immutable.';

create index idx_sale_items_shop_medicine on public.sale_items(shop_id, medicine_id);
create index idx_sale_items_sale          on public.sale_items(sale_id);

-- =====================================================================
-- stock_movements  (ACTIVE in v1)
-- Every change to medicines.quantity writes one row here, so on-hand
-- stock is always explainable and voids are auditable. Written only by
-- add_stock / record_sale / void_sale inside their transactions.
-- =====================================================================
create table public.stock_movements (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references public.shops(id) on delete cascade,
  medicine_id uuid not null references public.medicines(id) on delete cascade,
  delta       int  not null,                                -- +restock/void, -sale
  reason      text not null check (reason in ('restock','sale','void','adjust')),
  ref_type    text check (ref_type in ('sale','stock','manual')),
  ref_id      uuid,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

comment on table public.stock_movements is 'Audit log of every quantity change. Explains current on-hand stock.';

create index idx_stock_movements_shop_med_created
  on public.stock_movements(shop_id, medicine_id, created_at desc);

-- ---------------------------------------------------------------------
alter table public.sales           enable row level security;
alter table public.sale_items      enable row level security;
alter table public.stock_movements enable row level security;

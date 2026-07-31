-- =====================================================================
-- 0002_inventory.sql
-- Inventory domain: suppliers and medicines.
-- Both carry shop_id and use soft delete (deleted_at) so history in
-- sale_items stays intact. Includes the trigram search index that backs
-- search across name / brand / manufacturer.
-- =====================================================================

-- =====================================================================
-- suppliers
-- Optional. A medicine may reference a supplier. Soft-deleted.
-- =====================================================================
create table public.suppliers (
  id         uuid primary key default gen_random_uuid(),
  shop_id    uuid not null references public.shops(id) on delete cascade,
  name       text not null,
  phone      text,
  note       text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.suppliers is 'Suppliers per shop. Soft-deleted to preserve medicine references.';

create index idx_suppliers_shop on public.suppliers(shop_id) where deleted_at is null;

create trigger trg_suppliers_updated_at
  before update on public.suppliers
  for each row execute function public.set_updated_at();

-- =====================================================================
-- medicines
-- The catalog + live on-hand quantity. v1 keeps a single batch/expiry
-- on the row (documented simplification). Money is integer paise.
-- low_stock_threshold overrides the shop default when set.
-- =====================================================================
create table public.medicines (
  id                    uuid primary key default gen_random_uuid(),
  shop_id               uuid not null references public.shops(id) on delete cascade,
  name                  text not null,
  brand                 text,
  manufacturer          text,
  unit                  text not null,                    -- strip/bottle/tube/... required
  sku                   text,
  supplier_id           uuid references public.suppliers(id) on delete set null,
  quantity              int  not null default 0 check (quantity >= 0),
  low_stock_threshold   int  check (low_stock_threshold >= 0),
  purchase_price_paise  bigint not null default 0 check (purchase_price_paise >= 0),
  selling_price_paise   bigint not null default 0 check (selling_price_paise >= 0),
  batch_no              text,
  expiry_date           date,
  deleted_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.medicines is 'Medicine catalog + live on-hand quantity. Single batch/expiry per row in v1.';
comment on column public.medicines.unit is 'Required. Displayed with quantity everywhere (e.g. "22 strips").';
comment on column public.medicines.quantity is 'Live on-hand. Only mutated by add_stock / record_sale / void_sale.';

-- Hot-path indexes (all shop-scoped), matching PROJECT.md.
create index idx_medicines_shop_name    on public.medicines(shop_id, name)        where deleted_at is null;
create index idx_medicines_shop_qty     on public.medicines(shop_id, quantity)    where deleted_at is null;
create index idx_medicines_shop_expiry  on public.medicines(shop_id, expiry_date) where deleted_at is null;

-- Search index: trigram over name + brand + manufacturer, shop-scoped
-- via the query. Backs search_medicines() (defined in 0005) and the
-- Inventory + Sell search fields.
create index idx_medicines_search_trgm
  on public.medicines
  using gin (
    (lower(coalesce(name,'') || ' ' || coalesce(brand,'') || ' ' || coalesce(manufacturer,''))) gin_trgm_ops
  )
  where deleted_at is null;

create trigger trg_medicines_updated_at
  before update on public.medicines
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
alter table public.suppliers enable row level security;
alter table public.medicines enable row level security;

-- =====================================================================
-- 0006_views.sql
-- Read-optimized views for the dashboard, alerts, and Recently Sold.
-- All are security_invoker so the querying user's RLS on the base tables
-- applies -> each view returns only the caller's shop's rows.
-- =====================================================================

-- ---------------------------------------------------------------------
-- v_low_stock
-- Medicines at or below their effective low-stock threshold
-- (per-medicine override, else the shop default from settings).
-- ---------------------------------------------------------------------
create or replace view public.v_low_stock
with (security_invoker = true) as
select
  m.*,
  coalesce(
    m.low_stock_threshold,
    (s.settings->>'low_stock_threshold')::int,
    10
  ) as effective_threshold
from public.medicines m
join public.shops s on s.id = m.shop_id
where m.deleted_at is null
  and m.quantity <= coalesce(
        m.low_stock_threshold,
        (s.settings->>'low_stock_threshold')::int,
        10
      );

comment on view public.v_low_stock is 'Medicines at/below effective low-stock threshold, per caller shop (RLS).';

-- ---------------------------------------------------------------------
-- v_expiring_soon
-- Medicines expiring within the shop's expiry window (default 30 days),
-- including already-expired. is_expired flags past-date rows for the UI.
-- ---------------------------------------------------------------------
create or replace view public.v_expiring_soon
with (security_invoker = true) as
select
  m.*,
  (m.expiry_date < current_date) as is_expired,
  coalesce((s.settings->>'expiry_window_days')::int, 30) as expiry_window_days
from public.medicines m
join public.shops s on s.id = m.shop_id
where m.deleted_at is null
  and m.expiry_date is not null
  and m.expiry_date <= current_date
      + (coalesce((s.settings->>'expiry_window_days')::int, 30) || ' days')::interval;

comment on view public.v_expiring_soon is 'Medicines expiring within the shop window (or expired), per caller shop (RLS).';

-- ---------------------------------------------------------------------
-- v_dashboard_stats
-- One row per shop: headline numbers for the dashboard.
-- Sales figures count only non-voided sales.
-- ---------------------------------------------------------------------
create or replace view public.v_dashboard_stats
with (security_invoker = true) as
select
  sh.id as shop_id,
  (select count(*) from public.medicines m
     where m.shop_id = sh.id and m.deleted_at is null) as medicine_count,
  (select count(*) from public.v_low_stock l
     where l.shop_id = sh.id) as low_stock_count,
  (select count(*) from public.v_expiring_soon e
     where e.shop_id = sh.id) as expiring_count,
  (select coalesce(sum(s.total_paise), 0) from public.sales s
     where s.shop_id = sh.id
       and s.status = 'completed'
       and s.created_at >= date_trunc('day', now())) as today_sales_paise,
  (select count(*) from public.sales s
     where s.shop_id = sh.id
       and s.status = 'completed'
       and s.created_at >= date_trunc('day', now())) as today_sales_count
from public.shops sh;

comment on view public.v_dashboard_stats is 'Headline dashboard counts + today sales, per caller shop (RLS).';

-- ---------------------------------------------------------------------
-- v_recently_sold
-- Backs the Sell screen quick-add chips: medicines this shop sells most
-- over the last 30 days (non-voided sales), in-stock and not deleted,
-- ranked by units sold then recency. Cap the consuming query with LIMIT.
-- ---------------------------------------------------------------------
create or replace view public.v_recently_sold
with (security_invoker = true) as
select
  m.id,
  m.shop_id,
  m.name,
  m.brand,
  m.manufacturer,
  m.unit,
  m.quantity,
  m.selling_price_paise,
  sum(si.quantity)          as units_sold_30d,
  max(s.created_at)         as last_sold_at
from public.sale_items si
join public.sales     s on s.id = si.sale_id
join public.medicines m on m.id = si.medicine_id
where s.status = 'completed'
  and s.created_at >= now() - interval '30 days'
  and m.deleted_at is null
  and m.quantity > 0
group by m.id, m.shop_id, m.name, m.brand, m.manufacturer, m.unit, m.quantity, m.selling_price_paise
order by units_sold_30d desc, last_sold_at desc;

comment on view public.v_recently_sold is 'Top fast-movers (30d, non-voided, in-stock) for Sell quick-add, per caller shop (RLS).';

-- ---------------------------------------------------------------------
-- Grant read access to the views for the authenticated role. Because
-- they are security_invoker, the caller's RLS on the base tables still
-- restricts rows to the caller's shop.
-- ---------------------------------------------------------------------
grant select on public.v_low_stock       to authenticated;
grant select on public.v_expiring_soon   to authenticated;
grant select on public.v_dashboard_stats to authenticated;
grant select on public.v_recently_sold   to authenticated;

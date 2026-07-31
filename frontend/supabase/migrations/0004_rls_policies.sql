-- =====================================================================
-- 0004_rls_policies.sql
-- Row Level Security policies. This is the backbone of tenant isolation:
-- deny-by-default, every business row scoped to auth_shop_id().
--
-- RLS was enabled per-table in earlier migrations. With RLS enabled and
-- no policy, all access is denied. Each policy below re-grants access
-- only for rows belonging to the caller's shop.
--
-- Conventions:
--   * SELECT/UPDATE/DELETE policies use USING (shop_id = auth_shop_id()).
--   * INSERT policies use WITH CHECK (shop_id = auth_shop_id()) so a user
--     cannot insert rows into another shop.
--   * Direct writes to medicines.quantity, sales, sale_items and
--     stock_movements are intentionally NOT granted here — those flow
--     only through SECURITY DEFINER RPCs (0005) that enforce invariants.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Base privileges. RLS narrows WHICH ROWS a role may touch, but the role
-- must first hold table privileges at all. Supabase grants these to the
-- built-in roles by default; we declare them explicitly so the schema is
-- self-contained and portable. Privileges are deliberately minimal:
--   * sales / sale_items / stock_movements: SELECT only (writes via RPC).
--   * everything else: the verbs their policies below actually use.
-- ---------------------------------------------------------------------
grant usage on schema public to authenticated;

grant select                         on public.plans           to authenticated;
grant select, update                 on public.shops           to authenticated;
grant select, update                 on public.profiles        to authenticated;
grant select, insert, update         on public.suppliers       to authenticated;
grant select, insert, update         on public.medicines       to authenticated;
grant select                         on public.sales           to authenticated;
grant select                         on public.sale_items      to authenticated;
grant select                         on public.stock_movements to authenticated;

-- ---------------------------------------------------------------------
-- plans: readable by any authenticated user (needed to show plan info);
-- never writable from the client.
-- ---------------------------------------------------------------------
create policy "plans_select_authenticated"
  on public.plans for select
  to authenticated
  using (is_active = true);

-- ---------------------------------------------------------------------
-- shops: a user sees and updates only their own shop.
-- No client INSERT/DELETE — shops are created via provision_shop (0005)
-- and never deleted from the client.
-- ---------------------------------------------------------------------
create policy "shops_select_own"
  on public.shops for select
  to authenticated
  using (id = public.auth_shop_id());

create policy "shops_update_own"
  on public.shops for update
  to authenticated
  using (id = public.auth_shop_id())
  with check (id = public.auth_shop_id());

-- ---------------------------------------------------------------------
-- profiles: a user can read profiles in their own shop and update their
-- own profile row. Creation happens in provision_shop (0005).
-- ---------------------------------------------------------------------
create policy "profiles_select_same_shop"
  on public.profiles for select
  to authenticated
  using (shop_id = public.auth_shop_id());

create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and shop_id = public.auth_shop_id());

-- ---------------------------------------------------------------------
-- suppliers: full CRUD within the caller's shop.
-- ---------------------------------------------------------------------
create policy "suppliers_select_own"
  on public.suppliers for select
  to authenticated
  using (shop_id = public.auth_shop_id());

create policy "suppliers_insert_own"
  on public.suppliers for insert
  to authenticated
  with check (shop_id = public.auth_shop_id());

create policy "suppliers_update_own"
  on public.suppliers for update
  to authenticated
  using (shop_id = public.auth_shop_id())
  with check (shop_id = public.auth_shop_id());

-- Soft delete is an UPDATE of deleted_at, covered by suppliers_update_own.
-- Hard DELETE is not granted.

-- ---------------------------------------------------------------------
-- medicines: select/insert/update within the caller's shop.
-- NOTE: clients may insert medicines and edit catalog fields, but
-- quantity changes should go through the RPCs. We still allow UPDATE
-- here (needed for editing name/price/threshold/soft-delete); the RPCs
-- own the quantity+movement invariant by convention and are the only
-- path the UI uses to change stock.
-- ---------------------------------------------------------------------
create policy "medicines_select_own"
  on public.medicines for select
  to authenticated
  using (shop_id = public.auth_shop_id());

create policy "medicines_insert_own"
  on public.medicines for insert
  to authenticated
  with check (shop_id = public.auth_shop_id());

create policy "medicines_update_own"
  on public.medicines for update
  to authenticated
  using (shop_id = public.auth_shop_id())
  with check (shop_id = public.auth_shop_id());

-- Hard DELETE not granted; medicines are soft-deleted via UPDATE.

-- ---------------------------------------------------------------------
-- sales & sale_items: SELECT only from the client. All writes happen
-- through record_sale / void_sale (SECURITY DEFINER), so we deliberately
-- grant NO insert/update/delete here. This guarantees totals, snapshots
-- and stock stay consistent.
-- ---------------------------------------------------------------------
create policy "sales_select_own"
  on public.sales for select
  to authenticated
  using (shop_id = public.auth_shop_id());

create policy "sale_items_select_own"
  on public.sale_items for select
  to authenticated
  using (shop_id = public.auth_shop_id());

-- ---------------------------------------------------------------------
-- stock_movements: SELECT only. Rows are written exclusively by the
-- RPCs; the client never inserts movements directly.
-- ---------------------------------------------------------------------
create policy "stock_movements_select_own"
  on public.stock_movements for select
  to authenticated
  using (shop_id = public.auth_shop_id());

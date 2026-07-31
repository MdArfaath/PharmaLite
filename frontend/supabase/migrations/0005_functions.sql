-- =====================================================================
-- 0005_functions.sql
-- The business logic that must be atomic or privileged:
--   * provision_shop   - signup bootstrap (breaks the profiles chicken/egg)
--   * add_stock        - increment quantity + log movement
--   * record_sale      - validate stock, decrement, write sale+items+movements
--   * void_sale        - reverse a sale, restore stock, log movements
--   * search_medicines - name/brand/manufacturer search (Inventory + Sell)
--
-- Write RPCs are SECURITY DEFINER so they can write tables the client
-- can't (sales, sale_items, stock_movements, medicines.quantity) while
-- still asserting tenancy internally via auth_shop_id().
-- =====================================================================

-- =====================================================================
-- provision_shop(shop_name, full_name)
-- Called once right after auth.signUp(). Creates the shop (on the default
-- 'solo' plan) and the caller's profile atomically. SECURITY DEFINER so
-- it can insert even though the user has no profile/shop yet.
-- Idempotent-ish: if the caller already has a profile, returns its shop.
-- =====================================================================
create or replace function public.provision_shop(
  p_shop_name text,
  p_full_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_plan_id  uuid;
  v_shop_id  uuid;
  v_existing uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if coalesce(btrim(p_shop_name), '') = '' then
    raise exception 'Shop name is required';
  end if;

  -- If already provisioned, return the existing shop (safe re-entry).
  select shop_id into v_existing from public.profiles where id = v_uid;
  if v_existing is not null then
    return v_existing;
  end if;

  select id into v_plan_id from public.plans where code = 'solo' limit 1;
  if v_plan_id is null then
    raise exception 'Default plan not found';
  end if;

  insert into public.shops (name, plan_id, owner_user_id)
  values (btrim(p_shop_name), v_plan_id, v_uid)
  returning id into v_shop_id;

  insert into public.profiles (id, shop_id, full_name, role)
  values (v_uid, v_shop_id, nullif(btrim(coalesce(p_full_name,'')), ''), 'owner');

  return v_shop_id;
end;
$$;

revoke all on function public.provision_shop(text, text) from public;
grant execute on function public.provision_shop(text, text) to authenticated;

-- =====================================================================
-- add_stock(medicine_id, delta, reason)
-- Increments (or adjusts) on-hand quantity and logs a stock_movement,
-- atomically. delta > 0 for restock. Asserts the medicine is in the
-- caller's shop. Locks the row to avoid lost updates.
-- =====================================================================
create or replace function public.add_stock(
  p_medicine_id uuid,
  p_delta       int,
  p_reason      text default 'restock'
)
returns public.medicines
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop uuid := public.auth_shop_id();
  v_med  public.medicines;
begin
  if v_shop is null then
    raise exception 'Not authenticated';
  end if;
  if p_reason not in ('restock','adjust') then
    raise exception 'add_stock reason must be restock or adjust';
  end if;

  -- Lock the medicine row for this shop.
  select * into v_med
  from public.medicines
  where id = p_medicine_id and shop_id = v_shop and deleted_at is null
  for update;

  if not found then
    raise exception 'Medicine not found in this shop';
  end if;

  if v_med.quantity + p_delta < 0 then
    raise exception 'Resulting quantity would be negative';
  end if;

  update public.medicines
    set quantity = quantity + p_delta
    where id = p_medicine_id
    returning * into v_med;

  insert into public.stock_movements
    (shop_id, medicine_id, delta, reason, ref_type, ref_id, created_by)
  values
    (v_shop, p_medicine_id, p_delta, p_reason, 'stock', null, auth.uid());

  return v_med;
end;
$$;

revoke all on function public.add_stock(uuid, int, text) from public;
grant execute on function public.add_stock(uuid, int, text) to authenticated;

-- =====================================================================
-- record_sale(items, payment_method, note, voids_sale_id)
-- The core transaction. items is a jsonb array:
--   [{ "medicine_id": "...", "quantity": 2 }, ...]
-- For each line it locks the medicine, checks stock, decrements it,
-- snapshots name + selling price, inserts the sale line and a 'sale'
-- stock_movement. Inserts the sale header with the computed total.
-- If voids_sale_id is provided (the "edit" path), the link is stamped;
-- callers should have already voided that sale via void_sale.
-- Returns the new sale id.
-- =====================================================================
create or replace function public.record_sale(
  p_items          jsonb,
  p_payment_method text default 'cash',
  p_note           text default null,
  p_voids_sale_id  uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop      uuid := public.auth_shop_id();
  v_sale_id   uuid;
  v_total     bigint := 0;
  v_count     int := 0;
  v_item      jsonb;
  v_med_id    uuid;
  v_qty       int;
  v_med       public.medicines;
  v_line_tot  bigint;
begin
  if v_shop is null then
    raise exception 'Not authenticated';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Sale must contain at least one item';
  end if;

  -- Validate the optional voided reference belongs to this shop.
  if p_voids_sale_id is not null then
    perform 1 from public.sales
     where id = p_voids_sale_id and shop_id = v_shop;
    if not found then
      raise exception 'Referenced sale to correct was not found in this shop';
    end if;
  end if;

  -- Create the header first (total filled in after lines).
  insert into public.sales
    (shop_id, total_paise, item_count, payment_method, note, status, voids_sale_id, sold_by)
  values
    (v_shop, 0, 0, coalesce(p_payment_method,'cash'), p_note, 'completed', p_voids_sale_id, auth.uid())
  returning id into v_sale_id;

  -- Process each line.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_med_id := (v_item->>'medicine_id')::uuid;
    v_qty    := (v_item->>'quantity')::int;

    if v_med_id is null or v_qty is null or v_qty <= 0 then
      raise exception 'Each item needs a medicine_id and quantity > 0';
    end if;

    -- Lock the medicine row (this shop only).
    select * into v_med
    from public.medicines
    where id = v_med_id and shop_id = v_shop and deleted_at is null
    for update;

    if not found then
      raise exception 'Medicine % not found in this shop', v_med_id;
    end if;

    if v_med.quantity < v_qty then
      raise exception 'Not enough stock for % (have %, need %)',
        v_med.name, v_med.quantity, v_qty;
    end if;

    v_line_tot := v_med.selling_price_paise * v_qty;

    -- Decrement stock.
    update public.medicines
      set quantity = quantity - v_qty
      where id = v_med_id;

    -- Insert the line with price/name snapshots.
    insert into public.sale_items
      (shop_id, sale_id, medicine_id, medicine_name, quantity, unit_price_paise, line_total_paise)
    values
      (v_shop, v_sale_id, v_med_id, v_med.name, v_qty, v_med.selling_price_paise, v_line_tot);

    -- Log the movement.
    insert into public.stock_movements
      (shop_id, medicine_id, delta, reason, ref_type, ref_id, created_by)
    values
      (v_shop, v_med_id, -v_qty, 'sale', 'sale', v_sale_id, auth.uid());

    v_total := v_total + v_line_tot;
    v_count := v_count + v_qty;
  end loop;

  -- Finalize header totals.
  update public.sales
    set total_paise = v_total, item_count = v_count
    where id = v_sale_id;

  return v_sale_id;
end;
$$;

revoke all on function public.record_sale(jsonb, text, text, uuid) from public;
grant execute on function public.record_sale(jsonb, text, text, uuid) to authenticated;

-- =====================================================================
-- void_sale(sale_id, reason)
-- Reverses a completed sale: guards against double-void, flips status to
-- 'voided', restores each line's quantity to the medicine, and logs a
-- 'void' movement per line. Keeps the sale row (append-only history).
-- =====================================================================
create or replace function public.void_sale(
  p_sale_id uuid,
  p_reason  text default null
)
returns public.sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop uuid := public.auth_shop_id();
  v_sale public.sales;
  v_line public.sale_items;
begin
  if v_shop is null then
    raise exception 'Not authenticated';
  end if;

  -- Lock the sale (this shop only).
  select * into v_sale
  from public.sales
  where id = p_sale_id and shop_id = v_shop
  for update;

  if not found then
    raise exception 'Sale not found in this shop';
  end if;
  if v_sale.status = 'voided' then
    raise exception 'Sale is already voided';
  end if;

  -- Restore stock for each line (skip lines whose medicine was deleted).
  for v_line in
    select * from public.sale_items where sale_id = p_sale_id and shop_id = v_shop
  loop
    if v_line.medicine_id is not null then
      update public.medicines
        set quantity = quantity + v_line.quantity
        where id = v_line.medicine_id and shop_id = v_shop;

      insert into public.stock_movements
        (shop_id, medicine_id, delta, reason, ref_type, ref_id, created_by)
      values
        (v_shop, v_line.medicine_id, v_line.quantity, 'void', 'sale', p_sale_id, auth.uid());
    end if;
  end loop;

  update public.sales
    set status = 'voided',
        voided_at = now(),
        voided_reason = nullif(btrim(coalesce(p_reason,'')), '')
    where id = p_sale_id
    returning * into v_sale;

  return v_sale;
end;
$$;

revoke all on function public.void_sale(uuid, text) from public;
grant execute on function public.void_sale(uuid, text) to authenticated;

-- =====================================================================
-- search_medicines(term)
-- Case-insensitive partial match across name / brand / manufacturer,
-- scoped to the caller's shop, excluding soft-deleted rows. Used by both
-- the Inventory list and the Sell search. Empty term returns the list
-- ordered by name. STABLE + runs as invoker so RLS still applies.
-- =====================================================================
create or replace function public.search_medicines(p_term text)
returns setof public.medicines
language sql
stable
set search_path = public
as $$
  select *
  from public.medicines m
  where m.shop_id = public.auth_shop_id()
    and m.deleted_at is null
    and (
      coalesce(btrim(p_term), '') = ''
      or lower(coalesce(m.name,'') || ' ' || coalesce(m.brand,'') || ' ' || coalesce(m.manufacturer,''))
         like '%' || lower(btrim(p_term)) || '%'
    )
  order by m.name asc;
$$;

revoke all on function public.search_medicines(text) from public;
grant execute on function public.search_medicines(text) to authenticated;

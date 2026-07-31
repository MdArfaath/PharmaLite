-- =====================================================================
-- seed.sql  (DEV ONLY)
-- Minimal seed for local development. Assumes migrations 0001-0006 ran.
-- Creates one demo shop + medicines WITHOUT going through auth, by
-- inserting directly (RLS is bypassed when run as the DB owner via the
-- Supabase SQL editor / psql). Do NOT run in production.
--
-- NOTE: In real usage, shops/profiles are created by provision_shop()
-- after a user signs up. This seed fabricates a fake owner_user_id for
-- convenience; replace with a real auth user id if you want to log in.
-- =====================================================================

do $$
declare
  v_plan uuid;
  v_shop uuid;
  v_fake_owner uuid := '00000000-0000-0000-0000-0000000000aa';
  v_med1 uuid;
begin
  select id into v_plan from public.plans where code = 'solo';

  -- Demo shop (owner_user_id references auth.users; for a pure-SQL demo
  -- without an auth user, temporarily drop the FK or insert a matching
  -- auth.users row. Guarded so seed is skipped if the owner doesn't exist.)
  if exists (select 1 from auth.users where id = v_fake_owner) then
    insert into public.shops (name, plan_id, owner_user_id, phone)
    values ('Demo Medical Store', v_plan, v_fake_owner, '9999999999')
    returning id into v_shop;

    insert into public.profiles (id, shop_id, full_name, role)
    values (v_fake_owner, v_shop, 'Demo Owner', 'owner');

    insert into public.medicines (shop_id, name, brand, manufacturer, unit, quantity, low_stock_threshold, purchase_price_paise, selling_price_paise, batch_no, expiry_date)
    values
      (v_shop, 'Paracetamol 500mg', 'Calpol', 'GSK',        'strip', 22, 10, 800,  1200, 'B1001', current_date + 200),
      (v_shop, 'Amoxicillin 250mg', 'Mox',    'Ranbaxy',    'strip', 6,  10, 2500, 3500, 'B1002', current_date + 20),
      (v_shop, 'Cough Syrup',       'Benadryl','Johnson',   'bottle',3,  5,  6000, 8500, 'B1003', current_date + 400),
      (v_shop, 'Antiseptic Cream',  'Soframycin','Sanofi',  'tube',  5,  5,  4000, 5500, 'B1004', current_date - 5);

    raise notice 'Seeded demo shop %', v_shop;
  else
    raise notice 'Skipping seed: create an auth user with id % first, or use the app signup flow.', v_fake_owner;
  end if;
end $$;

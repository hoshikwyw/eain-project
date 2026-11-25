-- 0028 Points step aside.
--
-- Premium templates are sold in kyat (0027), so points no longer buy
-- anything. From here on:
--   1. New accounts get no welcome points.
--   2. Publishing, opens and replies earn nothing: an 'earn' entry is
--      skipped quietly, so those actions never fail because of points.
--   3. A premium template is always paid only, and the reverse.
--
-- Kept on purpose: balances, the ledger, existing unlocks, admin
-- adjustments and refunds. If a reward scheme returns ("invite three
-- friends, get a template"), it can be built on the same ledger.

-- 1. No welcome bonus -----------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_locale text;
begin
  v_name := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(coalesce(new.email, ''), '@', 1)
  );
  v_locale := case when new.raw_user_meta_data ->> 'locale' = 'my' then 'my' else 'en' end;

  insert into public.profiles (id, display_name, avatar_url, locale)
  values (new.id, left(v_name, 80), new.raw_user_meta_data ->> 'avatar_url', v_locale);

  return new;
end;
$$;

-- 2. Activity earns nothing -----------------------------------------------------

create or replace function public.apply_point_transaction(
  p_user_id uuid,
  p_type public.point_transaction_type,
  p_amount integer,
  p_reference_type text default null,
  p_reference_id text default null,
  p_description text default ''
)
returns public.point_transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance integer;
  v_row public.point_transactions;
begin
  if p_amount = 0 then
    raise exception 'amount must not be zero' using errcode = '22023';
  end if;
  if p_type in ('spend') and p_amount > 0 then
    raise exception 'spend must be negative' using errcode = '22023';
  end if;
  if p_type in ('earn', 'purchase', 'refund', 'bonus') and p_amount < 0 then
    raise exception '% must be positive', p_type using errcode = '22023';
  end if;

  -- Points are retired as a reward: nothing is earned for activity.
  if p_type = 'earn' then
    return null;
  end if;

  -- Lock the profile row so concurrent grants and spends cannot race.
  select points_balance into v_balance
  from public.profiles where id = p_user_id for update;

  if v_balance is null then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;

  if v_balance + p_amount < 0 then
    raise exception 'insufficient points' using errcode = 'P0001';
  end if;

  insert into public.point_transactions
    (user_id, type, amount, balance_after, reference_type, reference_id, description)
  values
    (p_user_id, p_type, p_amount, v_balance + p_amount, p_reference_type, p_reference_id, p_description)
  returning * into v_row;

  update public.profiles set points_balance = v_row.balance_after where id = p_user_id;

  return v_row;
end;
$$;

revoke all on function public.apply_point_transaction(uuid, public.point_transaction_type, integer, text, text, text)
  from public, anon, authenticated;

-- 3. Premium means sold in kyat -------------------------------------------------

update public.templates set paid_only = is_premium where paid_only <> is_premium;

alter table public.templates
  drop constraint if exists templates_premium_is_paid;
alter table public.templates
  add constraint templates_premium_is_paid check (paid_only = is_premium);

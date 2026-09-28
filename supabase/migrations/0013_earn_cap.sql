-- 0013 Daily cap on earned points.
--
-- Earn rules (publish +20, first open +10, first response +20) are already
-- once per gift. Without a ceiling, deleting and re-publishing gifts or
-- opening one's own links from other browsers could still farm points.
-- Earned points are now capped per user per UTC day. When the cap is hit
-- the grant is reduced or skipped silently, so publishing, opening and
-- replying never fail because of points. Welcome bonus, admin adjustments,
-- refunds and spending are not affected.
--
-- Same signature as 0002, so every caller keeps working.

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
  daily_earn_cap constant integer := 100;
  v_balance integer;
  v_earned_today integer;
  v_amount integer := p_amount;
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

  -- Lock the profile row so concurrent grants and spends cannot race.
  select points_balance into v_balance
  from public.profiles where id = p_user_id for update;

  if v_balance is null then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;

  if p_type = 'earn' then
    select coalesce(sum(amount), 0) into v_earned_today
    from public.point_transactions
    where user_id = p_user_id and type = 'earn' and created_at >= date_trunc('day', now());

    v_amount := least(p_amount, daily_earn_cap - v_earned_today);
    if v_amount <= 0 then
      return null; -- Cap reached: nothing granted today.
    end if;
  end if;

  if v_balance + v_amount < 0 then
    raise exception 'insufficient points' using errcode = 'P0001';
  end if;

  insert into public.point_transactions
    (user_id, type, amount, balance_after, reference_type, reference_id, description)
  values
    (p_user_id, p_type, v_amount, v_balance + v_amount, p_reference_type, p_reference_id, p_description)
  returning * into v_row;

  update public.profiles set points_balance = v_row.balance_after where id = p_user_id;

  return v_row;
end;
$$;

revoke all on function public.apply_point_transaction(uuid, public.point_transaction_type, integer, text, text, text)
  from public, anon, authenticated;

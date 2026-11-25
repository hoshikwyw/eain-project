-- 0023 Points rules before the first sales.
--
-- Until now a new account got 100 points and could earn 100 more a day, so
-- any premium template (50 to 100 points) was free within a day or two and
-- nobody would ever need to pay. Three changes:
--
-- 1. The welcome bonus is 20 points, enough to feel the rewards but not to
--    unlock a premium template on day one.
-- 2. Earned points stop at 20 a day.
-- 3. A template can be paid only. Points never unlock it; Eain grants it
--    after the customer pays (KBZPay or WavePay, checked by hand at first),
--    through admin_grant_template, which is logged like every admin action.
--    The wedding and engagement invitations start as paid only.
--
-- Existing balances and unlocks are kept: no one loses what they have.
-- Same signatures as before, so every caller keeps working.

-- 1. Welcome bonus ------------------------------------------------------------

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

  perform public.apply_point_transaction(
    new.id, 'bonus', 20, 'welcome', new.id::text, 'Welcome to Eain'
  );

  return new;
end;
$$;

-- 2. Daily earn cap -------------------------------------------------------------

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
  daily_earn_cap constant integer := 20;
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

-- 3. Paid-only templates --------------------------------------------------------

alter table public.templates
  add column if not exists paid_only boolean not null default false;

-- Paid only is a kind of premium: a free template cannot be paid only.
alter table public.templates
  drop constraint if exists templates_paid_only_premium;
alter table public.templates
  add constraint templates_paid_only_premium check (not paid_only or is_premium);

update public.templates set paid_only = true
where slug in ('wedding-invitation', 'engagement-party');

-- An unlock granted after a payment has no points transaction behind it.
alter table public.template_unlocks
  alter column transaction_id drop not null;

create or replace function public.unlock_template(p_template_id uuid)
returns public.template_unlocks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_template public.templates;
  v_existing public.template_unlocks;
  v_tx public.point_transactions;
  v_row public.template_unlocks;
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  select * into v_template from public.templates where id = p_template_id and is_active;
  if v_template.id is null then
    raise exception 'template not found' using errcode = 'P0002';
  end if;
  if not v_template.is_premium then
    raise exception 'template is free' using errcode = '22023';
  end if;

  select * into v_existing from public.template_unlocks
  where user_id = auth.uid() and template_id = p_template_id;
  if v_existing.user_id is not null then
    return v_existing;
  end if;

  if v_template.paid_only then
    raise exception 'paid only' using errcode = 'P0001';
  end if;

  -- Raises 'insufficient points' when the balance is too low.
  v_tx := public.apply_point_transaction(
    auth.uid(), 'spend', -v_template.point_price, 'template_unlock', p_template_id::text,
    'Unlocked template ' || v_template.slug
  );

  insert into public.template_unlocks (user_id, template_id, transaction_id)
  values (auth.uid(), p_template_id, v_tx.id)
  returning * into v_row;
  return v_row;
exception
  when unique_violation then
    -- Two clicks at once: the ledger already charged once. Return the unlock.
    select * into v_existing from public.template_unlocks
    where user_id = auth.uid() and template_id = p_template_id;
    return v_existing;
end;
$$;

revoke all on function public.unlock_template(uuid) from public, anon;
grant execute on function public.unlock_template(uuid) to authenticated;

-- Gives a user a premium template after they paid. Granting twice is a no-op.
create or replace function public.admin_grant_template(
  p_user_id uuid,
  p_template_id uuid,
  p_note text
)
returns public.template_unlocks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_template public.templates;
  v_row public.template_unlocks;
begin
  perform public.assert_admin();

  select * into v_template from public.templates where id = p_template_id;
  if v_template.id is null then
    raise exception 'template not found' using errcode = 'P0002';
  end if;
  if not v_template.is_premium then
    raise exception 'template is free' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;

  insert into public.template_unlocks (user_id, template_id, transaction_id)
  values (p_user_id, p_template_id, null)
  on conflict (user_id, template_id) do nothing
  returning * into v_row;

  if v_row.user_id is null then
    select * into v_row from public.template_unlocks
    where user_id = p_user_id and template_id = p_template_id;
    return v_row; -- Already had it: nothing new to log.
  end if;

  perform public.admin_log('grant_template', 'user', p_user_id::text,
    jsonb_build_object(
      'template', v_template.slug,
      'note', left(coalesce(nullif(trim(p_note), ''), ''), 200)
    ));

  return v_row;
end;
$$;

revoke all on function public.admin_grant_template(uuid, uuid, text) from public, anon;
grant execute on function public.admin_grant_template(uuid, uuid, text) to authenticated;

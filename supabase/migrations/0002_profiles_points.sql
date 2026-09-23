-- 0002 Profiles and Eain Points.
--
-- profiles
--   Owner: the user. Read: own row (admins: all). Create: trigger only.
--   Update: own row, safe columns only. Delete: cascades from auth.users.
--   Public: nothing. Personal data: yes. RLS: yes. Retention: until account deletion.
--
-- point_transactions
--   Owner: the user. Read: own rows. Create/Update/Delete: ledger function only.
--   Public: nothing. Personal data: no. RLS: yes. Audit: it IS the audit. Retention: kept.
--
-- template_unlocks
--   Owner: the user. Read: own rows. Create: ledger spend only. Retention: kept.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 2048),
  locale text not null default 'en' check (locale in ('en', 'my')),
  role public.user_role not null default 'user',
  points_balance integer not null default 0 check (points_balance >= 0),
  notify_on_open boolean not null default true,
  notify_on_response boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: read own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Column-level grants: role and points_balance can never be changed by a
-- user, whatever the policy says. Only the ledger function (owner) can.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar_url, locale, notify_on_open, notify_on_response)
  on public.profiles to authenticated;

-- Point ledger ------------------------------------------------------------

create table public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.point_transaction_type not null,
  amount integer not null check (amount <> 0),
  balance_after integer not null check (balance_after >= 0),
  reference_type text check (reference_type is null or char_length(reference_type) <= 40),
  reference_id text check (reference_id is null or char_length(reference_id) <= 128),
  description text not null default '' check (char_length(description) <= 200),
  created_at timestamptz not null default now()
);

create index point_transactions_user_created_idx
  on public.point_transactions (user_id, created_at desc);

-- One transaction per (user, reference). Makes earn rules and unlocks idempotent.
create unique index point_transactions_user_reference_uidx
  on public.point_transactions (user_id, reference_type, reference_id)
  where reference_id is not null;

alter table public.point_transactions enable row level security;

create policy "point_transactions: read own"
  on public.point_transactions for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

revoke all on public.point_transactions from anon, authenticated;
grant select on public.point_transactions to authenticated;

create table public.template_unlocks (
  user_id uuid not null references public.profiles (id) on delete cascade,
  template_id uuid not null,
  transaction_id uuid not null references public.point_transactions (id),
  created_at timestamptz not null default now(),
  primary key (user_id, template_id)
);

alter table public.template_unlocks enable row level security;

create policy "template_unlocks: read own"
  on public.template_unlocks for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

revoke all on public.template_unlocks from anon, authenticated;
grant select on public.template_unlocks to authenticated;

-- The only way a balance changes. Runs as the table owner. Not callable by
-- users directly; server code calls it with the service role, and other
-- database functions call it internally.
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

  -- Lock the profile row so concurrent spends cannot overdraw.
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

-- New user: create profile and grant welcome points ------------------------

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
    new.id, 'bonus', 100, 'welcome', new.id::text, 'Welcome to Eain'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

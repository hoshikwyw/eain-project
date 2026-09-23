-- 0005 Notifications, reports, admin audit, rate limits, payments.
--
-- notifications
--   Owner: the user. Read and mark-as-read: own. Create: server functions.
--   Retention: trimmed after a set period.
--
-- reports
--   Created by anyone through server code. Read/Update: admins. Retention:
--   until resolved plus a set period.
--
-- admin_audit_logs
--   Written by server code for every admin action. Read: admins. Retention: long.
--
-- rate_limits
--   Server only. Holds salted hashes, never raw IPs. Rows expire in hours.
--
-- payments
--   Owner: the user. Read: own. Written by server after provider verification.
--   Unused in V1 (payments off). Retention: per legal need.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  gift_id uuid references public.gifts (id) on delete cascade,
  title_key text not null check (char_length(title_key) <= 80),
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;
create policy "notifications: read own"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy "notifications: update own"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "notifications: delete own"
  on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));
revoke all on public.notifications from anon, authenticated;
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.gifts (id) on delete cascade,
  reporter_id uuid references public.profiles (id) on delete set null,
  reason public.report_reason not null,
  details text not null default '' check (char_length(details) <= 1000),
  status public.report_status not null default 'open',
  resolved_by uuid references public.profiles (id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index reports_status_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;
create policy "reports: admin read"
  on public.reports for select to authenticated using (public.is_admin());
create policy "reports: admin update"
  on public.reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
revoke all on public.reports from anon, authenticated;
grant select on public.reports to authenticated;
grant update (status, resolved_by, resolved_at) on public.reports to authenticated;

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles (id),
  action text not null check (char_length(action) <= 80),
  target_type text not null check (char_length(target_type) <= 40),
  target_id text check (target_id is null or char_length(target_id) <= 128),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_logs_created_idx on public.admin_audit_logs (created_at desc);

alter table public.admin_audit_logs enable row level security;
create policy "admin_audit_logs: admin read"
  on public.admin_audit_logs for select to authenticated using (public.is_admin());
revoke all on public.admin_audit_logs from anon, authenticated;
grant select on public.admin_audit_logs to authenticated;

create table public.rate_limits (
  key text primary key,
  count integer not null default 0,
  window_started_at timestamptz not null default now()
);

alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

-- Fixed-window counter. Returns true when the call is allowed.
create or replace function public.check_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  insert into public.rate_limits (key, count, window_started_at)
  values (p_key, 1, now())
  on conflict (key) do update
    set count = case
          when public.rate_limits.window_started_at < now() - make_interval(secs => p_window_seconds) then 1
          else public.rate_limits.count + 1
        end,
        window_started_at = case
          when public.rate_limits.window_started_at < now() - make_interval(secs => p_window_seconds) then now()
          else public.rate_limits.window_started_at
        end
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  provider text not null check (char_length(provider) <= 40),
  provider_reference text not null check (char_length(provider_reference) <= 128),
  amount_mmk integer not null check (amount_mmk > 0),
  points integer not null check (points > 0),
  status public.payment_status not null default 'pending',
  point_transaction_id uuid references public.point_transactions (id),
  created_at timestamptz not null default now(),
  verified_at timestamptz,
  unique (provider, provider_reference)
);

alter table public.payments enable row level security;
create policy "payments: read own"
  on public.payments for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
revoke all on public.payments from anon, authenticated;
grant select on public.payments to authenticated;

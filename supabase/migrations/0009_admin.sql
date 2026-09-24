-- 0009 Admin functions and reporting.
--
-- Every admin action goes through a function that checks is_admin() and
-- writes an admin_audit_logs row in the same transaction. Admins never get
-- broad UPDATE rights on user data; they get these narrow, logged actions.
-- Reports are inserted by server code (service role) on behalf of receivers.

create or replace function public.assert_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.assert_admin() from public, anon, authenticated;

create or replace function public.admin_log(
  p_action text,
  p_target_type text,
  p_target_id text,
  p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  insert into public.admin_audit_logs (admin_id, action, target_type, target_id, details)
  values (auth.uid(), left(p_action, 80), left(p_target_type, 40), left(p_target_id, 128), coalesce(p_details, '{}'::jsonb));
end;
$$;
revoke all on function public.admin_log(text, text, text, jsonb) from public, anon;
grant execute on function public.admin_log(text, text, text, jsonb) to authenticated;

-- Takes a gift offline. The owner keeps the content and is told why.
create or replace function public.admin_disable_gift(p_gift_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gift public.gifts;
begin
  perform public.assert_admin();

  update public.gifts set status = 'unpublished'
  where id = p_gift_id and status = 'published'
  returning * into v_gift;

  if v_gift.id is null then
    raise exception 'gift not found or not published' using errcode = 'P0002';
  end if;

  insert into public.gift_events (gift_id, event_type) values (p_gift_id, 'unpublished');

  insert into public.notifications (user_id, type, gift_id, title_key, payload)
  values (v_gift.sender_id, 'system', p_gift_id, 'giftDisabled',
          jsonb_build_object('giftTitle', v_gift.title, 'reason', left(coalesce(p_reason, ''), 300)));

  perform public.admin_log('disable_gift', 'gift', p_gift_id::text, jsonb_build_object('reason', left(coalesce(p_reason, ''), 300)));
end;
$$;
revoke all on function public.admin_disable_gift(uuid, text) from public, anon;
grant execute on function public.admin_disable_gift(uuid, text) to authenticated;

create or replace function public.admin_resolve_report(p_report_id uuid, p_status public.report_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  if p_status not in ('resolved', 'dismissed', 'reviewing') then
    raise exception 'invalid status' using errcode = '22023';
  end if;

  update public.reports
  set status = p_status,
      resolved_by = case when p_status in ('resolved', 'dismissed') then auth.uid() else null end,
      resolved_at = case when p_status in ('resolved', 'dismissed') then now() else null end
  where id = p_report_id;

  if not found then
    raise exception 'report not found' using errcode = 'P0002';
  end if;

  perform public.admin_log('resolve_report', 'report', p_report_id::text, jsonb_build_object('status', p_status));
end;
$$;
revoke all on function public.admin_resolve_report(uuid, public.report_status) from public, anon;
grant execute on function public.admin_resolve_report(uuid, public.report_status) to authenticated;

-- An admin cannot change their own role, so there is always a second admin involved.
create or replace function public.admin_set_role(p_user_id uuid, p_role public.user_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  if p_user_id = auth.uid() then
    raise exception 'cannot change own role' using errcode = '22023';
  end if;
  update public.profiles set role = p_role where id = p_user_id;
  if not found then
    raise exception 'user not found' using errcode = 'P0002';
  end if;
  perform public.admin_log('set_role', 'user', p_user_id::text, jsonb_build_object('role', p_role));
end;
$$;
revoke all on function public.admin_set_role(uuid, public.user_role) from public, anon;
grant execute on function public.admin_set_role(uuid, public.user_role) to authenticated;

-- Manual point correction. Positive = bonus, negative = spend. Always through the ledger.
create or replace function public.admin_adjust_points(p_user_id uuid, p_amount integer, p_description text)
returns public.point_transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tx public.point_transactions;
begin
  perform public.assert_admin();
  if p_amount = 0 or abs(p_amount) > 100000 then
    raise exception 'invalid amount' using errcode = '22023';
  end if;

  v_tx := public.apply_point_transaction(
    p_user_id,
    case when p_amount > 0 then 'bonus'::public.point_transaction_type else 'spend'::public.point_transaction_type end,
    p_amount,
    'admin_adjustment',
    gen_random_uuid()::text,
    left(coalesce(nullif(trim(p_description), ''), 'Adjustment by Eain'), 200)
  );

  perform public.admin_log('adjust_points', 'user', p_user_id::text,
    jsonb_build_object('amount', p_amount, 'transaction_id', v_tx.id, 'description', v_tx.description));
  return v_tx;
end;
$$;
revoke all on function public.admin_adjust_points(uuid, integer, text) from public, anon;
grant execute on function public.admin_adjust_points(uuid, integer, text) to authenticated;

-- Template metadata edits, logged.
create or replace function public.admin_update_template(
  p_template_id uuid,
  p_is_active boolean,
  p_is_featured boolean,
  p_is_premium boolean,
  p_point_price integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  update public.templates
  set is_active = p_is_active,
      is_featured = p_is_featured,
      is_premium = p_is_premium,
      point_price = case when p_is_premium then greatest(p_point_price, 1) else 0 end
  where id = p_template_id;
  if not found then
    raise exception 'template not found' using errcode = 'P0002';
  end if;
  perform public.admin_log('update_template', 'template', p_template_id::text,
    jsonb_build_object('is_active', p_is_active, 'is_featured', p_is_featured, 'is_premium', p_is_premium, 'point_price', p_point_price));
end;
$$;
revoke all on function public.admin_update_template(uuid, boolean, boolean, boolean, integer) from public, anon;
grant execute on function public.admin_update_template(uuid, boolean, boolean, boolean, integer) to authenticated;

-- Platform counts for the admin overview and the free-tier usage panel.
create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  return jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'admins', (select count(*) from public.profiles where role = 'admin'),
    'gifts', (select count(*) from public.gifts where status <> 'deleted'),
    'published', (select count(*) from public.gifts where status = 'published'),
    'opened_gifts', (select count(distinct gift_id) from public.gift_events where event_type = 'opened'),
    'responses', (select count(*) from public.gift_responses),
    'open_reports', (select count(*) from public.reports where status in ('open', 'reviewing')),
    'media_count', (select count(*) from public.gift_media),
    'media_bytes', (select coalesce(sum(bytes), 0) from public.gift_media),
    'points_in_circulation', (select coalesce(sum(points_balance), 0) from public.profiles),
    'published_last_7_days', (select count(*) from public.gift_events where event_type = 'published' and created_at > now() - interval '7 days'),
    'db_bytes', pg_database_size(current_database())
  );
end;
$$;
revoke all on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;

-- Admins read every gift's sections, media and recipient for moderation.
-- The owner policies already include is_admin() through owns_gift(); the
-- profiles read policy also does. Nothing more is needed for reading.

-- 0007 Gift lifecycle functions and open tracking.
--
-- Creators call publish/unpublish/regenerate/delete through RPC. Each checks
-- ownership itself and runs as owner so it can touch columns users cannot
-- (share_token, published_at, events, points, notifications).
--
-- record_gift_open is called only by server code with the service role.
-- It never stores IP, user agent or location. session_id is a random id the
-- receiver's browser generates so repeat views are not double counted.

-- Every new gift gets a CREATED event. Runs as owner because users cannot
-- insert events directly.
create or replace function public.on_gift_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.gift_events (gift_id, event_type) values (new.id, 'created');
  return new;
end;
$$;

create trigger gifts_on_created
  after insert on public.gifts
  for each row execute function public.on_gift_created();

-- Publish -------------------------------------------------------------------

create or replace function public.publish_gift(p_gift_id uuid)
returns public.gifts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gift public.gifts;
begin
  select * into v_gift from public.gifts
  where id = p_gift_id and sender_id = auth.uid() for update;

  if v_gift.id is null then
    raise exception 'gift not found' using errcode = 'P0002';
  end if;
  if v_gift.status = 'deleted' then
    raise exception 'gift deleted' using errcode = 'P0001';
  end if;

  -- One default recipient so gifts and recipients are separate from day one.
  if not exists (select 1 from public.gift_recipients where gift_id = p_gift_id) then
    insert into public.gift_recipients (gift_id) values (p_gift_id);
  end if;

  update public.gifts
  set status = 'published',
      published_at = coalesce(published_at, now())
  where id = p_gift_id
  returning * into v_gift;

  insert into public.gift_events (gift_id, event_type) values (p_gift_id, 'published');

  -- Earn rule: +20 for the first publish of a gift. The unique reference
  -- index makes this idempotent, so republishing never pays twice.
  begin
    perform public.apply_point_transaction(
      v_gift.sender_id, 'earn', 20, 'gift_publish', p_gift_id::text, 'Published a gift'
    );
  exception when unique_violation then
    null;
  end;

  return v_gift;
end;
$$;

create or replace function public.unpublish_gift(p_gift_id uuid)
returns public.gifts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gift public.gifts;
begin
  update public.gifts
  set status = 'unpublished'
  where id = p_gift_id and sender_id = auth.uid() and status = 'published'
  returning * into v_gift;

  if v_gift.id is null then
    raise exception 'gift not found or not published' using errcode = 'P0002';
  end if;

  insert into public.gift_events (gift_id, event_type) values (p_gift_id, 'unpublished');
  return v_gift;
end;
$$;

-- New link. The old token stops working immediately.
create or replace function public.regenerate_gift_link(p_gift_id uuid)
returns public.gifts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gift public.gifts;
begin
  update public.gifts
  set share_token = public.generate_token()
  where id = p_gift_id and sender_id = auth.uid() and status <> 'deleted'
  returning * into v_gift;

  if v_gift.id is null then
    raise exception 'gift not found' using errcode = 'P0002';
  end if;

  insert into public.gift_events (gift_id, event_type) values (p_gift_id, 'link_regenerated');
  return v_gift;
end;
$$;

-- Soft delete: link stops working now, content is removed by the retention job later.
create or replace function public.delete_gift(p_gift_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.gifts
  set status = 'deleted', deleted_at = now()
  where id = p_gift_id and sender_id = auth.uid() and status <> 'deleted';

  if not found then
    raise exception 'gift not found' using errcode = 'P0002';
  end if;

  insert into public.gift_events (gift_id, event_type) values (p_gift_id, 'deleted');
end;
$$;

revoke all on function public.publish_gift(uuid) from public, anon;
revoke all on function public.unpublish_gift(uuid) from public, anon;
revoke all on function public.regenerate_gift_link(uuid) from public, anon;
revoke all on function public.delete_gift(uuid) from public, anon;
grant execute on function public.publish_gift(uuid) to authenticated;
grant execute on function public.unpublish_gift(uuid) to authenticated;
grant execute on function public.regenerate_gift_link(uuid) to authenticated;
grant execute on function public.delete_gift(uuid) to authenticated;

-- Open tracking (service role only) ------------------------------------------

create or replace function public.record_gift_open(p_share_token text, p_session_id text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gift public.gifts;
  v_recipient public.gift_recipients;
  v_first_open boolean := false;
  v_sender public.profiles;
begin
  select * into v_gift from public.gifts
  where share_token = p_share_token and status = 'published';
  if v_gift.id is null then
    return false;
  end if;

  -- Same browser session opening again is not a new open.
  if exists (
    select 1 from public.gift_events
    where gift_id = v_gift.id and event_type = 'opened' and session_id = p_session_id
  ) then
    return true;
  end if;

  select * into v_recipient from public.gift_recipients
  where gift_id = v_gift.id order by created_at limit 1 for update;

  v_first_open := v_recipient.first_opened_at is null;

  update public.gift_recipients
  set first_opened_at = coalesce(first_opened_at, now()),
      last_opened_at = now(),
      open_count = open_count + 1
  where id = v_recipient.id;

  insert into public.gift_events (gift_id, recipient_id, event_type, session_id)
  values (v_gift.id, v_recipient.id, 'opened', p_session_id);

  if v_first_open then
    select * into v_sender from public.profiles where id = v_gift.sender_id;

    if v_sender.notify_on_open then
      insert into public.notifications (user_id, type, gift_id, title_key, payload)
      values (v_gift.sender_id, 'gift_opened', v_gift.id, 'giftOpened',
              jsonb_build_object('giftTitle', v_gift.title));
    end if;

    -- Earn rule: +10 the first time a gift is opened.
    begin
      perform public.apply_point_transaction(
        v_gift.sender_id, 'earn', 10, 'gift_opened', v_gift.id::text, 'Your gift was opened'
      );
    exception when unique_violation then
      null;
    end;
  end if;

  return true;
end;
$$;

-- Receiver reached the end of the content. Service role only.
create or replace function public.record_gift_viewed(p_share_token text, p_session_id text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gift_id uuid;
begin
  select id into v_gift_id from public.gifts
  where share_token = p_share_token and status = 'published';
  if v_gift_id is null then
    return false;
  end if;

  if not exists (
    select 1 from public.gift_events
    where gift_id = v_gift_id and event_type = 'viewed' and session_id = p_session_id
  ) then
    insert into public.gift_events (gift_id, event_type, session_id)
    values (v_gift_id, 'viewed', p_session_id);
  end if;
  return true;
end;
$$;

revoke all on function public.record_gift_open(text, text) from public, anon, authenticated;
revoke all on function public.record_gift_viewed(text, text) from public, anon, authenticated;

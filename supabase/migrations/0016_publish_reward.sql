-- 0016 Creating a gift earns 5 points, down from 20.
--
-- "Create a gift" on the dashboard is the reward paid the first time a gift
-- is published. Only the amount changes; the rest of publish_gift is as in
-- 0007. The rewards for a first open (+10) and a first response (+20) stay.
-- Points already paid are not touched.

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

  -- Earn rule: +5 for the first publish of a gift. The unique reference
  -- index makes this idempotent, so republishing never pays twice.
  begin
    perform public.apply_point_transaction(
      v_gift.sender_id, 'earn', 5, 'gift_publish', p_gift_id::text, 'Published a gift'
    );
  exception when unique_violation then
    null;
  end;

  return v_gift;
end;
$$;

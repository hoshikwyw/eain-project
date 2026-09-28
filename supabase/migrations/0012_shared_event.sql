-- 0012 Record the "shared" step of a gift's timeline.
-- The creator copies the link, uses the phone's share sheet or downloads the
-- QR. Creators cannot insert events directly, so this owner-checked function
-- records it once per gift. The spec's distinction holds: shared means the
-- creator shared it, not that anyone received it.

create or replace function public.record_gift_shared(p_gift_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.gifts
    where id = p_gift_id and sender_id = auth.uid() and status = 'published'
  ) then
    return false;
  end if;

  if not exists (select 1 from public.gift_events where gift_id = p_gift_id and event_type = 'shared') then
    insert into public.gift_events (gift_id, event_type) values (p_gift_id, 'shared');
  end if;
  return true;
end;
$$;

revoke all on function public.record_gift_shared(uuid) from public, anon;
grant execute on function public.record_gift_shared(uuid) to authenticated;

-- 0030 Admins hear about a new payment.
--
-- With 0029 a customer's "I've paid" waits in /admin/payments, but nothing
-- told the admin it was there. Now every admin gets a notification when a
-- new pending payment is made (not when the same customer asks again for
-- the same template, which returns the existing one). The notification
-- carries the template, the amount and the wallet; the app links it to the
-- payments queue.
--
-- Same signature and checks as 0029; only the alert is new.
--
-- Also: a deleted account's waiting payments close with it (they could
-- never be approved), and any left behind already are closed now.

create or replace function public.request_template_purchase(
  p_template_id uuid,
  p_provider text,
  p_reference text
)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_template public.templates;
  v_reference text;
  v_row public.payments;
  v_pending integer;
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  if p_provider is null or p_provider not in ('kbzpay', 'wavepay') then
    raise exception 'unknown wallet' using errcode = '22023';
  end if;

  -- Spaces and dashes are how people copy transaction ids; they are not part of it.
  v_reference := upper(regexp_replace(coalesce(p_reference, ''), '[\s-]', '', 'g'));
  if char_length(v_reference) < 4 or char_length(v_reference) > 40 then
    raise exception 'bad reference' using errcode = '22023';
  end if;

  select * into v_template from public.templates where id = p_template_id and is_active;
  if v_template.id is null then
    raise exception 'template not found' using errcode = 'P0002';
  end if;
  if not v_template.paid_only or v_template.price_mmk is null then
    raise exception 'not for sale' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.template_unlocks
    where user_id = auth.uid() and template_id = p_template_id
  ) then
    raise exception 'already owned' using errcode = 'P0001';
  end if;

  select * into v_row from public.payments
  where user_id = auth.uid() and template_id = p_template_id and status = 'pending'
  order by created_at desc
  limit 1;
  if v_row.id is not null then
    return v_row;
  end if;

  -- A few at a time is plenty for a real customer, and stops a flood.
  select count(*) into v_pending from public.payments
  where user_id = auth.uid() and status = 'pending';
  if v_pending >= 5 then
    raise exception 'too many pending' using errcode = 'P0001';
  end if;

  insert into public.payments (user_id, provider, provider_reference, amount_mmk, template_id)
  values (auth.uid(), p_provider, v_reference, v_template.price_mmk, p_template_id)
  returning * into v_row;

  -- Every admin hears about it, so a paying customer is not left waiting.
  insert into public.notifications (user_id, type, title_key, payload)
  select p.id, 'system', 'paymentWaiting',
         jsonb_build_object(
           'templateSlug', v_template.slug,
           'templateName', v_template.name_en,
           'templateNameMy', v_template.name_my,
           'amountMmk', v_row.amount_mmk,
           'provider', v_row.provider,
           'paymentId', v_row.id
         )
  from public.profiles p
  where p.role = 'admin' and p.id <> auth.uid();

  return v_row;
end;
$$;

revoke all on function public.request_template_purchase(uuid, text, text) from public, anon;
grant execute on function public.request_template_purchase(uuid, text, text) to authenticated;

-- A deleted account's waiting payments can never be approved (there is no
-- one to give the template to), so they close with the account instead of
-- sitting in the queue for good. The money record stays, marked why.
create or replace function public.close_payments_of_deleted_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.payments
  set status = 'failed', verified_at = now(), review_note = 'Account deleted'
  where user_id = old.id and status = 'pending';
  return old;
end;
$$;

revoke all on function public.close_payments_of_deleted_profile() from public, anon, authenticated;

drop trigger if exists close_payments_on_profile_delete on public.profiles;
create trigger close_payments_on_profile_delete
  before delete on public.profiles
  for each row execute function public.close_payments_of_deleted_profile();

-- Any already left behind by a deleted account.
update public.payments
set status = 'failed', verified_at = now(), review_note = 'Account deleted'
where status = 'pending' and user_id is null;

-- 0029 Customers tell Eain they paid for a template.
--
-- The payments table (0005) was made for buying points and never used.
-- Premium templates are sold in kyat now (0027, 0028), so a payment is for
-- one template: the customer pays by KBZPay or WavePay, then on the buy
-- page says which wallet and the last digits of the transaction. That
-- creates a pending payment. The admin checks it against the wallet app and
-- approves it (admin_review_payment, below), which grants the template and
-- tells the customer; or rejects it, which tells them too.
--
-- Changes to the table:
--   - template_id: which template the payment is for.
--   - points is no longer required (a template payment carries none).
--   - provider_reference is what the customer typed (last digits); two
--     customers can type the same digits, so it is no longer unique.
--   - provider is kbzpay or wavepay.
--   - user_id and template_id are set to null if the account or template is
--     deleted, so deleting an account never fails because of a payment and
--     the money record stays for accounting.
--   - reviewed_by and review_note for the admin's decision.

alter table public.payments drop constraint if exists payments_provider_provider_reference_key;

alter table public.payments alter column points drop not null;
alter table public.payments drop constraint if exists payments_points_check;
alter table public.payments
  add constraint payments_points_check check (points is null or points > 0);

alter table public.payments drop constraint if exists payments_provider_known;
alter table public.payments
  add constraint payments_provider_known check (provider in ('kbzpay', 'wavepay'));

alter table public.payments alter column user_id drop not null;
alter table public.payments drop constraint if exists payments_user_id_fkey;
alter table public.payments
  add constraint payments_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete set null;

alter table public.payments
  add column if not exists template_id uuid references public.templates (id) on delete set null;
alter table public.payments
  add column if not exists reviewed_by uuid references public.profiles (id) on delete set null;
alter table public.payments
  add column if not exists review_note text check (review_note is null or char_length(review_note) <= 200);

create index if not exists payments_pending_idx
  on public.payments (created_at) where status = 'pending';

-- The customer's side: "I paid for this template". Returns the pending
-- payment; asking twice for the same template returns the same one.
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
  return v_row;
end;
$$;

revoke all on function public.request_template_purchase(uuid, text, text) from public, anon;
grant execute on function public.request_template_purchase(uuid, text, text) to authenticated;

-- The admin's side: approve (grant the template) or reject a pending
-- payment. Either way the customer gets a notification and the decision is
-- in the audit log. Deciding twice is refused, so two admins cannot both act.
create or replace function public.admin_review_payment(
  p_payment_id uuid,
  p_approve boolean,
  p_note text
)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.payments;
  v_template public.templates;
  v_note text := left(coalesce(nullif(trim(p_note), ''), ''), 200);
begin
  perform public.assert_admin();

  select * into v_row from public.payments where id = p_payment_id for update;
  if v_row.id is null then
    raise exception 'payment not found' using errcode = 'P0002';
  end if;
  if v_row.status <> 'pending' then
    raise exception 'already decided' using errcode = 'P0001';
  end if;
  if v_row.user_id is null or v_row.template_id is null then
    raise exception 'account or template gone' using errcode = 'P0002';
  end if;

  select * into v_template from public.templates where id = v_row.template_id;

  if p_approve then
    insert into public.template_unlocks (user_id, template_id, transaction_id)
    values (v_row.user_id, v_row.template_id, null)
    on conflict (user_id, template_id) do nothing;
  end if;

  update public.payments
  set status = case when p_approve then 'verified'::public.payment_status
                    else 'failed'::public.payment_status end,
      verified_at = now(),
      reviewed_by = auth.uid(),
      review_note = nullif(v_note, '')
  where id = v_row.id
  returning * into v_row;

  insert into public.notifications (user_id, type, title_key, payload)
  values (
    v_row.user_id,
    'system',
    case when p_approve then 'paymentApproved' else 'paymentRejected' end,
    jsonb_build_object(
      'templateSlug', v_template.slug,
      'templateName', v_template.name_en,
      'templateNameMy', v_template.name_my,
      'reason', nullif(v_note, '')
    )
  );

  perform public.admin_log(
    case when p_approve then 'approve_payment' else 'reject_payment' end,
    'user', v_row.user_id::text,
    jsonb_build_object(
      'payment', v_row.id, 'template', v_template.slug, 'amount_mmk', v_row.amount_mmk,
      'provider', v_row.provider, 'reference', v_row.provider_reference, 'note', v_note
    ));

  return v_row;
end;
$$;

revoke all on function public.admin_review_payment(uuid, boolean, text) from public, anon;
grant execute on function public.admin_review_payment(uuid, boolean, text) to authenticated;

-- 0008 Receiver responses, generic receiver events, premium template unlock.
--
-- submit_gift_response / record_receiver_event: service role only. Called by
-- server code after the share-token lookup and rate limit. No IP or device
-- data is stored; session_id is a random id from the receiver's browser.
--
-- unlock_template: called by the signed-in creator through RPC. The only way
-- to gain a premium template. Spends points through the ledger, once.

-- Generic dedupe of receiver events that are not "opened". Service role only.
create or replace function public.record_receiver_event(
  p_share_token text,
  p_session_id text,
  p_type public.gift_event_type
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gift_id uuid;
begin
  if p_type not in ('viewed', 'response_started') then
    raise exception 'event type not allowed' using errcode = '22023';
  end if;

  select id into v_gift_id from public.gifts
  where share_token = p_share_token and status = 'published';
  if v_gift_id is null then
    return false;
  end if;

  if not exists (
    select 1 from public.gift_events
    where gift_id = v_gift_id and event_type = p_type and session_id = p_session_id
  ) then
    insert into public.gift_events (gift_id, event_type, session_id)
    values (v_gift_id, p_type, p_session_id);
  end if;
  return true;
end;
$$;

revoke all on function public.record_receiver_event(text, text, public.gift_event_type)
  from public, anon, authenticated;

-- Response --------------------------------------------------------------------
--
-- p_answers: [{ "questionId": uuid, "optionId": uuid|null, "text": string|null, "number": int|null }]
-- Validates every question belongs to the gift and every option to its
-- question. Required questions must be answered. One response per session.
-- Returns the new response id, or raises.

create or replace function public.submit_gift_response(
  p_share_token text,
  p_session_id text,
  p_answers jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gift public.gifts;
  v_recipient_id uuid;
  v_response_id uuid;
  v_sender public.profiles;
  v_first boolean;
  a jsonb;
  v_qid uuid;
  v_oid uuid;
  v_q public.gift_questions;
  v_label text;
  v_answered uuid[] := '{}';
begin
  select * into v_gift from public.gifts
  where share_token = p_share_token and status = 'published';
  if v_gift.id is null then
    raise exception 'gift not found' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.gift_responses
    where gift_id = v_gift.id and session_id = p_session_id
  ) then
    raise exception 'already responded' using errcode = '23505';
  end if;

  if jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) = 0 or jsonb_array_length(p_answers) > 20 then
    raise exception 'answers required' using errcode = '22023';
  end if;

  select id into v_recipient_id from public.gift_recipients
  where gift_id = v_gift.id order by created_at limit 1;

  v_first := not exists (select 1 from public.gift_responses where gift_id = v_gift.id);

  insert into public.gift_responses (gift_id, recipient_id, session_id)
  values (v_gift.id, v_recipient_id, p_session_id)
  returning id into v_response_id;

  for a in select * from jsonb_array_elements(p_answers) loop
    v_qid := (a ->> 'questionId')::uuid;
    select * into v_q from public.gift_questions where id = v_qid and gift_id = v_gift.id;
    if v_q.id is null then
      raise exception 'question not in gift' using errcode = '22023';
    end if;
    if v_qid = any (v_answered) then
      continue;
    end if;

    v_oid := null;
    v_label := null;
    if a ? 'optionId' and a ->> 'optionId' is not null then
      select id, label into v_oid, v_label from public.gift_question_options
      where id = (a ->> 'optionId')::uuid and question_id = v_qid;
      if v_oid is null then
        raise exception 'option not in question' using errcode = '22023';
      end if;
    end if;

    if v_q.type in ('choice', 'yes_no', 'reaction') and v_oid is null then
      raise exception 'option required' using errcode = '22023';
    end if;
    if v_q.type = 'rating' and (a ->> 'number') is null then
      raise exception 'rating required' using errcode = '22023';
    end if;
    if v_q.type = 'short_text' and coalesce(nullif(trim(a ->> 'text'), ''), '') = '' then
      raise exception 'text required' using errcode = '22023';
    end if;

    insert into public.gift_answers (response_id, question_id, option_id, answer_text, answer_number)
    values (
      v_response_id,
      v_qid,
      v_oid,
      -- Snapshot the option label so the answer survives option edits.
      left(coalesce(nullif(trim(a ->> 'text'), ''), v_label), 1000),
      case when (a ->> 'number') ~ '^[0-9]+$' then least((a ->> 'number')::int, 10) else null end
    );
    v_answered := array_append(v_answered, v_qid);
  end loop;

  if exists (
    select 1 from public.gift_questions q
    where q.gift_id = v_gift.id and q.is_required and not (q.id = any (v_answered))
  ) then
    raise exception 'required question missing' using errcode = '22023';
  end if;

  insert into public.gift_events (gift_id, recipient_id, event_type, session_id)
  values (v_gift.id, v_recipient_id, 'responded', p_session_id);

  select * into v_sender from public.profiles where id = v_gift.sender_id;
  if v_sender.notify_on_response then
    insert into public.notifications (user_id, type, gift_id, title_key, payload)
    values (v_gift.sender_id, 'response_received', v_gift.id, 'responseReceived',
            jsonb_build_object('giftTitle', v_gift.title));
  end if;

  -- Earn rule: +20 for the first response a gift receives.
  if v_first then
    begin
      perform public.apply_point_transaction(
        v_gift.sender_id, 'earn', 20, 'gift_responded', v_gift.id::text, 'Someone responded to your gift'
      );
    exception when unique_violation then
      null;
    end;
  end if;

  return v_response_id;
end;
$$;

revoke all on function public.submit_gift_response(text, text, jsonb) from public, anon, authenticated;

-- Premium unlock --------------------------------------------------------------

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

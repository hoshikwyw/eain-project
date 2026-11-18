-- 0021 Replies in notifications.
--
-- The notification a creator gets for a reply now carries the answers in a
-- few words ("Thuzar · Yes, I'll be there"), so an RSVP can be read from the
-- inbox without opening the gift. The same function as 0008 with a summary
-- built as the answers are stored; nothing else changes.

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
  v_summary text := '';
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
    -- The answer in a few words, for the notification: the text, the option, or the rating.
    v_summary := concat_ws(' · ', nullif(v_summary, ''), left(coalesce(
      nullif(trim(a ->> 'text'), ''),
      v_label,
      case when (a ->> 'number') ~ '^[0-9]+$' then (a ->> 'number') || '/5' end
    ), 80));
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
            jsonb_build_object('giftTitle', v_gift.title, 'summary', left(v_summary, 200)));
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

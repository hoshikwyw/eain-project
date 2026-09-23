-- 0004 Gifts and everything attached to one.
--
-- gifts, gift_sections, gift_questions, gift_question_options, gift_media, gift_recipients
--   Owner: the creator (gifts.sender_id). Read/Create/Update/Delete: creator only.
--   Public: gift CONTENT only, served by Next.js server code using the service
--   role after looking up a share token. The anon role has no access.
--   Personal data: yes. RLS: yes. Retention: until deleted, then grace period.
--
-- gift_events
--   Written by server code (service role) only. Read: creator. No IP or device data.
--   Retention: raw events trimmed after a set period.
--
-- gift_responses, gift_answers
--   Written by server code on behalf of the receiver. Read: creator only.
--   Never readable through any public path. Retention: deleted with gift.

create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  template_id uuid not null references public.templates (id),
  title text not null default '' check (char_length(title) <= 120),
  status public.gift_status not null default 'draft',
  share_token text not null unique default public.generate_token(),
  theme jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  deleted_at timestamptz
);

create index gifts_sender_idx on public.gifts (sender_id, created_at desc);
create index gifts_status_idx on public.gifts (status) where status = 'published';

create trigger gifts_set_updated_at
  before update on public.gifts
  for each row execute function public.set_updated_at();

-- Free tier limit: five gifts that are not deleted.
create or replace function public.enforce_gift_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.gifts where sender_id = new.sender_id and status <> 'deleted';
  if v_count >= 5 then
    raise exception 'gift limit reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger gifts_enforce_limit
  before insert on public.gifts
  for each row execute function public.enforce_gift_limit();

alter table public.gifts enable row level security;

create policy "gifts: owner read"
  on public.gifts for select to authenticated
  using (sender_id = (select auth.uid()) or public.is_admin());
create policy "gifts: owner insert"
  on public.gifts for insert to authenticated
  with check (sender_id = (select auth.uid()));
create policy "gifts: owner update"
  on public.gifts for update to authenticated
  using (sender_id = (select auth.uid()))
  with check (sender_id = (select auth.uid()));
create policy "gifts: owner delete"
  on public.gifts for delete to authenticated
  using (sender_id = (select auth.uid()));

revoke all on public.gifts from anon, authenticated;
grant select, insert, delete on public.gifts to authenticated;
-- share_token and published_at change only through server functions.
grant update (title, status, theme, template_id, deleted_at) on public.gifts to authenticated;

-- Reusable ownership check for child tables.
create or replace function public.owns_gift(p_gift_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.gifts g
    where g.id = p_gift_id and (g.sender_id = auth.uid() or public.is_admin())
  );
$$;

revoke all on function public.owns_gift(uuid) from public, anon;
grant execute on function public.owns_gift(uuid) to authenticated;

-- Sections -----------------------------------------------------------------

create table public.gift_sections (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.gifts (id) on delete cascade,
  type public.section_type not null,
  position integer not null default 0,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gift_id, position) deferrable initially deferred
);

create trigger gift_sections_set_updated_at
  before update on public.gift_sections
  for each row execute function public.set_updated_at();

alter table public.gift_sections enable row level security;
create policy "gift_sections: owner all"
  on public.gift_sections for all to authenticated
  using (public.owns_gift(gift_id)) with check (public.owns_gift(gift_id));
revoke all on public.gift_sections from anon, authenticated;
grant select, insert, update, delete on public.gift_sections to authenticated;

-- Media --------------------------------------------------------------------

create table public.gift_media (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.gifts (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null unique check (char_length(storage_path) <= 300),
  thumb_path text check (thumb_path is null or char_length(thumb_path) <= 300),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  bytes integer not null check (bytes > 0 and bytes <= 5242880),
  width integer check (width is null or width between 1 and 8000),
  height integer check (height is null or height between 1 and 8000),
  created_at timestamptz not null default now()
);

create index gift_media_gift_idx on public.gift_media (gift_id);

-- Free tier limit: five photos per gift.
create or replace function public.enforce_media_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.gift_media where gift_id = new.gift_id) >= 5 then
    raise exception 'photo limit reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger gift_media_enforce_limit
  before insert on public.gift_media
  for each row execute function public.enforce_media_limit();

alter table public.gift_media enable row level security;
create policy "gift_media: owner all"
  on public.gift_media for all to authenticated
  using (owner_id = (select auth.uid()) and public.owns_gift(gift_id))
  with check (owner_id = (select auth.uid()) and public.owns_gift(gift_id));
revoke all on public.gift_media from anon, authenticated;
grant select, insert, delete on public.gift_media to authenticated;

-- Private storage bucket. Uploads and reads go through signed URLs issued
-- by server code. No storage policies for anon or authenticated.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gift-media', 'gift-media', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Recipients ---------------------------------------------------------------

create table public.gift_recipients (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.gifts (id) on delete cascade,
  name text not null default '' check (char_length(name) <= 80),
  email text check (email is null or char_length(email) <= 254),
  phone text check (phone is null or char_length(phone) <= 32),
  recipient_token text not null unique default public.generate_token(),
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  open_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index gift_recipients_gift_idx on public.gift_recipients (gift_id);

alter table public.gift_recipients enable row level security;
create policy "gift_recipients: owner all"
  on public.gift_recipients for all to authenticated
  using (public.owns_gift(gift_id)) with check (public.owns_gift(gift_id));
revoke all on public.gift_recipients from anon, authenticated;
grant select, insert, delete on public.gift_recipients to authenticated;
grant update (name, email, phone) on public.gift_recipients to authenticated;

-- Questions ----------------------------------------------------------------

create table public.gift_questions (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.gifts (id) on delete cascade,
  section_id uuid references public.gift_sections (id) on delete cascade,
  type public.question_type not null,
  prompt text not null check (char_length(prompt) between 1 and 300),
  position integer not null default 0,
  is_required boolean not null default false,
  created_at timestamptz not null default now()
);

create index gift_questions_gift_idx on public.gift_questions (gift_id, position);

alter table public.gift_questions enable row level security;
create policy "gift_questions: owner all"
  on public.gift_questions for all to authenticated
  using (public.owns_gift(gift_id)) with check (public.owns_gift(gift_id));
revoke all on public.gift_questions from anon, authenticated;
grant select, insert, update, delete on public.gift_questions to authenticated;

create table public.gift_question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.gift_questions (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 120),
  position integer not null default 0
);

create index gift_question_options_question_idx on public.gift_question_options (question_id, position);

create or replace function public.owns_question(p_question_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.gift_questions q
    where q.id = p_question_id and public.owns_gift(q.gift_id)
  );
$$;
revoke all on function public.owns_question(uuid) from public, anon;
grant execute on function public.owns_question(uuid) to authenticated;

alter table public.gift_question_options enable row level security;
create policy "gift_question_options: owner all"
  on public.gift_question_options for all to authenticated
  using (public.owns_question(question_id)) with check (public.owns_question(question_id));
revoke all on public.gift_question_options from anon, authenticated;
grant select, insert, update, delete on public.gift_question_options to authenticated;

-- Responses (written by server for the receiver, read by creator) -----------

create table public.gift_responses (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.gifts (id) on delete cascade,
  recipient_id uuid references public.gift_recipients (id) on delete set null,
  session_id text check (session_id is null or char_length(session_id) <= 64),
  created_at timestamptz not null default now()
);

create index gift_responses_gift_idx on public.gift_responses (gift_id, created_at desc);

alter table public.gift_responses enable row level security;
create policy "gift_responses: owner read"
  on public.gift_responses for select to authenticated
  using (public.owns_gift(gift_id));
create policy "gift_responses: owner delete"
  on public.gift_responses for delete to authenticated
  using (public.owns_gift(gift_id));
revoke all on public.gift_responses from anon, authenticated;
grant select, delete on public.gift_responses to authenticated;

create table public.gift_answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.gift_responses (id) on delete cascade,
  question_id uuid not null references public.gift_questions (id) on delete cascade,
  option_id uuid references public.gift_question_options (id) on delete set null,
  answer_text text check (answer_text is null or char_length(answer_text) <= 1000),
  answer_number integer check (answer_number is null or answer_number between 0 and 10),
  created_at timestamptz not null default now()
);

create index gift_answers_response_idx on public.gift_answers (response_id);

create or replace function public.owns_response(p_response_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.gift_responses r
    where r.id = p_response_id and public.owns_gift(r.gift_id)
  );
$$;
revoke all on function public.owns_response(uuid) from public, anon;
grant execute on function public.owns_response(uuid) to authenticated;

alter table public.gift_answers enable row level security;
create policy "gift_answers: owner read"
  on public.gift_answers for select to authenticated
  using (public.owns_response(response_id));
revoke all on public.gift_answers from anon, authenticated;
grant select on public.gift_answers to authenticated;

-- Events (privacy-friendly: no IP, no user agent, no location) --------------

create table public.gift_events (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.gifts (id) on delete cascade,
  recipient_id uuid references public.gift_recipients (id) on delete set null,
  event_type public.gift_event_type not null,
  session_id text check (session_id is null or char_length(session_id) <= 64),
  created_at timestamptz not null default now()
);

create index gift_events_gift_idx on public.gift_events (gift_id, created_at desc);

alter table public.gift_events enable row level security;
create policy "gift_events: owner read"
  on public.gift_events for select to authenticated
  using (public.owns_gift(gift_id));
revoke all on public.gift_events from anon, authenticated;
grant select on public.gift_events to authenticated;

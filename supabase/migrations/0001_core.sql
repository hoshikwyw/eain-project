-- 0001 Core: extensions, enums, shared helpers.
-- Security stance: the anon role gets NO default access to public tables.
-- Every table re-grants exactly what it needs.

create extension if not exists pgcrypto with schema extensions;

-- Remove Supabase's default "anon can do anything RLS allows" grants for
-- tables created from now on. Policies still gate authenticated access.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on functions from anon;
alter default privileges in schema public revoke all on functions from authenticated;

-- Enums -------------------------------------------------------------------

create type public.user_role as enum ('user', 'admin');

create type public.gift_status as enum ('draft', 'published', 'unpublished', 'deleted');

create type public.gift_type as enum ('postcard', 'website', 'memory', 'interactive');

create type public.section_type as enum (
  'text', 'image', 'photo_grid', 'timeline', 'quote', 'message',
  'question', 'choice', 'reaction', 'final_message'
);

create type public.question_type as enum ('choice', 'yes_no', 'short_text', 'reaction', 'rating');

create type public.gift_event_type as enum (
  'created', 'published', 'unpublished', 'shared', 'qr_generated', 'opened', 'viewed',
  'response_started', 'responded', 'link_regenerated', 'deleted'
);

create type public.point_transaction_type as enum ('earn', 'purchase', 'spend', 'refund', 'bonus');

create type public.notification_type as enum ('gift_opened', 'response_received', 'points_earned', 'system');

create type public.report_reason as enum (
  'harassment', 'spam', 'scam', 'inappropriate', 'copyright', 'malicious_link', 'other'
);

create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

create type public.payment_status as enum ('pending', 'verified', 'failed', 'refunded');

-- Helpers -----------------------------------------------------------------

-- URL-safe secret token: 32 random bytes, base64url, 43 characters.
create or replace function public.generate_token()
returns text
language sql
volatile
set search_path = ''
as $$
  select translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/=', '-_');
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- True when the calling user has the admin role. Security definer so it can
-- read profiles without recursing through profile policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
revoke all on function public.generate_token() from public, anon, authenticated;

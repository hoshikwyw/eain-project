-- 0003 Categories and templates.
--
-- categories, templates
--   Owner: Eain. Read: anyone (active rows only for non-admins), including anon
--   so the public template library works. Create/Update/Delete: admins.
--   Personal data: no. RLS: yes. Retention: indefinite.
--   Template layouts are React components keyed by slug; the table holds metadata.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name_en text not null check (char_length(name_en) <= 60),
  name_my text not null check (char_length(name_my) <= 60),
  sort_order integer not null default 0,
  is_active boolean not null default true
);

alter table public.categories enable row level security;

create policy "categories: read active"
  on public.categories for select to anon, authenticated
  using (is_active or public.is_admin());

create policy "categories: admin write"
  on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  category_id uuid not null references public.categories (id),
  gift_type public.gift_type not null default 'postcard',
  name_en text not null check (char_length(name_en) <= 80),
  name_my text not null check (char_length(name_my) <= 80),
  description_en text not null default '' check (char_length(description_en) <= 300),
  description_my text not null default '' check (char_length(description_my) <= 300),
  preview_path text check (preview_path is null or char_length(preview_path) <= 300),
  is_premium boolean not null default false,
  point_price integer not null default 0 check (point_price >= 0),
  default_theme jsonb not null default '{}'::jsonb,
  default_sections jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint templates_premium_price check ((is_premium and point_price > 0) or (not is_premium and point_price = 0))
);

create index templates_category_idx on public.templates (category_id, sort_order);

create trigger templates_set_updated_at
  before update on public.templates
  for each row execute function public.set_updated_at();

alter table public.templates enable row level security;

create policy "templates: read active"
  on public.templates for select to anon, authenticated
  using (is_active or public.is_admin());

create policy "templates: admin write"
  on public.templates for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.templates to anon, authenticated;
grant insert, update, delete on public.templates to authenticated;

alter table public.template_unlocks
  add constraint template_unlocks_template_fk
  foreign key (template_id) references public.templates (id) on delete cascade;

-- Seed: the fourteen categories from the spec ------------------------------

insert into public.categories (slug, name_en, name_my, sort_order) values
  ('birthday',        'Birthday',        'မွေးနေ့',            1),
  ('love',            'Love',            'အချစ်',              2),
  ('friendship',      'Friendship',      'သူငယ်ချင်း',          3),
  ('thank-you',       'Thank You',       'ကျေးဇူးတင်စကား',      4),
  ('appreciation',    'Appreciation',    'လေးစားတန်ဖိုးထား',     5),
  ('congratulations', 'Congratulations', 'ဂုဏ်ယူပါတယ်',         6),
  ('good-luck',       'Good Luck',       'ကံကောင်းပါစေ',        7),
  ('sorry',           'Sorry',           'တောင်းပန်ပါတယ်',       8),
  ('miss-you',        'Miss You',        'လွမ်းတယ်',            9),
  ('anniversary',     'Anniversary',     'နှစ်ပတ်လည်',          10),
  ('memories',        'Memories',        'အမှတ်တရများ',         11),
  ('celebration',     'Celebration',     'ဂုဏ်ပြုပွဲ',           12),
  ('postcard',        'Postcard',        'ပို့စကတ်',            13),
  ('surprise',        'Surprise',        'အံ့အားသင့်စရာ',        14);

-- Seed: the ten V1 templates. Layout components arrive in later parts.
insert into public.templates
  (slug, category_id, gift_type, name_en, name_my, description_en, description_my, is_premium, point_price, is_featured, sort_order)
select t.slug, c.id, t.gift_type::public.gift_type, t.name_en, t.name_my, t.description_en, t.description_my,
       t.is_premium, t.point_price, t.is_featured, t.sort_order
from (values
  ('birthday-postcard', 'birthday', 'postcard', 'Birthday Postcard', 'မွေးနေ့ ပို့စကတ်',
     'A warm, simple birthday card.', 'နွေးထွေးရိုးရှင်းတဲ့ မွေးနေ့ကတ်။', false, 0, true, 1),
  ('birthday-surprise', 'birthday', 'interactive', 'Birthday Surprise', 'မွေးနေ့ အံ့အားသင့်စရာ',
     'A reveal with a question at the end.', 'အဆုံးမှာ မေးခွန်းပါတဲ့ ဖွင့်ကြည့်ရမည့် လက်ဆောင်။', true, 50, true, 2),
  ('anniversary', 'anniversary', 'website', 'Anniversary', 'နှစ်ပတ်လည်',
     'A small page for the two of you.', 'နှစ်ဦးအတွက် စာမျက်နှာလေးတစ်ခု။', true, 50, false, 3),
  ('friendship', 'friendship', 'postcard', 'Friendship', 'သူငယ်ချင်း',
     'For the friend who is always there.', 'အမြဲရှိနေတဲ့ သူငယ်ချင်းအတွက်။', false, 0, true, 4),
  ('thank-you', 'thank-you', 'postcard', 'Thank You', 'ကျေးဇူးတင်စကား',
     'Say it properly.', 'သေချာစွာ ပြောလိုက်ပါ။', false, 0, false, 5),
  ('appreciation', 'appreciation', 'postcard', 'Appreciation', 'လေးစားတန်ဖိုးထား',
     'For someone who deserves to hear it.', 'ကြားသင့်တဲ့သူအတွက်။', false, 0, false, 6),
  ('miss-you', 'miss-you', 'postcard', 'Love / Miss You', 'လွမ်းတယ်',
     'Close the distance a little.', 'အကွာအဝေးကို နည်းနည်း နီးစေပါ။', false, 0, false, 7),
  ('general-postcard', 'postcard', 'postcard', 'General Postcard', 'ပို့စကတ်',
     'Any occasion, any message.', 'မည်သည့်အခါမဆို၊ မည်သည့်စာမဆို။', false, 0, false, 8),
  ('memory-timeline', 'memories', 'memory', 'Memory Timeline', 'အမှတ်တရ အချိန်ဇယား',
     'Photos and moments in order.', 'ဓာတ်ပုံနဲ့ အခိုက်အတန့်များကို အစီအစဉ်အလိုက်။', true, 80, true, 9),
  ('congratulations', 'congratulations', 'postcard', 'Congratulations', 'ဂုဏ်ယူပါတယ်',
     'Celebrate their win.', 'သူတို့အောင်မြင်မှုကို ဂုဏ်ပြုပါ။', false, 0, false, 10)
) as t(slug, category_slug, gift_type, name_en, name_my, description_en, description_my, is_premium, point_price, is_featured, sort_order)
join public.categories c on c.slug = t.category_slug;

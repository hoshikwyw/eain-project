-- 0015 Night Garden template.
--
-- The first animated template: a twilight garden that grows and blooms, then
-- shows a name and a message typed a line at a time. The creator edits the
-- name, the message pages and the flower colour. Its animation is in
-- public/scenes/night-garden and its definition under the slug
-- "night-garden" in features/gifts/templates.ts.
-- Premium: 100 points to unlock.

insert into public.templates
  (slug, category_id, gift_type, name_en, name_my, description_en, description_my, is_premium, point_price, is_featured, sort_order)
select
  'night-garden', c.id, 'interactive', 'Night Garden', 'ညဥယျာဉ်',
  'A twilight garden that blooms for them, with your message typed out line by line.',
  'သူတို့အတွက် ပွင့်လာတဲ့ ညနေခင်း ပန်းဥယျာဉ်နဲ့ တစ်ကြောင်းချင်း ပေါ်လာမယ့် သင့်စာ။',
  true, 100, true, 1
from public.categories c
where c.slug = 'surprise'
on conflict (slug) do nothing;

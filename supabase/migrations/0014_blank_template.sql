-- 0014 Blank template.
--
-- Every other template comes dressed: a frame, an illustration, starter text
-- for its occasion. This one is an empty card the creator builds up
-- themselves with their own words, colours and stickers. Its layout lives in
-- code under the slug "blank" (features/gifts/templates.ts), like the rest.
-- Free, and listed first so it is easy to find.

insert into public.templates
  (slug, category_id, gift_type, name_en, name_my, description_en, description_my, is_premium, point_price, is_featured, sort_order)
select
  'blank', c.id, 'postcard', 'Blank Card', 'ကတ်အလွတ်',
  'An empty card. Add your own words, colours and stickers.',
  'ကတ်အလွတ်တစ်ခု။ သင့်စာ၊ အရောင်နဲ့ စတစ်ကာတွေကို ကိုယ်တိုင် ထည့်ပါ။',
  false, 0, true, 0
from public.categories c
where c.slug = 'postcard'
on conflict (slug) do nothing;

-- 0020 Places We've Been template.
--
-- A map of a relationship: a winding road with a stop for every place,
-- photos pinned beside it. Built from the timeline and photo-grid sections
-- with its own "journey" design, defined under the slug "places-weve-been"
-- in features/gifts/templates.ts. Premium: 60 points to unlock.

insert into public.templates
  (slug, category_id, gift_type, name_en, name_my, description_en, description_my, is_premium, point_price, is_featured, sort_order)
select
  'places-weve-been', c.id, 'memory', 'Places We''ve Been', 'ရောက်ခဲ့တဲ့ နေရာများ',
  'A winding road of the places you have shared, with a photo at every stop.',
  'အတူ ရောက်ခဲ့တဲ့ နေရာတွေကို ကွေ့ကောက်တဲ့ လမ်းတစ်လျှောက် ဓာတ်ပုံတွေနဲ့ မှတ်တမ်းတင်ပါ။',
  true, 60, true, 18
from public.categories c
where c.slug = 'memories'
on conflict (slug) do nothing;

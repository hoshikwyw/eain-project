-- 0025 Myanmar ceremony invitations: ahlu and shinbyu.
--
-- Two templates in the invitations category (0018), defined under these
-- slugs in features/gifts/templates.ts: a donation ceremony (ahlu) and a
-- novitiation ceremony (shinbyu). Same shape as the other invitations
-- (event details, guest name, RSVP, headcount) plus the programme as a
-- timeline, in the formal gold wedding design.
--
-- Both are paid only (0023), priced in kyat as event packs: ahlu 10,000 Ks,
-- shinbyu 15,000 Ks. point_price stays above zero because premium needs it,
-- but points never unlock a paid-only template. Prices can be changed on
-- the admin template page (0024).

insert into public.templates
  (slug, category_id, gift_type, name_en, name_my, description_en, description_my,
   is_premium, point_price, paid_only, price_mmk, is_featured, sort_order)
select t.slug, c.id, 'postcard', t.name_en, t.name_my, t.description_en, t.description_my,
       true, 80, true, t.price_mmk, false, t.sort_order
from (values
  ('ahlu', 'Donation Ceremony (Ahlu)', 'အလှူဖိတ်စာ',
     'A formal invitation to a merit-making ceremony, with the programme and a guest count for the meal.',
     'ကုသိုလ်ရေး အလှူမင်္ဂလာအတွက် အစီအစဉ်နဲ့ ဆွမ်းကျွေး ဧည့်သည်ဦးရေ ပါဝင်သော ခန့်ညားသည့် ဖိတ်စာ။',
     10000, 19),
  ('shinbyu', 'Novitiation Ceremony (Shinbyu)', 'ရှင်ပြုအလှူ ဖိတ်စာ',
     'A formal invitation to a shinbyu, with the novice-to-be, the programme and a guest count.',
     'ရှင်လောင်း၊ အစီအစဉ်နဲ့ ဧည့်သည်ဦးရေ ပါဝင်သော ရှင်ပြုအလှူမင်္ဂလာ ဖိတ်စာ။',
     15000, 20)
) as t(slug, name_en, name_my, description_en, description_my, price_mmk, sort_order)
join public.categories c on c.slug = 'invitations'
on conflict (slug) do nothing;

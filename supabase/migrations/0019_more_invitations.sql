-- 0019 More invitations.
--
-- Three more templates in the invitations category (0018): a housewarming,
-- an engagement party and a farewell party. Same shape as the first four:
-- event details and an RSVP, defined under these slugs in
-- features/gifts/templates.ts. The engagement party is premium: 50 points.

insert into public.templates
  (slug, category_id, gift_type, name_en, name_my, description_en, description_my, is_premium, point_price, is_featured, sort_order)
select t.slug, c.id, 'postcard', t.name_en, t.name_my, t.description_en, t.description_my,
       t.is_premium, t.point_price, t.is_featured, t.sort_order
from (values
  ('housewarming', 'Housewarming', 'အိမ်တက်ပွဲ',
     'Show everyone the new place, with a yes or no reply built in.',
     'အိမ်သစ်ကို လူတိုင်း လာကြည့်ဖို့ ဖိတ်ပြီး လာမလား မလာဘူးလား အဖြေပါ ရယူပါ။', false, 0, false, 15),
  ('engagement-party', 'Engagement Party', 'စေ့စပ်ပွဲ',
     'An elegant invitation to celebrate the yes.',
     'စေ့စပ်ခြင်းကို ဂုဏ်ပြုဖို့ ခန့်ညားသော ဖိတ်စာ။', true, 50, false, 16),
  ('farewell-party', 'Farewell Party', 'နှုတ်ဆက်ပွဲ',
     'One last evening together before the next chapter.',
     'နောက်အခန်းမစခင် နောက်ဆုံး ညနေတစ်ခု အတူတူ ဖြတ်သန်းရအောင်။', false, 0, false, 17)
) as t(slug, name_en, name_my, description_en, description_my, is_premium, point_price, is_featured, sort_order)
join public.categories c on c.slug = 'invitations'
on conflict (slug) do nothing;

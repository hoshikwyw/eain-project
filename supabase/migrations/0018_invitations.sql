-- 0018 Invitations.
--
-- A category and four templates for inviting people: a party, a wedding, a
-- baby shower and a graduation party. Each starts with the event details
-- section (0017) and a yes-or-no question for the RSVP. Their looks and
-- starting sections live under these slugs in features/gifts/templates.ts.
-- The wedding invitation is premium: 80 points to unlock.

insert into public.categories (slug, name_en, name_my, sort_order) values
  ('invitations', 'Invitations', 'ဖိတ်ကြားလွှာ', 15)
on conflict (slug) do nothing;

insert into public.templates
  (slug, category_id, gift_type, name_en, name_my, description_en, description_my, is_premium, point_price, is_featured, sort_order)
select t.slug, c.id, 'postcard', t.name_en, t.name_my, t.description_en, t.description_my,
       t.is_premium, t.point_price, t.is_featured, t.sort_order
from (values
  ('party-invitation', 'Party Invitation', 'ပွဲဖိတ်စာ',
     'Invite everyone to a party, with a yes or no reply built in.',
     'ပွဲကို ဖိတ်ပြီး လာမလား မလာဘူးလား အဖြေပါ တစ်ခါတည်း ရယူပါ။', false, 0, true, 11),
  ('wedding-invitation', 'Wedding Invitation', 'မင်္ဂလာဖိတ်စာ',
     'An elegant invitation with the details and an RSVP.',
     'အသေးစိတ်နဲ့ အကြောင်းပြန်ချက်ပါတဲ့ ခန့်ညားသော ဖိတ်စာ။', true, 80, true, 12),
  ('baby-shower', 'Baby Shower', 'ကလေးကြိုဆိုပွဲ',
     'A gentle invitation for the little one on the way.',
     'ရောက်လာတော့မယ့် ကလေးငယ်အတွက် နူးညံ့တဲ့ ဖိတ်စာ။', false, 0, false, 13),
  ('graduation-party', 'Graduation Party', 'ဘွဲ့ရပွဲ',
     'Celebrate the big day with everyone who helped.',
     'ကူညီခဲ့သူအားလုံးနဲ့ ဘွဲ့ရနေ့ကို အတူ ဂုဏ်ပြုပါ။', false, 0, false, 14)
) as t(slug, name_en, name_my, description_en, description_my, is_premium, point_price, is_featured, sort_order)
join public.categories c on c.slug = 'invitations'
on conflict (slug) do nothing;

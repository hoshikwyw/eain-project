-- 0026 A Valentine's Day template.
--
-- One template in the love category, defined under the slug "valentine" in
-- features/gifts/templates.ts: the elegant design in berry, a photo, a
-- letter, and "Will you be my Valentine?" with two answers that both say
-- yes. Paid only (0023) at 3,000 Ks, sold by hand like the invitations.
-- Not featured yet: feature it from the admin template page (0024) in late
-- January, and take it off the home page after 14 February.

insert into public.templates
  (slug, category_id, gift_type, name_en, name_my, description_en, description_my,
   is_premium, point_price, paid_only, price_mmk, is_featured, sort_order)
select 'valentine', c.id, 'interactive', 'Valentine', 'ချစ်သူများနေ့',
       'A love letter with a photo, and the question only one answer fits.',
       'ဓာတ်ပုံနဲ့ ချစ်စာ၊ ပြီးတော့ အဖြေတစ်ခုတည်းသာ ရှိတဲ့ မေးခွန်း။',
       true, 60, true, 3000, false, 21
from public.categories c
where c.slug = 'love'
on conflict (slug) do nothing;

-- 0027 Every premium template is sold in kyat.
--
-- Until now five premium templates could be unlocked with points, which
-- nobody can buy: each such unlock was a template given away. From here on
-- a premium template is bought with money only (paid only, 0023), at a kyat
-- price, through the buy page and an admin grant after the payment.
--
--   Birthday Surprise   2,000 Ks
--   Anniversary         3,000 Ks
--   Places We've Been   3,000 Ks
--   Memory Timeline     3,000 Ks
--   Night Garden        5,000 Ks
--
-- Anyone who already unlocked one of these with points keeps it:
-- template_unlocks is not touched. Prices can be changed on the admin
-- template page (0024). Points themselves are retired in the next part.

update public.templates as t
set paid_only = true,
    price_mmk = v.price_mmk
from (values
  ('birthday-surprise', 2000),
  ('anniversary', 3000),
  ('places-weve-been', 3000),
  ('memory-timeline', 3000),
  ('night-garden', 5000)
) as v(slug, price_mmk)
where t.slug = v.slug
  and t.is_premium;

-- 0024 Paid only and the kyat price from the admin template page.
--
-- 0023 added templates.paid_only and templates.price_mmk, set by hand in the
-- SQL editor. The admin template edit now carries both, so a price change
-- never needs SQL. The function gains two arguments, so the old 11-argument
-- version is dropped first (one signature, no overload to confuse callers).
--
-- Rules, checked here and not only in the form:
--   - paid only needs premium (the 0023 constraint also says so);
--   - paid only needs a kyat price from 100 to 10,000,000;
--   - a template that is not paid only keeps no kyat price.
-- The audit row records both before and after.

drop function if exists public.admin_update_template_details(
  uuid, text, text, text, text, uuid, integer, boolean, boolean, boolean, integer
);

create or replace function public.admin_update_template_details(
  p_template_id uuid,
  p_name_en text,
  p_name_my text,
  p_description_en text,
  p_description_my text,
  p_category_id uuid,
  p_sort_order integer,
  p_is_active boolean,
  p_is_featured boolean,
  p_is_premium boolean,
  p_point_price integer,
  p_paid_only boolean,
  p_price_mmk integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before public.templates;
begin
  perform public.assert_admin();

  if coalesce(trim(p_name_en), '') = '' or coalesce(trim(p_name_my), '') = '' then
    raise exception 'names required' using errcode = '22023';
  end if;
  if not exists (select 1 from public.categories where id = p_category_id) then
    raise exception 'category not found' using errcode = '22023';
  end if;
  if p_is_premium and coalesce(p_point_price, 0) < 1 then
    raise exception 'premium needs a price' using errcode = '22023';
  end if;
  if p_paid_only and not p_is_premium then
    raise exception 'paid only needs premium' using errcode = '22023';
  end if;
  if p_paid_only and (p_price_mmk is null or p_price_mmk < 100 or p_price_mmk > 10000000) then
    raise exception 'paid only needs a kyat price' using errcode = '22023';
  end if;

  select * into v_before from public.templates where id = p_template_id for update;
  if v_before.id is null then
    raise exception 'template not found' using errcode = 'P0002';
  end if;

  update public.templates
  set name_en = left(trim(p_name_en), 80),
      name_my = left(trim(p_name_my), 80),
      description_en = left(trim(coalesce(p_description_en, '')), 300),
      description_my = left(trim(coalesce(p_description_my, '')), 300),
      category_id = p_category_id,
      sort_order = greatest(0, least(coalesce(p_sort_order, 0), 9999)),
      is_active = p_is_active,
      is_featured = p_is_featured,
      is_premium = p_is_premium,
      point_price = case when p_is_premium then least(p_point_price, 100000) else 0 end,
      paid_only = p_paid_only,
      price_mmk = case when p_paid_only then p_price_mmk else null end
  where id = p_template_id;

  perform public.admin_log('update_template', 'template', p_template_id::text, jsonb_build_object(
    'slug', v_before.slug,
    'before', jsonb_build_object('name_en', v_before.name_en, 'is_active', v_before.is_active,
      'is_premium', v_before.is_premium, 'point_price', v_before.point_price,
      'paid_only', v_before.paid_only, 'price_mmk', v_before.price_mmk,
      'sort_order', v_before.sort_order),
    'after', jsonb_build_object('name_en', p_name_en, 'is_active', p_is_active,
      'is_premium', p_is_premium, 'point_price', p_point_price,
      'paid_only', p_paid_only, 'price_mmk', case when p_paid_only then p_price_mmk end,
      'sort_order', p_sort_order)
  ));
end;
$$;

revoke all on function public.admin_update_template_details(
  uuid, text, text, text, text, uuid, integer, boolean, boolean, boolean, integer, boolean, integer
) from public, anon;
grant execute on function public.admin_update_template_details(
  uuid, text, text, text, text, uuid, integer, boolean, boolean, boolean, integer, boolean, integer
) to authenticated;

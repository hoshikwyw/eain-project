-- 0011 Full template editing for admins, and per-template usage numbers.
-- Both check the admin role; edits write an audit row in the same transaction.

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
  p_point_price integer
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
      point_price = case when p_is_premium then least(p_point_price, 100000) else 0 end
  where id = p_template_id;

  perform public.admin_log('update_template', 'template', p_template_id::text, jsonb_build_object(
    'slug', v_before.slug,
    'before', jsonb_build_object('name_en', v_before.name_en, 'is_active', v_before.is_active, 'is_premium', v_before.is_premium, 'point_price', v_before.point_price, 'sort_order', v_before.sort_order),
    'after', jsonb_build_object('name_en', p_name_en, 'is_active', p_is_active, 'is_premium', p_is_premium, 'point_price', p_point_price, 'sort_order', p_sort_order)
  ));
end;
$$;

revoke all on function public.admin_update_template_details(uuid, text, text, text, text, uuid, integer, boolean, boolean, boolean, integer) from public, anon;
grant execute on function public.admin_update_template_details(uuid, text, text, text, text, uuid, integer, boolean, boolean, boolean, integer) to authenticated;

-- Gifts created, published and unlocks per template.
create or replace function public.admin_template_stats()
returns table (template_id uuid, gifts bigint, published bigint, unlocks bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  return query
  select t.id,
         (select count(*) from public.gifts g where g.template_id = t.id and g.status <> 'deleted'),
         (select count(*) from public.gifts g where g.template_id = t.id and g.status = 'published'),
         (select count(*) from public.template_unlocks u where u.template_id = t.id)
  from public.templates t;
end;
$$;

revoke all on function public.admin_template_stats() from public, anon;
grant execute on function public.admin_template_stats() to authenticated;

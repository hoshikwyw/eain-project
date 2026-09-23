import type { TemplateCard } from "@/components/templates/template-grid";
import { createClient } from "@/lib/supabase/server";
import { getTemplateStyle, isAvailableTemplate } from "./templates";

/** Template metadata for the picker and library, localised and marked available or not. */
export async function loadTemplateCards(locale: "en" | "my"): Promise<{
  templates: TemplateCard[];
  categories: { id: string; name: string }[];
}> {
  const supabase = await createClient();
  const [{ data: rows }, { data: categories }] = await Promise.all([
    supabase
      .from("templates")
      .select("id, slug, category_id, name_en, name_my, description_en, description_my, is_premium, point_price")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("categories").select("id, name_en, name_my, sort_order").eq("is_active", true).order("sort_order"),
  ]);

  const cats = (categories ?? []).map((c) => ({ id: c.id, name: locale === "my" ? c.name_my : c.name_en }));
  const catName = new Map(cats.map((c) => [c.id, c.name]));

  return {
    categories: cats,
    templates: (rows ?? []).map((r) => ({
      id: r.id,
      slug: r.slug,
      name: locale === "my" ? r.name_my : r.name_en,
      description: locale === "my" ? r.description_my : r.description_en,
      categoryId: r.category_id,
      category: catName.get(r.category_id) ?? "",
      isPremium: r.is_premium,
      pointPrice: r.point_price,
      // Premium templates unlock with points in Part E.
      available: isAvailableTemplate(r.slug) && !r.is_premium,
      variant: getTemplateStyle(r.slug).defaultVariant,
    })),
  };
}

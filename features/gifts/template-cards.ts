import type { TemplateCard } from "@/components/templates/template-grid";
import { createClient } from "@/lib/supabase/server";
import { getTemplateStyle, isAvailableTemplate } from "./templates";

/**
 * Template metadata for the picker and library, localised, with premium
 * unlock state for the signed-in user (RLS returns only their unlocks).
 */
export async function loadTemplateCards(locale: "en" | "my"): Promise<{
  templates: TemplateCard[];
  categories: { id: string; name: string }[];
}> {
  const supabase = await createClient();
  const [{ data: rows }, { data: categories }, { data: unlocks }] = await Promise.all([
    supabase
      .from("templates")
      .select("id, slug, category_id, name_en, name_my, description_en, description_my, is_premium, point_price")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("categories").select("id, name_en, name_my, sort_order").eq("is_active", true).order("sort_order"),
    supabase.from("template_unlocks").select("template_id"),
  ]);

  const cats = (categories ?? []).map((c) => ({ id: c.id, name: locale === "my" ? c.name_my : c.name_en }));
  const catName = new Map(cats.map((c) => [c.id, c.name]));
  const unlocked = new Set((unlocks ?? []).map((u) => u.template_id));

  return {
    categories: cats,
    templates: (rows ?? []).map((r) => {
      const isUnlocked = !r.is_premium || unlocked.has(r.id);
      return {
        id: r.id,
        slug: r.slug,
        name: locale === "my" ? r.name_my : r.name_en,
        description: locale === "my" ? r.description_my : r.description_en,
        categoryId: r.category_id,
        category: catName.get(r.category_id) ?? "",
        isPremium: r.is_premium,
        pointPrice: r.point_price,
        unlocked: isUnlocked,
        available: isAvailableTemplate(r.slug) && isUnlocked,
        variant: getTemplateStyle(r.slug).defaultVariant,
      };
    }),
  };
}

import type { TemplateCard } from "@/components/templates/template-grid";
import { createClient } from "@/lib/supabase/server";
import { getTemplateStyle, isAvailableTemplate } from "./templates";

/**
 * Template metadata for the picker and library, localised, with premium
 * unlock state for the signed-in user (RLS returns only their unlocks).
 */
export async function loadTemplateCards(locale: "en" | "my"): Promise<{
  templates: TemplateCard[];
  categories: { id: string; slug: string; name: string }[];
}> {
  const supabase = await createClient();
  const [{ data: rows }, { data: categories }, { data: unlocks }] = await Promise.all([
    supabase
      .from("templates")
      .select(
        "id, slug, category_id, name_en, name_my, description_en, description_my, is_premium, paid_only, price_mmk, point_price, is_featured",
      )
      .eq("is_active", true)
      .order("sort_order")
      .order("created_at"),
    supabase
      .from("categories")
      .select("id, slug, name_en, name_my, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("template_unlocks").select("template_id"),
  ]);

  const cats = (categories ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: locale === "my" ? c.name_my : c.name_en,
  }));
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
        paidOnly: r.paid_only,
        priceMmk: r.price_mmk,
        unlocked: isUnlocked,
        available: isAvailableTemplate(r.slug) && isUnlocked,
        featured: r.is_featured,
        variant: getTemplateStyle(r.slug).defaultVariant,
      };
    }),
  };
}

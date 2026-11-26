import "server-only";
import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { TemplateCard } from "@/components/templates/template-grid";
import { requireSupabasePublicEnv } from "@/lib/env";
import { hasSessionCookie } from "@/lib/session-hint";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { getTemplateStyle, isAvailableTemplate } from "./templates";

/** Cache tag for the template catalog. Admin template edits clear it (features/admin/actions.ts). */
export const TEMPLATES_TAG = "templates";

/**
 * The active templates and categories, the same for everyone, so they are
 * kept by Next's data cache for five minutes instead of read from the
 * database on every visit (the library, the home page and the picker all
 * use them). Read with a signed-out client: a cached function must not read
 * the visitor's cookies, and both tables are public to read.
 */
const loadCatalog = unstable_cache(
  async () => {
    const { url, anonKey } = requireSupabasePublicEnv();
    const supabase = createSupabaseClient<Database>(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const [{ data: rows }, { data: categories }] = await Promise.all([
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
    ]);
    return { rows: rows ?? [], categories: categories ?? [] };
  },
  ["template-catalog"],
  { tags: [TEMPLATES_TAG], revalidate: 300 },
);

/**
 * Template metadata for the picker and library, localised, with premium
 * unlock state for the signed-in user (RLS returns only their unlocks).
 * The catalog comes from the cache; unlocks are personal and never cached,
 * and are skipped entirely for a visitor with no sign-in cookie.
 */
export async function loadTemplateCards(locale: "en" | "my"): Promise<{
  templates: TemplateCard[];
  categories: { id: string; slug: string; name: string }[];
}> {
  const [{ rows, categories }, unlocks] = await Promise.all([
    loadCatalog(),
    (async () => {
      if (!(await hasSessionCookie())) return [];
      const supabase = await createClient();
      const { data } = await supabase.from("template_unlocks").select("template_id");
      return data ?? [];
    })(),
  ]);

  const cats = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: locale === "my" ? c.name_my : c.name_en,
  }));
  const catName = new Map(cats.map((c) => [c.id, c.name]));
  const unlocked = new Set(unlocks.map((u) => u.template_id));

  return {
    categories: cats,
    templates: rows.map((r) => {
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

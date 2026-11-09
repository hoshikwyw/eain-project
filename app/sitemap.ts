import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { isAvailableTemplate } from "@/features/gifts/templates";
import { isSupabaseConfigured, publicEnv, requireSupabasePublicEnv } from "@/lib/env";

/** The public template pages: active templates that have a layout in code. */
async function templateSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { url, anonKey } = requireSupabasePublicEnv();
    const supabase = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data } = await supabase.from("templates").select("slug").eq("is_active", true);
    return (data ?? []).map((r) => r.slug).filter(isAvailableTemplate);
  } catch {
    return [];
  }
}

/** Public marketing pages only. Gift, dashboard and admin routes are never listed. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = (publicEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5173").replace(/\/$/, "");
  const now = new Date();
  const templatePages: MetadataRoute.Sitemap = (await templateSlugs()).map((slug) => ({
    url: `${origin}/templates/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  return [
    { url: `${origin}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/templates`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...templatePages,
    { url: `${origin}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${origin}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${origin}/security`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${origin}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${origin}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}

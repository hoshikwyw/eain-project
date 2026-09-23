import type { Metadata } from "next";
import { Lock } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { isAvailableTemplate } from "@/features/gifts/templates";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("templatesPage");
  return { title: t("title") };
}

/** Public template library. Browsing needs no account; creating does. */
export default async function TemplatesPage() {
  const t = await getTranslations("templatesPage");
  const tc = await getTranslations("create");
  const locale = await getLocale();

  let templates: Array<{
    id: string;
    slug: string;
    name_en: string;
    name_my: string;
    description_en: string;
    description_my: string;
    is_premium: boolean;
    point_price: number;
    category: string;
  }> = [];

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const [{ data: rows }, { data: categories }] = await Promise.all([
      supabase
        .from("templates")
        .select("id, slug, category_id, name_en, name_my, description_en, description_my, is_premium, point_price")
        .eq("is_active", true)
        .order("sort_order"),
      supabase.from("categories").select("id, name_en, name_my"),
    ]);
    const categoryName = new Map((categories ?? []).map((c) => [c.id, locale === "my" ? c.name_my : c.name_en]));
    templates = (rows ?? []).map((r) => ({ ...r, category: categoryName.get(r.category_id) ?? "" }));
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold">{t("title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const available = isAvailableTemplate(template.slug) && !template.is_premium;
          const name = locale === "my" ? template.name_my : template.name_en;
          const description = locale === "my" ? template.description_my : template.description_en;
          return (
            <Card key={template.id}>
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <div className="bg-hero flex aspect-[4/3] items-end rounded-xl p-4">
                  <span className="font-display text-xl font-semibold">{name}</span>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{name}</h2>
                    <Chip tone="neutral">{template.category}</Chip>
                    {template.is_premium ? (
                      <Chip tone="brand">
                        <Lock className="size-3" />
                        {template.point_price}
                      </Chip>
                    ) : (
                      <Chip tone="success">{tc("free")}</Chip>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <Button asChild variant={available ? "primary" : "secondary"} className="w-full" disabled={!available}>
                  <Link href="/create">{available ? tc("useTemplate") : tc("comingSoon")}</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

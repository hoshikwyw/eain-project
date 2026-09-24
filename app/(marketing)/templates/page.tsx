import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { TemplateGrid } from "@/components/templates/template-grid";
import { loadTemplateCards } from "@/features/gifts/template-cards";
import { isSupabaseConfigured } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("templatesPage");
  return { title: t("title") };
}

/** Public template library. Browsing needs no account; creating does. */
export default async function TemplatesPage() {
  const t = await getTranslations("templatesPage");
  const locale = await getLocale();

  const { templates, categories } = isSupabaseConfigured()
    ? await loadTemplateCards(locale === "my" ? "my" : "en")
    : { templates: [], categories: [] };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold">{t("title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("subtitle")}</p>
      </div>
      <TemplateGrid templates={templates} categories={categories} mode="browse" locale={locale === "my" ? "my" : "en"} />
    </div>
  );
}

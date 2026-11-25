import { getLocale, getTranslations } from "next-intl/server";
import { TemplateGrid } from "@/components/templates/template-grid";
import { createGiftFromTemplate } from "@/features/gifts/actions";
import { loadTemplateCards } from "@/features/gifts/template-cards";
import { isAvailableTemplate } from "@/features/gifts/templates";
import { getCurrentProfile } from "@/features/profile/queries";
import { QueryToasts } from "@/components/ui/query-toasts";
import { PageTitle } from "@/components/ui/page-title";

const ERRORS = ["template", "premium", "unknown"] as const;

/** The template picker: every template, searchable, inside the app frame. */
export default async function CreatePage({ searchParams }: PageProps<"/create">) {
  const params = await searchParams;
  const requested = typeof params.template === "string" ? params.template : undefined;
  const error = ERRORS.find((e) => e === params.error);

  // Deep link from the public library: start the gift right away. A premium
  // template that is not unlocked comes back here with error=premium.
  if (requested && isAvailableTemplate(requested) && !error) {
    await createGiftFromTemplate(requested, params.unlocked === "1");
  }

  const t = await getTranslations("create");
  const locale = await getLocale();
  // The profile read keeps the page for signed-in creators only.
  const [{ templates, categories }] = await Promise.all([
    loadTemplateCards(locale === "my" ? "my" : "en"),
    getCurrentProfile(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <PageTitle>{t("title")}</PageTitle>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <QueryToasts
        items={ERRORS.map((e) => ({
          param: "error",
          value: e,
          type: "error" as const,
          title: t(`errors.${e}`),
        }))}
      />

      <TemplateGrid
        templates={templates}
        categories={categories}
        mode="create"
        highlightSlug={error === "premium" ? requested : undefined}
        locale={locale === "my" ? "my" : "en"}
      />
    </div>
  );
}

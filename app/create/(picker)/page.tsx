import { getLocale, getTranslations } from "next-intl/server";
import { TemplateGrid } from "@/components/templates/template-grid";
import { createGiftFromTemplate } from "@/features/gifts/actions";
import { loadTemplateCards } from "@/features/gifts/template-cards";
import { isAvailableTemplate } from "@/features/gifts/templates";
import { getCurrentProfile } from "@/features/profile/queries";
import { Notice } from "@/components/ui/notice";
import { PageTitle } from "@/components/ui/page-title";
import { PointsPill } from "@/components/dashboard/points-pill";

const ERRORS = ["template", "premium", "points", "unknown"] as const;

/** The template picker: every template, searchable, inside the app frame. */
export default async function CreatePage({ searchParams }: PageProps<"/create">) {
  const params = await searchParams;
  const requested = typeof params.template === "string" ? params.template : undefined;
  const error = ERRORS.find((e) => e === params.error);

  // Deep link from the public library: start the gift right away. A premium
  // template that is not unlocked comes back here with error=premium.
  if (requested && isAvailableTemplate(requested) && !error) {
    await createGiftFromTemplate(requested);
  }

  const t = await getTranslations("create");
  const tNav = await getTranslations("dashboard.nav");
  const locale = await getLocale();
  const [{ templates, categories }, profile] = await Promise.all([
    loadTemplateCards(locale === "my" ? "my" : "en"),
    getCurrentProfile(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <PageTitle>{t("title")}</PageTitle>
          <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        </div>
        {/* Phones have no balance in the top bar, and it decides what can be unlocked here. */}
        <PointsPill
          balance={profile.points_balance}
          label={tNav("points")}
          className="mt-1 shrink-0 md:hidden"
        />
      </div>

      {error && <Notice role="alert">{t(`errors.${error}`)}</Notice>}

      <TemplateGrid
        templates={templates}
        categories={categories}
        mode="create"
        pointsBalance={profile.points_balance}
        highlightSlug={error === "premium" ? requested : undefined}
        locale={locale === "my" ? "my" : "en"}
      />
    </div>
  );
}

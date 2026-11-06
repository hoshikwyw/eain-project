import { Star } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { TemplateGrid } from "@/components/templates/template-grid";
import { createGiftFromTemplate } from "@/features/gifts/actions";
import { loadTemplateCards } from "@/features/gifts/template-cards";
import { isAvailableTemplate } from "@/features/gifts/templates";
import { getCurrentProfile } from "@/features/profile/queries";

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
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        </div>
        {/* Phones have no balance in the top bar, and it decides what can be unlocked here. */}
        <Link
          href="/dashboard/points"
          aria-label={`${tNav("points")}: ${profile.points_balance}`}
          className="mt-1 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand-soft px-3.5 text-sm font-bold text-accent-foreground md:hidden dark:text-brand"
        >
          <Star className="size-4 fill-current" />
          {profile.points_balance}
        </Link>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-accent px-3.5 py-2.5 text-sm text-accent-foreground">
          {t(`errors.${error}`)}
        </p>
      )}

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

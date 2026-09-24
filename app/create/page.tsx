import { ArrowLeft, Star } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { LocaleToggle } from "@/components/settings/locale-toggle";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { TemplateGrid } from "@/components/templates/template-grid";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { createGiftFromTemplate } from "@/features/gifts/actions";
import { loadTemplateCards } from "@/features/gifts/template-cards";
import { isAvailableTemplate } from "@/features/gifts/templates";
import { getCurrentProfile } from "@/features/profile/queries";

const ERRORS = ["template", "premium", "points", "unknown"] as const;

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
  const locale = await getLocale();
  const [{ templates, categories }, profile] = await Promise.all([
    loadTemplateCards(locale === "my" ? "my" : "en"),
    getCurrentProfile(),
  ]);

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label={t("back")}>
            <Link href="/dashboard">
              <ArrowLeft />
            </Link>
          </Button>
          <Logo />
        </div>
        <div className="flex items-center gap-1.5">
          <Chip tone="brand">
            <Star className="size-3" />
            {profile.points_balance}
          </Chip>
          <LocaleToggle />
          <ThemeToggle />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pt-4 pb-28">
        <div>
          <h1 className="font-display text-3xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
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
    </main>
  );
}

import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { LocaleToggle } from "@/components/settings/locale-toggle";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { createGift } from "@/features/gifts/actions";
import { isAvailableTemplate } from "@/features/gifts/templates";
import { createClient } from "@/lib/supabase/server";

const ERRORS = ["template", "premium", "unknown"] as const;

export default async function CreatePage({ searchParams }: PageProps<"/create">) {
  const t = await getTranslations("create");
  const locale = await getLocale();
  const params = await searchParams;
  const error = ERRORS.find((e) => e === params.error);

  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("templates")
    .select("id, slug, name_en, name_my, description_en, description_my, is_premium, point_price, is_featured")
    .eq("is_active", true)
    .order("sort_order");

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
          <LocaleToggle />
          <ThemeToggle />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-28 pt-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-accent px-3.5 py-2.5 text-sm text-accent-foreground">
            {t(`errors.${error}`)}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(templates ?? []).map((template) => {
            const available = isAvailableTemplate(template.slug) && !template.is_premium;
            const name = locale === "my" ? template.name_my : template.name_en;
            const description = locale === "my" ? template.description_my : template.description_en;
            return (
              <Card key={template.id} className={available ? "" : "opacity-70"}>
                <CardContent className="flex h-full flex-col gap-4 p-5">
                  <div className="bg-hero flex aspect-[4/3] items-end rounded-xl p-4">
                    <span className="font-display text-xl font-semibold">{name}</span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold">{name}</h2>
                      {template.is_premium ? (
                        <Chip tone="brand">
                          <Lock className="size-3" />
                          {template.point_price}
                        </Chip>
                      ) : (
                        <Chip tone="success">{t("free")}</Chip>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                  {available ? (
                    <form action={createGift}>
                      <input type="hidden" name="template" value={template.slug} />
                      <Button type="submit" className="w-full">
                        {t("useTemplate")}
                      </Button>
                    </form>
                  ) : (
                    <Button variant="secondary" className="w-full" disabled>
                      {t("comingSoon")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}

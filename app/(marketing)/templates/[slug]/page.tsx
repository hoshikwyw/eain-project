import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { cache } from "react";
import { TemplateDemo } from "@/components/templates/template-demo";
import { TemplatePreview } from "@/components/templates/template-preview";
import { Button } from "@/components/ui/button";
import { CapsLabel } from "@/components/ui/caps-label";
import { Chip } from "@/components/ui/chip";
import { loadTemplateCards } from "@/features/gifts/template-cards";
import { getTemplateStyle, isAvailableTemplate, templates } from "@/features/gifts/templates";
import { isSupabaseConfigured } from "@/lib/env";

type Props = PageProps<"/templates/[slug]">;

/** How many other templates are offered under the page. */
const OTHERS_SHOWN = 4;

/** The template's card and a few others, once per request even though the metadata asks too. */
const loadPage = cache(async (slug: string, locale: "en" | "my") => {
  if (!isAvailableTemplate(slug) || !isSupabaseConfigured()) return null;
  const { templates: cards } = await loadTemplateCards(locale);
  const card = cards.find((c) => c.slug === slug);
  if (!card) return null;
  const others = cards
    .filter((c) => c.slug !== slug && isAvailableTemplate(c.slug))
    .slice(0, OTHERS_SHOWN);
  return { card, others };
});

const pageLocale = async () => ((await getLocale()) === "my" ? "my" : "en");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadPage(slug, await pageLocale());
  if (!data) return {};
  const t = await getTranslations("templatePage");
  return {
    title: t("pageTitle", { name: data.card.name }),
    description: data.card.description,
    alternates: { canonical: `/templates/${slug}` },
  };
}

/**
 * One template, shown the way its receiver will see it: the closed gift,
 * the opening and the finished sample card, beside what the template is and
 * the way to start from it. Public, so a shared link or a search result
 * lands on the gift itself rather than a thumbnail.
 */
export default async function TemplatePage({ params }: Props) {
  const { slug } = await params;
  const locale = await pageLocale();
  const data = await loadPage(slug, locale);
  if (!data) notFound();
  const { card, others } = data;

  const [t, tCreate, tDemo, tOpenings] = await Promise.all([
    getTranslations("templatePage"),
    getTranslations("create"),
    getTranslations("create.demo"),
    getTranslations("editor.openings"),
  ]);
  const style = getTemplateStyle(slug);
  const sectionCount = templates[slug]!.defaultSections(locale).length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-10 sm:py-12">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
        {/* What it is, and how to start */}
        <div className="flex flex-col gap-7 lg:sticky lg:top-24">
          <Link
            href="/templates"
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {t("back")}
          </Link>
          <div>
            <CapsLabel>{card.category}</CapsLabel>
            <h1 className="mt-2 font-display text-4xl font-semibold text-balance sm:text-5xl my:leading-[1.4]">
              {card.name}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">{card.description}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt className="text-muted-foreground">{t("facts.opening")}</dt>
              <dd className="mt-0.5 font-semibold">{tOpenings(style.defaultOpening)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("facts.sections")}</dt>
              <dd className="mt-0.5 font-semibold">
                {t("facts.sectionsCount", { count: sectionCount })}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("facts.price")}</dt>
              <dd className="mt-0.5 font-semibold">
                {card.isPremium ? t("facts.points", { points: card.pointPrice }) : t("facts.free")}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("facts.reply")}</dt>
              <dd className="mt-0.5 font-semibold">{t("facts.replyText")}</dd>
            </div>
          </dl>
          <div className="flex flex-col gap-2.5">
            {card.isPremium ? (
              <Button asChild size="lg" className="w-full sm:w-fit sm:px-8">
                <Link href={`/create?template=${slug}`}>
                  <Lock />
                  {tCreate("unlockFor", { points: card.pointPrice })}
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" variant="ink" className="w-full sm:w-fit sm:px-8">
                <Link href={`/try/${slug}`}>
                  {t("tryFree")}
                  <ArrowRight />
                </Link>
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              {card.isPremium ? t("premiumNote") : t("tryNote")}
            </p>
          </div>
        </div>

        {/* The receiver's experience */}
        <section aria-labelledby="template-demo" className="flex flex-col gap-3">
          <div>
            <CapsLabel as="h2" id="template-demo">
              {t("demoTitle")}
            </CapsLabel>
            <p className="mt-1 text-sm text-muted-foreground">{tDemo("hint")}</p>
          </div>
          <div className="bg-hero overflow-hidden rounded-[2rem] border">
            <TemplateDemo slug={slug} locale={locale} closedClassName="min-h-[36rem]" />
          </div>
        </section>
      </div>

      {others.length > 0 && (
        <section className="flex flex-col gap-5">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold">{t("more")}</h2>
            <Link
              href="/templates"
              className="group inline-flex items-center gap-2 text-sm font-semibold"
            >
              {t("back")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((o) => (
              <li key={o.id}>
                <Link href={`/templates/${o.slug}`} className="group block rounded-2xl">
                  <div className="transition-transform duration-300 group-hover:-translate-y-1">
                    <TemplatePreview
                      slug={o.slug}
                      variant={o.variant}
                      locale={locale}
                      name={o.name}
                    />
                  </div>
                  <span className="mt-2.5 flex items-center justify-between gap-2 px-1">
                    <span className="truncate text-sm font-semibold">{o.name}</span>
                    {o.isPremium ? (
                      <Chip tone="brand" className="shrink-0">
                        <Lock className="size-3" />
                        {o.pointPrice}
                      </Chip>
                    ) : (
                      <Chip tone="success" className="shrink-0">
                        {tCreate("free")}
                      </Chip>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

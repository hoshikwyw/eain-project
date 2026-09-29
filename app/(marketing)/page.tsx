import { ArrowRight, Link2, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Fragment } from "react";
import { Bird, Lovebirds } from "@/components/brand/lovebirds";
import { TemplatePreview } from "@/components/templates/template-preview";
import { Button } from "@/components/ui/button";
import { loadTemplateCards } from "@/features/gifts/template-cards";
import { isSupabaseConfigured } from "@/lib/env";
import { cn } from "@/lib/utils";

const occasions = ["birthday", "love", "friendship", "memories", "thankYou", "celebration"] as const;
const steps = ["choose", "create", "share", "open", "reply"] as const;
const connections = ["friends", "couples", "family", "classmates", "coworkers", "distance"] as const;
const trust = [
  { key: "private", icon: Link2 },
  { key: "receiver", icon: Lock },
  { key: "yours", icon: ShieldCheck },
] as const;

/** Small spaced-out section label with a leading hairline. Burmese drops caps and tracking. */
function Label({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-[11px] font-semibold tracking-[0.28em] text-muted-foreground uppercase my:text-xs my:tracking-normal my:normal-case",
        center && "justify-center",
      )}
    >
      <span aria-hidden="true" className="h-px w-8 bg-border" />
      {children}
      {center && <span aria-hidden="true" className="h-px w-8 bg-border" />}
    </p>
  );
}

const sectionTitle = "mt-5 font-display text-3xl font-light leading-tight tracking-[-0.01em] text-balance md:text-[2.6rem] my:leading-[1.55]";

export default async function HomePage() {
  const t = await getTranslations();
  const locale = (await getLocale()) === "my" ? "my" : "en";
  const showcase = isSupabaseConfigured()
    ? (await loadTemplateCards(locale)).templates.filter((x) => x.available).slice(0, 4)
    : [];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[40rem] bg-[radial-gradient(55%_60%_at_50%_0%,var(--brand-soft),transparent_75%)]"
        />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pt-20 pb-20 text-center md:pt-28">
          <Label center>{t("home.eyebrow")}</Label>
          <h1 className="mt-8 font-display text-5xl font-light leading-[1.02] tracking-[-0.025em] text-balance sm:text-6xl md:text-7xl lg:text-[5.25rem] my:text-4xl my:leading-[1.5] md:my:text-6xl">
            {t.rich("home.headline", {
              em: (chunks) => <em className="font-normal text-primary italic my:not-italic">{chunks}</em>,
            })}
          </h1>
          <p className="mt-7 max-w-xl text-lg text-muted-foreground md:text-xl">{t("home.subtitle")}</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="ink" size="lg" className="rounded-full px-8">
              <Link href="/create">
                {t("home.primaryCta")}
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="rounded-full px-6 text-muted-foreground hover:bg-transparent hover:text-foreground">
              <Link href="/templates">{t("home.secondaryCta")}</Link>
            </Button>
          </div>
          <p className="mt-6 text-xs tracking-wide text-muted-foreground">{t("home.meta")}</p>

          <div className="relative mt-20 w-full max-w-md">
            <div aria-hidden="true" className="absolute top-1/2 left-1/2 aspect-square w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/60" />
            <div aria-hidden="true" className="absolute top-1/2 left-1/2 aspect-square w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/40" />
            <div
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 aspect-square w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,var(--brand-soft),transparent)]"
            />
            <Lovebirds eager className="relative px-6" />
          </div>
        </div>
      </section>

      {/* Occasions */}
      <section aria-label={t("home.occasionsLabel")} className="border-y border-border/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4 py-9 md:gap-x-9">
          {occasions.map((key, i) => (
            <Fragment key={key}>
              {i > 0 && <span aria-hidden="true" className="size-1 rounded-full bg-border" />}
              <Link
                href="/templates"
                className="font-display text-xl font-light text-foreground/75 italic transition-colors hover:text-primary md:text-2xl my:not-italic"
              >
                {t(`categories.${key}`)}
              </Link>
            </Fragment>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 md:py-32">
        <div className="grid gap-12 md:grid-cols-[1fr_2fr] md:gap-16">
          <div>
            <Label>{t("home.howLabel")}</Label>
            <h2 className={sectionTitle}>{t("home.howTitle")}</h2>
          </div>
          <ol className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step} className="border-t border-border pt-6">
                <span className="font-display text-sm text-muted-foreground tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 font-display text-xl">{t(`howItWorks.${step}`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`howItWorks.${step}Text`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Statement */}
      <section className="bg-secondary/40">
        <div className="mx-auto max-w-4xl px-4 py-28 text-center md:py-40">
          <div className="flex flex-col gap-3 font-display text-3xl font-light leading-snug tracking-[-0.01em] text-balance md:text-5xl my:text-2xl my:leading-[1.6] md:my:text-4xl">
            <p>{t("home.statement1")}</p>
            <p className="text-foreground/70">{t("home.statement2")}</p>
            <p>
              <em className="text-primary italic my:not-italic">{t("home.statement3")}</em>
            </p>
          </div>
          <span aria-hidden="true" className="mx-auto mt-12 block h-px w-16 bg-border" />
          <p className="mx-auto mt-12 max-w-xl text-base text-muted-foreground md:text-lg">{t("home.statementEnd")}</p>
        </div>
      </section>

      {/* Templates */}
      {showcase.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-24 md:py-32">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <Label>{t("home.showcaseLabel")}</Label>
              <h2 className={sectionTitle}>{t("home.showcaseTitle")}</h2>
              <p className="mt-4 text-muted-foreground">{t("showcase.subtitle")}</p>
            </div>
            <Link href="/templates" className="group inline-flex items-center gap-2 text-sm font-semibold">
              {t("showcase.cta")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {showcase.map((tp) => (
              <Link key={tp.id} href={`/create?template=${tp.slug}`} className="group block rounded-xl">
                <div className="transition-transform duration-500 group-hover:-translate-y-1">
                  <TemplatePreview slug={tp.slug} variant={tp.variant} locale={locale} name={tp.name} />
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-3">
                  <span className="font-display text-lg">{tp.name}</span>
                  <span className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase my:text-xs my:tracking-normal my:normal-case">
                    {tp.category}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* For everyone */}
      <section className="border-t border-border/60">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 md:grid-cols-[1fr_1.4fr] md:gap-20 md:py-32">
          <div className="md:sticky md:top-28 md:self-start">
            <Label>{t("home.forLabel")}</Label>
            <h2 className={sectionTitle}>{t("connections.title")}</h2>
            <p className="mt-4 text-muted-foreground">{t("connections.subtitle")}</p>
          </div>
          <ul className="divide-y divide-border/70 border-y border-border/70">
            {connections.map((key) => (
              <li key={key} className="flex flex-col gap-1 py-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
                <span className="font-display text-2xl font-light">{t(`connections.${key}`)}</span>
                <span className="text-sm text-muted-foreground sm:text-right">{t(`connections.${key}Text`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Privacy */}
      <section className="bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-24 md:py-28">
          <div className="max-w-2xl">
            <Label>{t("home.trustLabel")}</Label>
            <h2 className={sectionTitle}>{t("trust.title")}</h2>
          </div>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {trust.map(({ key, icon: Icon }) => (
              <div key={key} className="flex flex-col gap-3 border-t border-border pt-6">
                <Icon className="size-5 text-muted-foreground" strokeWidth={1.5} />
                <h3 className="font-display text-xl">{t(`trust.${key}Title`)}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{t(`trust.${key}Text`)}</p>
              </div>
            ))}
          </div>
          <Link href="/security" className="group mt-12 inline-flex items-center gap-2 text-sm font-semibold">
            {t("trust.learnMore")}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto max-w-4xl px-4 py-28 text-center md:py-40">
        <div className="mx-auto w-24">
          <Bird variant="pink" className="float-slow" />
        </div>
        <h2 className="mt-8 font-display text-4xl font-light leading-tight tracking-[-0.02em] text-balance md:text-6xl my:leading-[1.5]">
          {t("finalCta.title")}
        </h2>
        <Button asChild variant="ink" size="lg" className="mt-10 rounded-full px-8">
          <Link href="/create">
            {t("finalCta.button")}
            <ArrowRight />
          </Link>
        </Button>
      </section>
    </>
  );
}

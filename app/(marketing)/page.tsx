import {
  Briefcase,
  Cake,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Link2,
  Lock,
  MessageCircleHeart,
  PartyPopper,
  Plane,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Lovebirds } from "@/components/brand/lovebirds";
import { TemplatePreview } from "@/components/templates/template-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { loadTemplateCards } from "@/features/gifts/template-cards";
import { isSupabaseConfigured } from "@/lib/env";

const categories = [
  { key: "birthday", icon: Cake },
  { key: "love", icon: Heart },
  { key: "friendship", icon: Users },
  { key: "memories", icon: Sparkles },
  { key: "thankYou", icon: MessageCircleHeart },
  { key: "celebration", icon: PartyPopper },
] as const;

const steps = ["choose", "create", "share", "open", "reply"] as const;

const features = [
  { key: "templates", icon: Gift },
  { key: "sharing", icon: Share2 },
  { key: "interactive", icon: MessageCircleHeart },
  { key: "track", icon: Sparkles },
] as const;

const connections = [
  { key: "friends", icon: Users },
  { key: "couples", icon: Heart },
  { key: "family", icon: Home },
  { key: "classmates", icon: GraduationCap },
  { key: "coworkers", icon: Briefcase },
  { key: "distance", icon: Plane },
] as const;

const trust = [
  { key: "private", icon: Link2 },
  { key: "receiver", icon: Lock },
  { key: "yours", icon: ShieldCheck },
] as const;

export default async function HomePage() {
  const t = await getTranslations();
  const locale = (await getLocale()) === "my" ? "my" : "en";
  const showcase = isSupabaseConfigured()
    ? (await loadTemplateCards(locale)).templates.filter((x) => x.available).slice(0, 4)
    : [];

  return (
    <>
      <section className="bg-hero">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col items-start gap-6">
            <Chip tone="brand">{t("hero.badge")}</Chip>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-balance md:text-6xl">{t("hero.title")}</h1>
            <p className="text-lg text-muted-foreground text-balance md:text-xl">{t("hero.subtitle")}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/create">{t("hero.primaryCta")}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/templates">{t("hero.secondaryCta")}</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{t("hero.note")}</p>
          </div>
          <div className="mx-auto w-full max-w-md">
            <Lovebirds eager />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-2xl font-semibold md:text-3xl">{t("categories.title")}</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {categories.map(({ key, icon: Icon }) => (
            <Link key={key} href="/templates" className="rounded-2xl">
              <Card className="h-full transition-transform hover:-translate-y-0.5">
                <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
                  <span className="grid size-11 place-items-center rounded-full bg-brand-soft text-accent-foreground dark:text-brand">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-sm font-semibold">{t(`categories.${key}`)}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section id="how" className="bg-secondary/60">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-2xl font-semibold md:text-3xl">{t("howItWorks.title")}</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-5">
            {steps.map((step, index) => (
              <li key={step} className="flex flex-col gap-2">
                <span className="grid size-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{index + 1}</span>
                <h3 className="font-semibold">{t(`howItWorks.${step}`)}</h3>
                <p className="text-sm text-muted-foreground">{t(`howItWorks.${step}Text`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-semibold md:text-3xl">{t("connections.title")}</h2>
          <p className="mt-2 text-muted-foreground">{t("connections.subtitle")}</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {connections.map(({ key, icon: Icon }) => (
            <Card key={key}>
              <CardContent className="flex gap-4 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{t(`connections.${key}`)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`connections.${key}Text`)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {showcase.length > 0 && (
        <section className="bg-secondary/60">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <h2 className="font-display text-2xl font-semibold md:text-3xl">{t("showcase.title")}</h2>
                <p className="mt-2 text-muted-foreground">{t("showcase.subtitle")}</p>
              </div>
              <Button asChild variant="secondary">
                <Link href="/templates">{t("showcase.cta")}</Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {showcase.map((tp) => (
                <Link key={tp.id} href={`/create?template=${tp.slug}`} className="rounded-2xl">
                  <Card className="h-full transition-transform hover:-translate-y-0.5">
                    <CardContent className="flex flex-col gap-3 p-4">
                      <TemplatePreview slug={tp.slug} variant={tp.variant} locale={locale} name={tp.name} />
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{tp.name}</span>
                        <Chip tone="neutral">{tp.category}</Chip>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {features.map(({ key, icon: Icon }) => (
            <Card key={key}>
              <CardContent className="flex gap-4 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{t(`features.${key}Title`)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`features.${key}Text`)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-secondary/60">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-2xl font-semibold md:text-3xl">{t("trust.title")}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {trust.map(({ key, icon: Icon }) => (
              <div key={key} className="flex flex-col gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-success-soft text-success">
                  <Icon className="size-5" />
                </span>
                <h3 className="font-semibold">{t(`trust.${key}Title`)}</h3>
                <p className="text-sm text-muted-foreground">{t(`trust.${key}Text`)}</p>
              </div>
            ))}
          </div>
          <Button asChild variant="link" className="mt-6 px-0">
            <Link href="/security">{t("trust.learnMore")}</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 pb-20">
        <Card className="bg-hero text-center">
          <CardContent className="flex flex-col items-center gap-5 p-10 md:p-14">
            <h2 className="font-display text-3xl font-semibold text-balance md:text-4xl">{t("finalCta.title")}</h2>
            <Button asChild size="lg">
              <Link href="/create">{t("finalCta.button")}</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

"use client";

import { Lock, Search } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { createGift } from "@/features/gifts/actions";
import type { ThemeVariant } from "@/features/gifts/schemas";
import { unlockTemplate } from "@/features/points/actions";
import { TemplatePreview } from "./template-preview";

export type TemplateCard = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  category: string;
  isPremium: boolean;
  pointPrice: number;
  /** Free, or premium and already paid for by this user. */
  unlocked: boolean;
  /** Has a layout in code and is unlocked. */
  available: boolean;
  variant: ThemeVariant;
};

type Props = {
  templates: TemplateCard[];
  categories: { id: string; name: string }[];
  /** create: buttons create a gift. browse: buttons link to /create. */
  mode: "create" | "browse";
  /** Signed-in user's balance, for unlock buttons. Null when browsing signed out. */
  pointsBalance?: number | null;
  /** Slug to scroll to and highlight, e.g. after a premium redirect. */
  highlightSlug?: string;
  /** Language for the preview's starting text. */
  locale: "en" | "my";
};

/** Template library with category chips and search. Filtering is client-side; the list is small. */
export function TemplateGrid({ templates, categories, mode, pointsBalance = null, highlightSlug, locale }: Props) {
  const t = useTranslations("create");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const usedCategories = useMemo(() => {
    const ids = new Set(templates.map((x) => x.categoryId));
    return categories.filter((c) => ids.has(c.id));
  }, [templates, categories]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter(
      (x) =>
        (!category || x.categoryId === category) &&
        (!q || x.name.toLowerCase().includes(q) || x.description.toLowerCase().includes(q) || x.category.toLowerCase().includes(q)),
    );
  }, [templates, query, category]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={category === null} onClick={() => setCategory(null)}>
            {t("allCategories")}
          </FilterChip>
          {usedCategories.map((c) => (
            <FilterChip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
              {c.name}
            </FilterChip>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("noResults")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((template) => (
            <Card
              key={template.id}
              id={`template-${template.slug}`}
              className={
                template.slug === highlightSlug
                  ? "ring-2 ring-primary"
                  : template.available || (template.isPremium && !template.unlocked)
                    ? ""
                    : "opacity-80"
              }
            >
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <TemplatePreview slug={template.slug} variant={template.variant} locale={locale} name={template.name} />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{template.name}</h2>
                    <Chip tone="neutral">{template.category}</Chip>
                    {template.isPremium ? (
                      <Chip tone="brand">
                        <Lock className="size-3" />
                        {template.pointPrice}
                      </Chip>
                    ) : (
                      <Chip tone="success">{t("free")}</Chip>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
                <TemplateAction template={template} mode={mode} pointsBalance={pointsBalance} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateAction({
  template,
  mode,
  pointsBalance,
}: {
  template: TemplateCard;
  mode: "create" | "browse";
  pointsBalance: number | null;
}) {
  const t = useTranslations("create");

  if (template.available) {
    return mode === "create" ? (
      <form action={createGift}>
        <input type="hidden" name="template" value={template.slug} />
        <SubmitButton className="w-full" pendingLabel={t("creating")}>
          {t("useTemplate")}
        </SubmitButton>
      </form>
    ) : (
      <Button asChild className="w-full">
        <Link href={`/create?template=${template.slug}`}>{t("useTemplate")}</Link>
      </Button>
    );
  }

  if (template.isPremium && !template.unlocked) {
    if (mode === "browse" || pointsBalance === null) {
      return (
        <Button asChild variant="secondary" className="w-full">
          <Link href={`/create?template=${template.slug}`}>
            <Lock />
            {t("unlockFor", { points: template.pointPrice })}
          </Link>
        </Button>
      );
    }
    if (pointsBalance >= template.pointPrice) {
      return (
        <form action={unlockTemplate}>
          <input type="hidden" name="template" value={template.slug} />
          <SubmitButton variant="soft" className="w-full" pendingLabel={t("unlocking")}>
            <Lock />
            {t("unlockFor", { points: template.pointPrice })}
          </SubmitButton>
        </form>
      );
    }
    return (
      <Button asChild variant="secondary" className="w-full">
        <Link href="/dashboard/points">{t("needMorePoints", { points: template.pointPrice - pointsBalance })}</Link>
      </Button>
    );
  }

  return (
    <Button variant="secondary" className="w-full" disabled>
      {t("comingSoon")}
    </Button>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground"
          : "rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      }
    >
      {children}
    </button>
  );
}

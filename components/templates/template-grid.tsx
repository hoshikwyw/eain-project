"use client";

import { Lock, Search } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { createGift } from "@/features/gifts/actions";
import type { ThemeVariant } from "@/features/gifts/schemas";
import { unlockTemplate } from "@/features/points/actions";
import { cn } from "@/lib/utils";
import { TemplatePreview } from "./template-preview";
import { TemplatePreviewDialog } from "./template-preview-dialog";

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
export function TemplateGrid({
  templates,
  categories,
  mode,
  pointsBalance = null,
  highlightSlug,
  locale,
}: Props) {
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
        (!q ||
          x.name.toLowerCase().includes(q) ||
          x.description.toLowerCase().includes(q) ||
          x.category.toLowerCase().includes(q)),
    );
  }, [templates, query, category]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="h-12 rounded-full pr-5 pl-11"
          />
        </div>
        {/* One row that scrolls sideways on phones; wraps where there is room. */}
        <div className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 sm:flex-wrap">
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
        <EmptyState bird="pink" text={t("noResults")} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {visible.map((template) => (
            <article
              key={template.id}
              id={`template-${template.slug}`}
              className={cn(
                "flex scroll-mt-24 flex-col gap-3 panel p-3",
                template.slug === highlightSlug && "ring-2 ring-primary",
                !template.available && !(template.isPremium && !template.unlocked) && "opacity-80",
              )}
            >
              <TemplatePreview
                slug={template.slug}
                variant={template.variant}
                locale={locale}
                name={template.name}
              />
              <div className="flex flex-1 flex-col gap-1 px-1.5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="truncate font-semibold">
                    {mode === "browse" ? (
                      <Link
                        href={`/templates/${template.slug}`}
                        className="rounded-sm underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        {template.name}
                      </Link>
                    ) : (
                      template.name
                    )}
                  </h2>
                  {template.isPremium ? (
                    <Chip tone="brand" className="shrink-0">
                      <Lock className="size-3" />
                      {template.pointPrice}
                    </Chip>
                  ) : (
                    <Chip tone="success" className="shrink-0">
                      {t("free")}
                    </Chip>
                  )}
                </div>
                <p className="text-xs font-semibold text-muted-foreground">{template.category}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {template.description}
                </p>
              </div>
              <div className="flex gap-2">
                <TemplatePreviewDialog
                  slug={template.slug}
                  name={template.name}
                  locale={locale}
                  triggerClassName="shrink-0"
                >
                  <TemplateAction template={template} mode={mode} pointsBalance={pointsBalance} />
                </TemplatePreviewDialog>
                <div className="min-w-0 flex-1">
                  <TemplateAction template={template} mode={mode} pointsBalance={pointsBalance} />
                </div>
              </div>
            </article>
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
        <Link href={`/try/${template.slug}`}>{t("useTemplate")}</Link>
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
        <Link href="/dashboard/points">
          {t("needMorePoints", { points: template.pointPrice - pointsBalance })}
        </Link>
      </Button>
    );
  }

  return (
    <Button variant="secondary" className="w-full" disabled>
      {t("comingSoon")}
    </Button>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-9 shrink-0 cursor-pointer rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

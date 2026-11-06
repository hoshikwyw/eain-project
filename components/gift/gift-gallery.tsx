"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { GALLERY_FILTERS, type GalleryFilter } from "./gallery-filters";

type Item = {
  id: string;
  /** Every tab this gift shows under, besides "all". */
  groups: GalleryFilter[];
  tile: React.ReactNode;
};

type Props = {
  items: Item[];
  /** The tab to start on, from the page address. */
  initial: GalleryFilter;
  /** A last tile shown on the "all" tab, such as "create a new gift". */
  tail?: React.ReactNode;
};

/**
 * The My Gifts grid with its filter tabs. The tiles are drawn on the server
 * and handed in ready-made, so switching tabs is instant: it only chooses
 * which of them to show. The chosen tab is kept in the page address so a
 * reload or a shared link opens on the same one.
 */
export function GiftGallery({ items, initial, tail }: Props) {
  const t = useTranslations("dashboard.gifts.filters");
  const [filter, setFilter] = useState<GalleryFilter>(initial);

  const shown = filter === "all" ? items : items.filter((item) => item.groups.includes(filter));
  const countOf = (key: GalleryFilter) => (key === "all" ? items.length : items.filter((item) => item.groups.includes(key)).length);

  function choose(next: GalleryFilter) {
    setFilter(next);
    window.history.replaceState(null, "", next === "all" ? window.location.pathname : `?filter=${next}`);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Scrolls sideways if the tabs ever outgrow a narrow phone. */}
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
        <div role="group" aria-label={t("label")} className="flex gap-1 rounded-full bg-secondary p-1 sm:inline-flex">
          {GALLERY_FILTERS.map((key) => {
            const active = key === filter;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => choose(key)}
                className={cn(
                  "inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-2 text-sm sm:flex-none sm:px-3.5 font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                  active ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(key)}
                <span className={cn("text-xs tabular-nums", active ? "text-muted-foreground" : "opacity-70")}>{countOf(key)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {shown.length === 0 && filter !== "all" ? (
        <div role="status">
          <EmptyState bird={filter === "drafts" ? "pink" : "blue"} compact text={t(`empty.${filter}`)} />
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4">
          {shown.map((item) => (
            <li key={item.id}>{item.tile}</li>
          ))}
          {filter === "all" && tail && <li>{tail}</li>}
        </ul>
      )}
    </div>
  );
}

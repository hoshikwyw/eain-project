"use client";

import { BookOpen, ChevronDown, ChevronUp, Gift, Mail, Play, Plus, ScrollText, Sparkles, Theater, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { DARK_VARIANTS, variantSwatch } from "@/components/gift/palettes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MAX_SECTIONS,
  OPENINGS,
  THEME_VARIANTS,
  type EditableSectionType,
  type MediaItem,
  type Opening,
  type Section,
  type ThemeVariant,
} from "@/features/gifts/schemas";
import { cn } from "@/lib/utils";
import { SectionFields } from "./section-fields";
import { sectionSummary } from "./text-fields";

const SECTION_TYPES: EditableSectionType[] = ["text", "message", "image", "photo_grid", "timeline", "quote", "question", "final_message"];

const OPENING_ICONS: Record<Opening, React.ComponentType<{ className?: string }>> = {
  envelope: Mail,
  book: BookOpen,
  giftbox: Gift,
  curtain: Theater,
  scroll: ScrollText,
  simple: Sparkles,
};

const optionClass = (active: boolean) =>
  cn(
    "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border text-center text-xs font-semibold transition-colors",
    active ? "border-primary bg-accent text-accent-foreground ring-1 ring-primary" : "border-border hover:bg-secondary",
  );

type SectionsPanelProps = {
  sections: Section[];
  selectedId: string | null;
  /** Sections to flag as incomplete. */
  invalidIds: ReadonlySet<string>;
  onSelect: (id: string | null) => void;
  onChange: (section: Section) => void;
  onMove: (index: number, dir: -1 | 1) => void;
  onRemove: (id: string) => void;
  onAdd: (type: EditableSectionType) => void;
  giftId: string;
  media: MediaItem[];
  onMediaChange: (media: MediaItem[]) => void;
};

/** Every section in order. The selected one opens to show its fields. */
export function SectionsPanel(p: SectionsPanelProps) {
  const t = useTranslations("editor");
  const [adding, setAdding] = useState(false);
  const selectedRow = useRef<HTMLLIElement>(null);

  // A section picked on the gift is brought into view here too.
  useEffect(() => {
    selectedRow.current?.scrollIntoView({ block: "nearest" });
  }, [p.selectedId]);

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-2">
        {p.sections.map((section, index) => {
          const selected = section.id === p.selectedId;
          return (
            <li
              key={section.id}
              ref={selected ? selectedRow : undefined}
              className={cn(
                "rounded-2xl border bg-card",
                selected ? "border-primary ring-1 ring-primary" : p.invalidIds.has(section.id) ? "border-destructive" : "border-border",
              )}
            >
              <div className="flex items-center gap-0.5 py-1 pr-1.5 pl-3.5">
                <button
                  type="button"
                  aria-expanded={selected}
                  className="flex min-w-0 flex-1 cursor-pointer flex-col py-1.5 text-left outline-none"
                  onClick={() => p.onSelect(selected ? null : section.id)}
                >
                  <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">{t(`sectionTypes.${section.type}`)}</span>
                  <span className="truncate text-sm">{sectionSummary(section) || "…"}</span>
                </button>
                <Button type="button" variant="ghost" size="icon" className="size-8" aria-label={t("moveUp")} disabled={index === 0} onClick={() => p.onMove(index, -1)}>
                  <ChevronUp />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="size-8" aria-label={t("moveDown")} disabled={index === p.sections.length - 1} onClick={() => p.onMove(index, 1)}>
                  <ChevronDown />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="size-8 text-destructive" aria-label={t("removeSection")} disabled={p.sections.length <= 1} onClick={() => p.onRemove(section.id)}>
                  <Trash2 />
                </Button>
              </div>
              {selected && (
                <div className="flex flex-col gap-4 border-t border-border p-3.5">
                  <SectionFields section={section} onChange={p.onChange} giftId={p.giftId} media={p.media} onMediaChange={p.onMediaChange} />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {adding ? (
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-dashed border-border p-3">
          {SECTION_TYPES.map((type) => (
            <Button
              key={type}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                p.onAdd(type);
                setAdding(false);
              }}
            >
              {t(`sectionTypes.${type}`)}
            </Button>
          ))}
          <Button type="button" variant="ghost" size="sm" className="col-span-2" onClick={() => setAdding(false)}>
            {t("cancel")}
          </Button>
        </div>
      ) : (
        <Button type="button" variant="secondary" className="self-start" disabled={p.sections.length >= MAX_SECTIONS} onClick={() => setAdding(true)}>
          <Plus />
          {t("addSection")}
        </Button>
      )}
      <p className="text-xs text-muted-foreground">{t("sectionCount", { count: p.sections.length, max: MAX_SECTIONS })}</p>
    </div>
  );
}

/** The gift's look: one of the ready-made colour sets, light or dark. */
export function LookPanel({ variant, onChange }: { variant: ThemeVariant; onChange: (variant: ThemeVariant) => void }) {
  const t = useTranslations("editor");
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="sr-only">{t("theme")}</legend>
      {([false, true] as const).map((dark) => (
        <div key={String(dark)} className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">{dark ? t("darkLooks") : t("lightLooks")}</p>
          <div className="grid grid-cols-3 gap-2">
            {THEME_VARIANTS.filter((v) => DARK_VARIANTS.has(v) === dark).map((v) => (
              <label key={v} className={cn(optionClass(variant === v), "p-2")}>
                <input type="radio" name="variant" value={v} checked={variant === v} onChange={() => onChange(v)} className="sr-only" />
                <span aria-hidden="true" className="h-8 w-full rounded-lg ring-1 ring-black/5" style={{ background: variantSwatch[v] }} />
                <span className="leading-tight">{t(`variants.${v}`)}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </fieldset>
  );
}

/** How the gift opens for the receiver. Picking one plays it. */
export function OpeningPanel({ opening, onChange, onPlay }: { opening: Opening; onChange: (opening: Opening) => void; onPlay: () => void }) {
  const t = useTranslations("editor");
  return (
    <div role="radiogroup" aria-label={t("opening")} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{t("openingHint")}</p>
        <Button type="button" variant="soft" size="sm" onClick={onPlay}>
          <Play />
          {t("playOpening")}
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {OPENINGS.map((o) => {
          const Icon = OPENING_ICONS[o];
          return (
            <label key={o} className={cn(optionClass(opening === o), "p-3")}>
              <input
                type="radio"
                name="opening"
                value={o}
                checked={opening === o}
                onChange={() => {
                  onChange(o);
                  onPlay();
                }}
                className="sr-only"
              />
              <Icon className="size-5" />
              <span className="leading-tight">{t(`openings.${o}`)}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

type DetailsPanelProps = {
  title: string;
  onTitle: (title: string) => void;
  /** Flags the title when a save was tried without one. */
  titleInvalid: boolean;
  recipientName: string;
  onRecipientName: (name: string) => void;
};

/** What is not on the gift itself: its private title and who it is for. */
export function DetailsPanel(p: DetailsPanelProps) {
  const t = useTranslations("editor");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">{t("title")}</Label>
        <Input id="title" value={p.title} onChange={(e) => p.onTitle(e.target.value)} maxLength={120} aria-invalid={p.titleInvalid || undefined} />
        <p className="text-xs text-muted-foreground">{t("titleHint")}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="recipientName">{t("recipientName")}</Label>
        <Input id="recipientName" value={p.recipientName} onChange={(e) => p.onRecipientName(e.target.value)} maxLength={80} placeholder={t("recipientPlaceholder")} />
      </div>
    </div>
  );
}

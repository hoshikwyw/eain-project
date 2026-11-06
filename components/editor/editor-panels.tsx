"use client";

import { BookOpen, ChevronDown, ChevronUp, Gift, Mail, Play, Plus, RotateCcw, ScrollText, Sparkles, Theater, Trash2, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { contrastRatio, DARK_VARIANTS, lookColors, variantSwatch } from "@/components/gift/palettes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StickerArt } from "@/components/gift/sticker-layer";
import { FLOWER_COLORS, flowerSwatch, type FlowerColor } from "@/features/gifts/scene";
import {
  MAX_SECTIONS,
  MAX_STICKERS,
  OPENINGS,
  THEME_VARIANTS,
  type EditableSectionType,
  type GiftColors,
  type MediaItem,
  type Opening,
  type Section,
  type ThemeVariant,
} from "@/features/gifts/schemas";
import { STICKER_GROUPS, type StickerKind } from "@/features/gifts/stickers";
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
  /** The kinds of section that can be added. Default: all of them. */
  addTypes?: EditableSectionType[];
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
          {(p.addTypes ?? SECTION_TYPES).map((type) => (
            <Button
              key={type}
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-full"
              onClick={() => {
                p.onAdd(type);
                setAdding(false);
              }}
            >
              {t(`sectionTypes.${type}`)}
            </Button>
          ))}
          <Button type="button" variant="ghost" size="sm" className="col-span-2 rounded-full" onClick={() => setAdding(false)}>
            {t("cancel")}
          </Button>
        </div>
      ) : (
        <Button type="button" variant="secondary" className="self-start rounded-full" disabled={p.sections.length >= MAX_SECTIONS} onClick={() => setAdding(true)}>
          <Plus />
          {t("addSection")}
        </Button>
      )}
      <p className="text-xs text-muted-foreground">{t("sectionCount", { count: p.sections.length, max: MAX_SECTIONS })}</p>
    </div>
  );
}

/** The sticker library. Picking one puts it on the gift, ready to be dragged into place. */
export function StickersPanel({ count, onAdd }: { count: number; onAdd: (kind: StickerKind) => void }) {
  const t = useTranslations("editor");
  const full = count >= MAX_STICKERS;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs leading-relaxed text-muted-foreground">{full ? t("stickerLimit", { max: MAX_STICKERS }) : t("stickersHint")}</p>
      {STICKER_GROUPS.map((group) => (
        <div key={group.key} className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">{t(`stickerGroups.${group.key}`)}</h3>
          <div className="grid grid-cols-6 gap-1.5">
            {group.kinds.map((kind) => (
              <button
                key={kind}
                type="button"
                disabled={full}
                aria-label={t(`stickerNames.${kind}`)}
                title={t(`stickerNames.${kind}`)}
                onClick={() => onAdd(kind)}
                className="aspect-square cursor-pointer rounded-xl border border-border p-1.5 transition-colors outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/60 active:scale-95 disabled:cursor-default disabled:opacity-40"
              >
                <StickerArt kind={kind} />
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">{t("stickerCount", { count, max: MAX_STICKERS })}</p>
    </div>
  );
}

type LookPanelProps = {
  variant: ThemeVariant;
  /** The creator's own colours over the look. */
  colors: GiftColors;
  /** The look the gift's template starts with. */
  templateVariant: ThemeVariant;
  /** Picks a look. It starts again from that look's colours. */
  onVariant: (variant: ThemeVariant) => void;
  onColors: (colors: GiftColors) => void;
};

/** Below this the main text is hard to read on the card. WCAG asks 4.5 for small text; 3 flags the clear misses. */
const MIN_CONTRAST = 3;

/** The colour of the flowers in an animated garden. */
export function FlowersPanel({ flower, onChange }: { flower: FlowerColor; onChange: (flower: FlowerColor) => void }) {
  const t = useTranslations("editor");
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="sr-only">{t("flowers")}</legend>
      <p className="text-xs leading-relaxed text-muted-foreground">{t("flowersHint")}</p>
      <div className="grid grid-cols-3 gap-2">
        {FLOWER_COLORS.map((key) => {
          const { petal, edge } = flowerSwatch[key];
          return (
            <label key={key} className={cn(optionClass(flower === key), "p-3")}>
              <input type="radio" name="flower" value={key} checked={flower === key} onChange={() => onChange(key)} className="sr-only" />
              <svg aria-hidden="true" viewBox="-24 -24 48 48" className="size-11">
                {[0, 90, 180, 270].map((angle) => (
                  <ellipse key={angle} cx="0" cy="-11" rx="8.5" ry="11" fill={petal} stroke={edge} strokeWidth="1.2" transform={`rotate(${angle})`} />
                ))}
                <circle r="5.5" fill="#ffd75a" stroke="#e9a21f" strokeWidth="0.8" />
              </svg>
              <span className="leading-tight">{t(`flowerColors.${key}`)}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** The gift's look: a ready-made colour set to start from, then any colour of it changed. */
export function LookPanel({ variant, colors, templateVariant, onVariant, onColors }: LookPanelProps) {
  const t = useTranslations("editor");
  const look = lookColors(variant);

  const set = (key: keyof GiftColors, hex: string) =>
    // A blend needs a colour to blend from, so it brings the look's background along.
    onColors({ ...(key === "bg2" && !colors.bg ? { bg: look.bgHex } : {}), ...colors, [key]: hex });
  const clear = (...keys: (keyof GiftColors)[]) => {
    const next = { ...colors };
    for (const key of keys) delete next[key];
    onColors(next);
  };
  const lowContrast = contrastRatio(colors.text ?? look.text, colors.card ?? look.card) < MIN_CONTRAST;

  return (
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">{t("theme")}</legend>
        {([false, true] as const).map((dark) => (
          <div key={String(dark)} className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">{dark ? t("darkLooks") : t("lightLooks")}</p>
            <div className="grid grid-cols-3 gap-2">
              {THEME_VARIANTS.filter((v) => DARK_VARIANTS.has(v) === dark).map((v) => (
                <label key={v} className={cn(optionClass(variant === v), "p-2")}>
                  <input type="radio" name="variant" value={v} checked={variant === v} onChange={() => onVariant(v)} className="sr-only" />
                  <span aria-hidden="true" className="h-8 w-full rounded-lg ring-1 ring-black/5" style={{ background: variantSwatch[v] }} />
                  <span className="leading-tight">{t(`variants.${v}`)}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start rounded-full"
          disabled={variant === templateVariant && Object.keys(colors).length === 0}
          onClick={() => onVariant(templateVariant)}
        >
          <RotateCcw />
          {t("templateLook")}
        </Button>
      </fieldset>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">{t("yourColors")}</h3>
          <Button type="button" variant="ghost" size="sm" className="rounded-full" disabled={Object.keys(colors).length === 0} onClick={() => onColors({})}>
            <RotateCcw />
            {t("resetColors")}
          </Button>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{t("colorsHint")}</p>
        <ul className="flex flex-col gap-1.5">
          <ColorRow label={t("colorBg")} value={colors.bg} shown={colors.bg ?? look.bg} start={look.bgHex} onChange={(hex) => set("bg", hex)} onClear={() => clear("bg", "bg2")} />
          <ColorRow
            label={t("colorBg2")}
            value={colors.bg2}
            shown={colors.bg2}
            start={colors.bg ?? look.bgHex}
            empty={colors.bg ? t("noBlend") : undefined}
            onChange={(hex) => set("bg2", hex)}
            onClear={() => clear("bg2")}
          />
          <ColorRow label={t("colorCard")} value={colors.card} shown={colors.card ?? look.card} start={look.card} onChange={(hex) => set("card", hex)} onClear={() => clear("card")} />
          <ColorRow label={t("colorText")} value={colors.text} shown={colors.text ?? look.text} start={look.text} onChange={(hex) => set("text", hex)} onClear={() => clear("text")} />
          <ColorRow label={t("colorAccent")} value={colors.accent} shown={colors.accent ?? look.accent} start={look.accent} onChange={(hex) => set("accent", hex)} onClear={() => clear("accent")} />
        </ul>
        {lowContrast && (
          <p role="status" className="flex items-start gap-2 rounded-xl bg-secondary p-3 text-xs leading-relaxed">
            <TriangleAlert className="size-4 shrink-0 text-destructive" />
            {t("lowContrast")}
          </p>
        )}
      </div>
    </div>
  );
}

type ColorRowProps = {
  label: string;
  /** The creator's colour, if they set one. */
  value: string | undefined;
  /** What the swatch shows: the creator's colour or the look's own. Undefined: nothing set, shows a plus. */
  shown: string | undefined;
  /** Where the system colour picker opens when nothing is set yet. */
  start: string;
  /** Said in place of the colour while none is set. Default: that it comes from the look. */
  empty?: string;
  onChange: (hex: string) => void;
  onClear: () => void;
};

/** One colour of the gift. The swatch opens the system colour picker; the arrow goes back to the look's own. */
function ColorRow({ label, value, shown, start, empty, onChange, onClear }: ColorRowProps) {
  const t = useTranslations("editor");
  return (
    <li className="flex items-center gap-1">
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl p-1.5 hover:bg-secondary">
        <span
          aria-hidden="true"
          className={cn("relative grid size-9 shrink-0 place-items-center rounded-full border border-black/15 ring-1 ring-white/30", !shown && "border-dashed border-border")}
          style={{ background: shown }}
        >
          {!shown && <Plus className="size-4 text-muted-foreground" />}
          <input
            type="color"
            aria-label={label}
            value={value ?? start}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-semibold">{label}</span>
          <span className="truncate text-xs text-muted-foreground uppercase tabular-nums">{value ?? empty ?? t("lookColor")}</span>
        </span>
      </label>
      <Button type="button" variant="ghost" size="icon" className="size-8" aria-label={t("resetColor", { name: label })} disabled={!value} onClick={onClear}>
        <RotateCcw />
      </Button>
    </li>
  );
}

/** How the gift opens for the receiver. Picking one plays it. */
export function OpeningPanel({ opening, onChange, onPlay }: { opening: Opening; onChange: (opening: Opening) => void; onPlay: () => void }) {
  const t = useTranslations("editor");
  return (
    <div role="radiogroup" aria-label={t("opening")} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{t("openingHint")}</p>
        <Button type="button" variant="soft" size="sm" className="rounded-full" onClick={onPlay}>
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

"use client";

import { Flower2, Layers, Palette, Play, Settings2, Sticker as StickerIcon } from "lucide-react";
import type { EditableSectionType } from "@/features/gifts/schemas";
import { cn } from "@/lib/utils";

/** The groups of tools in the editor. */
export type Tab = "sections" | "stickers" | "flowers" | "look" | "opening" | "details";

export const CARD_TABS: Tab[] = ["sections", "stickers", "look", "opening", "details"];
// A scene template is an animation: it has its text and its flowers, and no
// stickers, looks or opening of its own.
export const SCENE_TABS: Tab[] = ["sections", "flowers", "details"];
/** A scene's text is its name and message pages, so only pages can be added. */
export const SCENE_SECTION_TYPES: EditableSectionType[] = ["message"];

const TAB_ICONS: Record<Tab, React.ComponentType<{ className?: string }>> = {
  sections: Layers,
  stickers: StickerIcon,
  flowers: Flower2,
  look: Palette,
  opening: Play,
  details: Settings2,
};

type Props = {
  tabs: Tab[];
  labels: Record<Tab, string>;
  /** The tab shown as chosen, or null when none is (the phone sheet is closed). */
  active: Tab | null;
  onPick: (tab: Tab) => void;
  /** What the row of tabs is, for screen readers. */
  label: string;
  className?: string;
};

/** The row of tool tabs: across the top of the side panel on wide screens, along the bottom on phones. */
export function ToolTabs({ tabs, labels, active, onPick, label, className }: Props) {
  return (
    <div role="tablist" aria-label={label} style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }} className={cn("grid gap-1", className)}>
      {tabs.map((name) => {
        const Icon = TAB_ICONS[name];
        const chosen = active === name;
        return (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={chosen}
            onClick={() => onPick(name)}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[11px] leading-tight font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
              chosen ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="size-5" />
            <span className="max-w-full truncate">{labels[name]}</span>
          </button>
        );
      })}
    </div>
  );
}

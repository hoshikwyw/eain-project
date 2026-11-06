"use client";

import { ArrowLeft, Eye, Loader2, Pencil, Play, Redo2, Save, Send, Undo2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { GiftStatusChip } from "@/components/gift/gift-status-chip";
import { LocaleToggle } from "@/components/settings/locale-toggle";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GiftStatus } from "@/types/database";

type Props = {
  /** The gift's name as typed so far. */
  title: string;
  /** Shown in place of an empty name, and as the name's tooltip: the word "Details". */
  detailsLabel: string;
  /** Pressing the name opens Details, where the gift is named. */
  onTitle: () => void;
  status: GiftStatus;
  /** The receiver has opened it at least once. */
  opened: boolean;
  history: { canUndo: boolean; canRedo: boolean; undo: () => void; redo: () => void };
  /** The short save status ("Saving", "Unsaved changes", "Saved"), or nothing. */
  note: { text: string; tone: string } | null;
  /** A scene template: its preview plays the animation, and there is no edit/preview switch. */
  scene: boolean;
  previewing: boolean;
  onPreview: () => void;
  onPlay: () => void;
  /** The save form: its action, what it sends, and what to do when the gift cannot be saved yet. */
  saveAction: (payload: FormData) => void;
  payloadJson: string;
  valid: boolean;
  onInvalid: () => void;
  saving: boolean;
  publishing: boolean;
  /** The gift is live: the button updates it instead of publishing it. */
  published: boolean;
  onPublish: () => void;
};

/**
 * The first row of the editor's bar. On wide screens it is one row: which
 * gift this is on the left, what can be done with it on the right. On
 * phones the two halves are a row each.
 */
export function EditorBar(p: Props) {
  const t = useTranslations("editor");
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 py-2 lg:h-16 lg:flex-nowrap lg:gap-x-4 lg:py-0">
      {/* Which gift this is. Its own row on phones, the left end of the bar on wide screens. */}
      <div className="flex min-w-0 basis-full items-center gap-2 lg:max-w-xs lg:basis-auto xl:max-w-sm">
        <Button asChild variant="ghost" size="icon" className="size-9 shrink-0" aria-label={t("back")}>
          <Link href="/dashboard/gifts">
            <ArrowLeft />
          </Link>
        </Button>
        <button
          type="button"
          title={p.detailsLabel}
          onClick={p.onTitle}
          className="min-w-0 cursor-pointer truncate rounded-lg font-display text-lg font-semibold outline-none hover:text-primary-ink focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          {p.title.trim() || p.detailsLabel}
        </button>
        <GiftStatusChip status={p.status} opened={p.opened} />
        <span className="ml-auto flex shrink-0 items-center gap-1 lg:hidden">
          <LocaleToggle />
          <ThemeToggle />
        </span>
      </div>

      {/* What can be done with it. */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
        <Button type="button" variant="ghost" size="icon" className="size-9" aria-label={t("undo")} disabled={!p.history.canUndo} onClick={p.history.undo}>
          <Undo2 />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="size-9" aria-label={t("redo")} disabled={!p.history.canRedo} onClick={p.history.redo}>
          <Redo2 />
        </Button>
        <p role="status" className={cn("min-w-0 flex-1 truncate text-sm", p.note?.tone)}>
          {p.note?.text}
        </p>
        <span className="flex shrink-0 items-center gap-1 max-lg:hidden">
          <LocaleToggle />
          <ThemeToggle />
        </span>
        {p.scene ? (
          // The card is only a summary, so "preview" plays the animation itself.
          <Button type="button" variant="ghost" size="sm" onClick={p.onPlay}>
            <Play />
            <span className="max-sm:sr-only">{t("playScene")}</span>
          </Button>
        ) : (
          <Button type="button" variant="ghost" size="sm" aria-pressed={p.previewing} onClick={p.onPreview}>
            {p.previewing ? <Pencil /> : <Eye />}
            <span className="max-sm:sr-only">{p.previewing ? t("backToEdit") : t("preview")}</span>
          </Button>
        )}
        <form
          action={p.saveAction}
          onSubmit={(e) => {
            if (p.valid) return;
            e.preventDefault();
            p.onInvalid();
          }}
        >
          <input type="hidden" name="payload" value={p.payloadJson} />
          <Button type="submit" variant="secondary" size="sm" disabled={p.saving || p.publishing} aria-busy={p.saving} className={cn(!p.publishing && "disabled:opacity-100")}>
            {p.saving ? <Loader2 className="animate-spin" /> : <Save />}
            <span className="max-sm:sr-only">{p.saving ? t("saving") : t("save")}</span>
          </Button>
        </form>
        <Button type="button" size="sm" className="px-4" onClick={p.onPublish} disabled={p.publishing} aria-busy={p.publishing}>
          {p.publishing ? <Loader2 className="animate-spin" /> : <Send />}
          {p.publishing ? (
            t("publishing")
          ) : (
            <>
              {/* The long label only where the bar has room for it and for the save status. */}
              <span className="xl:hidden">{p.published ? t("republishShort") : t("publishShort")}</span>
              <span className="max-xl:hidden">{p.published ? t("republish") : t("publish")}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

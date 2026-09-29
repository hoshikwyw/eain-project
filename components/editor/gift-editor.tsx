"use client";

import { BookOpen, ChevronDown, ChevronUp, Eye, Gift, Loader2, Mail, Play, Plus, Save, ScrollText, Send, Sparkles, Theater, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { GiftOpening, openingDuration, type OpeningStage } from "@/components/gift/gift-opening";
import { GiftView } from "@/components/gift/gift-view";
import { DARK_VARIANTS, variantSwatch } from "@/components/gift/palettes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveAndPublishGift, saveGift } from "@/features/gifts/actions";
import {
  MAX_SECTIONS,
  OPENINGS,
  THEME_VARIANTS,
  type EditableSectionType,
  type EditorPayload,
  type MediaItem,
  type Opening,
  type SaveGiftState,
  type Section,
  type ThemeVariant,
} from "@/features/gifts/schemas";
import type { TemplateStyle } from "@/features/gifts/templates";
import { cn } from "@/lib/utils";
import { SectionFields } from "./section-fields";

type Props = {
  giftId: string;
  status: string;
  title: string;
  recipientName: string;
  variant: ThemeVariant;
  opening: Opening;
  sections: Section[];
  media: MediaItem[];
  style: TemplateStyle;
  senderName: string;
  publishError?: boolean;
};

const OPENING_ICONS: Record<Opening, React.ComponentType<{ className?: string }>> = {
  envelope: Mail,
  book: BookOpen,
  giftbox: Gift,
  curtain: Theater,
  scroll: ScrollText,
  simple: Sparkles,
};

const SECTION_TYPES: EditableSectionType[] = ["text", "message", "image", "photo_grid", "timeline", "quote", "question", "final_message"];

function emptySection(type: EditableSectionType): Section {
  const id = crypto.randomUUID();
  switch (type) {
    case "question":
      return {
        id,
        type,
        content: {
          questionId: crypto.randomUUID(),
          kind: "choice",
          prompt: "",
          required: false,
          options: [
            { id: crypto.randomUUID(), label: "" },
            { id: crypto.randomUUID(), label: "" },
          ],
        },
      };
    case "text":
      return { id, type, content: { heading: "", subheading: "" } };
    case "message":
      return { id, type, content: { text: "" } };
    case "image":
      return { id, type, content: { mediaId: null, caption: "" } };
    case "photo_grid":
      return { id, type, content: { mediaIds: [], caption: "" } };
    case "timeline":
      return { id, type, content: { items: [{ date: "", title: "", text: "" }] } };
    case "quote":
      return { id, type, content: { text: "", attribution: "" } };
    case "final_message":
      return { id, type, content: { text: "", signature: "" } };
  }
}

export function GiftEditor(props: Props) {
  const t = useTranslations("editor");
  const tGift = useTranslations("gift");
  const [title, setTitle] = useState(props.title);
  const [recipientName, setRecipientName] = useState(props.recipientName);
  const [variant, setVariant] = useState<ThemeVariant>(props.variant);
  const [opening, setOpening] = useState<Opening>(props.opening);
  const [openingPreview, setOpeningPreview] = useState<OpeningStage | null>(null);
  const [sections, setSections] = useState<Section[]>(props.sections);
  const [media, setMedia] = useState<MediaItem[]>(props.media);
  const [showPreview, setShowPreview] = useState(false);
  const [adding, setAdding] = useState(false);

  const payload = useMemo<EditorPayload>(
    () => ({ title, recipientName, variant, opening, sections }),
    [title, recipientName, variant, opening, sections],
  );
  const payloadJson = JSON.stringify(payload);

  // What the server last confirmed as saved, to show unsaved changes.
  const [lastSaved, setLastSaved] = useState(() =>
    JSON.stringify({
      title: props.title,
      recipientName: props.recipientName,
      variant: props.variant,
      opening: props.opening,
      sections: props.sections,
    }),
  );
  const dirty = payloadJson !== lastSaved;

  const [state, formAction, saving] = useActionState<SaveGiftState, FormData>(async (prev, fd) => {
    const result = await saveGift(props.giftId, prev, fd);
    if (result.status === "saved") setLastSaved(String(fd.get("payload")));
    return result;
  }, {});

  // Publish always saves the current editor content first, so nothing typed is lost.
  const [publishing, startPublish] = useTransition();
  const [publishState, setPublishState] = useState<SaveGiftState["status"]>();
  const publish = () =>
    startPublish(async () => {
      setPublishState(undefined);
      const fd = new FormData();
      fd.set("payload", payloadJson);
      const result = await saveAndPublishGift(props.giftId, fd);
      if (result) setPublishState(result.status);
    });

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  // Opening preview: show the closed gift for a moment, play it, then close.
  useEffect(() => {
    if (!openingPreview) return;
    const timer =
      openingPreview === "closed"
        ? window.setTimeout(() => setOpeningPreview("opening"), 700)
        : window.setTimeout(() => setOpeningPreview(null), openingDuration(opening) + 300);
    return () => window.clearTimeout(timer);
  }, [openingPreview, opening]);

  const mediaMap = useMemo(() => Object.fromEntries(media.map((m) => [m.id, m])), [media]);

  const updateSection = (next: Section) => setSections((s) => s.map((sec) => (sec.id === next.id ? next : sec)));
  const removeSection = (id: string) => setSections((s) => s.filter((sec) => sec.id !== id));
  const move = (index: number, dir: -1 | 1) =>
    setSections((s) => {
      const target = index + dir;
      if (target < 0 || target >= s.length) return s;
      const copy = [...s];
      [copy[index], copy[target]] = [copy[target]!, copy[index]!];
      return copy;
    });
  const addSection = (type: EditableSectionType) => {
    setSections((s) => (s.length >= MAX_SECTIONS ? s : [...s, emptySection(type)]));
    setAdding(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,460px)_1fr]">
      <form action={formAction} className={cn("flex flex-col gap-6", showPreview && "hidden lg:flex")}>
        <input type="hidden" name="payload" value={JSON.stringify(payload)} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">{t("title")}</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
            <p className="text-xs text-muted-foreground">{t("titleHint")}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="recipientName">{t("recipientName")}</Label>
            <Input
              id="recipientName"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              maxLength={80}
              placeholder={t("recipientPlaceholder")}
            />
          </div>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-semibold">{t("theme")}</legend>
          {([false, true] as const).map((dark) => (
            <div key={String(dark)} className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">{dark ? t("darkLooks") : t("lightLooks")}</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {THEME_VARIANTS.filter((v) => DARK_VARIANTS.has(v) === dark).map((v) => (
                  <label
                    key={v}
                    className={cn(
                      "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border p-2 text-center text-xs font-semibold transition-colors",
                      variant === v ? "border-primary bg-accent text-accent-foreground ring-1 ring-primary" : "border-border hover:bg-secondary",
                    )}
                  >
                    <input type="radio" name="variant" value={v} checked={variant === v} onChange={() => setVariant(v)} className="sr-only" />
                    <span aria-hidden="true" className="h-8 w-full rounded-lg ring-1 ring-black/5" style={{ background: variantSwatch[v] }} />
                    <span className="leading-tight">{t(`variants.${v}`)}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </fieldset>

        <div role="radiogroup" aria-labelledby="opening-label" className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 id="opening-label" className="text-sm font-semibold">
                {t("opening")}
              </h2>
              <p className="text-xs text-muted-foreground">{t("openingHint")}</p>
            </div>
            <Button type="button" variant="soft" size="sm" onClick={() => setOpeningPreview("closed")}>
              <Play />
              {t("playOpening")}
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {OPENINGS.map((o) => {
              const Icon = OPENING_ICONS[o];
              return (
                <label
                  key={o}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border p-3 text-center text-xs font-semibold transition-colors",
                    opening === o ? "border-primary bg-accent text-accent-foreground ring-1 ring-primary" : "border-border hover:bg-secondary",
                  )}
                >
                  <input
                    type="radio"
                    name="opening"
                    value={o}
                    checked={opening === o}
                    onChange={() => {
                      setOpening(o);
                      setOpeningPreview("closed");
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

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">{t("sections")}</h2>
          <ol className="flex flex-col gap-3">
            {sections.map((section, index) => (
              <li key={section.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                    {t(`sectionTypes.${section.type}`)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" className="size-8" aria-label={t("moveUp")} disabled={index === 0} onClick={() => move(index, -1)}>
                      <ChevronUp />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="size-8" aria-label={t("moveDown")} disabled={index === sections.length - 1} onClick={() => move(index, 1)}>
                      <ChevronDown />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="size-8 text-destructive" aria-label={t("removeSection")} disabled={sections.length <= 1} onClick={() => removeSection(section.id)}>
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <SectionFields section={section} onChange={updateSection} giftId={props.giftId} media={media} onMediaChange={setMedia} />
              </li>
            ))}
          </ol>

          {adding ? (
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-dashed border-border p-3 sm:grid-cols-3">
              {SECTION_TYPES.map((type) => (
                <Button key={type} type="button" variant="secondary" size="sm" onClick={() => addSection(type)}>
                  {t(`sectionTypes.${type}`)}
                </Button>
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
                {t("cancel")}
              </Button>
            </div>
          ) : (
            <Button type="button" variant="secondary" className="self-start" disabled={sections.length >= MAX_SECTIONS} onClick={() => setAdding(true)}>
              <Plus />
              {t("addSection")}
            </Button>
          )}
          <p className="text-xs text-muted-foreground">{t("sectionCount", { count: sections.length, max: MAX_SECTIONS })}</p>
        </div>

        <div className="sticky bottom-20 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card/95 p-3 backdrop-blur md:bottom-4">
          <Button type="submit" disabled={saving} aria-busy={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {saving ? t("saving") : t("save")}
          </Button>
          <Button type="button" variant="secondary" className="lg:hidden" onClick={() => setShowPreview(true)}>
            <Eye />
            {t("preview")}
          </Button>
          {dirty && !saving && <span className="text-sm text-muted-foreground">{t("unsaved")}</span>}
          {!dirty && state.status === "saved" && <span className="text-sm text-success">{t("saved")}</span>}
          {state.status === "invalid" && <span className="text-sm text-destructive">{t("invalid")}</span>}
          {state.status === "error" && <span className="text-sm text-destructive">{t("error")}</span>}
        </div>
      </form>

      <div className={cn("flex flex-col gap-4", !showPreview && "hidden lg:flex")}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">{t("livePreview")}</h2>
          <Button type="button" variant="ghost" size="sm" className="lg:hidden" onClick={() => setShowPreview(false)}>
            {t("backToEdit")}
          </Button>
        </div>
        <div className="lg:sticky lg:top-20">
          <GiftView
            sections={sections}
            media={mediaMap}
            variant={variant}
            style={props.style}
            recipientName={recipientName}
            senderName={props.senderName}
            compact
            placeholders
          />

          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{props.status === "published" ? t("publishedHint") : t("publishHint")}</p>
            {(props.publishError || publishState === "error") && <p className="text-sm text-destructive">{t("publishError")}</p>}
            {publishState === "invalid" && <p className="text-sm text-destructive">{t("invalid")}</p>}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={props.status === "published" ? "secondary" : "primary"}
                onClick={publish}
                disabled={publishing || saving}
                aria-busy={publishing}
              >
                {publishing ? <Loader2 className="animate-spin" /> : <Send />}
                {publishing ? t("publishing") : props.status === "published" ? t("republish") : t("publish")}
              </Button>
              <Button asChild variant="ghost">
                <Link href={`/dashboard/gifts/${props.giftId}`}>{t("manage")}</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t("publishSaves")}</p>
          </div>
        </div>
      </div>

      {openingPreview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("openingPreview")}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm"
          onClick={() => setOpeningPreview(null)}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4"
            aria-label={t("closePreview")}
            onClick={() => setOpeningPreview(null)}
          >
            <X />
          </Button>
          <GiftOpening
            key={opening}
            kind={opening}
            variant={variant}
            stage={openingPreview}
            label={recipientName ? tGift("forName", { name: recipientName }) : tGift("forYou")}
          />
        </div>
      )}
    </div>
  );
}

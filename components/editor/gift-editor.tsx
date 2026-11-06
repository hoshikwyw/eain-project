"use client";

import { ArrowLeft, Eye, Flower2, Layers, Loader2, Palette, Pencil, Play, Redo2, Save, Send, Settings2, Sticker as StickerIcon, Undo2, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { startTransition, useActionState, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { GiftOpening, openingDuration, type OpeningStage } from "@/components/gift/gift-opening";
import { GiftStatusChip } from "@/components/gift/gift-status-chip";
import type { GiftEdit } from "@/components/gift/gift-renderer";
import { STAGE_MAX_WIDTH } from "@/components/gift/gift-stage";
import { GiftView } from "@/components/gift/gift-view";
import { SceneFrame } from "@/components/scene/scene-frame";
import { LocaleToggle } from "@/components/settings/locale-toggle";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { Button } from "@/components/ui/button";
import { saveAndPublishGift, saveGift } from "@/features/gifts/actions";
import { defaultScene, sceneConfig, type GiftScene } from "@/features/gifts/scene";
import {
  MAX_SECTIONS,
  MAX_STICKERS,
  PHOTO_SIZE_MAX,
  sectionSchema,
  type EditableSectionType,
  type EditorPayload,
  type GiftColors,
  type MediaItem,
  type Opening,
  type SaveGiftState,
  type Section,
  type Sticker,
  type ThemeVariant,
} from "@/features/gifts/schemas";
import { dropStickerAnchor, insertStickerAnchor, swapStickerAnchors } from "@/features/gifts/sections";
import type { StickerKind } from "@/features/gifts/stickers";
import type { TemplateStyle } from "@/features/gifts/templates";
import { cn } from "@/lib/utils";
import type { GiftStatus } from "@/types/database";
import {
  sectionSelector,
  stickerAt,
  stickerContainer,
  stickerContainerSelector,
  stickerOnScreen,
  textSelector,
  trackPointer,
  type TextTarget,
} from "./canvas-geometry";
import { EditableText } from "./editable-text";
import { DetailsPanel, FlowersPanel, LookPanel, OpeningPanel, SectionsPanel, StickersPanel } from "./editor-panels";
import { PhotoResizeHandle } from "./photo-resize-handle";
import { SectionToolbar } from "./section-toolbar";
import { StickerControls } from "./sticker-controls";
import { TEXT_FIELDS, textStyle, withText, withoutTextStyle, withTextStyle } from "./text-fields";
import { TextResizeHandle } from "./text-resize-handle";
import { TextToolbar } from "./text-toolbar";
import { useHistory } from "./use-history";

type Props = {
  giftId: string;
  status: GiftStatus;
  /** The receiver has opened it at least once. */
  opened: boolean;
  title: string;
  recipientName: string;
  variant: ThemeVariant;
  opening: Opening;
  colors: GiftColors;
  stickers: Sticker[];
  /** Only for scene templates: what was chosen for the animation. */
  scene?: GiftScene;
  sections: Section[];
  media: MediaItem[];
  style: TemplateStyle;
  senderName: string;
  publishError?: boolean;
};

type Tab = "sections" | "stickers" | "flowers" | "look" | "opening" | "details";
const CARD_TABS: Tab[] = ["sections", "stickers", "look", "opening", "details"];
// A scene template is an animation: it has its text and its flowers, and no
// stickers, looks or opening of its own.
const SCENE_TABS: Tab[] = ["sections", "flowers", "details"];
/** A scene's text is its name and message pages, so only pages can be added. */
const SCENE_SECTION_TYPES: EditableSectionType[] = ["message"];

/** A draft saves itself this long after the last change. */
const AUTOSAVE_MS = 3000;

const TAB_ICONS: Record<Tab, React.ComponentType<{ className?: string }>> = {
  sections: Layers,
  stickers: StickerIcon,
  flowers: Flower2,
  look: Palette,
  opening: Play,
  details: Settings2,
};

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

/**
 * The gift editor. The gift itself is the workspace: texts are typed in
 * place and sections are picked by clicking them. Tools live in a side panel
 * on wide screens and in a bottom sheet on phones.
 */
export function GiftEditor(props: Props) {
  const t = useTranslations("editor");
  const tFields = useTranslations("editor.fields");
  const tGift = useTranslations("gift");
  const [title, setTitle] = useState(props.title);
  const [recipientName, setRecipientName] = useState(props.recipientName);
  const [variant, setVariant] = useState<ThemeVariant>(props.variant);
  const [opening, setOpening] = useState<Opening>(props.opening);
  const [openingPreview, setOpeningPreview] = useState<OpeningStage | null>(null);
  const [colors, setColors] = useState<GiftColors>(props.colors);
  const [stickers, setStickers] = useState<Sticker[]>(props.stickers);
  /** Set for scene templates. The gift shown here is then the animation's summary card. */
  const sceneKind = props.style.scene;
  const [scene, setScene] = useState<GiftScene>(props.scene ?? defaultScene);
  const [playing, setPlaying] = useState(false);
  const [sections, setSections] = useState<Section[]>(props.sections);
  const [media, setMedia] = useState<MediaItem[]>(props.media);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  /** The text being typed into, which is the one the resize dot belongs to. */
  const [activeText, setActiveText] = useState<TextTarget | null>(null);
  /** True for the instant after a sticker or photo drag, so the click that ends it picks nothing. */
  const justDragged = useRef(false);
  const [tab, setTab] = useState<Tab>("sections");
  /** Phones only: whether the tool sheet is up. Wide screens always show the panel. */
  const [sheetOpen, setSheetOpen] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  /** Turned on by a save that was stopped, so nothing is flagged while the user is still writing. */
  const [showInvalid, setShowInvalid] = useState(false);
  const [scrollTo, setScrollTo] = useState<{ id: string; block: ScrollLogicalPosition } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const payload = useMemo<EditorPayload>(
    () => ({ title, recipientName, variant, opening, colors, stickers, ...(sceneKind && { scene }), sections }),
    [title, recipientName, variant, opening, colors, stickers, sceneKind, scene, sections],
  );
  const payloadJson = JSON.stringify(payload);

  // What the server last confirmed as saved, to show unsaved changes.
  const [lastSaved, setLastSaved] = useState(() =>
    JSON.stringify({
      title: props.title,
      recipientName: props.recipientName,
      variant: props.variant,
      opening: props.opening,
      colors: props.colors,
      stickers: props.stickers,
      ...(props.style.scene && { scene: props.scene ?? defaultScene }),
      sections: props.sections,
    }),
  );
  const dirty = payloadJson !== lastSaved;

  const invalidIds = useMemo(
    () => new Set(sections.filter((s) => !sectionSchema.safeParse(s).success).map((s) => s.id)),
    [sections],
  );
  const titleInvalid = title.trim() === "";
  const valid = invalidIds.size === 0 && !titleInvalid;

  // Undo and redo cover everything that is saved: texts, styles, colours, stickers and details.
  const history = useHistory(payload, (snapshot) => {
    setTitle(snapshot.title);
    setRecipientName(snapshot.recipientName);
    setVariant(snapshot.variant);
    setOpening(snapshot.opening);
    setColors(snapshot.colors);
    setStickers(snapshot.stickers);
    if (snapshot.scene) setScene(snapshot.scene);
    setSections(snapshot.sections);
  });

  /** The content of the last save that failed, so autosave does not keep retrying the same thing. */
  const [failedSave, setFailedSave] = useState<string | null>(null);
  const [state, formAction, saving] = useActionState<SaveGiftState, FormData>(async (prev, fd) => {
    const sent = String(fd.get("payload"));
    const result = await saveGift(props.giftId, prev, fd);
    if (result.status === "saved") setLastSaved(sent);
    setFailedSave(result.status === "saved" ? null : sent);
    return result;
  }, {});

  // Publish always saves the current editor content first, so nothing typed is lost.
  const [publishing, startPublish] = useTransition();
  const [publishState, setPublishState] = useState<SaveGiftState["status"]>();

  // A draft saves itself once the creator pauses. A published gift does not:
  // a save there is live for the receiver at once, so it stays a deliberate step.
  const autosave = props.status !== "published";
  useEffect(() => {
    if (!autosave || !dirty || !valid || saving || publishing || payloadJson === failedSave) return;
    const timer = window.setTimeout(() => {
      const fd = new FormData();
      fd.set("payload", payloadJson);
      startTransition(() => formAction(fd));
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [autosave, dirty, valid, saving, publishing, payloadJson, failedSave, formAction]);

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

  useEffect(() => {
    if (!scrollTo) return;
    canvasRef.current?.querySelector(sectionSelector(scrollTo.id))?.scrollIntoView({ block: scrollTo.block, behavior: "smooth" });
  }, [scrollTo]);

  // Keys for the selected sticker: Delete removes it, arrows nudge it.
  useEffect(() => {
    if (!selectedSticker) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target;
      if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        setStickers((all) => all.filter((s) => s.id !== selectedSticker));
        setSelectedSticker(null);
      } else if (e.key === "Escape") {
        setSelectedSticker(null);
      } else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        const dx = e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0;
        const dy = e.key === "ArrowDown" ? step : e.key === "ArrowUp" ? -step : 0;
        setStickers((all) =>
          all.map((s) =>
            s.id === selectedSticker ? { ...s, x: Math.min(Math.max(s.x + dx, -20), 120), y: Math.min(Math.max(s.y + dy, -50), 150) } : s,
          ),
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedSticker]);

  const mediaMap = useMemo(() => Object.fromEntries(media.map((m) => [m.id, m])), [media]);

  // Sections ------------------------------------------------------------------

  const updateSection = (next: Section) => setSections((s) => s.map((sec) => (sec.id === next.id ? next : sec)));
  const setText = useCallback(
    (id: string, field: string, value: string, index?: number) =>
      setSections((all) => all.map((s) => (s.id === id ? withText(s, field, value, index) : s))),
    [],
  );
  const removeSection = (id: string) => {
    const index = sections.findIndex((s) => s.id === id);
    if (index < 0 || sections.length <= 1) return;
    setSections(sections.filter((s) => s.id !== id));
    setStickers((all) => dropStickerAnchor(all, index));
    if (selectedId === id) setSelectedId(null);
  };
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    const copy = [...sections];
    [copy[index], copy[target]] = [copy[target]!, copy[index]!];
    setSections(copy);
    setStickers((all) => swapStickerAnchors(all, index, target));
    setScrollTo({ id: copy[target]!.id, block: "nearest" });
  };
  const addSection = (type: EditableSectionType) => {
    if (sections.length >= MAX_SECTIONS) return;
    const section = emptySection(type);
    setSections([...sections, section]);
    setSelectedId(section.id);
    setScrollTo({ id: section.id, block: "center" });
  };

  /** Copies a section to just below itself. A question gets ids of its own, so answers never mix. */
  const duplicateSection = (id: string) => {
    const index = sections.findIndex((s) => s.id === id);
    const source = sections[index];
    if (!source || sections.length >= MAX_SECTIONS) return;
    const copy: Section =
      source.type === "question"
        ? {
            ...source,
            id: crypto.randomUUID(),
            content: {
              ...source.content,
              questionId: crypto.randomUUID(),
              options: source.content.options.map((o) => ({ ...o, id: crypto.randomUUID() })),
            },
          }
        : { ...source, id: crypto.randomUUID() };
    setSections([...sections.slice(0, index + 1), copy, ...sections.slice(index + 1)]);
    setStickers((all) => insertStickerAnchor(all, index + 1));
    setSelectedId(copy.id);
    setScrollTo({ id: copy.id, block: "center" });
  };

  /** Picks a section from the panel and brings it into view on the gift. */
  const selectFromPanel = (id: string | null) => {
    setSelectedId(id);
    if (id) setScrollTo({ id, block: "center" });
  };
  const openTab = (next: Tab) => {
    setTab(next);
    setSheetOpen(true);
  };

  // Stickers ------------------------------------------------------------------

  const patchSticker = (id: string, next: (s: Sticker) => Sticker) => setStickers((all) => all.map((s) => (s.id === id ? next(s) : s)));

  const selectSticker = (id: string) => {
    setSelectedSticker(id);
    setSelectedId(null);
    setActiveText(null);
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && canvasRef.current?.contains(focused)) focused.blur();
  };

  /** Puts a new sticker in the middle of the part of the gift that is on screen. */
  const addSticker = (kind: StickerKind) => {
    const canvas = canvasRef.current;
    if (!canvas || stickers.length >= MAX_STICKERS) return;
    const frame = canvas.getBoundingClientRect();
    const top = Math.max(frame.top, 72);
    const bottom = Math.min(frame.bottom, window.innerHeight - 72);
    // Each new one lands a little off the last, so they do not hide each other.
    const offset = ((stickers.length % 5) - 2) * 18;
    const sticker = stickerAt(
      canvas,
      sections,
      { id: crypto.randomUUID(), kind, rotate: 0 },
      {
        cx: frame.left + frame.width / 2 + offset,
        cy: (bottom > top ? (top + bottom) / 2 : frame.top + frame.height / 2) + offset,
        size: frame.width * 0.16,
      },
    );
    setStickers([...stickers, sticker]);
    selectSticker(sticker.id);
    setSheetOpen(false);
  };

  /** Drags a sticker with the pointer. On release it settles on the section under it. */
  const dragSticker = (e: React.PointerEvent, id: string) => {
    const canvas = canvasRef.current;
    const sticker = stickers.find((s) => s.id === id);
    if (!canvas || !sticker) return;
    const start = stickerOnScreen(canvas, sections, sticker);
    const box = stickerContainer(canvas, sections, sticker)?.getBoundingClientRect();
    if (!start || !box) return;
    e.preventDefault();
    selectSticker(id);
    const origin = { x: e.clientX, y: e.clientY };
    let moved: { dx: number; dy: number } | null = null;
    trackPointer(
      (ev) => {
        const dx = ev.clientX - origin.x;
        const dy = ev.clientY - origin.y;
        if (!moved && Math.hypot(dx, dy) < 4) return;
        moved = { dx, dy };
        patchSticker(id, (s) => ({ ...s, x: sticker.x + (dx / box.width) * 100, y: sticker.y + (dy / box.height) * 100 }));
      },
      () => {
        if (!moved) return;
        const { dx, dy } = moved;
        patchSticker(id, (s) => stickerAt(canvas, sections, s, { cx: start.cx + dx, cy: start.cy + dy, size: start.size }));
        justDragged.current = true;
        window.setTimeout(() => {
          justDragged.current = false;
        }, 0);
      },
    );
  };

  const duplicateSticker = (sticker: Sticker) => {
    if (stickers.length >= MAX_STICKERS) return;
    const copy = { ...sticker, id: crypto.randomUUID(), x: Math.min(sticker.x + 5, 120), y: Math.min(sticker.y + 5, 150) };
    setStickers([...stickers, copy]);
    setSelectedSticker(copy.id);
  };

  // Clicks and focus on the gift pick the section they land in.
  const pickOnCanvas = (target: EventTarget, deselect: boolean) => {
    if (justDragged.current || !(target instanceof Element)) return;
    if (target.closest("[data-canvas-ui]") || target.closest("[data-sticker-id]")) return;
    const id = target.closest<HTMLElement>("[data-section-id]")?.dataset.sectionId ?? null;
    if (id) {
      setSelectedId(id);
      setSelectedSticker(null);
      setTab("sections");
    } else if (deselect) {
      setSelectedId(null);
      setSelectedSticker(null);
      setActiveText(null);
    }
  };

  const onCanvasPointerDown = (e: React.PointerEvent) => {
    if (!(e.target instanceof Element) || e.target.closest("[data-canvas-ui]")) return;
    const id = e.target.closest<HTMLElement>("[data-sticker-id]")?.dataset.stickerId;
    if (id) dragSticker(e, id);
  };

  const onCanvasFocus = (e: React.FocusEvent) => {
    pickOnCanvas(e.target, false);
    const el = e.target instanceof HTMLElement && e.target.matches(".editable-text") ? e.target : null;
    const sectionId = el?.closest<HTMLElement>("[data-section-id]")?.dataset.sectionId;
    const field = el?.dataset.textField;
    if (!el || !sectionId || !field) return;
    setActiveText({ sectionId, field, index: el.dataset.textIndex === undefined ? undefined : Number(el.dataset.textIndex) });
  };

  // The text's tools stay while focus is on them, and go when it leaves for somewhere else.
  const onCanvasBlur = (e: React.FocusEvent) => {
    if (!(e.relatedTarget instanceof Element && e.relatedTarget.closest("[data-canvas-ui]"))) setActiveText(null);
  };
  const onTextToolsBlur = (e: React.FocusEvent) => {
    const next = e.relatedTarget;
    if (!(next instanceof Element && (next.closest("[data-canvas-ui]") || canvasRef.current?.contains(next)))) setActiveText(null);
  };

  /** Changes the style of the text being edited. A value of undefined goes back to the design's own. */
  const styleActiveText = (change: (section: Section, field: string) => Section) => {
    if (!activeText) return;
    setSections((all) => all.map((s) => (s.id === activeText.sectionId ? change(s, activeText.field) : s)));
  };

  // Saving --------------------------------------------------------------------

  /** Points at what stops a save: the title, or the first incomplete section. */
  const revealInvalid = () => {
    setShowInvalid(true);
    setPreviewing(false);
    if (titleInvalid) return openTab("details");
    const first = sections.find((s) => invalidIds.has(s.id));
    if (first) {
      setTab("sections");
      selectFromPanel(first.id);
    }
  };

  const publish = () => {
    if (!valid) return revealInvalid();
    startPublish(async () => {
      setPublishState(undefined);
      const fd = new FormData();
      fd.set("payload", payloadJson);
      const result = await saveAndPublishGift(props.giftId, fd);
      if (result) setPublishState(result.status);
    });
  };

  /** Saves now, for the keyboard. The Save button submits its form to the same action. */
  const saveNow = () => {
    if (!valid) return revealInvalid();
    if (saving || publishing) return;
    const fd = new FormData();
    fd.set("payload", payloadJson);
    startTransition(() => formAction(fd));
  };

  // Ctrl or Cmd with Z, Shift+Z, Y and S. Undo is the editor's own everywhere,
  // texts included, so one history covers typing, styling and moving.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "z" || key === "y") {
        e.preventDefault();
        if (key === "y" || e.shiftKey) history.redo();
        else history.undo();
      } else if (key === "s") {
        e.preventDefault();
        saveNow();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // What stops a save is spelled out in full; the rest is a short status.
  const problem =
    showInvalid && !valid
      ? t("invalid")
      : props.publishError || publishState === "error"
        ? t("publishError")
        : state.status === "error" && dirty
          ? t("error")
          : null;
  const status = problem
    ? null
    : saving
      ? { text: t("saving"), tone: "text-muted-foreground" }
      : dirty
        ? { text: t("unsaved"), tone: "text-muted-foreground" }
        : state.status === "saved"
          ? { text: t("saved"), tone: "text-success" }
          : null;

  // Canvas --------------------------------------------------------------------

  const senderName = props.senderName;
  const edit = useMemo<GiftEdit>(
    () => ({
      selectedId,
      invalidIds: showInvalid ? invalidIds : undefined,
      text: ({ section, field, index, value }) => {
        const meta = TEXT_FIELDS[`${section.type}.${field}`];
        if (!meta) return value;
        return (
          <EditableText
            value={value}
            max={meta.max}
            multiline={meta.multiline}
            // An empty signature falls back to the sender's name, so that is what shows.
            placeholder={(field === "signature" && senderName) || tFields(meta.label)}
            field={field}
            index={index}
            onChange={(next) => setText(section.id, field, next, index)}
          />
        );
      },
    }),
    [selectedId, showInvalid, invalidIds, senderName, tFields, setText],
  );

  const selectedIndex = sections.findIndex((s) => s.id === selectedId);
  const selectedSection = selectedIndex >= 0 ? sections[selectedIndex] : undefined;
  /** The selected section when it holds a photo or photos, which can then be resized on the gift. */
  const selectedPhoto = selectedSection && (selectedSection.type === "image" || selectedSection.type === "photo_grid") ? selectedSection : undefined;
  const sticker = stickers.find((s) => s.id === selectedSticker);
  const stickerBox = sticker && stickerContainerSelector(sections, sticker);
  const activeSection = activeText ? sections.find((s) => s.id === activeText.sectionId) : undefined;
  const tabs = sceneKind ? SCENE_TABS : CARD_TABS;
  const tabColumns = { gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` };
  const tabLabel: Record<Tab, string> = {
    sections: t("sections"),
    stickers: t("stickers"),
    flowers: t("flowers"),
    look: t("theme"),
    opening: t("opening"),
    details: t("details"),
  };
  const published = props.status === "published";

  return (
    <div className="flex flex-1 flex-col">
      {/* The editor's own bar, across the whole screen; its content lines up with the page below. */}
      <div className="sticky top-0 z-30 flex flex-col px-[max(1rem,calc(50%-35rem))]">
        {/* The glass is a layer of its own, so the text tools' popups can blur the gift behind them. */}
        <div aria-hidden="true" className="glass-bar absolute inset-0 -z-10 border-b" />
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
              title={tabLabel.details}
              onClick={() => openTab("details")}
              className="min-w-0 cursor-pointer truncate rounded-lg font-display text-lg font-semibold outline-none hover:text-primary-ink focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              {title.trim() || tabLabel.details}
            </button>
            <GiftStatusChip status={props.status} opened={props.opened} />
            <span className="ml-auto flex shrink-0 items-center gap-1 lg:hidden">
              <LocaleToggle />
              <ThemeToggle />
            </span>
          </div>

          {/* What can be done with it. */}
          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
            <Button type="button" variant="ghost" size="icon" className="size-9" aria-label={t("undo")} disabled={!history.canUndo} onClick={history.undo}>
              <Undo2 />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="size-9" aria-label={t("redo")} disabled={!history.canRedo} onClick={history.redo}>
              <Redo2 />
            </Button>
            <p role="status" className={cn("min-w-0 flex-1 truncate text-sm", status?.tone)}>
              {status?.text}
            </p>
            <span className="flex shrink-0 items-center gap-1 max-lg:hidden">
              <LocaleToggle />
              <ThemeToggle />
            </span>
            {sceneKind ? (
              // The card is only a summary, so "preview" plays the animation itself.
              <Button type="button" variant="ghost" size="sm" onClick={() => setPlaying(true)}>
                <Play />
                <span className="max-sm:sr-only">{t("playScene")}</span>
              </Button>
            ) : (
              <Button type="button" variant="ghost" size="sm" aria-pressed={previewing} onClick={() => setPreviewing((v) => !v)}>
                {previewing ? <Pencil /> : <Eye />}
                <span className="max-sm:sr-only">{previewing ? t("backToEdit") : t("preview")}</span>
              </Button>
            )}
            <form
              action={formAction}
              onSubmit={(e) => {
                if (valid) return;
                e.preventDefault();
                revealInvalid();
              }}
            >
              <input type="hidden" name="payload" value={payloadJson} />
              <Button type="submit" variant="secondary" size="sm" disabled={saving || publishing} aria-busy={saving}>
                {saving ? <Loader2 className="animate-spin" /> : <Save />}
                <span className="max-sm:sr-only">{saving ? t("saving") : t("save")}</span>
              </Button>
            </form>
            <Button type="button" size="sm" className="px-4" onClick={publish} disabled={publishing || saving} aria-busy={publishing}>
              {publishing ? <Loader2 className="animate-spin" /> : <Send />}
              {publishing ? (
                t("publishing")
              ) : (
                <>
                  {/* The long label only where the bar has room for it and for the save status. */}
                  <span className="xl:hidden">{published ? t("republishShort") : t("publishShort")}</span>
                  <span className="max-xl:hidden">{published ? t("republish") : t("publish")}</span>
                </>
              )}
            </Button>
          </div>
        </div>
        {problem && (
          <p role="alert" className="py-1.5 text-sm text-destructive">
            {problem}
          </p>
        )}
        {!previewing && (
          // Lined up with the gift below: the tools for the text being edited, or the hint.
          <div className="grid lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-6">
            <div className="flex min-h-12 items-center justify-center py-1.5" onBlur={onTextToolsBlur}>
              {!sceneKind && activeText && activeSection ? (
                <TextToolbar
                  canvas={canvasRef}
                  selector={textSelector(activeText)}
                  watch={sections}
                  style={textStyle(activeSection, activeText.field)}
                  onChange={(change) => styleActiveText((s, field) => withTextStyle(s, field, change))}
                  onReset={() => styleActiveText(withoutTextStyle)}
                  labels={{
                    tools: t("textTools"),
                    font: t("font"),
                    designFont: t("designFont"),
                    smaller: t("smallerText"),
                    larger: t("largerText"),
                    bold: t("bold"),
                    italic: t("italic"),
                    alignLeft: t("alignLeft"),
                    alignCenter: t("alignCenter"),
                    alignRight: t("alignRight"),
                    color: t("textColor"),
                    designColor: t("designColor"),
                    customColor: t("customColor"),
                    reset: t("resetText"),
                  }}
                />
              ) : (
                <p className="text-center text-sm leading-relaxed text-muted-foreground">{sceneKind ? t("sceneHint") : t("canvasHint")}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 pt-4 pb-28 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className={cn("flex min-w-0 flex-col gap-4", sheetOpen && "max-lg:pb-[62svh]")}>
          {/* As wide as a gift is ever shown, so the canvas and the gift's frame are one box. */}
          <div className="mx-auto flex w-full flex-col gap-4" style={{ maxWidth: STAGE_MAX_WIDTH }}>
            <div
              ref={canvasRef}
              className={cn("relative", !previewing && "gift-canvas")}
              onClick={previewing ? undefined : (e) => pickOnCanvas(e.target, true)}
              onPointerDown={previewing ? undefined : onCanvasPointerDown}
              onFocus={previewing ? undefined : onCanvasFocus}
              onBlur={previewing ? undefined : onCanvasBlur}
            >
              <GiftView
                sections={sections}
                media={mediaMap}
                variant={variant}
                colors={colors}
                stickers={stickers}
                scene={sceneKind ? scene : undefined}
                style={props.style}
                recipientName={recipientName}
                senderName={senderName}
                placeholders={!previewing}
                edit={previewing ? undefined : edit}
              />
              {!previewing && selectedId && selectedIndex >= 0 && (
                <SectionToolbar
                  canvas={canvasRef}
                  sectionId={selectedId}
                  watch={sections}
                  canMoveUp={selectedIndex > 0}
                  canMoveDown={selectedIndex < sections.length - 1}
                  canRemove={sections.length > 1}
                  canDuplicate={sections.length < MAX_SECTIONS}
                  onMoveUp={() => move(selectedIndex, -1)}
                  onMoveDown={() => move(selectedIndex, 1)}
                  onEdit={() => {
                    openTab("sections");
                    setScrollTo({ id: selectedId, block: "start" });
                  }}
                  onDuplicate={() => duplicateSection(selectedId)}
                  onRemove={() => removeSection(selectedId)}
                  labels={{
                    moveUp: t("moveUp"),
                    moveDown: t("moveDown"),
                    edit: t("editSection"),
                    duplicate: t("duplicateSection"),
                    remove: t("removeSection"),
                  }}
                />
              )}
              {!previewing && !sceneKind && selectedPhoto && (
                <PhotoResizeHandle
                  canvas={canvasRef}
                  sectionId={selectedPhoto.id}
                  watch={sections}
                  size={selectedPhoto.content.size ?? PHOTO_SIZE_MAX}
                  onSize={(size) =>
                    // Two branches so each keeps its own content type.
                    updateSection(selectedPhoto.type === "image" ? { ...selectedPhoto, content: { ...selectedPhoto.content, size } } : { ...selectedPhoto, content: { ...selectedPhoto.content, size } })
                  }
                  // The release is followed by a click, which would land beside the photo and clear the selection.
                  onDone={() => {
                    justDragged.current = true;
                    window.setTimeout(() => {
                      justDragged.current = false;
                    }, 0);
                  }}
                  label={t("resizePhoto")}
                />
              )}
              {!previewing && !sceneKind && activeText && activeSection && (
                <TextResizeHandle
                  canvas={canvasRef}
                  selector={textSelector(activeText)}
                  watch={sections}
                  scale={textStyle(activeSection, activeText.field)?.scale ?? 1}
                  onScale={(scale) => styleActiveText((s, field) => withTextStyle(s, field, { scale }))}
                  label={t("resizeText")}
                />
              )}
              {!previewing && sticker && stickerBox !== undefined && (
                <StickerControls
                  canvas={canvasRef}
                  sticker={sticker}
                  container={stickerBox}
                  watch={sections}
                  onChange={(change) => patchSticker(sticker.id, (s) => ({ ...s, ...change }))}
                  canDuplicate={stickers.length < MAX_STICKERS}
                  onDuplicate={() => duplicateSticker(sticker)}
                  onFront={() => setStickers((all) => [...all.filter((s) => s.id !== sticker.id), sticker])}
                  onRemove={() => {
                    setStickers((all) => all.filter((s) => s.id !== sticker.id));
                    setSelectedSticker(null);
                  }}
                  labels={{
                    resize: t("resizeSticker"),
                    rotate: t("rotateSticker"),
                    duplicate: t("duplicateSticker"),
                    front: t("bringToFront"),
                    remove: t("removeSticker"),
                  }}
                />
              )}
            </div>

            <div className="glass flex flex-col gap-2 rounded-3xl border p-5">
              <p className="text-sm text-muted-foreground">{published ? t("publishedHint") : t("publishHint")}</p>
              <p className="text-xs text-muted-foreground">{autosave ? t("draftAutosave") : t("publishSaves")}</p>
              <Button asChild variant="secondary" size="sm" className="mt-1 self-start">
                <Link href={`/dashboard/gifts/${props.giftId}`}>{t("manage")}</Link>
              </Button>
            </div>
          </div>
        </div>

        <aside
          aria-label={t("tools")}
          className={cn(
            "z-40 flex flex-col overflow-hidden max-lg:glass-strong lg:glass",
            "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-[calc(3.75rem+env(safe-area-inset-bottom))] max-lg:max-h-[60svh] max-lg:rounded-t-3xl max-lg:border-t max-lg:shadow-[0_-12px_32px_rgba(0,0,0,0.16)]",
            !sheetOpen && "max-lg:hidden",
            "lg:sticky lg:top-32 lg:max-h-[calc(100svh-9rem)] lg:self-start lg:rounded-3xl lg:border lg:shadow-soft",
          )}
        >
          <div role="tablist" aria-label={t("tools")} style={tabColumns} className="grid gap-1 border-b border-border p-1.5 max-lg:hidden">
            {tabs.map((name) => (
              <TabButton key={name} name={name} label={tabLabel[name]} active={tab === name} onClick={() => setTab(name)} />
            ))}
          </div>
          <div className="flex items-center justify-between border-b border-border py-2 pr-2 pl-4 lg:hidden">
            <h2 className="text-sm font-semibold">{tabLabel[tab]}</h2>
            <Button type="button" variant="ghost" size="icon" className="size-9" aria-label={t("closePanel")} onClick={() => setSheetOpen(false)}>
              <X />
            </Button>
          </div>
          <div role="tabpanel" aria-label={tabLabel[tab]} className="overflow-y-auto overscroll-contain p-4">
            {tab === "sections" && (
              <SectionsPanel
                sections={sections}
                selectedId={selectedId}
                invalidIds={showInvalid ? invalidIds : new Set()}
                onSelect={selectFromPanel}
                onChange={updateSection}
                onMove={move}
                onRemove={removeSection}
                onAdd={addSection}
                addTypes={sceneKind ? SCENE_SECTION_TYPES : undefined}
                giftId={props.giftId}
                media={media}
                onMediaChange={setMedia}
              />
            )}
            {tab === "stickers" && <StickersPanel count={stickers.length} onAdd={addSticker} />}
            {tab === "flowers" && <FlowersPanel flower={scene.flower} onChange={(flower) => setScene({ ...scene, flower })} />}
            {tab === "look" && (
              <LookPanel
                variant={variant}
                colors={colors}
                templateVariant={props.style.defaultVariant}
                onVariant={(next) => {
                  setVariant(next);
                  setColors({});
                }}
                onColors={setColors}
              />
            )}
            {tab === "opening" && <OpeningPanel opening={opening} onChange={setOpening} onPlay={() => setOpeningPreview("closed")} />}
            {tab === "details" && (
              <DetailsPanel
                title={title}
                onTitle={setTitle}
                titleInvalid={showInvalid && titleInvalid}
                recipientName={recipientName}
                onRecipientName={setRecipientName}
              />
            )}
          </div>
        </aside>
      </div>

      <div
        role="tablist"
        aria-label={t("tools")}
        style={tabColumns}
        className="glass-bar fixed inset-x-0 bottom-0 z-40 grid gap-1 border-t px-1.5 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] lg:hidden"
      >
        {tabs.map((name) => (
          <TabButton
            key={name}
            name={name}
            label={tabLabel[name]}
            active={sheetOpen && tab === name}
            onClick={() => (sheetOpen && tab === name ? setSheetOpen(false) : openTab(name))}
          />
        ))}
      </div>

      {playing && sceneKind && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("scenePreview")}
          className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4 backdrop-blur-md"
          onClick={() => setPlaying(false)}
        >
          <Button type="button" variant="ghost" size="icon" className="absolute top-4 right-4" aria-label={t("closePreview")} onClick={() => setPlaying(false)}>
            <X />
          </Button>
          {/* The same phone-shaped frame the receiver sees, with what is in the editor right now. */}
          <div className="h-[min(88svh,46rem)] w-full max-w-md overflow-hidden rounded-3xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <SceneFrame
              kind={sceneKind}
              title={tGift("sceneTitle")}
              config={sceneConfig(sections, scene, { recipient: recipientName, sender: senderName }, tGift("tapToBloom"))}
            />
          </div>
        </div>
      )}

      {openingPreview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("openingPreview")}
          className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4 backdrop-blur-md"
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
            colors={colors}
            stage={openingPreview}
            label={recipientName ? tGift("forName", { name: recipientName }) : tGift("forYou")}
          />
        </div>
      )}
    </div>
  );
}

function TabButton({ name, label, active, onClick }: { name: Tab; label: string; active: boolean; onClick: () => void }) {
  const Icon = TAB_ICONS[name];
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[11px] leading-tight font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      <Icon className="size-5" />
      <span className="max-w-full truncate">{label}</span>
    </button>
  );
}

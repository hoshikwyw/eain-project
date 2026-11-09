"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GiftOpening, openingDuration, type OpeningStage } from "@/components/gift/gift-opening";
import type { GiftEdit } from "@/components/gift/gift-renderer";
import { STAGE_MAX_WIDTH } from "@/components/gift/gift-stage";
import { GiftView } from "@/components/gift/gift-view";
import { SceneFrame } from "@/components/scene/scene-frame";
import { Button } from "@/components/ui/button";
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
  type Section,
  type Sticker,
  type ThemeVariant,
} from "@/features/gifts/schemas";
import {
  dropStickerAnchor,
  insertStickerAnchor,
  swapStickerAnchors,
} from "@/features/gifts/sections";
import type { TemplateStyle } from "@/features/gifts/templates";
import { cn } from "@/lib/utils";
import type { GiftStatus } from "@/types/database";
import {
  sectionSelector,
  stickerContainerSelector,
  textSelector,
  type TextTarget,
} from "./canvas-geometry";
import { EditableText } from "./editable-text";
import { AccountSheet } from "./account-sheet";
import { EditorBar } from "./editor-bar";
import {
  DetailsPanel,
  FlowersPanel,
  LookPanel,
  OpeningPanel,
  SectionsPanel,
  StickersPanel,
} from "./editor-panels";
import { CARD_TABS, SCENE_SECTION_TYPES, SCENE_TABS, ToolTabs, type Tab } from "./editor-tabs";
import { copyOfSection, emptySection } from "./new-section";
import { PhotoResizeHandle } from "./photo-resize-handle";
import { PreviewOverlay } from "./preview-overlay";
import { SectionToolbar } from "./section-toolbar";
import { StickerControls } from "./sticker-controls";
import { TEXT_FIELDS, textStyle, withText, withoutTextStyle, withTextStyle } from "./text-fields";
import { TextResizeHandle } from "./text-resize-handle";
import { TextToolbar } from "./text-toolbar";
import { useEditorShortcuts, useStickerKeys } from "./use-editor-keys";
import { useGiftSave } from "./use-gift-save";
import { useGuestDraft } from "./use-guest-draft";
import { useHistory } from "./use-history";
import { useStickerActions } from "./use-sticker-actions";

type Props = {
  /** The saved gift being edited. Null while a visitor tries a template without an account. */
  giftId: string | null;
  /** Set for a visitor without an account: which template they are trying. The gift lives in their browser. */
  guest?: { template: string };
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
  const [scrollTo, setScrollTo] = useState<{ id: string; block: ScrollLogicalPosition } | null>(
    null,
  );
  const canvasRef = useRef<HTMLDivElement>(null);

  const payload = useMemo<EditorPayload>(
    () => ({
      title,
      recipientName,
      variant,
      opening,
      colors,
      stickers,
      ...(sceneKind && { scene }),
      sections,
    }),
    [title, recipientName, variant, opening, colors, stickers, sceneKind, scene, sections],
  );
  const payloadJson = JSON.stringify(payload);

  const invalidIds = useMemo(
    () => new Set(sections.filter((s) => !sectionSchema.safeParse(s).success).map((s) => s.id)),
    [sections],
  );
  const titleInvalid = title.trim() === "";
  const valid = invalidIds.size === 0 && !titleInvalid;

  /** Puts a whole payload into the editor, as undo and redo do. */
  const applySnapshot = (snapshot: EditorPayload) => {
    setTitle(snapshot.title);
    setRecipientName(snapshot.recipientName);
    setVariant(snapshot.variant);
    setOpening(snapshot.opening);
    setColors(snapshot.colors);
    setStickers(snapshot.stickers);
    if (snapshot.scene) setScene(snapshot.scene);
    setSections(snapshot.sections);
  };

  // Undo and redo cover everything that is saved: texts, styles, colours, stickers and details.
  const history = useHistory(payload, applySnapshot);

  // A visitor without an account: the gift is kept in the browser, and saving asks for an account.
  const guest = props.guest;
  const [accountSheet, setAccountSheet] = useState(false);
  const askForAccount = () => setAccountSheet(true);
  const draft = useGuestDraft(guest ? { template: guest.template, payloadJson } : null);

  // A draft saves itself once the creator pauses. A published gift does not:
  // a save there is live for the receiver at once, so it stays a deliberate step.
  const autosave = props.status !== "published";
  const { dirty, state, formAction, saving, publishing, publishState, publish, saveNow } =
    useGiftSave({
      giftId: props.giftId ?? "",
      enabled: !guest,
      autosave,
      initialJson: () =>
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
      payloadJson,
      valid,
      onInvalid: () => revealInvalid(),
    });

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
    canvasRef.current
      ?.querySelector(sectionSelector(scrollTo.id))
      ?.scrollIntoView({ block: scrollTo.block, behavior: "smooth" });
  }, [scrollTo]);

  useStickerKeys(selectedSticker, setStickers, setSelectedSticker);

  const mediaMap = useMemo(() => Object.fromEntries(media.map((m) => [m.id, m])), [media]);

  // Sections ------------------------------------------------------------------

  const updateSection = (next: Section) =>
    setSections((s) => s.map((sec) => (sec.id === next.id ? next : sec)));
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

  /** Copies a section to just below itself. */
  const duplicateSection = (id: string) => {
    const index = sections.findIndex((s) => s.id === id);
    const source = sections[index];
    if (!source || sections.length >= MAX_SECTIONS) return;
    const copy = copyOfSection(source);
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

  const selectSticker = (id: string) => {
    setSelectedSticker(id);
    setSelectedId(null);
    setActiveText(null);
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && canvasRef.current?.contains(focused)) focused.blur();
  };

  /** Called when a drag on the gift ends: the click the browser sends right after it must pick nothing. */
  const markDragged = () => {
    justDragged.current = true;
    window.setTimeout(() => {
      justDragged.current = false;
    }, 0);
  };

  const { patchSticker, addSticker, dragSticker, duplicateSticker } = useStickerActions({
    canvasRef,
    sections,
    stickers,
    setStickers,
    select: selectSticker,
    setSelected: setSelectedSticker,
    onAdded: () => setSheetOpen(false),
    onDragEnd: markDragged,
  });

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
    const el =
      e.target instanceof HTMLElement && e.target.matches(".editable-text") ? e.target : null;
    const sectionId = el?.closest<HTMLElement>("[data-section-id]")?.dataset.sectionId;
    const field = el?.dataset.textField;
    if (!el || !sectionId || !field) return;
    setActiveText({
      sectionId,
      field,
      index: el.dataset.textIndex === undefined ? undefined : Number(el.dataset.textIndex),
    });
  };

  // The text's tools stay while focus is on them, and go when it leaves for somewhere else.
  const onCanvasBlur = (e: React.FocusEvent) => {
    if (!(e.relatedTarget instanceof Element && e.relatedTarget.closest("[data-canvas-ui]")))
      setActiveText(null);
  };
  const onTextToolsBlur = (e: React.FocusEvent) => {
    const next = e.relatedTarget;
    if (!(
      next instanceof Element &&
      (next.closest("[data-canvas-ui]") || canvasRef.current?.contains(next))
    ))
      setActiveText(null);
  };

  /** Changes the style of the text being edited. A value of undefined goes back to the design's own. */
  const styleActiveText = (change: (section: Section, field: string) => Section) => {
    if (!activeText) return;
    setSections((all) =>
      all.map((s) => (s.id === activeText.sectionId ? change(s, activeText.field) : s)),
    );
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

  useEditorShortcuts({
    undo: history.undo,
    redo: history.redo,
    save: guest ? askForAccount : saveNow,
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
  const status = guest
    ? draft.saved
      ? { text: t("guest.saved"), tone: "text-muted-foreground" }
      : null
    : problem
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
            // An empty signature falls back to the sender's name, so that is what shows;
            // a guest has no name yet, so they are asked for it.
            placeholder={
              (field === "signature" && (senderName || (guest && t("guest.signature")))) ||
              tFields(meta.label)
            }
            field={field}
            index={index}
            onChange={(next) => setText(section.id, field, next, index)}
          />
        );
      },
    }),
    [selectedId, showInvalid, invalidIds, senderName, guest, t, tFields, setText],
  );

  const selectedIndex = sections.findIndex((s) => s.id === selectedId);
  const selectedSection = selectedIndex >= 0 ? sections[selectedIndex] : undefined;
  /** The selected section when it holds a photo or photos, which can then be resized on the gift. */
  const selectedPhoto =
    selectedSection && (selectedSection.type === "image" || selectedSection.type === "photo_grid")
      ? selectedSection
      : undefined;
  const sticker = stickers.find((s) => s.id === selectedSticker);
  const stickerBox = sticker && stickerContainerSelector(sections, sticker);
  const activeSection = activeText
    ? sections.find((s) => s.id === activeText.sectionId)
    : undefined;
  const tabs = sceneKind ? SCENE_TABS : CARD_TABS;
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
        <div aria-hidden="true" className="absolute inset-0 -z-10 border-b glass-bar" />
        <EditorBar
          title={title}
          detailsLabel={tabLabel.details}
          onTitle={() => openTab("details")}
          status={props.status}
          opened={props.opened}
          guest={Boolean(guest)}
          onGuestSave={askForAccount}
          backHref={guest ? "/templates" : "/dashboard/gifts"}
          history={history}
          note={status}
          scene={Boolean(sceneKind)}
          previewing={previewing}
          onPreview={() => setPreviewing((v) => !v)}
          onPlay={() => setPlaying(true)}
          saveAction={formAction}
          payloadJson={payloadJson}
          valid={valid}
          onInvalid={revealInvalid}
          saving={saving}
          publishing={publishing}
          published={published}
          onPublish={publish}
        />
        {problem && (
          <p role="alert" className="py-1.5 text-sm text-destructive">
            {problem}
          </p>
        )}
        {!previewing && (
          // Lined up with the gift below: the tools for the text being edited, or the hint.
          <div className="grid lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-6">
            <div
              className="flex min-h-12 items-center justify-center py-1.5"
              onBlur={onTextToolsBlur}
            >
              {!sceneKind && activeText && activeSection ? (
                <TextToolbar
                  canvas={canvasRef}
                  selector={textSelector(activeText)}
                  watch={sections}
                  style={textStyle(activeSection, activeText.field)}
                  onChange={(change) =>
                    styleActiveText((s, field) => withTextStyle(s, field, change))
                  }
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
                <p className="text-center text-sm leading-relaxed text-muted-foreground">
                  {sceneKind ? t("sceneHint") : t("canvasHint")}
                </p>
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
                    updateSection(
                      selectedPhoto.type === "image"
                        ? { ...selectedPhoto, content: { ...selectedPhoto.content, size } }
                        : { ...selectedPhoto, content: { ...selectedPhoto.content, size } },
                    )
                  }
                  // The release is followed by a click, which would land beside the photo and clear the selection.
                  onDone={markDragged}
                  label={t("resizePhoto")}
                />
              )}
              {!previewing && !sceneKind && activeText && activeSection && (
                <TextResizeHandle
                  canvas={canvasRef}
                  selector={textSelector(activeText)}
                  watch={sections}
                  scale={textStyle(activeSection, activeText.field)?.scale ?? 1}
                  onScale={(scale) =>
                    styleActiveText((s, field) => withTextStyle(s, field, { scale }))
                  }
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
                  onFront={() =>
                    setStickers((all) => [...all.filter((s) => s.id !== sticker.id), sticker])
                  }
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

            {guest ? (
              <div className="flex flex-col gap-3 rounded-3xl border glass p-5">
                <p className="text-sm text-muted-foreground">{t("guest.hint")}</p>
                <Button type="button" size="sm" className="self-start" onClick={askForAccount}>
                  {t("guest.createAccount")}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 rounded-3xl border glass p-5">
                <p className="text-sm text-muted-foreground">
                  {published ? t("publishedHint") : t("publishHint")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {autosave ? t("draftAutosave") : t("publishSaves")}
                </p>
                <Button asChild variant="secondary" size="sm" className="mt-1 self-start">
                  <Link href={`/dashboard/gifts/${props.giftId}`}>{t("manage")}</Link>
                </Button>
              </div>
            )}
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
          <ToolTabs
            tabs={tabs}
            labels={tabLabel}
            active={tab}
            onPick={setTab}
            label={t("tools")}
            className="border-b border-border p-1.5 max-lg:hidden"
          />
          <div className="flex items-center justify-between border-b border-border py-2 pr-2 pl-4 lg:hidden">
            <h2 className="text-sm font-semibold">{tabLabel[tab]}</h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9"
              aria-label={t("closePanel")}
              onClick={() => setSheetOpen(false)}
            >
              <X />
            </Button>
          </div>
          <div
            role="tabpanel"
            aria-label={tabLabel[tab]}
            className="overflow-y-auto overscroll-contain p-4"
          >
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
                giftId={props.giftId ?? ""}
                guest={Boolean(guest)}
                media={media}
                onMediaChange={setMedia}
              />
            )}
            {tab === "stickers" && <StickersPanel count={stickers.length} onAdd={addSticker} />}
            {tab === "flowers" && (
              <FlowersPanel
                flower={scene.flower}
                onChange={(flower) => setScene({ ...scene, flower })}
              />
            )}
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
            {tab === "opening" && (
              <OpeningPanel
                opening={opening}
                onChange={setOpening}
                onPlay={() => setOpeningPreview("closed")}
              />
            )}
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

      <ToolTabs
        tabs={tabs}
        labels={tabLabel}
        active={sheetOpen ? tab : null}
        onPick={(name) => (sheetOpen && tab === name ? setSheetOpen(false) : openTab(name))}
        label={t("tools")}
        className="fixed inset-x-0 bottom-0 z-40 border-t glass-bar px-1.5 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] lg:hidden"
      />

      {guest && (
        <AccountSheet
          open={accountSheet}
          onClose={() => setAccountSheet(false)}
          next="/create/continue"
        />
      )}

      {playing && sceneKind && (
        <PreviewOverlay
          label={t("scenePreview")}
          closeLabel={t("closePreview")}
          onClose={() => setPlaying(false)}
        >
          {/* The same phone-shaped frame the receiver sees, with what is in the editor right now. */}
          <div
            className="h-[min(88svh,46rem)] w-full max-w-md overflow-hidden rounded-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <SceneFrame
              kind={sceneKind}
              title={tGift("sceneTitle")}
              config={sceneConfig(
                sections,
                scene,
                { recipient: recipientName, sender: senderName },
                tGift("tapToBloom"),
              )}
            />
          </div>
        </PreviewOverlay>
      )}

      {openingPreview && (
        <PreviewOverlay
          label={t("openingPreview")}
          closeLabel={t("closePreview")}
          onClose={() => setOpeningPreview(null)}
        >
          <GiftOpening
            key={opening}
            kind={opening}
            variant={variant}
            colors={colors}
            stage={openingPreview}
            label={recipientName ? tGift("forName", { name: recipientName }) : tGift("forYou")}
          />
        </PreviewOverlay>
      )}
    </div>
  );
}

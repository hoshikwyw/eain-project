import type { GiftSection } from "@/types/database";
import {
  giftColorsSchema,
  giftThemeSchema,
  hexColorSchema,
  MAX_STICKERS,
  sectionSchema,
  stickerSchema,
  type EditorPayload,
  type GiftColors,
  type GiftTheme,
  type Opening,
  type Section,
  type Sticker,
  type ThemeVariant,
} from "./schemas";
import { giftSceneSchema, type GiftScene } from "./scene";

/**
 * Turns stored rows into typed sections. Malformed rows are dropped so one bad
 * row can never break a page.
 */
export function sectionsFromRows(rows: Pick<GiftSection, "id" | "type" | "content" | "position">[]): Section[] {
  return [...rows]
    .sort((a, b) => a.position - b.position)
    .map((row) => sectionSchema.safeParse({ id: row.id, type: row.type, content: row.content ?? {} }))
    .filter((r) => r.success)
    .map((r) => r.data);
}

export function variantFromTheme(theme: unknown): ThemeVariant {
  const parsed = giftThemeSchema.safeParse(theme ?? {});
  return parsed.success ? parsed.data.variant : "blossom";
}

/** The gift's opening, or the template default when the gift has none saved. */
export function openingFromTheme(theme: unknown, fallback: Opening): Opening {
  const parsed = giftThemeSchema.safeParse(theme ?? {});
  return (parsed.success && parsed.data.opening) || fallback;
}

const themeField = (theme: unknown, key: string): unknown =>
  theme && typeof theme === "object" ? (theme as Record<string, unknown>)[key] : undefined;

/** Colours the creator set over the look. A bad value is dropped on its own. */
export function colorsFromTheme(theme: unknown): GiftColors {
  const raw = themeField(theme, "colors");
  if (!raw || typeof raw !== "object") return {};
  const colors: GiftColors = {};
  for (const key of giftColorsSchema.keyof().options) {
    const parsed = hexColorSchema.safeParse((raw as Record<string, unknown>)[key]);
    if (parsed.success) colors[key] = parsed.data;
  }
  return colors;
}

/** Stickers on the gift. A bad sticker is dropped on its own. */
export function stickersFromTheme(theme: unknown): Sticker[] {
  const raw = themeField(theme, "stickers");
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, MAX_STICKERS)
    .map((s) => stickerSchema.safeParse(s))
    .filter((r) => r.success)
    .map((r) => r.data);
}

/** What the creator chose for a scene template's animation, if this gift has any. */
export function sceneFromTheme(theme: unknown): GiftScene | undefined {
  const raw = themeField(theme, "scene");
  if (raw === undefined || raw === null) return undefined;
  const parsed = giftSceneSchema.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

/**
 * The theme to store for an editor payload. Empty colours and stickers are
 * left out, and a sticker anchored past the last section moves to the gift.
 */
export function themeFromPayload(v: Pick<EditorPayload, "variant" | "opening" | "colors" | "stickers" | "scene" | "sections">): GiftTheme {
  const stickers = v.stickers.map(({ anchor, ...s }) =>
    anchor !== undefined && anchor < v.sections.length ? { ...s, anchor } : s,
  );
  return {
    variant: v.variant,
    opening: v.opening,
    ...(Object.keys(v.colors).length > 0 && { colors: v.colors }),
    ...(stickers.length > 0 && { stickers }),
    ...(v.scene && { scene: v.scene }),
  };
}

/** Stickers after the sections at positions `a` and `b` swap places. Each sticker stays on its section. */
export function swapStickerAnchors(stickers: Sticker[], a: number, b: number): Sticker[] {
  return stickers.map((s) => (s.anchor === a ? { ...s, anchor: b } : s.anchor === b ? { ...s, anchor: a } : s));
}

/** Stickers after a section is inserted at `position`. Those on later sections move down with them. */
export function insertStickerAnchor(stickers: Sticker[], position: number): Sticker[] {
  return stickers.map((s) => (s.anchor !== undefined && s.anchor >= position ? { ...s, anchor: s.anchor + 1 } : s));
}

/** Stickers after the section at `position` is removed. Its own stickers go with it. */
export function dropStickerAnchor(stickers: Sticker[], position: number): Sticker[] {
  return stickers
    .filter((s) => s.anchor !== position)
    .map((s) => (s.anchor !== undefined && s.anchor > position ? { ...s, anchor: s.anchor - 1 } : s));
}

/** Rows to insert for a section list. Client ids are not stored. */
export function rowsFromSections(giftId: string, sections: Section[]) {
  return sections.map((s, position) => ({ gift_id: giftId, type: s.type, position, content: s.content }));
}

/** Every media id a section list references. */
export function referencedMediaIds(sections: Section[]): string[] {
  const ids = new Set<string>();
  for (const s of sections) {
    if (s.type === "image" && s.content.mediaId) ids.add(s.content.mediaId);
    if (s.type === "photo_grid") s.content.mediaIds.forEach((id) => ids.add(id));
  }
  return [...ids];
}

/** Drops references to media the gift does not own. */
export function pruneMediaReferences(sections: Section[], ownedIds: Set<string>): Section[] {
  return sections.map((s) => {
    if (s.type === "image") {
      return s.content.mediaId && !ownedIds.has(s.content.mediaId)
        ? { ...s, content: { ...s.content, mediaId: null } }
        : s;
    }
    if (s.type === "photo_grid") {
      return { ...s, content: { ...s.content, mediaIds: s.content.mediaIds.filter((id) => ownedIds.has(id)) } };
    }
    return s;
  });
}

/** Question sections in order, with their position among all sections. */
export function questionsFromSections(sections: Section[]) {
  return sections
    .map((s, position) => (s.type === "question" ? { position, ...s.content } : null))
    .filter((q): q is NonNullable<typeof q> => q !== null);
}

/**
 * The look saved with a gift: which ready-made look, the creator's own
 * colours over it, the stickers, and what was chosen for an animated
 * template. Every part falls back on its own, so one bad value never hides
 * a gift. Spread it into what a gift is drawn from.
 */
export function lookFromTheme(theme: unknown) {
  return {
    variant: variantFromTheme(theme),
    colors: colorsFromTheme(theme),
    stickers: stickersFromTheme(theme),
    scene: sceneFromTheme(theme),
  };
}


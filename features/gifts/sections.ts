import type { GiftSection } from "@/types/database";
import { giftThemeSchema, sectionSchema, type Section, type ThemeVariant } from "./schemas";

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

/** Plain-text heading for previews and titles. */
export function firstHeading(sections: Section[]): string {
  const cover = sections.find((s) => s.type === "text");
  return cover?.type === "text" ? cover.content.heading : "";
}

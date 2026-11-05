import type { Section } from "@/features/gifts/schemas";

type FieldLabel =
  | "heading"
  | "subheading"
  | "message"
  | "caption"
  | "date"
  | "momentTitle"
  | "momentText"
  | "quote"
  | "attribution"
  | "closingLine"
  | "signature";

/**
 * Texts that can be edited on the gift itself, keyed by section type and
 * field. Limits mirror features/gifts/schemas.ts; `label` is the key under
 * editor.fields shown while the text is empty.
 */
export const TEXT_FIELDS: Record<string, { max: number; multiline?: boolean; label: FieldLabel }> = {
  "text.heading": { max: 80, label: "heading" },
  "text.subheading": { max: 160, label: "subheading" },
  "message.text": { max: 1000, multiline: true, label: "message" },
  "image.caption": { max: 160, label: "caption" },
  "photo_grid.caption": { max: 160, label: "caption" },
  "timeline.date": { max: 40, label: "date" },
  "timeline.title": { max: 80, label: "momentTitle" },
  "timeline.text": { max: 300, label: "momentText" },
  "quote.text": { max: 300, label: "quote" },
  "quote.attribution": { max: 80, label: "attribution" },
  "final_message.text": { max: 300, label: "closingLine" },
  "final_message.signature": { max: 80, label: "signature" },
};

/** The section with one text field changed. `index` picks the item of a timeline. */
export function withText(section: Section, field: string, value: string, index?: number): Section {
  if (!TEXT_FIELDS[`${section.type}.${field}`]) return section;
  if (section.type === "timeline") {
    if (index === undefined) return section;
    const items = section.content.items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    return { ...section, content: { ...section.content, items } };
  }
  return { ...section, content: { ...section.content, [field]: value } } as Section;
}

/** A short line that tells sections apart in the list. */
export function sectionSummary(section: Section): string {
  switch (section.type) {
    case "text":
      return section.content.heading;
    case "message":
    case "quote":
      return section.content.text;
    case "image":
    case "photo_grid":
      return section.content.caption;
    case "timeline":
      return section.content.items.map((i) => i.title).filter(Boolean).join(", ");
    case "question":
      return section.content.prompt;
    case "final_message":
      return [section.content.text, section.content.signature].filter(Boolean).join(" ");
  }
}

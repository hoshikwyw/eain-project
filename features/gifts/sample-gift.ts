import type { MediaItem, Opening, Section, ThemeVariant } from "./schemas";
import type { SceneKind } from "./scene";
import { getTemplateStyle, templates } from "./templates";

export type SampleGift = {
  sections: Section[];
  media: Record<string, MediaItem>;
  recipientName: string;
  senderName: string;
  variant: ThemeVariant;
  opening: Opening;
  scene?: SceneKind;
};

/** The birds stand in for photos: clearly a sample, and already on every page. */
const PHOTOS: MediaItem[] = [
  {
    id: "sample-1",
    url: "/brand/lovebirds.webp",
    thumbUrl: "/brand/lovebirds.webp",
    width: 990,
    height: 906,
  },
  {
    id: "sample-2",
    url: "/brand/bird-pink.webp",
    thumbUrl: "/brand/bird-pink.webp",
    width: 600,
    height: 773,
  },
  {
    id: "sample-3",
    url: "/brand/bird-blue.webp",
    thumbUrl: "/brand/bird-blue.webp",
    width: 600,
    height: 731,
  },
];

/**
 * A finished-looking gift made from a template, for previews: the template's
 * starting text with every photo slot filled and sample names for the two
 * people. Null when the template has no layout in code.
 */
export function sampleGift(slug: string, locale: "en" | "my"): SampleGift | null {
  const definition = templates[slug];
  if (!definition) return null;
  const style = getTemplateStyle(slug);
  let next = 0;
  const sections = definition.defaultSections(locale).map((section): Section => {
    if (section.type === "image") {
      const photo = PHOTOS[next++ % PHOTOS.length]!;
      return { ...section, content: { ...section.content, mediaId: photo.id } };
    }
    if (section.type === "photo_grid") {
      return { ...section, content: { ...section.content, mediaIds: PHOTOS.map((p) => p.id) } };
    }
    return section;
  });
  return {
    sections,
    media: Object.fromEntries(PHOTOS.map((p) => [p.id, p])),
    recipientName: locale === "my" ? "စု" : "Su",
    senderName: locale === "my" ? "မြ" : "Mya",
    variant: style.defaultVariant,
    opening: style.defaultOpening,
    ...(style.scene && { scene: style.scene }),
  };
}

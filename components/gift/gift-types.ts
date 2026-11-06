import type { ReactNode } from "react";
import type { GiftScene } from "@/features/gifts/scene";
import type {
  GiftColors,
  MediaItem,
  Section,
  Sticker,
  ThemeVariant,
} from "@/features/gifts/schemas";
import type { Design, TemplateStyle } from "@/features/gifts/templates";

export type Labels = { forName: string; forYou: string; addPhoto: string; questionNote: string };

/**
 * What the editor plugs in to make the gift editable in place. The renderer
 * stays free of editor code: it asks for each text's editable element and
 * marks sections so the editor can find them.
 */
export type GiftEdit = {
  /** The editable element for one text field. `index` is the item, for timelines. */
  text: (args: { section: Section; field: string; index?: number; value: string }) => ReactNode;
  selectedId?: string | null;
  /** Sections to flag as incomplete. */
  invalidIds?: ReadonlySet<string>;
};

export type GiftRendererProps = {
  sections: Section[];
  media: Record<string, MediaItem>;
  variant: ThemeVariant;
  /** The creator's own colours over the look. */
  colors?: GiftColors;
  /** Stickers on the gift, each on the whole gift or on one section. */
  stickers?: Sticker[];
  /** For scene templates: what the creator chose for the animation, shown on its summary card. */
  scene?: GiftScene;
  style: TemplateStyle;
  recipientName: string;
  senderName: string;
  /** Smaller type and spacing, for template thumbnails. */
  compact?: boolean;
  /** Show dashed boxes where photos are missing. Editor only. */
  placeholders?: boolean;
  /** Staggered entrance animation for the receiver page. */
  animate?: boolean;
  /**
   * Questions are answered in the reply form under the gift. "preview" shows a
   * static card in place (editor and dashboard); "hidden" drops them (receiver).
   */
  questionMode?: "preview" | "hidden";
  /** Labels the renderer needs; passed in so this stays a server-safe component. */
  labels: Labels;
  /** Set by the editor only. Empty optional texts then show, so they can be filled in. */
  edit?: GiftEdit;
};

/** What every design and section is handed: the renderer's own input, plus what it worked out from it. */
export type Ctx = GiftRendererProps & {
  design: Design;
  eyebrow: string;
  visible: Section[];
  sectionStickers: Map<string, Sticker[]>;
};

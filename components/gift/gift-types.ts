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

export type Labels = {
  forName: string;
  forYou: string;
  addPhoto: string;
  questionNote: string;
  /** Title of the link that opens an event's place in a maps app. */
  openInMaps: string;
  /** The "Add to calendar" row under an event with a real date, and its two links. */
  addToCalendar: string;
  calendarGoogle: string;
  calendarIcs: string;
  /** Name of the calendar entry when the card has no heading. */
  calendarTitle: string;
  /** "Please reply by {date}", shown under the event while its RSVP deadline is ahead. */
  replyBy: string;
  /** The page's language, for dates the card prints itself. */
  locale: string;
};

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
  /**
   * A picture of a gift (thumbnails in galleries and the template library): no links
   * and no live controls, because the picture usually sits inside a link itself and a
   * link within a link breaks hydration.
   */
  inert?: boolean;
  /** Show dashed boxes where photos are missing. Editor only. */
  placeholders?: boolean;
  /** Staggered entrance animation for the receiver page. */
  animate?: boolean;
  /**
   * How question sections show. "preview" is a static card with the prompt
   * (editor and dashboard); "answer" is the live form, answered right there on
   * the card inside an AnswerProvider (receiver page and library preview);
   * "hidden" drops them.
   */
  questionMode?: "preview" | "hidden" | "answer";
  /** Labels the renderer needs; passed in so this stays a server-safe component. */
  labels: Labels;
  /** Set by the editor only. Empty optional texts then show, so they can be filled in. */
  edit?: GiftEdit;
  /**
   * Where the receiver page serves an event as an .ics file, "/api/g/<token>/calendar".
   * Only the receiver page has it; elsewhere the calendar links are pictured, not live.
   */
  calendarBase?: string;
  /** Level of the card's first heading. 2 when the page already has its own h1 above the card. */
  headingLevel?: 1 | 2;
};

/** What every design and section is handed: the renderer's own input, plus what it worked out from it. */
export type Ctx = GiftRendererProps & {
  design: Design;
  eyebrow: string;
  visible: Section[];
  sectionStickers: Map<string, Sticker[]>;
};

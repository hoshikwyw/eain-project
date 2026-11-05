import { z } from "zod";
import { STICKER_KINDS } from "./stickers";

/** Visual variants a template can render. Templates carry their own palette. */
export const themeVariantSchema = z.enum([
  "blossom",
  "mint",
  "sunset",
  "celebrate",
  "ocean",
  "lavender",
  "champagne",
  "ivory",
  "night",
  "forest",
  "noir",
  "berry",
]);
export type ThemeVariant = z.infer<typeof themeVariantSchema>;
export const THEME_VARIANTS = themeVariantSchema.options;

/** How the gift opens on the receiver page, before the content shows. */
export const openingSchema = z.enum(["envelope", "book", "giftbox", "curtain", "scroll", "simple"]);
export type Opening = z.infer<typeof openingSchema>;
export const OPENINGS = openingSchema.options;

/** #rrggbb only, so a stored colour can never carry other CSS. */
export const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

/**
 * Colours the creator picked over the look. Each one is optional; anything
 * left out keeps the look's own colour. `bg2` turns the background into a
 * gradient from `bg`.
 */
export const giftColorsSchema = z.object({
  bg: hexColorSchema.optional(),
  bg2: hexColorSchema.optional(),
  card: hexColorSchema.optional(),
  text: hexColorSchema.optional(),
  accent: hexColorSchema.optional(),
});
export type GiftColors = z.infer<typeof giftColorsSchema>;

export const MAX_SECTIONS = 12;
export const MAX_PHOTOS_PER_GIFT = 5;
export const MAX_STICKERS = 30;

/**
 * A sticker placed on the gift. Position is the sticker's centre in percent
 * of the box it sits on, and size is its width in percent of that box's
 * width, so it keeps its place on a phone and on a desktop.
 */
export const stickerSchema = z.object({
  id: z.string().min(1).max(40),
  kind: z.enum(STICKER_KINDS),
  /** Position of the section the sticker sits on. Left out: the whole gift. */
  anchor: z.number().int().min(0).max(MAX_SECTIONS - 1).optional(),
  x: z.number().min(-20).max(120),
  y: z.number().min(-50).max(150),
  size: z.number().min(4).max(80),
  rotate: z.number().min(-180).max(180).default(0),
});
export type Sticker = z.infer<typeof stickerSchema>;

export const giftThemeSchema = z.object({
  variant: themeVariantSchema.default("blossom"),
  /** Missing on gifts made before openings existed; the template default applies. */
  opening: openingSchema.optional(),
  /** Read through colorsFromTheme and stickersFromTheme, which drop bad values. */
  colors: giftColorsSchema.optional().catch(undefined),
  stickers: z.array(stickerSchema).max(MAX_STICKERS).optional().catch(undefined),
});
export type GiftTheme = z.infer<typeof giftThemeSchema>;

// Text styles ----------------------------------------------------------------

export const textFontSchema = z.enum(["serif", "sans", "hand"]);
export type TextFont = z.infer<typeof textFontSchema>;

/**
 * How one piece of text departs from its design. Every field is optional;
 * a field left out keeps what the design gives that text.
 */
export const textStyleSchema = z.object({
  font: textFontSchema.optional(),
  /** Multiplier on the design's own size for this text. */
  scale: z.number().min(0.5).max(2.5).optional(),
  color: hexColorSchema.optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
});
export type TextStyle = z.infer<typeof textStyleSchema>;

/**
 * Styles for a section's text fields, keyed by field name. A malformed value
 * is dropped instead of failing the section, so a bad style never hides text.
 */
const stylesFor = <K extends string>(fields: readonly [K, ...K[]]) =>
  z.partialRecord(z.enum(fields), textStyleSchema).optional().catch(undefined);

// Section bodies ------------------------------------------------------------

const shortText = (max: number) => z.string().trim().max(max);

export const coverContentSchema = z.object({
  heading: z.string().trim().min(1).max(80),
  subheading: shortText(160).default(""),
  styles: stylesFor(["heading", "subheading"]),
});

export const messageContentSchema = z.object({
  text: z.string().trim().min(1).max(1000),
  styles: stylesFor(["text"]),
});

export const imageContentSchema = z.object({
  mediaId: z.uuid().nullable().default(null),
  caption: shortText(160).default(""),
  styles: stylesFor(["caption"]),
});

export const photoGridContentSchema = z.object({
  mediaIds: z.array(z.uuid()).max(5).default([]),
  caption: shortText(160).default(""),
  styles: stylesFor(["caption"]),
});

export const timelineItemSchema = z.object({
  date: shortText(40).default(""),
  title: z.string().trim().min(1).max(80),
  text: shortText(300).default(""),
});

export const timelineContentSchema = z.object({
  items: z.array(timelineItemSchema).min(1).max(8),
  /** One style per field, shared by every item so the timeline stays even. */
  styles: stylesFor(["date", "title", "text"]),
});

export const quoteContentSchema = z.object({
  text: z.string().trim().min(1).max(300),
  attribution: shortText(80).default(""),
  styles: stylesFor(["text", "attribution"]),
});

export const finalMessageContentSchema = z.object({
  text: shortText(300).default(""),
  signature: shortText(80).default(""),
  styles: stylesFor(["text", "signature"]),
});

export const questionKindSchema = z.enum(["choice", "yes_no", "short_text", "reaction", "rating"]);
export type QuestionKind = z.infer<typeof questionKindSchema>;
export const QUESTION_KINDS = questionKindSchema.options;

export const questionOptionSchema = z.object({
  id: z.uuid(),
  label: z.string().trim().min(1).max(120),
});

/**
 * A question lives in a section for editing and ordering, and is mirrored
 * into gift_questions on save so answers can reference stable ids.
 */
export const questionContentSchema = z.object({
  questionId: z.uuid(),
  kind: questionKindSchema,
  prompt: z.string().trim().min(1).max(300),
  required: z.boolean().default(false),
  options: z.array(questionOptionSchema).max(6).default([]),
});

/** Fixed reaction set. Stored as options so answers stay plain rows. */
export const REACTIONS = ["❤️", "😊", "🥹", "🎉", "😂"] as const;

/** A section as the editor and renderer see it. `id` is a client-side key. */
export const sectionSchema = z.discriminatedUnion("type", [
  z.object({ id: z.string().max(40), type: z.literal("question"), content: questionContentSchema }),
  z.object({ id: z.string().max(40), type: z.literal("text"), content: coverContentSchema }),
  z.object({ id: z.string().max(40), type: z.literal("message"), content: messageContentSchema }),
  z.object({ id: z.string().max(40), type: z.literal("image"), content: imageContentSchema }),
  z.object({ id: z.string().max(40), type: z.literal("photo_grid"), content: photoGridContentSchema }),
  z.object({ id: z.string().max(40), type: z.literal("timeline"), content: timelineContentSchema }),
  z.object({ id: z.string().max(40), type: z.literal("quote"), content: quoteContentSchema }),
  z.object({ id: z.string().max(40), type: z.literal("final_message"), content: finalMessageContentSchema }),
]);
export type Section = z.infer<typeof sectionSchema>;
export type SectionOf<T extends Section["type"]> = Extract<Section, { type: T }>;
export type EditableSectionType = Section["type"];

/** What the editor submits as one JSON payload. */
export const editorPayloadSchema = z.object({
  title: z.string().trim().min(1).max(120),
  recipientName: shortText(80).default(""),
  variant: themeVariantSchema,
  opening: openingSchema,
  colors: giftColorsSchema.default({}),
  stickers: z.array(stickerSchema).max(MAX_STICKERS).default([]),
  sections: z.array(sectionSchema).min(1).max(MAX_SECTIONS),
});
export type EditorPayload = z.infer<typeof editorPayloadSchema>;

/** A photo the renderer can show. URLs are short-lived signed URLs. */
export type MediaItem = {
  id: string;
  url: string;
  thumbUrl: string;
  width: number | null;
  height: number | null;
};

export const sessionIdSchema = z.string().regex(/^[A-Za-z0-9_-]{8,64}$/);

export const receiverEventSchema = z.object({
  type: z.enum(["opened", "viewed", "response_started"]),
  sessionId: sessionIdSchema,
});

/** What the receiver page shows and submits. Never includes creator data. */
export type PublicQuestion = {
  id: string;
  kind: QuestionKind;
  prompt: string;
  required: boolean;
  options: { id: string; label: string }[];
};

export const answerSchema = z.object({
  questionId: z.uuid(),
  optionId: z.uuid().nullable().optional(),
  text: z.string().trim().max(1000).nullable().optional(),
  number: z.number().int().min(0).max(10).nullable().optional(),
});

export const responseSubmissionSchema = z.object({
  sessionId: sessionIdSchema,
  answers: z.array(answerSchema).min(1).max(20),
});
export type ResponseSubmission = z.infer<typeof responseSubmissionSchema>;

export type SaveGiftState = { status?: "saved" | "invalid" | "error" };

import { z } from "zod";

/** Visual variants a template can render. Templates carry their own palette. */
export const themeVariantSchema = z.enum(["blossom", "night", "mint", "sunset"]);
export type ThemeVariant = z.infer<typeof themeVariantSchema>;
export const THEME_VARIANTS = themeVariantSchema.options;

export const giftThemeSchema = z.object({
  variant: themeVariantSchema.default("blossom"),
});
export type GiftTheme = z.infer<typeof giftThemeSchema>;

// Section bodies ------------------------------------------------------------

const shortText = (max: number) => z.string().trim().max(max);

export const coverContentSchema = z.object({
  heading: z.string().trim().min(1).max(80),
  subheading: shortText(160).default(""),
});

export const messageContentSchema = z.object({
  text: z.string().trim().min(1).max(1000),
});

export const imageContentSchema = z.object({
  mediaId: z.uuid().nullable().default(null),
  caption: shortText(160).default(""),
});

export const photoGridContentSchema = z.object({
  mediaIds: z.array(z.uuid()).max(5).default([]),
  caption: shortText(160).default(""),
});

export const timelineItemSchema = z.object({
  date: shortText(40).default(""),
  title: z.string().trim().min(1).max(80),
  text: shortText(300).default(""),
});

export const timelineContentSchema = z.object({
  items: z.array(timelineItemSchema).min(1).max(8),
});

export const quoteContentSchema = z.object({
  text: z.string().trim().min(1).max(300),
  attribution: shortText(80).default(""),
});

export const finalMessageContentSchema = z.object({
  text: shortText(300).default(""),
  signature: shortText(80).default(""),
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

export const MAX_SECTIONS = 12;
export const MAX_PHOTOS_PER_GIFT = 5;

/** What the editor submits as one JSON payload. */
export const editorPayloadSchema = z.object({
  title: z.string().trim().min(1).max(120),
  recipientName: shortText(80).default(""),
  variant: themeVariantSchema,
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

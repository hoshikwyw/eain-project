import { z } from "zod";

/** Visual variant a template can render. Templates carry their own palette. */
export const themeVariantSchema = z.enum(["blossom", "night"]);
export type ThemeVariant = z.infer<typeof themeVariantSchema>;

export const giftThemeSchema = z.object({
  variant: themeVariantSchema.default("blossom"),
});
export type GiftTheme = z.infer<typeof giftThemeSchema>;

/** Section bodies, one schema per section type used so far. */
export const coverContentSchema = z.object({
  heading: z.string().trim().min(1).max(80),
});

export const messageContentSchema = z.object({
  text: z.string().trim().min(1).max(1000),
});

export const finalMessageContentSchema = z.object({
  text: z.string().trim().max(300).default(""),
  signature: z.string().trim().max(80).default(""),
});

/** What the Birthday Postcard editor submits. */
export const postcardFormSchema = z.object({
  title: z.string().trim().min(1).max(120),
  recipientName: z.string().trim().max(80).default(""),
  heading: coverContentSchema.shape.heading,
  message: messageContentSchema.shape.text,
  finalMessage: finalMessageContentSchema.shape.text,
  signature: finalMessageContentSchema.shape.signature,
  variant: themeVariantSchema,
});
export type PostcardFormValues = z.infer<typeof postcardFormSchema>;

/** Everything a postcard needs to render, in the editor or on the public page. */
export type PostcardContent = {
  heading: string;
  message: string;
  finalMessage: string;
  signature: string;
  recipientName: string;
  variant: ThemeVariant;
};

export const sessionIdSchema = z.string().regex(/^[A-Za-z0-9_-]{8,64}$/);

export const receiverEventSchema = z.object({
  type: z.enum(["opened", "viewed"]),
  sessionId: sessionIdSchema,
});

export type SaveGiftState = { status?: "saved" | "invalid" | "error" };

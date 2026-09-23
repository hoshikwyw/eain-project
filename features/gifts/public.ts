import "server-only";

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { signMedia } from "./media";
import type { MediaItem, Section, ThemeVariant } from "./schemas";
import { referencedMediaIds, sectionsFromRows, variantFromTheme } from "./sections";
import { getTemplateStyle, type TemplateStyle } from "./templates";

export type PublicGift = {
  templateSlug: string;
  style: TemplateStyle;
  variant: ThemeVariant;
  sections: Section[];
  media: Record<string, MediaItem>;
  recipientName: string;
  senderName: string;
};

/**
 * Loads a published gift by its share token for the receiver page.
 * Uses the service role after the token lookup, and returns ONLY what the
 * receiver may see: content, referenced photos, template and sender name.
 */
export const getPublicGift = cache(async (token: string): Promise<PublicGift | null> => {
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) return null;

  const admin = createAdminClient();
  const { data: gift } = await admin
    .from("gifts")
    .select("id, theme, template_id, sender_id")
    .eq("share_token", token)
    .eq("status", "published")
    .maybeSingle();
  if (!gift) return null;

  const [{ data: template }, { data: sectionRows }, { data: recipient }, { data: sender }] = await Promise.all([
    admin.from("templates").select("slug").eq("id", gift.template_id).single(),
    admin.from("gift_sections").select("id, type, content, position").eq("gift_id", gift.id),
    admin.from("gift_recipients").select("name").eq("gift_id", gift.id).order("created_at").limit(1).maybeSingle(),
    admin.from("profiles").select("display_name").eq("id", gift.sender_id).single(),
  ]);

  const sections = sectionsFromRows(sectionRows ?? []);
  const mediaIds = referencedMediaIds(sections);
  const { data: mediaRows } = mediaIds.length
    ? await admin
        .from("gift_media")
        .select("id, storage_path, thumb_path, width, height")
        .eq("gift_id", gift.id)
        .in("id", mediaIds)
    : { data: [] };

  const slug = template?.slug ?? "";
  return {
    templateSlug: slug,
    style: getTemplateStyle(slug),
    variant: variantFromTheme(gift.theme),
    sections,
    media: await signMedia(mediaRows ?? []),
    recipientName: recipient?.name ?? "",
    senderName: sender?.display_name ?? "",
  };
});

export async function recordReceiverEvent(
  token: string,
  type: "opened" | "viewed",
  sessionId: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const fn = type === "opened" ? "record_gift_open" : "record_gift_viewed";
  const { data, error } = await admin.rpc(fn, { p_share_token: token, p_session_id: sessionId });
  return !error && data === true;
}

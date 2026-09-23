import "server-only";

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { postcardContentFromSections } from "./queries";
import type { PostcardContent } from "./schemas";

export type PublicGift = {
  templateSlug: string;
  title: string;
  senderName: string;
  content: PostcardContent;
};

/**
 * Loads a published gift by its share token for the receiver page.
 * Uses the service role after the token lookup, and returns ONLY what the
 * receiver may see: content, template and the sender's display name.
 */
export const getPublicGift = cache(async (token: string): Promise<PublicGift | null> => {
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) return null;

  const admin = createAdminClient();
  const { data: gift } = await admin
    .from("gifts")
    .select("id, title, theme, template_id, sender_id")
    .eq("share_token", token)
    .eq("status", "published")
    .maybeSingle();
  if (!gift) return null;

  const [{ data: template }, { data: sections }, { data: recipient }, { data: sender }] = await Promise.all([
    admin.from("templates").select("slug").eq("id", gift.template_id).single(),
    admin.from("gift_sections").select("type, content, position").eq("gift_id", gift.id),
    admin.from("gift_recipients").select("name").eq("gift_id", gift.id).order("created_at").limit(1).maybeSingle(),
    admin.from("profiles").select("display_name").eq("id", gift.sender_id).single(),
  ]);

  return {
    templateSlug: template?.slug ?? "",
    title: gift.title,
    senderName: sender?.display_name ?? "",
    content: postcardContentFromSections(sections ?? [], gift.theme, recipient?.name ?? ""),
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

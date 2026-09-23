import { createClient } from "@/lib/supabase/server";
import type { Gift, GiftEvent, GiftRecipient, GiftSection, Template } from "@/types/database";
import {
  coverContentSchema,
  finalMessageContentSchema,
  giftThemeSchema,
  messageContentSchema,
  type PostcardContent,
} from "./schemas";

export type GiftListItem = Gift & {
  recipient: Pick<GiftRecipient, "name" | "first_opened_at"> | null;
  templateSlug: string;
};

/** All of the signed-in creator's gifts that are not deleted. RLS scopes the rows. */
export async function listMyGifts(): Promise<GiftListItem[]> {
  const supabase = await createClient();
  const { data: gifts } = await supabase
    .from("gifts")
    .select("*")
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  if (!gifts || gifts.length === 0) return [];

  const ids = gifts.map((g) => g.id);
  const [{ data: recipients }, { data: templates }] = await Promise.all([
    supabase.from("gift_recipients").select("gift_id, name, first_opened_at").in("gift_id", ids),
    supabase.from("templates").select("id, slug"),
  ]);

  const recipientByGift = new Map((recipients ?? []).map((r) => [r.gift_id, r]));
  const slugById = new Map((templates ?? []).map((t) => [t.id, t.slug]));

  return gifts.map((gift) => ({
    ...gift,
    recipient: recipientByGift.get(gift.id) ?? null,
    templateSlug: slugById.get(gift.template_id) ?? "",
  }));
}

export type EditorGift = {
  gift: Gift;
  template: Pick<Template, "id" | "slug" | "name_en" | "name_my">;
  sections: GiftSection[];
  recipient: GiftRecipient | null;
  content: PostcardContent;
};

/** One gift with everything the editor needs, or null when not found or not owned. */
export async function getEditorGift(giftId: string): Promise<EditorGift | null> {
  const supabase = await createClient();
  const { data: gift } = await supabase.from("gifts").select("*").eq("id", giftId).neq("status", "deleted").maybeSingle();
  if (!gift) return null;

  const [{ data: template }, { data: sections }, { data: recipient }] = await Promise.all([
    supabase.from("templates").select("id, slug, name_en, name_my").eq("id", gift.template_id).single(),
    supabase.from("gift_sections").select("*").eq("gift_id", giftId).order("position"),
    supabase
      .from("gift_recipients")
      .select("*")
      .eq("gift_id", giftId)
      .order("created_at")
      .limit(1)
      .maybeSingle(),
  ]);

  if (!template) return null;

  return {
    gift,
    template,
    sections: sections ?? [],
    recipient,
    content: postcardContentFromSections(sections ?? [], gift.theme, recipient?.name ?? ""),
  };
}

export type GiftDetail = EditorGift & { events: GiftEvent[] };

export async function getGiftDetail(giftId: string): Promise<GiftDetail | null> {
  const editor = await getEditorGift(giftId);
  if (!editor) return null;
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("gift_events")
    .select("*")
    .eq("gift_id", giftId)
    .order("created_at", { ascending: true });
  return { ...editor, events: events ?? [] };
}

/**
 * Turns stored sections into what the postcard component renders.
 * Tolerant of missing or malformed content so a bad row never breaks a page.
 */
export function postcardContentFromSections(
  sections: Pick<GiftSection, "type" | "content" | "position">[],
  theme: unknown,
  recipientName: string,
): PostcardContent {
  const ordered = [...sections].sort((a, b) => a.position - b.position);
  const cover = coverContentSchema.safeParse(ordered.find((s) => s.type === "text")?.content);
  const message = messageContentSchema.safeParse(ordered.find((s) => s.type === "message")?.content);
  const final = finalMessageContentSchema.safeParse(ordered.find((s) => s.type === "final_message")?.content);
  const parsedTheme = giftThemeSchema.safeParse(theme ?? {});

  return {
    heading: cover.success ? cover.data.heading : "",
    message: message.success ? message.data.text : "",
    finalMessage: final.success ? final.data.text : "",
    signature: final.success ? final.data.signature : "",
    recipientName,
    variant: parsedTheme.success ? parsedTheme.data.variant : "blossom",
  };
}

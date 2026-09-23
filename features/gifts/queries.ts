import { createClient } from "@/lib/supabase/server";
import type { Gift, GiftEvent, GiftMedia, GiftRecipient, Template } from "@/types/database";
import { signMedia } from "./media";
import type { MediaItem, Section, ThemeVariant } from "./schemas";
import { sectionsFromRows, variantFromTheme } from "./sections";
import { getTemplateStyle, type TemplateStyle } from "./templates";

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
  style: TemplateStyle;
  variant: ThemeVariant;
  sections: Section[];
  recipient: GiftRecipient | null;
  mediaRows: GiftMedia[];
  media: Record<string, MediaItem>;
};

/** One gift with everything the editor needs, or null when not found or not owned. */
export async function getEditorGift(giftId: string): Promise<EditorGift | null> {
  const supabase = await createClient();
  const { data: gift } = await supabase
    .from("gifts")
    .select("*")
    .eq("id", giftId)
    .neq("status", "deleted")
    .maybeSingle();
  if (!gift) return null;

  const [{ data: template }, { data: sections }, { data: recipient }, { data: mediaRows }] = await Promise.all([
    supabase.from("templates").select("id, slug, name_en, name_my").eq("id", gift.template_id).single(),
    supabase.from("gift_sections").select("*").eq("gift_id", giftId).order("position"),
    supabase.from("gift_recipients").select("*").eq("gift_id", giftId).order("created_at").limit(1).maybeSingle(),
    supabase.from("gift_media").select("*").eq("gift_id", giftId).order("created_at"),
  ]);

  if (!template) return null;

  return {
    gift,
    template,
    style: getTemplateStyle(template.slug),
    variant: variantFromTheme(gift.theme),
    sections: sectionsFromRows(sections ?? []),
    recipient,
    mediaRows: mediaRows ?? [],
    media: await signMedia(mediaRows ?? []),
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

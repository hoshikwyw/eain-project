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

export type ResponseView = {
  id: string;
  createdAt: string;
  answers: { prompt: string; value: string }[];
};

/** Responses to one gift, readable only by its creator through RLS. */
export async function getGiftResponses(giftId: string): Promise<ResponseView[]> {
  const supabase = await createClient();
  const { data: responses } = await supabase
    .from("gift_responses")
    .select("id, created_at")
    .eq("gift_id", giftId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (!responses || responses.length === 0) return [];

  const [{ data: answers }, { data: questions }] = await Promise.all([
    supabase
      .from("gift_answers")
      .select("response_id, question_id, option_id, answer_text, answer_number")
      .in("response_id", responses.map((r) => r.id)),
    supabase.from("gift_questions").select("id, prompt, position").eq("gift_id", giftId),
  ]);
  const promptById = new Map((questions ?? []).map((q) => [q.id, q]));

  return responses.map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    answers: (answers ?? [])
      .filter((a) => a.response_id === r.id)
      .sort((a, b) => (promptById.get(a.question_id)?.position ?? 0) - (promptById.get(b.question_id)?.position ?? 0))
      .map((a) => ({
        prompt: promptById.get(a.question_id)?.prompt ?? "",
        value: a.answer_text ?? (a.answer_number !== null ? `${a.answer_number}/5` : ""),
      })),
  }));
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

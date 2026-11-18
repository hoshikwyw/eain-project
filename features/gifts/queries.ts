import { createClient, createClientWithUser } from "@/lib/supabase/server";
import type { Gift, GiftEvent, GiftMedia, GiftRecipient, Template } from "@/types/database";
import { signMedia } from "./media";
import type { GiftColors, MediaItem, Opening, Section, Sticker, ThemeVariant } from "./schemas";
import type { GiftScene } from "./scene";
import { lookFromTheme, openingFromTheme, sectionsFromRows } from "./sections";
import { getTemplateStyle, type TemplateStyle } from "./templates";

/** A gift with everything needed to draw a picture of it, for galleries. */
export type GiftCard = {
  gift: Gift;
  recipient: Pick<GiftRecipient, "name" | "first_opened_at"> | null;
  style: TemplateStyle;
  variant: ThemeVariant;
  colors: GiftColors;
  stickers: Sticker[];
  scene: GiftScene | undefined;
  sections: Section[];
  media: Record<string, MediaItem>;
  /** Replies so far; for an invitation, the RSVPs. */
  responses: number;
};

/**
 * The signed-in creator's gifts that are not deleted, most recently changed
 * first, each with its content so it can be shown as a thumbnail. Loads all
 * of them in a fixed number of queries; a creator has at most a handful.
 */
export async function listMyGiftCards(limit?: number): Promise<GiftCard[]> {
  const { supabase, user } = await createClientWithUser();
  if (!user) return [];
  let query = supabase
    .from("gifts")
    .select("*")
    .eq("sender_id", user.id)
    .neq("status", "deleted")
    .order("updated_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data: gifts } = await query;
  if (!gifts || gifts.length === 0) return [];

  const ids = gifts.map((g) => g.id);
  const [
    { data: recipients },
    { data: templates },
    { data: sections },
    { data: mediaRows },
    { data: responseRows },
  ] = await Promise.all([
    supabase.from("gift_recipients").select("gift_id, name, first_opened_at").in("gift_id", ids),
    supabase.from("templates").select("id, slug"),
    supabase
      .from("gift_sections")
      .select("id, gift_id, type, content, position")
      .in("gift_id", ids),
    supabase
      .from("gift_media")
      .select("id, gift_id, storage_path, thumb_path, width, height")
      .in("gift_id", ids),
    supabase.from("gift_responses").select("gift_id").in("gift_id", ids),
  ]);
  const media = await signMedia(mediaRows ?? []);
  const responsesByGift = new Map<string, number>();
  for (const r of responseRows ?? [])
    responsesByGift.set(r.gift_id, (responsesByGift.get(r.gift_id) ?? 0) + 1);
  const recipientByGift = new Map((recipients ?? []).map((r) => [r.gift_id, r]));
  const slugById = new Map((templates ?? []).map((t) => [t.id, t.slug]));

  return gifts.map((gift) => ({
    gift,
    recipient: recipientByGift.get(gift.id) ?? null,
    style: getTemplateStyle(slugById.get(gift.template_id) ?? ""),
    ...lookFromTheme(gift.theme),
    sections: sectionsFromRows((sections ?? []).filter((s) => s.gift_id === gift.id)),
    media: Object.fromEntries(
      (mediaRows ?? [])
        .filter((m) => m.gift_id === gift.id && media[m.id])
        .map((m) => [m.id, media[m.id]!]),
    ),
    responses: responsesByGift.get(gift.id) ?? 0,
  }));
}

export type EditorGift = {
  gift: Gift;
  template: Pick<Template, "id" | "slug" | "name_en" | "name_my">;
  style: TemplateStyle;
  variant: ThemeVariant;
  opening: Opening;
  colors: GiftColors;
  stickers: Sticker[];
  scene: GiftScene | undefined;
  sections: Section[];
  recipient: GiftRecipient | null;
  mediaRows: GiftMedia[];
  media: Record<string, MediaItem>;
};

/**
 * One gift with everything the editor needs, or null when not found or not
 * owned. An admin gets null for someone else's gift too: they can read it,
 * but could not save or delete it here. Moderation has its own page.
 */
export async function getEditorGift(giftId: string): Promise<EditorGift | null> {
  const { supabase, user } = await createClientWithUser();
  if (!user) return null;
  const { data: gift } = await supabase
    .from("gifts")
    .select("*")
    .eq("id", giftId)
    .eq("sender_id", user.id)
    .neq("status", "deleted")
    .maybeSingle();
  if (!gift) return null;

  const [{ data: template }, { data: sections }, { data: recipient }, { data: mediaRows }] =
    await Promise.all([
      supabase
        .from("templates")
        .select("id, slug, name_en, name_my")
        .eq("id", gift.template_id)
        .single(),
      supabase.from("gift_sections").select("*").eq("gift_id", giftId).order("position"),
      supabase
        .from("gift_recipients")
        .select("*")
        .eq("gift_id", giftId)
        .order("created_at")
        .limit(1)
        .maybeSingle(),
      supabase.from("gift_media").select("*").eq("gift_id", giftId).order("created_at"),
    ]);

  if (!template) return null;

  const style = getTemplateStyle(template.slug);
  return {
    gift,
    template,
    style,
    ...lookFromTheme(gift.theme),
    opening: openingFromTheme(gift.theme, style.defaultOpening),
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
      .in(
        "response_id",
        responses.map((r) => r.id),
      ),
    supabase.from("gift_questions").select("id, prompt, position").eq("gift_id", giftId),
  ]);
  const promptById = new Map((questions ?? []).map((q) => [q.id, q]));

  return responses.map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    answers: (answers ?? [])
      .filter((a) => a.response_id === r.id)
      .sort(
        (a, b) =>
          (promptById.get(a.question_id)?.position ?? 0) -
          (promptById.get(b.question_id)?.position ?? 0),
      )
      .map((a) => ({
        prompt: promptById.get(a.question_id)?.prompt ?? "",
        value: a.answer_text ?? (a.answer_number !== null ? `${a.answer_number}/5` : ""),
      })),
  }));
}

export type AnswerTally = {
  prompt: string;
  /** Replies that answered this question. */
  total: number;
  options: { label: string; count: number }[];
};

/**
 * For questions answered by picking an option (yes or no, a choice, a
 * reaction): how many replies chose each one. Options nobody picked are
 * listed too, so an RSVP reads "Sorry, I can't make it: 0" rather than
 * nothing. An option deleted since still counts under the label the answer
 * kept.
 */
export async function getResponseTallies(giftId: string): Promise<AnswerTally[]> {
  const supabase = await createClient();
  const { data: questions } = await supabase
    .from("gift_questions")
    .select("id, prompt, position, type")
    .eq("gift_id", giftId)
    .in("type", ["yes_no", "choice", "reaction"])
    .order("position");
  if (!questions || questions.length === 0) return [];

  const [{ data: options }, { data: responses }] = await Promise.all([
    supabase
      .from("gift_question_options")
      .select("id, question_id, label, position")
      .in(
        "question_id",
        questions.map((q) => q.id),
      )
      .order("position"),
    supabase.from("gift_responses").select("id").eq("gift_id", giftId),
  ]);
  const responseIds = (responses ?? []).map((r) => r.id);
  const { data: answers } =
    responseIds.length > 0
      ? await supabase
          .from("gift_answers")
          .select("question_id, option_id, answer_text")
          .in("response_id", responseIds)
      : { data: [] };

  return questions.map((q) => {
    const picks = (answers ?? []).filter((a) => a.question_id === q.id);
    const rows = (options ?? [])
      .filter((o) => o.question_id === q.id)
      .map((o) => ({ id: o.id, label: o.label, count: 0 }));
    for (const a of picks) {
      const row =
        rows.find((r) => r.id === a.option_id) ?? rows.find((r) => r.label === a.answer_text);
      if (row) row.count += 1;
      else
        rows.push({
          id: a.option_id ?? a.answer_text ?? "?",
          label: a.answer_text ?? "?",
          count: 1,
        });
    }
    return {
      prompt: q.prompt,
      total: picks.length,
      options: rows.map(({ label, count }) => ({ label, count })),
    };
  });
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

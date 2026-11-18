import "server-only";

import { cache } from "react";
import { track } from "@/lib/analytics";
import { createAdminClient } from "@/lib/supabase/admin";
import { signMedia } from "./media";
import { rsvpClosed, rsvpDeadline } from "./rsvp";
import type {
  GiftColors,
  MediaItem,
  Opening,
  PublicQuestion,
  ResponseSubmission,
  Section,
  Sticker,
  ThemeVariant,
} from "./schemas";
import type { GiftScene } from "./scene";
import { lookFromTheme, openingFromTheme, referencedMediaIds, sectionsFromRows } from "./sections";
import { getTemplateStyle, type TemplateStyle } from "./templates";

export type PublicGift = {
  templateSlug: string;
  templatePremium: boolean;
  style: TemplateStyle;
  variant: ThemeVariant;
  opening: Opening;
  colors: GiftColors;
  stickers: Sticker[];
  scene: GiftScene | undefined;
  sections: Section[];
  media: Record<string, MediaItem>;
  questions: PublicQuestion[];
  recipientName: string;
  senderName: string;
};

/**
 * Loads a published gift by its share token for the receiver page.
 * Uses the service role after the token lookup, and returns ONLY what the
 * receiver may see: content, referenced photos, questions, template and
 * the sender's display name.
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

  const [
    { data: template },
    { data: sectionRows },
    { data: recipient },
    { data: sender },
    { data: questionRows },
  ] = await Promise.all([
    admin.from("templates").select("slug, is_premium").eq("id", gift.template_id).single(),
    admin.from("gift_sections").select("id, type, content, position").eq("gift_id", gift.id),
    admin
      .from("gift_recipients")
      .select("name")
      .eq("gift_id", gift.id)
      .order("created_at")
      .limit(1)
      .maybeSingle(),
    admin.from("profiles").select("display_name").eq("id", gift.sender_id).single(),
    admin
      .from("gift_questions")
      .select("id, type, prompt, is_required, position")
      .eq("gift_id", gift.id)
      .order("position"),
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

  const questionIds = (questionRows ?? []).map((q) => q.id);
  const { data: optionRows } = questionIds.length
    ? await admin
        .from("gift_question_options")
        .select("id, question_id, label, position")
        .in("question_id", questionIds)
        .order("position")
    : { data: [] };

  const questions: PublicQuestion[] = (questionRows ?? []).map((q) => ({
    id: q.id,
    kind: q.type,
    prompt: q.prompt,
    required: q.is_required,
    options: (optionRows ?? [])
      .filter((o) => o.question_id === q.id)
      .map((o) => ({ id: o.id, label: o.label })),
  }));

  const slug = template?.slug ?? "";
  const style = getTemplateStyle(slug);
  return {
    templateSlug: slug,
    templatePremium: template?.is_premium ?? false,
    style,
    ...lookFromTheme(gift.theme),
    opening: openingFromTheme(gift.theme, style.defaultOpening),
    sections,
    media: await signMedia(mediaRows ?? []),
    questions,
    recipientName: recipient?.name ?? "",
    senderName: sender?.display_name ?? "",
  };
});

export async function recordReceiverEvent(
  token: string,
  type: "opened" | "viewed" | "response_started",
  sessionId: string,
): Promise<boolean> {
  const admin = createAdminClient();
  if (type === "opened") {
    const { data, error } = await admin.rpc("record_gift_open", {
      p_share_token: token,
      p_session_id: sessionId,
    });
    if (!error && data === true) await track("gift_opened", null);
    return !error && data === true;
  }
  const { data, error } = await admin.rpc("record_receiver_event", {
    p_share_token: token,
    p_session_id: sessionId,
    p_type: type,
  });
  return !error && data === true;
}

export type SessionAnswer = {
  questionId: string;
  optionId: string | null;
  text: string | null;
  number: number | null;
};

/**
 * What one browser session answered on a gift, so a returning guest sees their
 * own reply on the card. The session id is the random value that browser made
 * for itself, so this reads back only that guest's answers. null when there is
 * no such published gift; [] when the session has not replied (or the creator
 * removed the reply).
 */
export async function getSessionAnswers(
  token: string,
  sessionId: string,
): Promise<SessionAnswer[] | null> {
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) return null;
  const admin = createAdminClient();
  const { data: gift } = await admin
    .from("gifts")
    .select("id")
    .eq("share_token", token)
    .eq("status", "published")
    .maybeSingle();
  if (!gift) return null;
  const { data: response } = await admin
    .from("gift_responses")
    .select("id")
    .eq("gift_id", gift.id)
    .eq("session_id", sessionId)
    .maybeSingle();
  if (!response) return [];
  const { data: answers } = await admin
    .from("gift_answers")
    .select("question_id, option_id, answer_text, answer_number")
    .eq("response_id", response.id);
  return (answers ?? []).map((a) => ({
    questionId: a.question_id,
    optionId: a.option_id,
    text: a.answer_text,
    number: a.answer_number,
  }));
}

export type SubmitResult =
  { ok: true } | { ok: false; reason: "not-found" | "duplicate" | "invalid" | "closed" | "error" };

export async function submitResponse(
  token: string,
  submission: ResponseSubmission,
): Promise<SubmitResult> {
  const admin = createAdminClient();
  const { data: gift } = await admin
    .from("gifts")
    .select("id")
    .eq("share_token", token)
    .eq("status", "published")
    .maybeSingle();
  if (!gift) return { ok: false, reason: "not-found" };

  // After the host's RSVP deadline the card takes no more replies, new or changed.
  const { data: eventRows } = await admin
    .from("gift_sections")
    .select("id, type, content, position")
    .eq("gift_id", gift.id)
    .eq("type", "event");
  if (rsvpClosed(rsvpDeadline(sectionsFromRows(eventRows ?? [])))) {
    return { ok: false, reason: "closed" };
  }

  if (submission.replace) {
    // A change of mind: the earlier reply from this browser goes, answers with it, and the
    // new one is stored as usual. The creator is told again, with the new answer.
    await admin
      .from("gift_responses")
      .delete()
      .eq("gift_id", gift.id)
      .eq("session_id", submission.sessionId);
  }
  const { error } = await admin.rpc("submit_gift_response", {
    p_share_token: token,
    p_session_id: submission.sessionId,
    p_answers: submission.answers.map((a) => ({
      questionId: a.questionId,
      optionId: a.optionId ?? null,
      text: a.text ?? null,
      number: a.number ?? null,
    })),
  });
  if (!error) {
    await track("response_submitted", null, { answers: submission.answers.length });
    return { ok: true };
  }
  if (error.code === "P0002") return { ok: false, reason: "not-found" };
  if (error.code === "23505") return { ok: false, reason: "duplicate" };
  if (error.code === "22023") return { ok: false, reason: "invalid" };
  return { ok: false, reason: "error" };
}

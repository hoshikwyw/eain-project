import "server-only";

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { signMedia } from "./media";
import type { MediaItem, PublicQuestion, ResponseSubmission, Section, ThemeVariant } from "./schemas";
import { referencedMediaIds, sectionsFromRows, variantFromTheme } from "./sections";
import { getTemplateStyle, type TemplateStyle } from "./templates";

export type PublicGift = {
  templateSlug: string;
  style: TemplateStyle;
  variant: ThemeVariant;
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

  const [{ data: template }, { data: sectionRows }, { data: recipient }, { data: sender }, { data: questionRows }] =
    await Promise.all([
      admin.from("templates").select("slug").eq("id", gift.template_id).single(),
      admin.from("gift_sections").select("id, type, content, position").eq("gift_id", gift.id),
      admin.from("gift_recipients").select("name").eq("gift_id", gift.id).order("created_at").limit(1).maybeSingle(),
      admin.from("profiles").select("display_name").eq("id", gift.sender_id).single(),
      admin.from("gift_questions").select("id, type, prompt, is_required, position").eq("gift_id", gift.id).order("position"),
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
    ? await admin.from("gift_question_options").select("id, question_id, label, position").in("question_id", questionIds).order("position")
    : { data: [] };

  const questions: PublicQuestion[] = (questionRows ?? []).map((q) => ({
    id: q.id,
    kind: q.type,
    prompt: q.prompt,
    required: q.is_required,
    options: (optionRows ?? []).filter((o) => o.question_id === q.id).map((o) => ({ id: o.id, label: o.label })),
  }));

  const slug = template?.slug ?? "";
  return {
    templateSlug: slug,
    style: getTemplateStyle(slug),
    variant: variantFromTheme(gift.theme),
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
    const { data, error } = await admin.rpc("record_gift_open", { p_share_token: token, p_session_id: sessionId });
    return !error && data === true;
  }
  const { data, error } = await admin.rpc("record_receiver_event", {
    p_share_token: token,
    p_session_id: sessionId,
    p_type: type,
  });
  return !error && data === true;
}

export type SubmitResult = { ok: true } | { ok: false; reason: "not-found" | "duplicate" | "invalid" | "error" };

export async function submitResponse(token: string, submission: ResponseSubmission): Promise<SubmitResult> {
  const admin = createAdminClient();
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
  if (!error) return { ok: true };
  if (error.code === "P0002") return { ok: false, reason: "not-found" };
  if (error.code === "23505") return { ok: false, reason: "duplicate" };
  if (error.code === "22023") return { ok: false, reason: "invalid" };
  return { ok: false, reason: "error" };
}

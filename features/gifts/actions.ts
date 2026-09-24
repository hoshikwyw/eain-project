"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { track } from "@/lib/analytics";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { MEDIA_BUCKET } from "./media";
import { editorPayloadSchema, type SaveGiftState, type Section } from "./schemas";
import { pruneMediaReferences, questionsFromSections, rowsFromSections, sectionsFromRows } from "./sections";
import { defaultTheme, isAvailableTemplate, templates } from "./templates";

/** Creates a draft from a template and opens the editor. */
export async function createGiftFromTemplate(slug: string): Promise<never> {
  if (!isAvailableTemplate(slug)) redirect("/create?error=template");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(`/create?template=${slug}`)}`);

  const { data: template } = await supabase
    .from("templates")
    .select("id, name_en, name_my, is_premium")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!template) redirect("/create?error=template");

  if (template.is_premium) {
    const { data: unlock } = await supabase
      .from("template_unlocks")
      .select("template_id")
      .eq("template_id", template.id)
      .maybeSingle();
    if (!unlock) redirect(`/create?error=premium&template=${slug}`);
  }

  const locale = await getLocale();

  const { data: gift, error } = await supabase
    .from("gifts")
    .insert({
      sender_id: user.id,
      template_id: template.id,
      title: locale === "my" ? template.name_my : template.name_en,
      theme: defaultTheme(slug),
    })
    .select("id")
    .single();

  if (error || !gift) {
    // The database trigger raises when the free limit of five gifts is hit.
    redirect(error?.message.includes("gift limit") ? "/dashboard/gifts?error=limit" : "/create?error=unknown");
  }

  const { error: sectionsError } = await supabase
    .from("gift_sections")
    .insert(rowsFromSections(gift.id, templates[slug]!.defaultSections(locale)));
  if (sectionsError) redirect("/create?error=unknown");

  await track("gift_created", user.id, { template: slug, locale });
  redirect(`/create/${gift.id}`);
}

export async function createGift(formData: FormData): Promise<void> {
  await createGiftFromTemplate(String(formData.get("template") ?? ""));
}

/** Saves the editor payload. RLS limits every statement to the owner. */
export async function saveGift(giftId: string, _prev: SaveGiftState, formData: FormData): Promise<SaveGiftState> {
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { status: "invalid" };
  }
  const parsed = editorPayloadSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid" };
  const v = parsed.data;

  const supabase = await createClient();

  const { data: gift, error: giftError } = await supabase
    .from("gifts")
    .update({ title: v.title, theme: { variant: v.variant } })
    .eq("id", giftId)
    .neq("status", "deleted")
    .select("id")
    .maybeSingle();
  if (giftError || !gift) return { status: "error" };

  // Only photos this gift owns may be referenced.
  const { data: owned } = await supabase.from("gift_media").select("id").eq("gift_id", giftId);
  const sections = pruneMediaReferences(v.sections, new Set((owned ?? []).map((m) => m.id)));

  const { error: deleteError } = await supabase.from("gift_sections").delete().eq("gift_id", giftId);
  if (deleteError) return { status: "error" };
  const { error: insertError } = await supabase.from("gift_sections").insert(rowsFromSections(giftId, sections));
  if (insertError) return { status: "error" };

  if (!(await syncQuestions(supabase, giftId, sections))) return { status: "error" };

  const { data: recipient } = await supabase
    .from("gift_recipients")
    .select("id")
    .eq("gift_id", giftId)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  const recipientResult = recipient
    ? await supabase.from("gift_recipients").update({ name: v.recipientName }).eq("id", recipient.id)
    : await supabase.from("gift_recipients").insert({ gift_id: giftId, name: v.recipientName });
  if (recipientResult.error) return { status: "error" };

  revalidatePath(`/create/${giftId}`);
  revalidatePath("/dashboard", "layout");
  return { status: "saved" };
}

/**
 * Mirrors question sections into gift_questions and gift_question_options so
 * answers can reference stable ids. Questions removed from the gift are
 * deleted along with their answers; options keep their ids across edits.
 */
async function syncQuestions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  giftId: string,
  sections: Section[],
): Promise<boolean> {
  const questions = questionsFromSections(sections);
  const keepIds = questions.map((q) => q.questionId);

  const { data: existing } = await supabase.from("gift_questions").select("id").eq("gift_id", giftId);
  const stale = (existing ?? []).map((q) => q.id).filter((id) => !keepIds.includes(id));
  if (stale.length > 0) {
    const { error } = await supabase.from("gift_questions").delete().in("id", stale);
    if (error) return false;
  }

  for (const q of questions) {
    const { error } = await supabase.from("gift_questions").upsert(
      { id: q.questionId, gift_id: giftId, type: q.kind, prompt: q.prompt, position: q.position, is_required: q.required },
      { onConflict: "id" },
    );
    if (error) return false;

    const optionIds = q.options.map((o) => o.id);
    const { data: existingOptions } = await supabase.from("gift_question_options").select("id").eq("question_id", q.questionId);
    const staleOptions = (existingOptions ?? []).map((o) => o.id).filter((id) => !optionIds.includes(id));
    if (staleOptions.length > 0) {
      const { error: delError } = await supabase.from("gift_question_options").delete().in("id", staleOptions);
      if (delError) return false;
    }
    if (q.options.length > 0) {
      const { error: optError } = await supabase.from("gift_question_options").upsert(
        q.options.map((o, position) => ({ id: o.id, question_id: q.questionId, label: o.label, position })),
        { onConflict: "id" },
      );
      if (optError) return false;
    }
  }
  return true;
}

/** Copies a gift, its sections, recipient name and photos into a new draft. */
export async function duplicateGift(giftId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: source }, { data: sections }, { data: recipient }, { data: media }] = await Promise.all([
    supabase.from("gifts").select("*").eq("id", giftId).neq("status", "deleted").maybeSingle(),
    supabase.from("gift_sections").select("*").eq("gift_id", giftId).order("position"),
    supabase.from("gift_recipients").select("name").eq("gift_id", giftId).order("created_at").limit(1).maybeSingle(),
    supabase.from("gift_media").select("*").eq("gift_id", giftId),
  ]);
  if (!source) redirect("/dashboard/gifts");

  const { data: copy, error } = await supabase
    .from("gifts")
    .insert({ sender_id: user.id, template_id: source.template_id, title: `${source.title} (2)`.slice(0, 120), theme: source.theme })
    .select("id")
    .single();
  if (error || !copy) {
    redirect(error?.message.includes("gift limit") ? "/dashboard/gifts?error=limit" : `/dashboard/gifts/${giftId}?error=duplicate`);
  }

  // Copy storage objects so deleting one gift never removes the other's photos.
  const idMap = new Map<string, string>();
  if (media && media.length > 0) {
    const admin = createAdminClient();
    for (const m of media) {
      const newId = crypto.randomUUID();
      const ext = m.storage_path.split(".").pop() ?? "webp";
      const base = `${user.id}/${copy.id}/${newId}`;
      const newPath = `${base}.${ext}`;
      const newThumb = m.thumb_path ? `${base}_thumb.${ext}` : null;
      const copied = await admin.storage.from(MEDIA_BUCKET).copy(m.storage_path, newPath);
      if (copied.error) continue;
      if (m.thumb_path && newThumb) await admin.storage.from(MEDIA_BUCKET).copy(m.thumb_path, newThumb);
      const { error: rowError } = await supabase.from("gift_media").insert({
        id: newId,
        gift_id: copy.id,
        owner_id: user.id,
        storage_path: newPath,
        thumb_path: newThumb,
        mime_type: m.mime_type,
        bytes: m.bytes,
        width: m.width,
        height: m.height,
      });
      if (!rowError) idMap.set(m.id, newId);
    }
  }

  // Photos get new ids; questions and options get new ids too, so the copy
  // has its own question rows and answers never cross between gifts.
  const remap = (content: unknown): unknown => {
    const c = (content ?? {}) as Record<string, unknown>;
    if (typeof c.mediaId === "string") return { ...c, mediaId: idMap.get(c.mediaId) ?? null };
    if (Array.isArray(c.mediaIds)) {
      return { ...c, mediaIds: c.mediaIds.map((id) => idMap.get(String(id))).filter(Boolean) };
    }
    if (typeof c.questionId === "string") {
      const options = Array.isArray(c.options)
        ? c.options.map((o) => ({ ...(o as Record<string, unknown>), id: crypto.randomUUID() }))
        : [];
      return { ...c, questionId: crypto.randomUUID(), options };
    }
    return c;
  };

  if (sections && sections.length > 0) {
    const copied = sections.map((s) => ({ gift_id: copy.id, type: s.type, position: s.position, content: remap(s.content) as never }));
    await supabase.from("gift_sections").insert(copied);
    const { data: rows } = await supabase.from("gift_sections").select("id, type, content, position").eq("gift_id", copy.id);
    await syncQuestions(supabase, copy.id, sectionsFromRows(rows ?? []));
  }
  if (recipient) await supabase.from("gift_recipients").insert({ gift_id: copy.id, name: recipient.name });

  revalidatePath("/dashboard", "layout");
  redirect(`/create/${copy.id}`);
}

async function rpcOnGift(fn: "publish_gift" | "unpublish_gift" | "regenerate_gift_link" | "delete_gift", giftId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, { p_gift_id: giftId });
  revalidatePath("/dashboard", "layout");
  return error;
}

export async function publishGift(giftId: string): Promise<void> {
  const error = await rpcOnGift("publish_gift", giftId);
  if (!error) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await track("gift_published", user?.id ?? null);
  }
  redirect(error ? `/create/${giftId}?error=publish` : `/dashboard/gifts/${giftId}?published=1`);
}

export async function unpublishGift(giftId: string): Promise<void> {
  await rpcOnGift("unpublish_gift", giftId);
  redirect(`/dashboard/gifts/${giftId}`);
}

export async function regenerateGiftLink(giftId: string): Promise<void> {
  await rpcOnGift("regenerate_gift_link", giftId);
  redirect(`/dashboard/gifts/${giftId}?regenerated=1`);
}

export async function deleteGift(giftId: string): Promise<void> {
  await rpcOnGift("delete_gift", giftId);
  redirect("/dashboard/gifts?deleted=1");
}

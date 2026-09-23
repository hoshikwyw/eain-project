"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { MEDIA_BUCKET } from "./media";
import { editorPayloadSchema, type SaveGiftState } from "./schemas";
import { pruneMediaReferences, rowsFromSections } from "./sections";
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
  // Premium unlock with points arrives in Part E. Only free templates for now.
  if (template.is_premium) redirect("/create?error=premium");

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

  const remap = (content: unknown): unknown => {
    const c = (content ?? {}) as Record<string, unknown>;
    if (typeof c.mediaId === "string") return { ...c, mediaId: idMap.get(c.mediaId) ?? null };
    if (Array.isArray(c.mediaIds)) {
      return { ...c, mediaIds: c.mediaIds.map((id) => idMap.get(String(id))).filter(Boolean) };
    }
    return c;
  };

  if (sections && sections.length > 0) {
    await supabase.from("gift_sections").insert(
      sections.map((s) => ({ gift_id: copy.id, type: s.type, position: s.position, content: remap(s.content) as never })),
    );
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

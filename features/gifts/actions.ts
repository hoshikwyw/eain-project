"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { postcardFormSchema, type SaveGiftState } from "./schemas";
import { isAvailableTemplate, templateDefaults } from "./templates";

/** Creates a draft from a template and opens the editor. */
export async function createGift(formData: FormData): Promise<void> {
  const slug = String(formData.get("template") ?? "");
  if (!isAvailableTemplate(slug)) redirect("/create?error=template");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/create");

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
  const defaults = templateDefaults[slug];

  const { data: gift, error } = await supabase
    .from("gifts")
    .insert({
      sender_id: user.id,
      template_id: template.id,
      title: locale === "my" ? template.name_my : template.name_en,
      theme: defaults.theme,
    })
    .select("id")
    .single();

  if (error || !gift) {
    // The database trigger raises when the free limit of five gifts is hit.
    redirect(error?.message.includes("gift limit") ? "/dashboard/gifts?error=limit" : "/create?error=unknown");
  }

  const { error: sectionsError } = await supabase.from("gift_sections").insert(
    defaults.sections(locale).map((s) => ({ ...s, gift_id: gift.id })),
  );
  if (sectionsError) redirect("/create?error=unknown");

  redirect(`/create/${gift.id}`);
}

/** Saves the postcard editor form. RLS limits every statement to the owner. */
export async function savePostcard(giftId: string, _prev: SaveGiftState, formData: FormData): Promise<SaveGiftState> {
  const parsed = postcardFormSchema.safeParse({
    title: formData.get("title"),
    recipientName: formData.get("recipientName") ?? "",
    heading: formData.get("heading"),
    message: formData.get("message"),
    finalMessage: formData.get("finalMessage") ?? "",
    signature: formData.get("signature") ?? "",
    variant: formData.get("variant"),
  });
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

  // Replace the section set. The unique (gift_id, position) constraint is
  // deferred, and RLS checks ownership on every row.
  const { error: deleteError } = await supabase.from("gift_sections").delete().eq("gift_id", giftId);
  if (deleteError) return { status: "error" };

  const { error: insertError } = await supabase.from("gift_sections").insert([
    { gift_id: giftId, type: "text", position: 0, content: { heading: v.heading } },
    { gift_id: giftId, type: "message", position: 1, content: { text: v.message } },
    { gift_id: giftId, type: "final_message", position: 2, content: { text: v.finalMessage, signature: v.signature } },
  ]);
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

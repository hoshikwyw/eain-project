"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Spends points to unlock a premium template, then starts a gift from it.
 * The database function owns the rules: balance check, one charge, audit row.
 */
export async function unlockTemplate(formData: FormData): Promise<void> {
  const slug = String(formData.get("template") ?? "");
  const supabase = await createClient();

  const { data: template } = await supabase
    .from("templates")
    .select("id, is_premium")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!template || !template.is_premium) redirect("/create?error=template");

  const { error } = await supabase.rpc("unlock_template", { p_template_id: template.id });
  revalidatePath("/dashboard", "layout");
  revalidatePath("/create");

  if (error) {
    redirect(error.message.includes("insufficient") ? "/create?error=points" : "/create?error=unknown");
  }
  redirect(`/create?template=${slug}`);
}

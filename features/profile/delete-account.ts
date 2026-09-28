"use server";

import { redirect } from "next/navigation";
import { MEDIA_BUCKET } from "@/features/gifts/media";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type DeleteAccountState = { status?: "mismatch" | "admin" | "error" };

/**
 * Self-service account deletion from Settings. The user types their email
 * to confirm. Photos are removed from storage first, then the auth user,
 * which cascades to the profile, gifts, sections, replies, notifications and
 * points. Admins must hand over the role first so the platform never loses
 * its last administrator by accident.
 */
export async function deleteMyAccount(_prev: DeleteAccountState, formData: FormData): Promise<DeleteAccountState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const typed = String(formData.get("confirmEmail") ?? "").trim().toLowerCase();
  if (!user.email || typed !== user.email.toLowerCase()) return { status: "mismatch" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role === "admin") return { status: "admin" };

  const admin = createAdminClient();
  const { data: media } = await admin.from("gift_media").select("storage_path, thumb_path").eq("owner_id", user.id);
  const paths = (media ?? []).flatMap((m) => [m.storage_path, m.thumb_path].filter((p): p is string => Boolean(p)));
  if (paths.length) await admin.storage.from(MEDIA_BUCKET).remove(paths);

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { status: "error" };

  // Clear this browser's session cookies. The account no longer exists server-side.
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
  redirect("/account-deleted");
}

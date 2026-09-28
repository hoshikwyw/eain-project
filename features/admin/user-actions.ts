"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { MEDIA_BUCKET } from "@/features/gifts/media";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { assertAdminAction } from "./guard";

/**
 * Account actions that need the Supabase Auth admin API. Each one confirms
 * the caller is an admin, refuses to act on the caller's own account, and
 * writes an audit entry through admin_log (which re-checks the role).
 */

const idSchema = z.object({ userId: z.uuid() });

function back(userId: string, key: "ok" | "error", value: string): never {
  redirect(`/admin/users/${userId}?${key}=${value}`);
}

async function audit(action: string, userId: string, details: Record<string, unknown>) {
  const supabase = await createClient();
  await supabase.rpc("admin_log", { p_action: action, p_target_type: "user", p_target_id: userId, p_details: details as never });
}

/** Blocks sign-in and token refresh. Existing sessions end when their token expires, within an hour. */
export async function suspendUser(formData: FormData): Promise<void> {
  const parsed = idSchema.extend({ reason: z.string().trim().max(300).default("") }).safeParse({
    userId: formData.get("userId"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) redirect("/admin/users?error=invalid");
  const adminId = await assertAdminAction();
  const { userId, reason } = parsed.data;
  if (userId === adminId) back(userId, "error", "self");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
  if (error) back(userId, "error", "failed");
  await audit("suspend_user", userId, { reason });
  revalidatePath("/admin", "layout");
  back(userId, "ok", "suspended");
}

export async function unsuspendUser(formData: FormData): Promise<void> {
  const parsed = idSchema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) redirect("/admin/users?error=invalid");
  await assertAdminAction();
  const { userId } = parsed.data;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
  if (error) back(userId, "error", "failed");
  await audit("unsuspend_user", userId, {});
  revalidatePath("/admin", "layout");
  back(userId, "ok", "unsuspended");
}

/** Takes every published gift of this user offline, notifying them for each. */
export async function takeUserGiftsOffline(formData: FormData): Promise<void> {
  const parsed = idSchema.extend({ reason: z.string().trim().max(300).default("") }).safeParse({
    userId: formData.get("userId"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) redirect("/admin/users?error=invalid");
  await assertAdminAction();
  const { userId, reason } = parsed.data;

  const admin = createAdminClient();
  const { data: gifts } = await admin.from("gifts").select("id").eq("sender_id", userId).eq("status", "published");
  const supabase = await createClient();
  for (const g of gifts ?? []) {
    await supabase.rpc("admin_disable_gift", { p_gift_id: g.id, p_reason: reason });
  }
  revalidatePath("/admin", "layout");
  back(userId, "ok", "giftsOffline");
}

/**
 * Permanently deletes the account: photos are removed from storage first,
 * then the auth user, which cascades to the profile, gifts, sections,
 * replies, notifications and points. Audit entries by other admins remain.
 */
export async function deleteUserAccount(formData: FormData): Promise<void> {
  const parsed = idSchema.extend({ confirmEmail: z.string().trim().toLowerCase() }).safeParse({
    userId: formData.get("userId"),
    confirmEmail: formData.get("confirmEmail") ?? "",
  });
  if (!parsed.success) redirect("/admin/users?error=invalid");
  const adminId = await assertAdminAction();
  const { userId, confirmEmail } = parsed.data;
  if (userId === adminId) back(userId, "error", "self");

  const admin = createAdminClient();
  const { data: authData } = await admin.auth.admin.getUserById(userId);
  const email = authData?.user?.email?.toLowerCase() ?? "";
  if (!email || email !== confirmEmail) back(userId, "error", "confirmEmail");

  const { data: media } = await admin.from("gift_media").select("storage_path, thumb_path").eq("owner_id", userId);
  const paths = (media ?? []).flatMap((m) => [m.storage_path, m.thumb_path].filter((p): p is string => Boolean(p)));
  if (paths.length) await admin.storage.from(MEDIA_BUCKET).remove(paths);

  await audit("delete_user", userId, { email, photosRemoved: paths.length });
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) back(userId, "error", "deleteFailed");

  revalidatePath("/admin", "layout");
  redirect("/admin/users?ok=deleted");
}

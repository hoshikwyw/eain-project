import "server-only";

import { createClientWithUser } from "@/lib/supabase/server";

/**
 * For Server Actions that use the service role. Confirms the caller is a
 * signed-in admin before anything privileged runs. Returns the admin's id.
 */
export async function assertAdminAction(): Promise<string> {
  const { supabase, user } = await createClientWithUser();
  if (!user) throw new Error("not signed in");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("admin only");
  return user.id;
}

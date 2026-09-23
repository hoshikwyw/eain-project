"use server";

import { revalidatePath } from "next/cache";
import { profileUpdateSchema } from "@/features/auth/schemas";
import { setLocale } from "@/i18n/actions";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = { status?: "saved" | "invalid" | "error" };

export async function updateProfile(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const parsed = profileUpdateSchema.safeParse({
    displayName: formData.get("displayName"),
    locale: formData.get("locale"),
    notifyOnOpen: formData.get("notifyOnOpen") === "on",
    notifyOnResponse: formData.get("notifyOnResponse") === "on",
  });
  if (!parsed.success) return { status: "invalid" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error" };

  // RLS limits this to the user's own row; column grants limit the columns.
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      locale: parsed.data.locale,
      notify_on_open: parsed.data.notifyOnOpen,
      notify_on_response: parsed.data.notifyOnResponse,
    })
    .eq("id", user.id);

  if (error) return { status: "error" };

  await setLocale(parsed.data.locale);
  revalidatePath("/dashboard", "layout");
  return { status: "saved" };
}

"use server";

import { revalidatePath } from "next/cache";
import { avatarUpdateSchema, profileUpdateSchema } from "@/features/auth/schemas";
import { providerPhoto, serializeAvatar, type AvatarPalette } from "@/features/profile/avatar";
import { setLocale } from "@/i18n/actions";
import { createClientWithUser } from "@/lib/supabase/server";

export type ProfileFormState = { status?: "saved" | "invalid" | "error" };
export type AvatarFormState = { status?: "saved" | "invalid" | "error" };

/**
 * Saves the account's picture: a drawn one (style, palette, seed) or the
 * photo from the sign-in provider. The photo URL comes from the auth
 * metadata on the server, never from the form, so nothing foreign lands in
 * the column.
 */
export async function updateAvatar(
  _prev: AvatarFormState,
  formData: FormData,
): Promise<AvatarFormState> {
  const { supabase, user } = await createClientWithUser();
  if (!user) return { status: "error" };

  let value: string;
  if (formData.get("mode") === "photo") {
    const photo = providerPhoto(user.user_metadata);
    if (!photo) return { status: "invalid" };
    value = photo;
  } else {
    const parsed = avatarUpdateSchema.safeParse({
      variant: formData.get("variant"),
      palette: formData.get("palette"),
      seed: formData.get("seed"),
    });
    if (!parsed.success) return { status: "invalid" };
    value = serializeAvatar({
      kind: "generated",
      variant: parsed.data.variant,
      palette: parsed.data.palette as AvatarPalette,
      seed: parsed.data.seed,
    });
  }

  const { error } = await supabase.from("profiles").update({ avatar_url: value }).eq("id", user.id);
  if (error) return { status: "error" };

  revalidatePath("/dashboard", "layout");
  return { status: "saved" };
}

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const parsed = profileUpdateSchema.safeParse({
    displayName: formData.get("displayName"),
    locale: formData.get("locale"),
    notifyOnOpen: formData.get("notifyOnOpen") === "on",
    notifyOnResponse: formData.get("notifyOnResponse") === "on",
  });
  if (!parsed.success) return { status: "invalid" };

  const { supabase, user } = await createClientWithUser();
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

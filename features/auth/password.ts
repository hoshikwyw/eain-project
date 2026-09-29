"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminSiteUrl, appMode } from "@/lib/app-mode";
import { isSupabaseConfigured } from "@/lib/env";
import { checkRateLimit, clientKeyFromHeaders } from "@/lib/rate-limit";
import { getSiteOrigin } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { emailSchema, passwordSchema } from "./schemas";

export type ForgotState = { status?: "sent" | "invalid" | "rate-limited" | "notConfigured" };
export type ResetState = { status?: "invalid" | "mismatch" | "error" | "expired" };

/**
 * Sends a reset link. Always answers "sent" for a valid address, whether or
 * not an account exists, so the form cannot be used to discover accounts.
 * Rate limited per client because the free mailer allows few emails per hour.
 */
export async function requestPasswordReset(_prev: ForgotState, formData: FormData): Promise<ForgotState> {
  if (!isSupabaseConfigured()) return { status: "notConfigured" };
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { status: "invalid" };

  const allowed = await checkRateLimit(`reset:${clientKeyFromHeaders(await headers())}`, 3, 3600);
  if (!allowed) return { status: "rate-limited" };

  const supabase = await createClient();
  // Reset links return to the site the request came from, admin or user.
  const origin = appMode === "admin" && adminSiteUrl ? adminSiteUrl : await getSiteOrigin();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/auth/reset")}`,
  });
  return { status: "sent" };
}

/** Sets a new password for the session created by the reset link. */
export async function updatePassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const parsed = z
    .object({ password: passwordSchema, confirm: z.string() })
    .safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { status: "invalid" };
  if (parsed.data.password !== parsed.data.confirm) return { status: "mismatch" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "expired" };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { status: "error" };
  redirect("/dashboard?notice=passwordUpdated");
}

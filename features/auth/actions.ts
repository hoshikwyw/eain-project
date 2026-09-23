"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/paths";
import { signInSchema, signUpSchema, type AuthFormState } from "./schemas";

async function siteOrigin(): Promise<string> {
  if (publicEnv.NEXT_PUBLIC_SITE_URL) return publicEnv.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:5173";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function fieldValues(formData: FormData) {
  return {
    displayName: String(formData.get("displayName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
}

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return { error: "notConfigured" };

  const values = fieldValues(formData);
  const parsed = signUpSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "invalid", fields: { displayName: values.displayName, email: values.email } };
  }

  const supabase = await createClient();
  const locale = await getLocale();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.displayName, locale } },
  });

  if (error) {
    const exists = error.code === "user_already_exists" || /already/i.test(error.message);
    return { error: exists ? "exists" : "unknown", fields: { displayName: values.displayName, email: values.email } };
  }

  // With email confirmation off, a session is returned and the user is in.
  // If confirmation is on in the Supabase dashboard, identities are empty
  // and we send them to login with a notice.
  if (!data.session) redirect("/auth/login?notice=confirm");

  redirect(safeNextPath(String(formData.get("next") ?? "")));
}

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return { error: "notConfigured" };

  const values = fieldValues(formData);
  const parsed = signInSchema.safeParse(values);
  if (!parsed.success) return { error: "invalid", fields: { email: values.email } };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "credentials", fields: { email: values.email } };

  redirect(safeNextPath(String(formData.get("next") ?? "")));
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) redirect("/auth/login?notice=notConfigured");

  const next = safeNextPath(String(formData.get("next") ?? ""));
  const supabase = await createClient();
  const origin = await siteOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });

  if (error || !data.url) redirect("/auth/login?notice=oauthFailed");
  redirect(data.url);
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

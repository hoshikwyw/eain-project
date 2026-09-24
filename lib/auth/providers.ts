import { isSupabaseConfigured, requireSupabasePublicEnv } from "@/lib/env";

export type AuthProviders = { google: boolean; emailConfirmationOn: boolean };

/**
 * Reads which sign-in methods Supabase Auth has enabled, so the login page
 * only shows buttons that work. Public endpoint, cached for five minutes.
 */
export async function getAuthProviders(): Promise<AuthProviders> {
  if (!isSupabaseConfigured()) return { google: false, emailConfirmationOn: false };
  const { url, anonKey } = requireSupabasePublicEnv();
  try {
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: anonKey },
      next: { revalidate: 300 },
    });
    if (!res.ok) return { google: false, emailConfirmationOn: false };
    const json = (await res.json()) as { external?: { google?: boolean }; mailer_autoconfirm?: boolean };
    return { google: Boolean(json.external?.google), emailConfirmationOn: json.mailer_autoconfirm === false };
  } catch {
    return { google: false, emailConfirmationOn: false };
  }
}

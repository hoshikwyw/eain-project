import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabasePublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Runs as the signed-in user (anon key + session cookie), so RLS applies.
 */
export async function createClient() {
  const { url, anonKey } = requireSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component: cookies are read-only there.
          // proxy.ts refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * The server client together with who is signed in: `user` is null when
 * nobody is. The token is checked with Supabase Auth, not just read from the
 * cookie, so `user` can be trusted for access decisions.
 */
export async function createClientWithUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : data.user };
}

/** Who is signed in, or null. */
export async function getCurrentUser() {
  return (await createClientWithUser()).user;
}

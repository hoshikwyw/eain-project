import "server-only";
import { cookies } from "next/headers";

/**
 * Whether this visitor carries a sign-in cookie, without asking Supabase.
 * Good enough to choose between "Log in" and "My gifts" on public pages:
 * if the session has quietly expired, the dashboard link simply leads to the
 * login page. Never use it to decide what someone may see; that is RLS and
 * the server's own checks.
 */
export async function hasSessionCookie(): Promise<boolean> {
  const store = await cookies();
  return store.getAll().some((c) => /^sb-.+-auth-token(\.\d+)?$/.test(c.name) && c.value !== "");
}

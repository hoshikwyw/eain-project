import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/server";

/**
 * Return URL for Google sign-in and password-reset links (PKCE).
 * Exchanges the code for a session cookie, then continues to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // Reset links fail when opened on another device or after expiry.
  if (next === "/auth/reset") return NextResponse.redirect(`${origin}/auth/forgot?notice=expired`);
  return NextResponse.redirect(`${origin}/auth/login?notice=oauthFailed`);
}

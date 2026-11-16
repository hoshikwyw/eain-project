import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/server";

/**
 * Return URL for links made by the older email templates ({{ .ConfirmationURL }}),
 * which pass through the Supabase host and only work in the browser that
 * asked for them (PKCE). Kept so emails already sent keep working; new
 * templates link to /auth/confirm instead. Exchanges the code for a session
 * cookie, then continues to `next`.
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

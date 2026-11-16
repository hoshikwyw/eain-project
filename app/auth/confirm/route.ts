import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { AFTER_CONFIRM_COOKIE, safeNextPath } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/server";

/** The email link kinds Supabase can send. Anything else is refused. */
const EMAIL_LINK_TYPES: readonly EmailOtpType[] = [
  "signup",
  "email",
  "recovery",
  "invite",
  "magiclink",
  "email_change",
];

/**
 * Where the links in Supabase's emails land: confirmation after sign-up and
 * password reset. The email templates point here on our own domain with a
 * token hash (docs/SETUP.md, "Email links"), so the browser never visits the
 * Supabase host, which some networks (Myanmar among them) cannot reach. The
 * server checks the hash with Supabase, sets the session cookie, and sends
 * the person on. Unlike the old redirect links, these work on any device.
 *
 * After sign-up the destination (such as the guest handoff) is remembered in
 * a short-lived cookie, because the template cannot carry it per person.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const cookieStore = await cookies();
  const remembered = cookieStore.get(AFTER_CONFIRM_COOKIE)?.value;
  cookieStore.delete(AFTER_CONFIRM_COOKIE);
  const next =
    type === "recovery" ? "/auth/reset" : safeNextPath(searchParams.get("next") ?? remembered);

  if (tokenHash && type && EMAIL_LINK_TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // Links expire and work only once.
  if (type === "recovery") return NextResponse.redirect(`${origin}/auth/forgot?notice=expired`);
  return NextResponse.redirect(
    `${origin}/auth/login?notice=linkExpired&next=${encodeURIComponent(next)}`,
  );
}

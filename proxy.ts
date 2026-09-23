import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth/paths";
import { updateSession } from "@/lib/supabase/proxy-session";

const PROTECTED_PREFIXES = ["/dashboard", "/create", "/admin"];
const AUTH_PAGES = ["/auth/login", "/auth/signup"];

/**
 * Runs before protected and auth routes.
 * - Keeps the Supabase session fresh.
 * - Sends signed-out visitors to login, remembering where they were going.
 * - Sends signed-in visitors away from the login and signup pages.
 * Authorization itself is enforced by RLS and server code, not here.
 */
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (isProtected && !user) {
    const login = request.nextUrl.clone();
    login.pathname = "/auth/login";
    login.search = "";
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  if (isAuthPage && user) {
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(next, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/create/:path*", "/admin/:path*", "/auth/login", "/auth/signup"],
};

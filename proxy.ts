import { NextResponse, type NextRequest } from "next/server";
import { adminSiteUrl, appMode, isAdminPath } from "@/lib/app-mode";
import { safeNextPath } from "@/lib/auth/paths";
import { updateSession } from "@/lib/supabase/proxy-session";

const PROTECTED_PREFIXES = ["/dashboard", "/create", "/admin"];
const AUTH_PAGES = ["/auth/login", "/auth/signup"];
/** Only these paths need the Supabase session refreshed; gift pages never do. */
const SESSION_PREFIXES = [...PROTECTED_PREFIXES, ...AUTH_PAGES, "/auth/reset"];

const startsWithAny = (pathname: string, prefixes: string[]) =>
  prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/**
 * Runs before every page request (static files are excluded by the matcher).
 * 1. Splits the sites when EAIN_APP_MODE is set:
 *    - admin site serves only /admin, /auth and /api; everything else goes to /admin.
 *    - user site sends /admin to the admin site.
 * 2. Keeps the Supabase session fresh on account pages.
 * 3. Sends signed-out visitors to login, and signed-in visitors away from login.
 * Authorization itself is enforced by RLS and server code, not here.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (appMode === "admin") {
    const allowed = isAdminPath(pathname) || pathname.startsWith("/auth/") || pathname.startsWith("/api/");
    if (!allowed) return NextResponse.redirect(new URL("/admin", request.url));
    if (pathname === "/auth/signup") return NextResponse.redirect(new URL("/auth/login", request.url));
  } else if (appMode === "user" && adminSiteUrl && isAdminPath(pathname)) {
    return NextResponse.redirect(new URL(pathname + search, adminSiteUrl));
  }

  if (!startsWithAny(pathname, SESSION_PREFIXES)) return NextResponse.next();

  const { response, user } = await updateSession(request);
  const home = appMode === "admin" ? "/admin" : "/dashboard";

  if (startsWithAny(pathname, PROTECTED_PREFIXES) && !user) {
    const login = request.nextUrl.clone();
    login.pathname = "/auth/login";
    login.search = "";
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  if (AUTH_PAGES.includes(pathname) && user) {
    const requested = request.nextUrl.searchParams.get("next");
    const next = requested ? safeNextPath(requested) : home;
    return NextResponse.redirect(new URL(next, request.url));
  }

  // The reset page only works with the session a reset link creates.
  if (pathname === "/auth/reset" && !user) {
    return NextResponse.redirect(new URL("/auth/forgot?notice=expired", request.url));
  }

  return response;
}

export const config = {
  // Everything except Next internals and files with an extension (images, icons, robots.txt, sitemap.xml).
  matcher: ["/((?!_next/|__nextjs|.*\\.[a-zA-Z0-9]+$).*)"],
};

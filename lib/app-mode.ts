/**
 * Eain can run as one site or as two:
 *   user  - the public site and creator dashboard (localhost:5173)
 *   admin - the admin console only (localhost:5174)
 *   all   - everything on one origin (default, e.g. a single deployment)
 *
 * EAIN_APP_MODE is set by scripts/dev.mjs and is only read on the server
 * and in proxy.ts. The two site URLs are public so client components can
 * link across.
 */
export type AppMode = "user" | "admin" | "all";

const raw = process.env.EAIN_APP_MODE;
export const appMode: AppMode = raw === "user" || raw === "admin" ? raw : "all";

const trim = (v: string | undefined) => (v ?? "").replace(/\/$/, "");

/** Absolute origin of the user site, or "" to stay on the current origin. */
export const userSiteUrl = trim(process.env.NEXT_PUBLIC_SITE_URL);
/** Absolute origin of the admin site, or "" to stay on the current origin. */
export const adminSiteUrl = trim(process.env.NEXT_PUBLIC_ADMIN_SITE_URL);

export const userHref = (path: string) => `${userSiteUrl}${path}`;
export const adminHref = (path: string) => `${adminSiteUrl}${path}`;

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

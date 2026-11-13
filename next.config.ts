import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const baseSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Animated scenes (public/scenes) are static pages shown inside a frame on
// the gift page and in the editor, so this site, and only this site, may
// frame them. They hold no gift content of their own and are not for search.
const scenePageHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

// Gift links carry a secret token in the URL. Never leak it through the
// Referer header and never let search engines index it.
const giftPageHeaders = [
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

// Photos live in a private Supabase bucket. Browsers never fetch them from
// the Supabase host, which some networks (Myanmar among them) cannot reach;
// they ask this site for /media/... and the request is forwarded here. The
// signature token travels in the query string, which a rewrite keeps, so
// access rules are unchanged. features/gifts/media.ts writes these URLs.
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const mediaHeaders = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The admin dev server (scripts/dev.mjs admin) builds into its own folder
  // so it can run beside the user site without sharing a cache.
  distDir: process.env.EAIN_DIST_DIR || ".next",
  async headers() {
    return [
      { source: "/:path*", headers: baseSecurityHeaders },
      { source: "/g/:path*", headers: giftPageHeaders },
      { source: "/r/:path*", headers: giftPageHeaders },
      { source: "/scenes/:path*", headers: scenePageHeaders },
      { source: "/media/:path*", headers: mediaHeaders },
    ];
  },
  async rewrites() {
    if (!supabaseUrl) return [];
    return [{ source: "/media/:path*", destination: `${supabaseUrl}/storage/v1/:path*` }];
  },
};

export default withNextIntl(nextConfig);

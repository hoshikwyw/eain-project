import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const baseSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Gift links carry a secret token in the URL. Never leak it through the
// Referer header and never let search engines index it.
const giftPageHeaders = [
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

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
    ];
  },
};

export default withNextIntl(nextConfig);

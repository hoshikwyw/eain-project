import type { MetadataRoute } from "next";
import { appMode } from "@/lib/app-mode";
import { publicEnv } from "@/lib/env";

/** The readers that fetch a shared link to show its preview in a chat or a post. */
const PREVIEW_BOTS = [
  "facebookexternalhit",
  "Facebot",
  "Twitterbot",
  "TelegramBot",
  "WhatsApp",
  "Viber",
  "Slackbot",
  "Discordbot",
  "LinkedInBot",
];

/** Gift links are private by token and must never be crawled or indexed by search engines. */
export default function robots(): MetadataRoute.Robots {
  // The admin console, when it runs as its own site, is closed to crawlers altogether.
  if (appMode === "admin") return { rules: [{ userAgent: "*", disallow: "/" }] };
  const origin = (publicEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5173").replace(/\/$/, "");
  const privatePages = ["/dashboard/", "/create/", "/admin/", "/api/", "/auth/"];
  return {
    rules: [
      // Chat and social apps read a gift link only to draw its preview card.
      // Some of them obey robots.txt, so they are let in to gift pages; those
      // pages still tell every reader not to index them.
      { userAgent: PREVIEW_BOTS, allow: "/", disallow: privatePages },
      { userAgent: "*", allow: "/", disallow: ["/g/", "/r/", ...privatePages] },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}

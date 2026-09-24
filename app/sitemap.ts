import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

/** Public marketing pages only. Gift, dashboard and admin routes are never listed. */
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = (publicEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5173").replace(/\/$/, "");
  const now = new Date();
  return [
    { url: `${origin}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/templates`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${origin}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${origin}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${origin}/security`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${origin}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${origin}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}

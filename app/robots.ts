import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

/** Gift links are private by token and must never be crawled or indexed. */
export default function robots(): MetadataRoute.Robots {
  const origin = (publicEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5173").replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/g/", "/r/", "/dashboard/", "/create/", "/admin/", "/api/", "/auth/"] }],
    sitemap: `${origin}/sitemap.xml`,
  };
}

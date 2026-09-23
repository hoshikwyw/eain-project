import { headers } from "next/headers";
import { publicEnv } from "@/lib/env";

/** Public origin for building share links. Env first, then the request host. */
export async function getSiteOrigin(): Promise<string> {
  if (publicEnv.NEXT_PUBLIC_SITE_URL) return publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:5173";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function giftShareUrl(origin: string, token: string): string {
  return `${origin}/g/${token}`;
}

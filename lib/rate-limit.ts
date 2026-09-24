import "server-only";

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Privacy-friendly client key: the IP is hashed with a salt that changes
 * daily, so nothing stored can be traced back to a visitor later.
 */
export function clientKey(request: Request): string {
  return clientKeyFromHeaders(request.headers);
}

/** Same key derivation for Server Actions, which see headers() but no Request. */
export function clientKeyFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-16) ?? "eain";
  return createHash("sha256").update(`${ip}|${day}|${salt}`).digest("base64url").slice(0, 32);
}

/** Fixed window counter in Postgres. Fails open on database errors. */
export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("check_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) return true;
  return data === true;
}

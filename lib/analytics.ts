import "server-only";

import { createHash } from "node:crypto";

/**
 * Minimal, privacy-friendly product analytics. Server-side only, so no
 * third-party script runs in anyone's browser. Off unless
 * NEXT_PUBLIC_POSTHOG_KEY is set. Never sends gift content, names or emails;
 * the distinct id is a salted hash of the user id.
 */
export type ProductEvent =
  | "gift_created"
  | "gift_published"
  | "gift_shared"
  | "gift_opened"
  | "response_submitted"
  | "template_unlocked"
  | "signup";

export async function track(event: ProductEvent, userId: string | null, properties: Record<string, string | number | boolean> = {}) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com").replace(/\/$/, "");
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-16) ?? "eain";
  const distinctId = userId ? createHash("sha256").update(`${userId}|${salt}`).digest("base64url").slice(0, 24) : "anonymous";
  try {
    await fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: key, event, distinct_id: distinctId, properties: { ...properties, $lib: "eain-server" } }),
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // Analytics must never affect the product.
  }
}

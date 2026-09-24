"use server";

import { headers } from "next/headers";
import { isSupabaseConfigured } from "@/lib/env";
import { checkRateLimit, clientKeyFromHeaders } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { reportSchema, type ReportState } from "./schemas";

/**
 * Anyone with a gift link can report it. No account needed.
 * Authorization: the share token. Rate limited per client. Stores only the
 * reason and free text; the reporter id is set only when someone is signed in.
 */
export async function submitReport(token: string, _prev: ReportState, formData: FormData): Promise<ReportState> {
  if (!isSupabaseConfigured() || !/^[A-Za-z0-9_-]{40,64}$/.test(token)) return { status: "not-found" };

  const parsed = reportSchema.safeParse({ reason: formData.get("reason"), details: formData.get("details") ?? "" });
  if (!parsed.success) return { status: "invalid" };

  const allowed = await checkRateLimit(`report:${clientKeyFromHeaders(await headers())}`, 5, 3600);
  if (!allowed) return { status: "rate-limited" };

  const admin = createAdminClient();
  const { data: gift } = await admin.from("gifts").select("id").eq("share_token", token).neq("status", "deleted").maybeSingle();
  if (!gift) return { status: "not-found" };

  let reporterId: string | null = null;
  try {
    const supabase = await createClient();
    reporterId = (await supabase.auth.getUser()).data.user?.id ?? null;
  } catch {
    reporterId = null;
  }

  const { error } = await admin.from("reports").insert({
    gift_id: gift.id,
    reporter_id: reporterId,
    reason: parsed.data.reason,
    details: parsed.data.details,
  });
  return { status: error ? "error" : "sent" };
}

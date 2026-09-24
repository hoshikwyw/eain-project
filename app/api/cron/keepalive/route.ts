import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/cron/keepalive
 * Supabase pauses free projects after a week without requests. Vercel calls
 * this once a day (see vercel.json). Authorization: the CRON_SECRET bearer
 * token Vercel sends. Also expires stale rate-limit counters while here.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("categories").select("id", { count: "exact", head: true });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await admin.from("rate_limits").delete().lt("window_started_at", cutoff);

  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}

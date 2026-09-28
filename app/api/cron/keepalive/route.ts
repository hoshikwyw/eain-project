import { NextResponse } from "next/server";
import { MEDIA_BUCKET } from "@/features/gifts/media";
import { createAdminClient } from "@/lib/supabase/admin";

/** Deleted gifts keep their content this long before it is removed for good. */
const DELETED_GRACE_DAYS = 30;
const PURGE_BATCH = 50;

/**
 * GET /api/cron/keepalive, called once a day by Vercel (see vercel.json).
 * Authorization: the CRON_SECRET bearer token Vercel sends.
 *  1. Touches the database so the free Supabase project never pauses.
 *  2. Clears rate-limit counters older than a day.
 *  3. Permanently removes gifts deleted more than 30 days ago: photos from
 *     storage first, then the gift row, which cascades to sections,
 *     recipients, questions, replies and events. This is the grace period
 *     the privacy page promises.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("categories").select("id", { count: "exact", head: true });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await admin.from("rate_limits").delete().lt("window_started_at", dayAgo);

  const cutoff = new Date(Date.now() - DELETED_GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: expired } = await admin
    .from("gifts")
    .select("id")
    .eq("status", "deleted")
    .lt("deleted_at", cutoff)
    .limit(PURGE_BATCH);

  let purgedGifts = 0;
  let purgedPhotos = 0;
  for (const gift of expired ?? []) {
    const { data: media } = await admin.from("gift_media").select("storage_path, thumb_path").eq("gift_id", gift.id);
    const paths = (media ?? []).flatMap((m) => [m.storage_path, m.thumb_path].filter((p): p is string => Boolean(p)));
    if (paths.length) {
      const { error: storageError } = await admin.storage.from(MEDIA_BUCKET).remove(paths);
      if (storageError) continue; // Keep the row so the next run retries the files.
      purgedPhotos += paths.length;
    }
    const { error: deleteError } = await admin.from("gifts").delete().eq("id", gift.id);
    if (!deleteError) purgedGifts += 1;
  }

  return NextResponse.json({ ok: true, at: new Date().toISOString(), purgedGifts, purgedPhotos });
}

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { MediaItem } from "./schemas";

export const MEDIA_BUCKET = "gift-media";
const SIGNED_URL_SECONDS = 60 * 60;

type MediaRow = {
  id: string;
  storage_path: string;
  thumb_path: string | null;
  width: number | null;
  height: number | null;
};

/**
 * Signs read URLs for a set of media rows. Storage is private, so every
 * image the editor or a receiver sees goes through a one-hour signed URL.
 * Callers are responsible for having authorised access to these rows.
 */
export async function signMedia(rows: MediaRow[]): Promise<Record<string, MediaItem>> {
  if (rows.length === 0) return {};
  const admin = createAdminClient();
  const paths = rows.flatMap((r) => [r.storage_path, r.thumb_path ?? r.storage_path]);
  const { data } = await admin.storage.from(MEDIA_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
  const urlByPath = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));

  const out: Record<string, MediaItem> = {};
  for (const r of rows) {
    const url = urlByPath.get(r.storage_path);
    if (!url) continue;
    out[r.id] = {
      id: r.id,
      url,
      thumbUrl: urlByPath.get(r.thumb_path ?? r.storage_path) ?? url,
      width: r.width,
      height: r.height,
    };
  }
  return out;
}

export async function removeMediaObjects(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const admin = createAdminClient();
  await admin.storage.from(MEDIA_BUCKET).remove(paths);
}

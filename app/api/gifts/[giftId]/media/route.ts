import { NextResponse } from "next/server";
import { z } from "zod";
import { MEDIA_BUCKET, removeMediaObjects, signMedia } from "@/features/gifts/media";
import { MAX_PHOTOS_PER_GIFT } from "@/features/gifts/schemas";
import {
  MAX_DIMENSION,
  MAX_THUMB_BYTES,
  MAX_UPLOAD_BYTES,
  extensionFor,
  sniffImageType,
} from "@/lib/media-validate";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ giftId: string }> };

/**
 * Photo upload for a gift the signed-in user owns.
 * Authentication: required (session cookie). Authorization: RLS on the gift.
 * Input: multipart with `file`, `thumb`, `width`, `height`. Bytes are checked
 * for a real JPEG, PNG or WebP signature; size, dimensions and the per-gift
 * count are enforced here, then the object is written to the private bucket.
 */
export async function POST(request: Request, { params }: Ctx) {
  const { giftId } = await params;
  if (!z.uuid().safeParse(giftId).success) return NextResponse.json({ error: "bad-request" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: gift } = await supabase
    .from("gifts")
    .select("id")
    .eq("id", giftId)
    .neq("status", "deleted")
    .maybeSingle();
  if (!gift) return NextResponse.json({ error: "not-found" }, { status: 404 });

  const { count } = await supabase.from("gift_media").select("id", { count: "exact", head: true }).eq("gift_id", giftId);
  if ((count ?? 0) >= MAX_PHOTOS_PER_GIFT) return NextResponse.json({ error: "limit" }, { status: 409 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  const file = form.get("file");
  const thumb = form.get("thumb");
  const width = Number(form.get("width"));
  const height = Number(form.get("height"));
  if (!(file instanceof Blob) || !(thumb instanceof Blob)) {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_UPLOAD_BYTES || thumb.size === 0 || thumb.size > MAX_THUMB_BYTES) {
    return NextResponse.json({ error: "too-large" }, { status: 413 });
  }
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > MAX_DIMENSION || height > MAX_DIMENSION) {
    return NextResponse.json({ error: "bad-dimensions" }, { status: 400 });
  }

  const fileBytes = new Uint8Array(await file.arrayBuffer());
  const thumbBytes = new Uint8Array(await thumb.arrayBuffer());
  const mime = sniffImageType(fileBytes);
  const thumbMime = sniffImageType(thumbBytes);
  if (!mime || !thumbMime) return NextResponse.json({ error: "not-image" }, { status: 415 });

  const mediaId = crypto.randomUUID();
  const ext = extensionFor(mime);
  const base = `${user.id}/${giftId}/${mediaId}`;
  const storagePath = `${base}.${ext}`;
  const thumbPath = `${base}_thumb.${extensionFor(thumbMime)}`;

  const admin = createAdminClient();
  const bucket = admin.storage.from(MEDIA_BUCKET);
  const [main, small] = await Promise.all([
    bucket.upload(storagePath, fileBytes, { contentType: mime, upsert: false, cacheControl: "31536000" }),
    bucket.upload(thumbPath, thumbBytes, { contentType: thumbMime, upsert: false, cacheControl: "31536000" }),
  ]);
  if (main.error || small.error) {
    await removeMediaObjects([storagePath, thumbPath]);
    return NextResponse.json({ error: "storage" }, { status: 500 });
  }

  // The row insert runs as the user: RLS and the per-gift trigger apply.
  const { data: row, error } = await supabase
    .from("gift_media")
    .insert({
      id: mediaId,
      gift_id: giftId,
      owner_id: user.id,
      storage_path: storagePath,
      thumb_path: thumbPath,
      mime_type: mime,
      bytes: fileBytes.byteLength,
      width,
      height,
    })
    .select("id, storage_path, thumb_path, width, height")
    .single();

  if (error || !row) {
    await removeMediaObjects([storagePath, thumbPath]);
    const limit = error?.message.includes("photo limit");
    return NextResponse.json({ error: limit ? "limit" : "database" }, { status: limit ? 409 : 500 });
  }

  const signed = await signMedia([row]);
  return NextResponse.json(signed[row.id], { status: 201 });
}

/** Removes one photo the user owns. Body: { mediaId }. */
export async function DELETE(request: Request, { params }: Ctx) {
  const { giftId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
  const parsed = z.object({ mediaId: z.uuid() }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "bad-request" }, { status: 400 });

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("gift_media")
    .select("id, storage_path, thumb_path")
    .eq("id", parsed.data.mediaId)
    .eq("gift_id", giftId)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: "not-found" }, { status: 404 });

  const { error } = await supabase.from("gift_media").delete().eq("id", row.id);
  if (error) return NextResponse.json({ error: "database" }, { status: 500 });

  await removeMediaObjects([row.storage_path, ...(row.thumb_path ? [row.thumb_path] : [])]);
  return NextResponse.json({ ok: true });
}

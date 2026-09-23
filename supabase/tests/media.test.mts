/**
 * Photo upload route test against the live project and a running dev server.
 * Signs in a throwaway user, builds the Supabase session cookie the way
 * @supabase/ssr stores it, and exercises /api/gifts/[giftId]/media.
 *
 * Run:  pnpm test:media   (dev server must be running on port 5173)
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createClient, type Session } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5173";
const projectRef = new URL(url).hostname.split(".")[0]!;

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const user = createClient(url, anonKey, { auth: { persistSession: false } });

// A real 1x1 PNG. The route sniffs bytes, so a fake extension is not enough.
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

let userId: string;
let giftId: string;
let cookie: string;
let token: string;
let mediaId: string;

/** Mirrors @supabase/ssr cookie storage: base64url JSON, chunked at 3180 chars. */
function sessionCookie(session: Session): string {
  const name = `sb-${projectRef}-auth-token`;
  const value = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
  if (value.length <= 3180) return `${name}=${value}`;
  const parts: string[] = [];
  for (let i = 0; i * 3180 < value.length; i++) parts.push(`${name}.${i}=${value.slice(i * 3180, (i + 1) * 3180)}`);
  return parts.join("; ");
}

function upload(body: FormData) {
  return fetch(`${site}/api/gifts/${giftId}/media`, { method: "POST", body, headers: { cookie } });
}

const part = (x: Buffer | string): BlobPart => (typeof x === "string" ? x : new Uint8Array(x));

function form(file: Buffer | string, thumb: Buffer | string = PNG_1X1, width = 1, height = 1) {
  const f = new FormData();
  f.set("file", new Blob([part(file)]), "photo");
  f.set("thumb", new Blob([part(thumb)]), "thumb");
  f.set("width", String(width));
  f.set("height", String(height));
  return f;
}

describe("photo uploads", () => {
  before(async () => {
    const email = `media-${Date.now()}@example.com`;
    const password = `Test-${Math.random().toString(36).slice(2)}-pass`;
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) throw error ?? new Error("createUser failed");
    userId = data.user.id;
    const signIn = await user.auth.signInWithPassword({ email, password });
    if (signIn.error || !signIn.data.session) throw signIn.error ?? new Error("no session");
    cookie = sessionCookie(signIn.data.session);

    const { data: template } = await user.from("templates").select("id").eq("slug", "miss-you").single();
    const { data: gift } = await user
      .from("gifts")
      .insert({ sender_id: userId, template_id: template!.id, title: "Media gift" })
      .select("id, share_token")
      .single();
    giftId = gift!.id;
    token = gift!.share_token;
  });

  after(async () => {
    if (userId) {
      const { data: rows } = await admin.from("gift_media").select("storage_path, thumb_path").eq("owner_id", userId);
      const paths = (rows ?? []).flatMap((r) => [r.storage_path, r.thumb_path].filter(Boolean) as string[]);
      if (paths.length) await admin.storage.from("gift-media").remove(paths);
      await admin.auth.admin.deleteUser(userId);
    }
  });

  it("rejects unauthenticated uploads", async () => {
    const res = await fetch(`${site}/api/gifts/${giftId}/media`, { method: "POST", body: form(PNG_1X1) });
    assert.equal(res.status, 401);
  });

  it("rejects files that are not real images", async () => {
    const res = await upload(form("hello, not an image at all, padded............", PNG_1X1));
    assert.equal(res.status, 415);
  });

  it("rejects bad dimensions", async () => {
    const res = await upload(form(PNG_1X1, PNG_1X1, 9000, 1));
    assert.equal(res.status, 400);
  });

  it("accepts a real image and returns a signed url", async () => {
    const res = await upload(form(PNG_1X1));
    const text = await res.text();
    assert.equal(res.status, 201, text);
    const body = JSON.parse(text) as { id: string; url: string; thumbUrl: string };
    mediaId = body.id;
    assert.ok(body.url.includes("/storage/v1/object/sign/"), "must be a signed url");
    const img = await fetch(body.url);
    assert.equal(img.status, 200);

    const { data: row } = await user.from("gift_media").select("owner_id, gift_id, mime_type, bytes").eq("id", mediaId).single();
    assert.deepEqual(row, { owner_id: userId, gift_id: giftId, mime_type: "image/png", bytes: PNG_1X1.byteLength });
  });

  it("the private bucket has no public url", async () => {
    const { data: row } = await admin.from("gift_media").select("storage_path").eq("id", mediaId).single();
    const publicUrl = `${url}/storage/v1/object/public/gift-media/${row!.storage_path}`;
    const res = await fetch(publicUrl);
    assert.notEqual(res.status, 200, "public path must not serve private media");
  });

  it("a photo section renders on the public page after publish", async () => {
    await user.from("gift_sections").insert([
      { gift_id: giftId, type: "text", position: 0, content: { heading: "Photo test", subheading: "" } },
      { gift_id: giftId, type: "image", position: 1, content: { mediaId, caption: "Our day" } },
    ]);
    const pub = await user.rpc("publish_gift", { p_gift_id: giftId });
    assert.equal(pub.error, null);
    const html = await (await fetch(`${site}/g/${token}`)).text();
    assert.ok(html.includes("Our day"));
    assert.ok(html.includes("/storage/v1/object/sign/"), "image should be served through a signed url");
  });

  it("enforces the per-gift photo limit", async () => {
    for (let i = 0; i < 4; i++) {
      const res = await upload(form(PNG_1X1));
      assert.equal(res.status, 201, `upload ${i + 2} should pass`);
    }
    const sixth = await upload(form(PNG_1X1));
    assert.equal(sixth.status, 409);
    const { count } = await admin.from("gift_media").select("id", { count: "exact", head: true }).eq("gift_id", giftId);
    assert.equal(count, 5);
  });

  it("another user cannot upload to or delete from this gift", async () => {
    const other = createClient(url, anonKey, { auth: { persistSession: false } });
    const email = `media-other-${Date.now()}@example.com`;
    const password = `Test-${Math.random().toString(36).slice(2)}-pass`;
    const { data } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    try {
      const signIn = await other.auth.signInWithPassword({ email, password });
      const otherCookie = sessionCookie(signIn.data.session!);
      const up = await fetch(`${site}/api/gifts/${giftId}/media`, { method: "POST", body: form(PNG_1X1), headers: { cookie: otherCookie } });
      assert.equal(up.status, 404);
      const del = await fetch(`${site}/api/gifts/${giftId}/media`, {
        method: "DELETE",
        headers: { cookie: otherCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId }),
      });
      assert.equal(del.status, 404);
    } finally {
      await admin.auth.admin.deleteUser(data.user!.id);
    }
  });

  it("the owner can delete a photo and its objects", async () => {
    const { data: row } = await admin.from("gift_media").select("storage_path").eq("id", mediaId).single();
    const res = await fetch(`${site}/api/gifts/${giftId}/media`, {
      method: "DELETE",
      headers: { cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId }),
    });
    assert.equal(res.status, 200);
    const { data: gone } = await admin.from("gift_media").select("id").eq("id", mediaId).maybeSingle();
    assert.equal(gone, null);
    const { data: signed } = await admin.storage.from("gift-media").createSignedUrl(row!.storage_path, 60);
    const fetched = signed ? await fetch(signed.signedUrl) : null;
    assert.ok(!fetched || fetched.status !== 200, "object should be removed from storage");
  });
});

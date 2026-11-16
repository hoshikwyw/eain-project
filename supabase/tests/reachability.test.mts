/**
 * Reachability: the browser must never need the Supabase host. Some networks
 * (Myanmar among them) cannot reach *.supabase.co at all, so everything the
 * browser loads, from pages to photos to the links in emails, has to come
 * from this site. This test renders the pages a visitor, a creator and a
 * receiver see, plus the scripts they load, and fails on any mention of the
 * Supabase host. Needs the dev server; point NEXT_PUBLIC_SITE_URL at the
 * production URL to check a deployment.
 * Run:  pnpm test:reachability
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createClient, type Session } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5173";
const host = new URL(url).host;
const projectRef = host.split(".")[0]!;

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const user = createClient(url, anonKey, { auth: { persistSession: false } });

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

let userId: string;
let giftId: string;
let token: string;
let cookie: string;

/** Mirrors @supabase/ssr cookie storage: base64url JSON, chunked at 3180 chars. */
function sessionCookie(session: Session): string {
  const name = `sb-${projectRef}-auth-token`;
  const value = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
  if (value.length <= 3180) return `${name}=${value}`;
  const parts: string[] = [];
  for (let i = 0; i * 3180 < value.length; i++)
    parts.push(`${name}.${i}=${value.slice(i * 3180, (i + 1) * 3180)}`);
  return parts.join("; ");
}

async function page(path: string, signedIn = false) {
  const res = await fetch(`${site}${path}`, {
    headers: signedIn ? { cookie } : {},
    redirect: "manual",
  });
  assert.equal(res.status, 200, `${path} should render (got ${res.status})`);
  return res.text();
}

/** Every script a page loads, so the check covers client bundles too. */
async function scriptsOf(html: string): Promise<string> {
  const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)]
    .map((m) => m[1]!)
    .filter((s) => s.startsWith("/"));
  const bodies = await Promise.all(srcs.map((s) => fetch(`${site}${s}`).then((r) => r.text())));
  return bodies.join("\n");
}

function assertNoSupabaseHost(what: string, text: string) {
  const at = text.indexOf(host);
  assert.equal(
    at,
    -1,
    `${what} points the browser at ${host}: …${text.slice(Math.max(0, at - 120), at + 80)}…`,
  );
}

describe("reachability without the Supabase host", () => {
  before(async () => {
    const email = `reach-${Date.now()}@example.com`;
    const password = `Test-${Math.random().toString(36).slice(2)}-pass`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) throw error ?? new Error("createUser failed");
    userId = data.user.id;
    const signIn = await user.auth.signInWithPassword({ email, password });
    if (signIn.error || !signIn.data.session) throw signIn.error ?? new Error("no session");
    cookie = sessionCookie(signIn.data.session);

    const { data: template } = await user
      .from("templates")
      .select("id")
      .eq("slug", "miss-you")
      .single();
    const { data: gift } = await user
      .from("gifts")
      .insert({ sender_id: userId, template_id: template!.id, title: "Reach me" })
      .select("id, share_token")
      .single();
    giftId = gift!.id;
    token = gift!.share_token;

    // A photo, so the gift page and the editor carry a signed image URL.
    const form = new FormData();
    form.set("file", new Blob([new Uint8Array(PNG_1X1)]), "photo");
    form.set("thumb", new Blob([new Uint8Array(PNG_1X1)]), "thumb");
    form.set("width", "1");
    form.set("height", "1");
    const up = await fetch(`${site}/api/gifts/${giftId}/media`, {
      method: "POST",
      body: form,
      headers: { cookie },
    });
    const uploaded = await up.text();
    assert.equal(up.status, 201, uploaded);
    const media = JSON.parse(uploaded) as { id: string; url: string };
    assertNoSupabaseHost("the upload response", media.url);
    await user.from("gift_sections").insert([
      { gift_id: giftId, type: "text", position: 0, content: { heading: "Hi", subheading: "" } },
      { gift_id: giftId, type: "image", position: 1, content: { mediaId: media.id, caption: "" } },
    ]);
    const pub = await user.rpc("publish_gift", { p_gift_id: giftId });
    assert.equal(pub.error, null);
  });

  after(async () => {
    if (!userId) return;
    const { data: rows } = await admin
      .from("gift_media")
      .select("storage_path, thumb_path")
      .eq("owner_id", userId);
    const paths = (rows ?? []).flatMap(
      (r) => [r.storage_path, r.thumb_path].filter(Boolean) as string[],
    );
    if (paths.length) await admin.storage.from("gift-media").remove(paths);
    await admin.auth.admin.deleteUser(userId);
  });

  it("public pages: home, templates, a template page, try, sign-in pages", async () => {
    for (const path of [
      "/",
      "/templates",
      "/templates/miss-you",
      "/try/miss-you",
      "/auth/login",
      "/auth/signup",
      "/auth/forgot",
    ]) {
      const html = await page(path);
      assertNoSupabaseHost(path, html);
    }
  });

  it("the receiver page with a photo", async () => {
    const html = await page(`/g/${token}`);
    assert.ok(html.includes("/media/object/sign/"), "the photo is there, through this site");
    assertNoSupabaseHost(`/g/${token}`, html);
  });

  it("creator pages: dashboard, gifts, the editor, points, settings", async () => {
    for (const path of [
      "/dashboard",
      "/dashboard/gifts",
      `/dashboard/gifts/${giftId}`,
      `/create/${giftId}`,
      "/create",
      "/dashboard/points",
      "/dashboard/settings",
    ]) {
      const html = await page(path, true);
      assertNoSupabaseHost(path, html);
    }
  });

  it("the scripts those pages load", async () => {
    for (const [path, signedIn] of [
      ["/", false],
      ["/auth/login", false],
      [`/g/${token}`, false],
      [`/create/${giftId}`, true],
    ] as const) {
      const html = await page(path, signedIn);
      assertNoSupabaseHost(`a script on ${path}`, await scriptsOf(html));
    }
  });

  it("the photo itself comes through this site", async () => {
    const html = await page(`/g/${token}`);
    // The closed gift page carries the photo in its serialized props, not an <img> yet.
    const src = html
      .match(/\/media\/object\/sign\/[^"\\\s<]+/)?.[0]
      ?.replaceAll("\\u0026", "&")
      .replaceAll("&amp;", "&");
    assert.ok(src, "an image URL on the gift page");
    const img = await fetch(`${site}${src}`);
    assert.equal(img.status, 200);
    assert.match(img.headers.get("content-type") ?? "", /^image\//);
  });
});

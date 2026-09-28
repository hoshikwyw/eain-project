/**
 * Pre-launch fixes: forgot-password pages, the "shared" timeline step, and
 * the daily purge of deleted gifts. Needs the dev server and CRON_SECRET.
 * Run:  pnpm test:part3
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const cronSecret = process.env.CRON_SECRET;
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5173";

const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const PNG_1X1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

async function makeUser(tag: string) {
  const email = `part3-${tag}-${Date.now()}@example.com`;
  const password = `Test-${Math.random().toString(36).slice(2)}-pass`;
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw error ?? new Error("createUser failed");
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  await client.auth.signInWithPassword({ email, password });
  return { id: data.user.id, client };
}

let owner: Awaited<ReturnType<typeof makeUser>>;
let other: Awaited<ReturnType<typeof makeUser>>;
let templateId: string;

describe("pre-launch fixes", () => {
  before(async () => {
    owner = await makeUser("owner");
    other = await makeUser("other");
    const { data } = await owner.client.from("templates").select("id").eq("slug", "thank-you").single();
    templateId = data!.id;
  });

  after(async () => {
    for (const u of [owner, other]) if (u) await service.auth.admin.deleteUser(u.id).catch(() => undefined);
  });

  it("login links to the forgot-password page, which renders a form", async () => {
    const login = await (await fetch(`${site}/auth/login`)).text();
    assert.ok(login.includes('href="/auth/forgot"'));
    const forgot = await fetch(`${site}/auth/forgot`);
    assert.equal(forgot.status, 200);
    assert.ok((await forgot.text()).includes('name="email"'));
  });

  it("the reset page without a session sends people back to request a link", async () => {
    const res = await fetch(`${site}/auth/reset`, { redirect: "manual" });
    assert.ok([303, 307, 308].includes(res.status), `status ${res.status}`);
    assert.ok((res.headers.get("location") ?? "").includes("/auth/forgot?notice=expired"));
  });

  it("an expired reset link lands on the forgot page with a notice", async () => {
    const res = await fetch(`${site}/auth/callback?code=bogus&next=%2Fauth%2Freset`, { redirect: "manual" });
    assert.ok((res.headers.get("location") ?? "").includes("/auth/forgot?notice=expired"));
  });

  it("shared is recorded once, only for the owner of a published gift", async () => {
    const { data: gift } = await owner.client.from("gifts").insert({ sender_id: owner.id, template_id: templateId, title: "Share me" }).select("id").single();
    const draft = await owner.client.rpc("record_gift_shared", { p_gift_id: gift!.id });
    assert.equal(draft.data, false, "drafts cannot be shared");

    await owner.client.rpc("publish_gift", { p_gift_id: gift!.id });
    assert.equal((await owner.client.rpc("record_gift_shared", { p_gift_id: gift!.id })).data, true);
    await owner.client.rpc("record_gift_shared", { p_gift_id: gift!.id });
    assert.equal((await other.client.rpc("record_gift_shared", { p_gift_id: gift!.id })).data, false, "not the owner");

    const { data: events } = await owner.client.from("gift_events").select("id").eq("gift_id", gift!.id).eq("event_type", "shared");
    assert.equal(events?.length, 1);
  });

  it("the cron rejects calls without the secret", async () => {
    const res = await fetch(`${site}/api/cron/keepalive`);
    assert.equal(res.status, 401);
  });

  it("the cron purges gifts deleted more than 30 days ago, photos included", { skip: !cronSecret && "CRON_SECRET not set" }, async () => {
    const { data: oldGift } = await owner.client.from("gifts").insert({ sender_id: owner.id, template_id: templateId, title: "Old deleted" }).select("id").single();
    const { data: recentGift } = await owner.client.from("gifts").insert({ sender_id: owner.id, template_id: templateId, title: "Recently deleted" }).select("id").single();

    const path = `${owner.id}/${oldGift!.id}/${crypto.randomUUID()}.png`;
    const up = await service.storage.from("gift-media").upload(path, PNG_1X1, { contentType: "image/png" });
    assert.equal(up.error, null);
    await service.from("gift_media").insert({ gift_id: oldGift!.id, owner_id: owner.id, storage_path: path, mime_type: "image/png", bytes: PNG_1X1.byteLength });

    const longAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    await service.from("gifts").update({ status: "deleted", deleted_at: longAgo }).eq("id", oldGift!.id);
    await service.from("gifts").update({ status: "deleted", deleted_at: new Date().toISOString() }).eq("id", recentGift!.id);

    const res = await fetch(`${site}/api/cron/keepalive`, { headers: { authorization: `Bearer ${cronSecret}` } });
    assert.equal(res.status, 200);
    const body = (await res.json()) as { purgedGifts: number; purgedPhotos: number };
    assert.ok(body.purgedGifts >= 1);
    assert.ok(body.purgedPhotos >= 1);

    const { data: gone } = await service.from("gifts").select("id").eq("id", oldGift!.id).maybeSingle();
    assert.equal(gone, null, "old deleted gift removed");
    const { data: kept } = await service.from("gifts").select("id").eq("id", recentGift!.id).maybeSingle();
    assert.ok(kept, "recently deleted gift kept for the grace period");
    const { data: signed } = await service.storage.from("gift-media").createSignedUrl(path, 60);
    const fetched = signed ? await fetch(signed.signedUrl) : null;
    assert.ok(!fetched || fetched.status !== 200, "photo removed from storage");
  });
});

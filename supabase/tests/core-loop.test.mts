/**
 * Core loop test against the live development project and a running dev
 * server: create -> publish -> open link -> receiver taps open -> creator
 * sees "opened", a notification and points.
 *
 * Run:  pnpm test:core   (dev server must be running on port 5173)
 * Needs .env.local. Creates one throwaway user and deletes it at the end.
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5173";

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const user = createClient(url, anonKey, { auth: { persistSession: false } });

let userId: string;
let giftId: string;
let token: string;
const sessionId = `test-${Date.now()}`;

describe("core loop", () => {
  before(async () => {
    const email = `core-${Date.now()}@example.com`;
    const password = `Test-${Math.random().toString(36).slice(2)}-pass`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: "Core Tester" },
    });
    if (error || !data.user) throw error ?? new Error("createUser failed");
    userId = data.user.id;
    const signIn = await user.auth.signInWithPassword({ email, password });
    if (signIn.error) throw signIn.error;
  });

  after(async () => {
    if (userId) await admin.auth.admin.deleteUser(userId);
  });

  it("creates a draft with sections and a recipient", async () => {
    const { data: template } = await user.from("templates").select("id").eq("slug", "birthday-postcard").single();
    const { data: gift, error } = await user
      .from("gifts")
      .insert({ sender_id: userId, template_id: template!.id, title: "Core loop gift", theme: { variant: "night" } })
      .select("id, status, share_token")
      .single();
    assert.equal(error, null);
    giftId = gift!.id;
    token = gift!.share_token;
    assert.equal(gift!.status, "draft");

    const { error: sErr } = await user.from("gift_sections").insert([
      { gift_id: giftId, type: "text", position: 0, content: { heading: "Happy Birthday, Su!" } },
      { gift_id: giftId, type: "message", position: 1, content: { text: "Hope your day is lovely." } },
      { gift_id: giftId, type: "final_message", position: 2, content: { text: "With love,", signature: "Core" } },
    ]);
    assert.equal(sErr, null);
    const { error: rErr } = await user.from("gift_recipients").insert({ gift_id: giftId, name: "Su" });
    assert.equal(rErr, null);

    const { data: events } = await user.from("gift_events").select("event_type").eq("gift_id", giftId);
    assert.deepEqual(events?.map((e) => e.event_type), ["created"]);
  });

  it("a draft is not reachable by its link", async () => {
    const res = await fetch(`${site}/g/${token}`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes("not available"), "draft should show the unavailable page");
    assert.ok(!html.includes("Happy Birthday, Su!"), "draft content must not leak");
  });

  it("publishes, records the event and pays +20 once", async () => {
    const first = await user.rpc("publish_gift", { p_gift_id: giftId });
    assert.equal(first.error, null);
    assert.equal(first.data.status, "published");
    const second = await user.rpc("publish_gift", { p_gift_id: giftId });
    assert.equal(second.error, null);

    const { data: profile } = await user.from("profiles").select("points_balance").single();
    assert.equal(profile?.points_balance, 120, "100 welcome + 20 publish, paid once");
  });

  it("the public page serves the content but no private data", async () => {
    const res = await fetch(`${site}/g/${token}`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("x-robots-tag"), "noindex, nofollow");
    assert.equal(res.headers.get("referrer-policy"), "no-referrer");
    const html = await res.text();
    assert.ok(html.includes("Happy Birthday, Su!"));
    assert.ok(!html.includes(userId), "sender id must not appear");
    assert.ok(!html.includes("core-"), "sender email must not appear");
  });

  it("receiver tap records opened, notifies and pays +10 once", async () => {
    const body = JSON.stringify({ type: "opened", sessionId });
    const headers = { "Content-Type": "application/json" };
    const r1 = await fetch(`${site}/api/g/${token}/events`, { method: "POST", headers, body });
    assert.equal(r1.status, 200);
    const r2 = await fetch(`${site}/api/g/${token}/events`, { method: "POST", headers, body });
    assert.equal(r2.status, 200);

    const { data: events } = await user.from("gift_events").select("event_type").eq("gift_id", giftId).eq("event_type", "opened");
    assert.equal(events?.length, 1, "same session counted once");

    const { data: recipient } = await user.from("gift_recipients").select("first_opened_at, open_count").eq("gift_id", giftId).single();
    assert.ok(recipient?.first_opened_at);
    assert.equal(recipient?.open_count, 1);

    const { data: notifications } = await user.from("notifications").select("type, title_key, read_at").eq("gift_id", giftId);
    assert.deepEqual(notifications, [{ type: "gift_opened", title_key: "giftOpened", read_at: null }]);

    const { data: profile } = await user.from("profiles").select("points_balance").single();
    assert.equal(profile?.points_balance, 130);
  });

  it("viewed is recorded once per session", async () => {
    const body = JSON.stringify({ type: "viewed", sessionId });
    const headers = { "Content-Type": "application/json" };
    await fetch(`${site}/api/g/${token}/events`, { method: "POST", headers, body });
    await fetch(`${site}/api/g/${token}/events`, { method: "POST", headers, body });
    const { data } = await user.from("gift_events").select("id").eq("gift_id", giftId).eq("event_type", "viewed");
    assert.equal(data?.length, 1);
  });

  it("rejects bad event payloads", async () => {
    const headers = { "Content-Type": "application/json" };
    const bad = await fetch(`${site}/api/g/${token}/events`, { method: "POST", headers, body: '{"type":"hack","sessionId":"x"}' });
    assert.equal(bad.status, 400);
    const unknown = await fetch(`${site}/api/g/${"a".repeat(43)}/events`, {
      method: "POST",
      headers,
      body: JSON.stringify({ type: "opened", sessionId }),
    });
    assert.equal(unknown.status, 404);
  });

  it("regenerating the link kills the old one", async () => {
    const { data, error } = await user.rpc("regenerate_gift_link", { p_gift_id: giftId });
    assert.equal(error, null);
    assert.notEqual(data.share_token, token);
    const old = await fetch(`${site}/g/${token}`);
    assert.ok((await old.text()).includes("not available"));
    const fresh = await fetch(`${site}/g/${data.share_token}`);
    assert.ok((await fresh.text()).includes("Happy Birthday, Su!"));
    token = data.share_token;
  });

  it("unpublish hides the gift, delete ends it", async () => {
    const un = await user.rpc("unpublish_gift", { p_gift_id: giftId });
    assert.equal(un.error, null);
    assert.ok((await (await fetch(`${site}/g/${token}`)).text()).includes("not available"));

    const del = await user.rpc("delete_gift", { p_gift_id: giftId });
    assert.equal(del.error, null);
    const { data: gift } = await user.from("gifts").select("status").eq("id", giftId).single();
    assert.equal(gift?.status, "deleted");
    const republish = await user.rpc("publish_gift", { p_gift_id: giftId });
    assert.ok(republish.error, "deleted gifts cannot be published");
  });
});

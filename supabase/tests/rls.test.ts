/**
 * Row Level Security tests against the linked development project.
 *
 * Run:  pnpm test:rls
 * Needs .env.local with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 * and SUPABASE_SERVICE_ROLE_KEY. Uses the Node built-in test runner, no extra
 * packages. Creates two throwaway users and deletes them at the end.
 *
 * Proves, for the M1 completion rule:
 *   - the anon role can read nothing private
 *   - creator A cannot read or change creator B's profile, gifts, responses, points
 *   - a user cannot change their own role or points balance
 *   - welcome points arrive through the ledger
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.");
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const anon = createClient(url, anonKey, { auth: { persistSession: false } });

type TestUser = { id: string; client: SupabaseClient; giftId: string };

async function makeUser(tag: string): Promise<TestUser> {
  const email = `rls-${tag}-${Date.now()}@example.com`;
  const password = `Test-${Math.random().toString(36).slice(2)}-pass`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: `User ${tag}` },
  });
  if (error || !data.user) throw error ?? new Error("createUser failed");

  const client = createClient(url!, anonKey!, { auth: { persistSession: false } });
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;

  const { data: template } = await admin.from("templates").select("id").limit(1).single();
  const { data: gift, error: giftError } = await client
    .from("gifts")
    .insert({ sender_id: data.user.id, template_id: template!.id, title: `Gift of ${tag}` })
    .select("id")
    .single();
  if (giftError || !gift) throw giftError ?? new Error("gift insert failed");

  return { id: data.user.id, client, giftId: gift.id };
}

let a: TestUser;
let b: TestUser;

describe("row level security", () => {
  before(async () => {
    a = await makeUser("a");
    b = await makeUser("b");
  });

  after(async () => {
    for (const u of [a, b]) if (u) await admin.auth.admin.deleteUser(u.id);
  });

  it("anon reads nothing private", async () => {
    for (const table of ["profiles", "gifts", "gift_responses", "gift_events", "point_transactions", "notifications"]) {
      const { data, error } = await anon.from(table).select("*").limit(1);
      assert.ok(error || (data ?? []).length === 0, `anon could read ${table}`);
    }
  });

  it("anon can read active templates and categories", async () => {
    const { data, error } = await anon.from("templates").select("slug").eq("is_active", true);
    assert.equal(error, null);
    assert.ok((data ?? []).length >= 10);
  });

  it("a user sees only their own profile", async () => {
    const { data } = await a.client.from("profiles").select("id");
    assert.deepEqual((data ?? []).map((r) => r.id), [a.id]);
  });

  it("a user gets 100 welcome points through the ledger", async () => {
    const { data: profile } = await a.client.from("profiles").select("points_balance").single();
    assert.equal(profile?.points_balance, 100);
    const { data: tx } = await a.client.from("point_transactions").select("type, amount, balance_after");
    assert.deepEqual(tx, [{ type: "bonus", amount: 100, balance_after: 100 }]);
  });

  it("a user cannot change their own role or balance", async () => {
    const role = await a.client.from("profiles").update({ role: "admin" } as never).eq("id", a.id);
    assert.ok(role.error, "role update should be denied");
    const points = await a.client.from("profiles").update({ points_balance: 9999 } as never).eq("id", a.id);
    assert.ok(points.error, "points update should be denied");
    const { data } = await a.client.from("profiles").select("role, points_balance").single();
    assert.deepEqual(data, { role: "user", points_balance: 100 });
  });

  it("a user cannot insert point transactions", async () => {
    const { error } = await a.client
      .from("point_transactions")
      .insert({ user_id: a.id, type: "bonus", amount: 500, balance_after: 600 } as never);
    assert.ok(error);
  });

  it("creator A cannot see creator B's gifts", async () => {
    const { data } = await a.client.from("gifts").select("id");
    assert.deepEqual((data ?? []).map((g) => g.id), [a.giftId]);
    const direct = await a.client.from("gifts").select("id").eq("id", b.giftId);
    assert.equal((direct.data ?? []).length, 0);
  });

  it("creator A cannot update or delete creator B's gift", async () => {
    await a.client.from("gifts").update({ title: "hacked" }).eq("id", b.giftId);
    const del = await a.client.from("gifts").delete().eq("id", b.giftId);
    assert.equal(del.count ?? 0, 0);
    const { data } = await admin.from("gifts").select("title").eq("id", b.giftId).single();
    assert.equal(data?.title, "Gift of b");
  });

  it("creator A cannot create a gift for creator B", async () => {
    const { data: template } = await admin.from("templates").select("id").limit(1).single();
    const { error } = await a.client
      .from("gifts")
      .insert({ sender_id: b.id, template_id: template!.id, title: "forged" });
    assert.ok(error);
  });

  it("creator A cannot read responses or events on creator B's gift", async () => {
    const { data: response } = await admin
      .from("gift_responses")
      .insert({ gift_id: b.giftId })
      .select("id")
      .single();
    await admin.from("gift_events").insert({ gift_id: b.giftId, event_type: "opened" });

    const responses = await a.client.from("gift_responses").select("id").eq("gift_id", b.giftId);
    assert.equal((responses.data ?? []).length, 0);
    const events = await a.client.from("gift_events").select("id").eq("gift_id", b.giftId);
    assert.equal((events.data ?? []).length, 0);

    const own = await b.client.from("gift_responses").select("id").eq("gift_id", b.giftId);
    assert.deepEqual((own.data ?? []).map((r) => r.id), [response!.id]);
  });

  it("a user cannot change their share token", async () => {
    const { data: before } = await a.client.from("gifts").select("share_token").eq("id", a.giftId).single();
    const { error } = await a.client.from("gifts").update({ share_token: "short" } as never).eq("id", a.giftId);
    assert.ok(error);
    const { data: afterRow } = await a.client.from("gifts").select("share_token").eq("id", a.giftId).single();
    assert.equal(afterRow?.share_token, before?.share_token);
    assert.equal(before?.share_token.length, 43);
  });

  it("the gift limit stops a sixth gift", async () => {
    const { data: template } = await admin.from("templates").select("id").limit(1).single();
    for (let i = 0; i < 4; i++) {
      const { error } = await a.client
        .from("gifts")
        .insert({ sender_id: a.id, template_id: template!.id, title: `extra ${i}` });
      assert.equal(error, null);
    }
    const sixth = await a.client
      .from("gifts")
      .insert({ sender_id: a.id, template_id: template!.id, title: "one too many" });
    assert.ok(sixth.error);
  });
});

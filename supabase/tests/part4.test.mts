/**
 * Daily earn cap and self-service account deletion UI.
 * Needs the dev server. The cap check needs migration 0013.
 * Run:  pnpm test:part4
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createClient, type Session } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5173";
const ref = new URL(url).hostname.split(".")[0]!;
const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

function cookieFor(session: Session): string {
  const name = `sb-${ref}-auth-token`;
  const value = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
  if (value.length <= 3180) return `${name}=${value}`;
  const parts: string[] = [];
  for (let i = 0; i * 3180 < value.length; i++) parts.push(`${name}.${i}=${value.slice(i * 3180, (i + 1) * 3180)}`);
  return parts.join("; ");
}

async function makeUser(tag: string) {
  const email = `part4-${tag}-${Date.now()}@example.com`;
  const password = `Test-${Math.random().toString(36).slice(2)}-pass`;
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw error ?? new Error("createUser failed");
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const signIn = await client.auth.signInWithPassword({ email, password });
  return { id: data.user.id, client, session: signIn.data.session! };
}

let member: Awaited<ReturnType<typeof makeUser>>;
let adminUser: Awaited<ReturnType<typeof makeUser>>;

describe("earn cap and account deletion", () => {
  before(async () => {
    member = await makeUser("member");
    adminUser = await makeUser("admin");
    await service.from("profiles").update({ role: "admin" } as never).eq("id", adminUser.id);
  });

  after(async () => {
    for (const u of [member, adminUser]) if (u) await service.auth.admin.deleteUser(u.id).catch(() => undefined);
  });

  it("earned points stop at 100 a day while publishing and opening keep working", async () => {
    const { data: template } = await member.client.from("templates").select("id").eq("slug", "thank-you").single();
    const tokens: string[] = [];
    for (let i = 0; i < 5; i++) {
      const { data: gift } = await member.client
        .from("gifts")
        .insert({ sender_id: member.id, template_id: template!.id, title: `Cap ${i}` })
        .select("id, share_token")
        .single();
      const pub = await member.client.rpc("publish_gift", { p_gift_id: gift!.id });
      assert.equal(pub.error, null, "publishing never fails because of points");
      tokens.push(pub.data.share_token);
    }

    const open = await fetch(`${site}/api/g/${tokens[0]}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "opened", sessionId: `cap-${Date.now()}` }),
    });
    assert.equal(open.status, 200, "the open is still recorded");

    const { data: earned } = await member.client.from("point_transactions").select("amount").eq("type", "earn");
    const total = (earned ?? []).reduce((s, r) => s + r.amount, 0);
    assert.equal(total, 100, `earned today should be capped at 100, got ${total}`);

    const { data: profile } = await member.client.from("profiles").select("points_balance").single();
    assert.equal(profile?.points_balance, 200, "100 welcome + 100 earned");
  });

  it("settings shows the delete form to members", async () => {
    const res = await fetch(`${site}/dashboard/settings`, { headers: { cookie: cookieFor(member.session) } });
    assert.equal(res.status, 200);
    assert.ok((await res.text()).includes('name="confirmEmail"'));
  });

  it("settings hides the delete form from admins", async () => {
    const res = await fetch(`${site}/dashboard/settings`, { headers: { cookie: cookieFor(adminUser.session) } });
    assert.equal(res.status, 200);
    assert.ok(!(await res.text()).includes('name="confirmEmail"'));
  });

  it("the goodbye page renders", async () => {
    const res = await fetch(`${site}/account-deleted`);
    assert.equal(res.status, 200);
  });
});

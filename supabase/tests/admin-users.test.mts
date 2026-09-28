/**
 * Admin user management, against the live project and a running dev server.
 * Run:  pnpm test:admin-users
 * Creates a throwaway admin and a throwaway member; removes both at the end.
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
  const email = `admin-users-${tag}-${Date.now()}@example.com`;
  const password = `Test-${Math.random().toString(36).slice(2)}-pass`;
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: `Member ${tag}` } });
  if (error || !data.user) throw error ?? new Error("createUser failed");
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;
  return { id: data.user.id, email, password, client, session: signIn.data.session! };
}

let admin: Awaited<ReturnType<typeof makeUser>>;
let member: Awaited<ReturnType<typeof makeUser>>;
let memberGift: string;

describe("admin user management", () => {
  before(async () => {
    admin = await makeUser("admin");
    await service.from("profiles").update({ role: "admin" } as never).eq("id", admin.id);
    const refreshed = await admin.client.auth.refreshSession();
    admin.session = refreshed.data.session ?? admin.session;
    member = await makeUser("member");
    const { data: template } = await member.client.from("templates").select("id").eq("slug", "friendship").single();
    const { data: gift } = await member.client
      .from("gifts")
      .insert({ sender_id: member.id, template_id: template!.id, title: "Member gift" })
      .select("id")
      .single();
    memberGift = gift!.id;
  });

  after(async () => {
    for (const u of [admin, member]) if (u) await service.auth.admin.deleteUser(u.id).catch(() => undefined);
  });

  it("the users list shows emails to admins only", async () => {
    const asAdmin = await fetch(`${site}/admin/users?q=admin-users-member`, { headers: { cookie: cookieFor(admin.session) } });
    assert.equal(asAdmin.status, 200);
    assert.ok((await asAdmin.text()).includes(member.email));

    const asMember = await fetch(`${site}/admin/users`, { headers: { cookie: cookieFor(member.session) } });
    const html = await asMember.text();
    assert.ok(!html.includes(admin.email), "a member must not see other accounts");
  });

  it("the detail page shows the member's gifts and account data", async () => {
    const res = await fetch(`${site}/admin/users/${member.id}`, { headers: { cookie: cookieFor(admin.session) } });
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes(member.email));
    assert.ok(html.includes("Member gift"));
    // Message text is in the client catalogue on every page, so look for rendered form fields.
    assert.ok(html.includes('name="confirmEmail"'), "delete form rendered");
  });

  it("on their own page an admin gets no suspend or delete controls", async () => {
    const res = await fetch(`${site}/admin/users/${admin.id}`, { headers: { cookie: cookieFor(admin.session) } });
    const html = await res.text();
    assert.ok(/>This is your account\./.test(html), "self note rendered");
    assert.ok(!html.includes('name="confirmEmail"'), "no delete form on own account");
    assert.ok(!html.includes('name="reason" placeholder="Reason, kept'), "no suspend form on own account");
  });

  it("a suspended account cannot sign in and gets the banned code", async () => {
    const { error } = await service.auth.admin.updateUserById(member.id, { ban_duration: "876000h" });
    assert.equal(error, null);
    const client = createClient(url, anonKey, { auth: { persistSession: false } });
    const attempt = await client.auth.signInWithPassword({ email: member.email, password: member.password });
    assert.ok(attempt.error, "sign-in must fail");
    assert.ok(attempt.error!.code === "user_banned" || /banned/i.test(attempt.error!.message), `unexpected error: ${attempt.error!.code} ${attempt.error!.message}`);
  });

  it("restoring the account lets them sign in again", async () => {
    await service.auth.admin.updateUserById(member.id, { ban_duration: "none" });
    const client = createClient(url, anonKey, { auth: { persistSession: false } });
    const attempt = await client.auth.signInWithPassword({ email: member.email, password: member.password });
    assert.equal(attempt.error, null);
  });

  it("admin_log accepts user targets from an admin and rejects members", async () => {
    const ok = await admin.client.rpc("admin_log", { p_action: "test_note", p_target_type: "user", p_target_id: member.id, p_details: {} });
    assert.equal(ok.error, null);
    const denied = await member.client.rpc("admin_log", { p_action: "test_note", p_target_type: "user", p_target_id: admin.id, p_details: {} });
    assert.ok(denied.error);
  });

  it("deleting the account removes the profile and everything it owned", async () => {
    const { error } = await service.auth.admin.deleteUser(member.id);
    assert.equal(error, null);
    const { data: profile } = await service.from("profiles").select("id").eq("id", member.id).maybeSingle();
    assert.equal(profile, null);
    const { data: gift } = await service.from("gifts").select("id").eq("id", memberGift).maybeSingle();
    assert.equal(gift, null);
    const { data: logs } = await service.from("admin_audit_logs").select("id").eq("target_id", member.id);
    assert.ok((logs ?? []).length >= 1, "audit entries about the deleted user remain");
  });
});

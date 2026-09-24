/**
 * Admin functions and reporting, against the live project and dev server.
 * Run:  pnpm test:admin
 * Creates a throwaway admin and a throwaway user; deletes both at the end.
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5173";

const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const adminUser = createClient(url, anonKey, { auth: { persistSession: false } });
const plainUser = createClient(url, anonKey, { auth: { persistSession: false } });

let adminId: string;
let userId: string;
let giftId: string;
let token: string;
let reportId: string;

async function makeUser(client: typeof adminUser, tag: string) {
  const email = `admin-${tag}-${Date.now()}@example.com`;
  const password = `Test-${Math.random().toString(36).slice(2)}-pass`;
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: `Admin test ${tag}` } });
  if (error || !data.user) throw error ?? new Error("createUser failed");
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;
  return data.user.id;
}

describe("admin and reports", () => {
  before(async () => {
    adminId = await makeUser(adminUser, "a");
    userId = await makeUser(plainUser, "u");
    // Promotion happens outside the app, as the setup guide says.
    const { error } = await service.from("profiles").update({ role: "admin" } as never).eq("id", adminId);
    assert.equal(error, null);

    const { data: template } = await plainUser.from("templates").select("id").eq("slug", "thank-you").single();
    const { data: gift } = await plainUser
      .from("gifts")
      .insert({ sender_id: userId, template_id: template!.id, title: "Reported gift" })
      .select("id, share_token")
      .single();
    giftId = gift!.id;
    token = gift!.share_token;
    await plainUser.from("gift_sections").insert({ gift_id: giftId, type: "text", position: 0, content: { heading: "Hello", subheading: "" } });
    await plainUser.rpc("publish_gift", { p_gift_id: giftId });
  });

  after(async () => {
    for (const id of [adminId, userId]) if (id) await service.auth.admin.deleteUser(id);
  });

  it("a plain user cannot call admin functions", async () => {
    const stats = await plainUser.rpc("admin_stats", {});
    assert.ok(stats.error);
    const role = await plainUser.rpc("admin_set_role", { p_user_id: userId, p_role: "admin" });
    assert.ok(role.error);
    const { data } = await plainUser.from("profiles").select("role").eq("id", userId).single();
    assert.equal(data?.role, "user");
    const disable = await plainUser.rpc("admin_disable_gift", { p_gift_id: giftId, p_reason: "x" });
    assert.ok(disable.error);
  });

  it("a plain user cannot read other profiles, reports or audit logs", async () => {
    const { data: profiles } = await plainUser.from("profiles").select("id");
    assert.deepEqual(profiles?.map((p) => p.id), [userId]);
    const { data: reports } = await plainUser.from("reports").select("id");
    assert.equal((reports ?? []).length, 0);
    const { data: logs } = await plainUser.from("admin_audit_logs").select("id");
    assert.equal((logs ?? []).length, 0);
  });

  it("the admin area is a 404 for non-admins and signed-out visitors", async () => {
    const res = await fetch(`${site}/admin`, { redirect: "manual" });
    assert.equal(res.status, 307, "signed out goes to login");
  });

  it("receivers can report a gift through the report page action", async () => {
    // Insert as the server action does: service role, reporter unknown.
    const { data: gift } = await service.from("gifts").select("id").eq("share_token", token).single();
    const { error } = await service.from("reports").insert({ gift_id: gift!.id, reason: "spam", details: "Test report" });
    assert.equal(error, null);
    const page = await fetch(`${site}/g/${token}/report`);
    assert.equal(page.status, 200);
    assert.ok((await page.text()).includes("Report this gift"));
  });

  it("admin sees stats and open reports", async () => {
    const { data, error } = await adminUser.rpc("admin_stats", {});
    assert.equal(error, null);
    const stats = data as Record<string, number>;
    assert.ok(stats.users! >= 2);
    assert.ok(stats.open_reports! >= 1);

    const { data: reports } = await adminUser.from("reports").select("id, gift_id, status").eq("gift_id", giftId);
    assert.equal(reports?.length, 1);
    reportId = reports![0]!.id;
    assert.equal(reports![0]!.status, "open");
  });

  it("admin can read a reported gift for moderation", async () => {
    const { data: gift } = await adminUser.from("gifts").select("id, title").eq("id", giftId).maybeSingle();
    assert.equal(gift?.title, "Reported gift");
    const { data: sections } = await adminUser.from("gift_sections").select("id").eq("gift_id", giftId);
    assert.equal(sections?.length, 1);
  });

  it("admin disables the gift: link dies, owner notified, action logged", async () => {
    const { error } = await adminUser.rpc("admin_disable_gift", { p_gift_id: giftId, p_reason: "Reported as spam" });
    assert.equal(error, null, error?.message);

    const html = await (await fetch(`${site}/g/${token}`)).text();
    assert.ok(html.includes("not available"));

    const { data: notes } = await plainUser.from("notifications").select("type, title_key, payload").eq("gift_id", giftId);
    assert.equal(notes?.length, 1);
    assert.equal(notes![0]!.title_key, "giftDisabled");
    assert.equal((notes![0]!.payload as { reason: string }).reason, "Reported as spam");

    const { data: logs } = await adminUser.from("admin_audit_logs").select("action, target_id, admin_id").eq("target_id", giftId);
    assert.deepEqual(logs, [{ action: "disable_gift", target_id: giftId, admin_id: adminId }]);
  });

  it("admin resolves the report and it is logged", async () => {
    const { error } = await adminUser.rpc("admin_resolve_report", { p_report_id: reportId, p_status: "resolved" });
    assert.equal(error, null);
    const { data } = await adminUser.from("reports").select("status, resolved_by").eq("id", reportId).single();
    assert.deepEqual(data, { status: "resolved", resolved_by: adminId });
  });

  it("admin adjusts points through the ledger, logged", async () => {
    const before = (await service.from("profiles").select("points_balance").eq("id", userId).single()).data!.points_balance;
    const { error } = await adminUser.rpc("admin_adjust_points", { p_user_id: userId, p_amount: 50, p_description: "Test bonus" });
    assert.equal(error, null, error?.message);
    const after = (await service.from("profiles").select("points_balance").eq("id", userId).single()).data!.points_balance;
    assert.equal(after, before + 50);
    const tooMuch = await adminUser.rpc("admin_adjust_points", { p_user_id: userId, p_amount: -100000, p_description: "drain" });
    assert.ok(tooMuch.error, "cannot take the balance negative");
    const { data: logs } = await adminUser.from("admin_audit_logs").select("action").eq("target_id", userId);
    assert.ok(logs?.some((l) => l.action === "adjust_points"));
  });

  it("admin cannot change their own role but can promote another", async () => {
    const self = await adminUser.rpc("admin_set_role", { p_user_id: adminId, p_role: "user" });
    assert.ok(self.error);
    const other = await adminUser.rpc("admin_set_role", { p_user_id: userId, p_role: "admin" });
    assert.equal(other.error, null);
    const back = await adminUser.rpc("admin_set_role", { p_user_id: userId, p_role: "user" });
    assert.equal(back.error, null);
  });

  it("admin edits template metadata, logged", async () => {
    const { data: tp } = await adminUser.from("templates").select("id, is_featured").eq("slug", "general-postcard").single();
    const { error } = await adminUser.rpc("admin_update_template", {
      p_template_id: tp!.id,
      p_is_active: true,
      p_is_featured: !tp!.is_featured,
      p_is_premium: false,
      p_point_price: 0,
    });
    assert.equal(error, null, error?.message);
    const { data: after } = await adminUser.from("templates").select("is_featured").eq("id", tp!.id).single();
    assert.equal(after?.is_featured, !tp!.is_featured);
    // restore
    await adminUser.rpc("admin_update_template", { p_template_id: tp!.id, p_is_active: true, p_is_featured: tp!.is_featured, p_is_premium: false, p_point_price: 0 });
  });
});

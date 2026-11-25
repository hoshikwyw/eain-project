/**
 * Daily earn cap, paid template grants and self-service account deletion UI.
 * Needs the dev server. The no-earning check needs migration 0028.
 * Run:  pnpm test:account
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createClient, type Session } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5173";
const ref = new URL(url).hostname.split(".")[0]!;
const service = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function cookieFor(session: Session): string {
  const name = `sb-${ref}-auth-token`;
  const value = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
  if (value.length <= 3180) return `${name}=${value}`;
  const parts: string[] = [];
  for (let i = 0; i * 3180 < value.length; i++)
    parts.push(`${name}.${i}=${value.slice(i * 3180, (i + 1) * 3180)}`);
  return parts.join("; ");
}

async function makeUser(tag: string) {
  const email = `part4-${tag}-${Date.now()}@example.com`;
  const password = `Test-${Math.random().toString(36).slice(2)}-pass`;
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
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
    await service
      .from("profiles")
      .update({ role: "admin" } as never)
      .eq("id", adminUser.id);
  });

  after(async () => {
    for (const u of [member, adminUser])
      if (u) await service.auth.admin.deleteUser(u.id).catch(() => undefined);
  });

  it("activity earns no points while publishing and opening keep working", async () => {
    // An earn entry is skipped quietly (0028), never an error.
    const seeded = await service.rpc("apply_point_transaction", {
      p_user_id: member.id,
      p_type: "earn",
      p_amount: 10,
      p_reference_type: "test_seed",
      p_reference_id: `cap-${Date.now()}`,
      p_description: "Earned earlier today",
    } as never);
    assert.equal(seeded.error, null, "an earn entry is skipped, not refused");

    const { data: template } = await member.client
      .from("templates")
      .select("id")
      .eq("slug", "thank-you")
      .single();
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

    const { data: earned } = await member.client
      .from("point_transactions")
      .select("amount")
      .eq("type", "earn");
    const total = (earned ?? []).reduce((s, r) => s + r.amount, 0);
    assert.equal(total, 0, `nothing is earned, got ${total}`);

    const { data: profile } = await member.client
      .from("profiles")
      .select("points_balance")
      .single();
    assert.equal(profile?.points_balance, 0, "no welcome points, nothing earned");
  });

  it("only an admin grants a paid template, once, and it is logged", async () => {
    const { data: wedding } = await member.client
      .from("templates")
      .select("id")
      .eq("slug", "wedding-invitation")
      .single();
    const args = { p_user_id: member.id, p_template_id: wedding!.id, p_note: "KBZPay test" };

    const self = await member.client.rpc("admin_grant_template", args);
    assert.ok(self.error, "a member cannot grant themselves a template");

    const first = await adminUser.client.rpc("admin_grant_template", args);
    assert.equal(first.error, null, first.error?.message);
    assert.equal(first.data.transaction_id, null, "no points behind a paid grant");
    const second = await adminUser.client.rpc("admin_grant_template", args);
    assert.equal(second.error, null, "granting twice is fine");

    const { data: unlocks } = await member.client
      .from("template_unlocks")
      .select("template_id")
      .eq("template_id", wedding!.id);
    assert.equal(unlocks?.length, 1, "the member now owns it");

    const { data: logs } = await service
      .from("admin_audit_logs")
      .select("action, details")
      .eq("target_id", member.id)
      .eq("action", "grant_template");
    assert.equal(logs?.length, 1, "logged once");
    assert.equal((logs![0].details as { template: string }).template, "wedding-invitation");

    const { data: free } = await member.client
      .from("templates")
      .select("id")
      .eq("slug", "thank-you")
      .single();
    const freeGrant = await adminUser.client.rpc("admin_grant_template", {
      ...args,
      p_template_id: free!.id,
    });
    assert.ok(freeGrant.error, "a free template is not granted");
  });

  it("an admin sets paid only and the kyat price; the database checks both", async () => {
    // Needs migration 0024. Edits the engagement invitation and puts it back.
    const { data: before } = await service
      .from("templates")
      .select("*")
      .eq("slug", "engagement-party")
      .single();
    const row = before as Record<string, unknown>;
    const args = (paidOnly: boolean, priceMmk: number | null, isPremium = true) => ({
      p_template_id: row.id,
      p_name_en: row.name_en,
      p_name_my: row.name_my,
      p_description_en: row.description_en,
      p_description_my: row.description_my,
      p_category_id: row.category_id,
      p_sort_order: row.sort_order,
      p_is_active: row.is_active,
      p_is_featured: row.is_featured,
      p_is_premium: isPremium,
      p_point_price: isPremium ? Math.max(Number(row.point_price), 1) : 0,
      p_paid_only: paidOnly,
      p_price_mmk: priceMmk,
    });
    const read = async () =>
      (
        await service
          .from("templates")
          .select("paid_only, price_mmk")
          .eq("id", row.id as string)
          .single()
      ).data;
    try {
      const asMember = await member.client.rpc("admin_update_template_details", args(true, 30000));
      assert.ok(asMember.error, "a member cannot edit templates");

      const set = await adminUser.client.rpc("admin_update_template_details", args(true, 30000));
      assert.equal(set.error, null, set.error?.message);
      assert.deepEqual(await read(), { paid_only: true, price_mmk: 30000 });

      const noPrice = await adminUser.client.rpc("admin_update_template_details", args(true, null));
      assert.match(noPrice.error?.message ?? "", /kyat price/);
      const tooLow = await adminUser.client.rpc("admin_update_template_details", args(true, 50));
      assert.match(tooLow.error?.message ?? "", /kyat price/);
      const notPremium = await adminUser.client.rpc(
        "admin_update_template_details",
        args(true, 30000, false),
      );
      assert.match(notPremium.error?.message ?? "", /needs premium/);
      assert.deepEqual(
        await read(),
        { paid_only: true, price_mmk: 30000 },
        "refused edits change nothing",
      );

      // Premium and paid only go together (0028): one without the other is refused.
      const halfway = await adminUser.client.rpc(
        "admin_update_template_details",
        args(false, 30000),
      );
      assert.ok(halfway.error, "premium that is not paid only is refused");
      const off = await adminUser.client.rpc(
        "admin_update_template_details",
        args(false, 30000, false),
      );
      assert.equal(off.error, null, off.error?.message);
      assert.deepEqual(
        await read(),
        { paid_only: false, price_mmk: null },
        "a free template keeps no kyat price",
      );
    } finally {
      await adminUser.client.rpc(
        "admin_update_template_details",
        args(
          Boolean(row.paid_only),
          (row.price_mmk as number | null) ?? null,
          Boolean(row.is_premium),
        ),
      );
    }
    assert.deepEqual(
      await read(),
      { paid_only: row.paid_only, price_mmk: row.price_mmk },
      "put back",
    );
  });

  it("settings shows the delete form to members", async () => {
    const res = await fetch(`${site}/dashboard/settings`, {
      headers: { cookie: cookieFor(member.session) },
    });
    assert.equal(res.status, 200);
    assert.ok((await res.text()).includes('name="confirmEmail"'));
  });

  it("settings hides the delete form from admins", async () => {
    const res = await fetch(`${site}/dashboard/settings`, {
      headers: { cookie: cookieFor(adminUser.session) },
    });
    assert.equal(res.status, 200);
    assert.ok(!(await res.text()).includes('name="confirmEmail"'));
  });

  it("the goodbye page renders", async () => {
    const res = await fetch(`${site}/account-deleted`);
    assert.equal(res.status, 200);
  });
});

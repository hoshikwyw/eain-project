/**
 * Email links that stay on our domain: /auth/confirm checks the token hash
 * from a confirmation or reset email, signs the person in and sends them on.
 * The hashes come from the admin "generate link" API, so no email is sent and
 * no mail rate limit is hit. Needs the dev server.
 * Run:  pnpm test:email-links
 */
import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5173";
const host = new URL(url).host;

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const userIds: string[] = [];

const location = (res: Response) => res.headers.get("location") ?? "";
/** Cookies a response set, in the form a following request can send back. */
const cookiesFrom = (res: Response) =>
  res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
const get = (path: string, cookie = "") =>
  fetch(`${site}${path}`, { redirect: "manual", headers: cookie ? { cookie } : {} });

describe("email links", () => {
  after(async () => {
    for (const id of userIds) await admin.auth.admin.deleteUser(id).catch(() => undefined);
  });

  it("a confirmation link signs the new account in and continues where sign-up was heading", async () => {
    const email = `links-signup-${Date.now()}@example.com`;
    const { data, error } = await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password: `Test-${Math.random().toString(36).slice(2)}-pass`,
      options: { data: { display_name: "Links Test" } },
    });
    assert.equal(error, null, error?.message);
    userIds.push(data.user!.id);
    assert.equal(data.user!.email_confirmed_at ?? null, null, "needs Confirm email ON in Supabase");

    // The link from the template, opened in the browser that signed up.
    const res = await get(
      `/auth/confirm?token_hash=${data.properties.hashed_token}&type=email`,
      "eain_after_confirm=%2Fcreate%2Fcontinue",
    );
    assert.equal(res.status, 307);
    assert.equal(location(res), `${site}/create/continue`);
    const cookie = cookiesFrom(res);
    assert.ok(cookie.includes("sb-"), "a session cookie must be set");
    assert.ok(cookie.includes("eain_after_confirm=;"), "the remembered path is used once");

    const dashboard = await get("/dashboard", cookie);
    assert.equal(dashboard.status, 200, "signed in after confirming");
    const { data: user } = await admin.auth.admin.getUserById(data.user!.id);
    assert.ok(user.user?.email_confirmed_at, "the account is confirmed");

    // The same link a second time has nothing left to confirm.
    const again = await get(`/auth/confirm?token_hash=${data.properties.hashed_token}&type=email`);
    assert.ok(location(again).includes("/auth/login?notice=linkExpired"));
  });

  it("a reset link opens the new-password page, on any device", async () => {
    const email = `links-reset-${Date.now()}@example.com`;
    const { data: created } = await admin.auth.admin.createUser({
      email,
      password: `Test-${Math.random().toString(36).slice(2)}-pass`,
      email_confirm: true,
    });
    userIds.push(created.user!.id);
    const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email });
    assert.equal(error, null, error?.message);

    // No cookies at all: the link was opened on another device.
    const res = await get(`/auth/confirm?token_hash=${data.properties.hashed_token}&type=recovery`);
    assert.equal(res.status, 307);
    assert.equal(location(res), `${site}/auth/reset`);
    const cookie = cookiesFrom(res);
    assert.ok(cookie.includes("sb-"), "a session cookie must be set");

    const reset = await get("/auth/reset", cookie);
    assert.equal(reset.status, 200);
    assert.ok((await reset.text()).includes(email), "the reset page names the account");
  });

  it("a bad or expired link lands on a page that explains", async () => {
    const reset = await get("/auth/confirm?token_hash=bogus&type=recovery");
    assert.ok(location(reset).includes("/auth/forgot?notice=expired"));
    const confirm = await get("/auth/confirm?token_hash=bogus&type=email");
    assert.ok(location(confirm).includes("/auth/login?notice=linkExpired"));
    const unknown = await get("/auth/confirm?token_hash=bogus&type=sms");
    assert.ok(location(unknown).includes("/auth/login?notice=linkExpired"));
    const login = await (await fetch(`${site}/auth/login?notice=linkExpired`)).text();
    assert.ok(login.includes("expired"), "the login page shows the notice");
  });

  it("the confirm route and auth pages never point the browser at the Supabase host", async () => {
    for (const path of ["/auth/login", "/auth/signup", "/auth/forgot"]) {
      const html = await (await fetch(`${site}${path}`)).text();
      assert.ok(!html.includes(host), `${path} must not mention ${host}`);
    }
    const res = await get("/auth/confirm?token_hash=bogus&type=email");
    assert.ok(!location(res).includes(host));
  });
});

/**
 * Guest editing test against a running dev server: a visitor can open a free
 * template without an account, a premium one sends them to sign in, the
 * handoff page needs an account, and a signed-in creator who opens a template
 * gets the saving screen. Also the rule for forgetting old browser drafts.
 *
 * Run:  pnpm test:guest   (dev server must be running on port 5173)
 * Needs .env.local. Creates one throwaway user and deletes it at the end.
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createClient, type Session } from "@supabase/supabase-js";
import { GUEST_DRAFT_MAX_AGE_MS, isFreshDraft } from "../../features/gifts/guest-draft.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5173").replace(/\/$/, "");
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

/** Fetches a page without following redirects, so the first hop can be checked. */
const page = (path: string, cookie?: string) =>
  fetch(`${site}${path}`, { redirect: "manual", headers: cookie ? { cookie } : {} });

/**
 * The try page streams (it has a loading screen), so a redirect or a 404
 * decided while rendering arrives inside a 200 body as a marker, not as a
 * status. The proxy, by contrast, answers with a real redirect.
 */
const streamed = (html: string) => ({
  redirectTo: html.match(/NEXT_REDIRECT;replace;([^;"]+);/)?.[1] ?? null,
  notFound: html.includes("NEXT_HTTP_ERROR_FALLBACK;404"),
});

describe("guest editing", () => {
  let userId: string;
  let cookie: string;
  let freeSlug: string;
  let premiumSlug: string;

  before(async () => {
    const { data: templates } = await service
      .from("templates")
      .select("slug, is_premium")
      .eq("is_active", true)
      .order("slug");
    freeSlug = templates!.find((t) => !t.is_premium)!.slug;
    premiumSlug = templates!.find((t) => t.is_premium)!.slug;

    const email = `guest-test-${Date.now()}@example.com`;
    const password = `Test-${Math.random().toString(36).slice(2)}-pass`;
    const { data, error } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: "Guest Test" },
    });
    if (error || !data.user) throw error ?? new Error("createUser failed");
    userId = data.user.id;
    const client = createClient(url, anonKey, { auth: { persistSession: false } });
    const signIn = await client.auth.signInWithPassword({ email, password });
    cookie = cookieFor(signIn.data.session!);
  });

  after(async () => {
    if (userId) await service.auth.admin.deleteUser(userId);
  });

  it("opens a free template for a visitor without an account", async () => {
    const res = await page(`/try/${freeSlug}`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /<title>[^<]*Try the /);
    assert.match(html, /noindex/);
  });

  it("sends a visitor who opens a premium template to sign in first", async () => {
    const res = await page(`/try/${premiumSlug}`);
    assert.equal(res.status, 200);
    assert.equal(streamed(await res.text()).redirectTo, `/create?template=${premiumSlug}`);
  });

  it("knows no template by a made-up name", async () => {
    const res = await page("/try/not-a-template");
    assert.equal(streamed(await res.text()).notFound, true);
  });

  it("asks a visitor to sign in before the handoff, and keeps the way back", async () => {
    const res = await page("/create/continue");
    assert.equal(res.status, 307);
    const to = new URL(res.headers.get("location")!, site);
    assert.equal(to.pathname, "/auth/login");
    assert.equal(to.searchParams.get("next"), "/create/continue");
  });

  it("shows a signed-in creator the saving screen when they open a template", async () => {
    const res = await page(`/try/${freeSlug}`, cookie);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /Saving your gift/);
  });

  it("gives a signed-in creator the saving screen for a premium template too", async () => {
    // The saving screen decides: a draft of it would fail as premium and go to the picker.
    const res = await page(`/try/${premiumSlug}`, cookie);
    assert.equal(res.status, 200);
    assert.match(await res.text(), /Saving your gift/);
  });
});

describe("browser drafts", () => {
  const now = Date.parse("2026-11-09T12:00:00Z");

  it("keeps a draft saved this month", () => {
    assert.equal(isFreshDraft("2026-11-01T09:00:00Z", now), true);
  });

  it("keeps a draft right at the edge", () => {
    assert.equal(isFreshDraft(new Date(now - GUEST_DRAFT_MAX_AGE_MS).toISOString(), now), true);
  });

  it("forgets a draft older than 30 days", () => {
    assert.equal(isFreshDraft("2026-10-01T09:00:00Z", now), false);
    assert.equal(
      isFreshDraft(new Date(now - GUEST_DRAFT_MAX_AGE_MS - 1).toISOString(), now),
      false,
    );
  });

  it("forgets a draft with no readable date", () => {
    assert.equal(isFreshDraft("", now), false);
    assert.equal(isFreshDraft("yesterday", now), false);
  });
});

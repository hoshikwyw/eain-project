/**
 * Template pages test against a running dev server: each template has a
 * public page that shows the receiver's view and the way to start from it,
 * premium ones point at unlocking, made-up names are not found, and the
 * sitemap lists the pages.
 *
 * Run:  pnpm test:templates   (dev server must be running on port 5173)
 * Needs .env.local. Creates nothing.
 */
import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5173").replace(/\/$/, "");

const anon = createClient(url, anonKey, { auth: { persistSession: false } });

/** A page decided while streaming carries its 404 as a marker in a 200 body. */
const notFound = (res: Response, html: string) =>
  res.status === 404 || html.includes("NEXT_HTTP_ERROR_FALLBACK;404");

describe("template pages", () => {
  let free: { slug: string; name_en: string };
  let premium: { slug: string; name_en: string; point_price: number };

  before(async () => {
    const { data } = await anon
      .from("templates")
      .select("slug, name_en, is_premium, point_price")
      .eq("is_active", true)
      .order("sort_order");
    free = data!.find((t) => !t.is_premium && t.slug !== "blank")!;
    premium = data!.find((t) => t.is_premium && t.slug !== "night-garden")!;
  });

  it("shows a free template with its name and a way to try it", async () => {
    const res = await fetch(`${site}/templates/${free.slug}`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, new RegExp(`<title>[^<]*${free.name_en}`));
    assert.match(html, /<h1[^>]*>[^<]*/);
    assert.ok(html.includes(`href="/try/${free.slug}"`), "try link");
    assert.ok(html.includes("Open Your Gift"), "the receiver's closed gift");
    assert.ok(!html.includes(`href="/create?template=${free.slug}"`), "no unlock link");
  });

  it("points a premium template at unlocking instead", async () => {
    const res = await fetch(`${site}/templates/${premium.slug}`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes(`href="/create?template=${premium.slug}"`), "unlock link");
    assert.ok(html.includes(`Unlock for ${premium.point_price} points`), "price");
    assert.ok(!html.includes(`href="/try/${premium.slug}"`), "no try link");
  });

  it("knows no template by a made-up name", async () => {
    const res = await fetch(`${site}/templates/not-a-template`);
    assert.ok(notFound(res, await res.text()));
  });

  it("offers a preview on every card in the library", async () => {
    const res = await fetch(`${site}/templates`);
    assert.equal(res.status, 200);
    const html = await res.text();
    const { data } = await anon.from("templates").select("name_en").eq("is_active", true);
    for (const t of data!) {
      assert.ok(
        html.includes(`aria-label="Preview ${t.name_en}"`),
        `preview button for ${t.name_en}`,
      );
    }
    assert.ok(html.includes("/brand/lovebirds.webp"), "sample photos in the thumbnails");
    // The label text travels with the renderer's props and some designs draw dashed frames;
    // the placeholder's own icon is what must be gone.
    assert.ok(!html.includes("lucide-image-plus"), "no empty photo boxes in the thumbnails");
  });

  it("lists the template pages in the sitemap", async () => {
    const res = await fetch(`${site}/sitemap.xml`);
    assert.equal(res.status, 200);
    const xml = await res.text();
    assert.ok(xml.includes(`/templates/${free.slug}</loc>`), "free template page");
    assert.ok(xml.includes(`/templates/${premium.slug}</loc>`), "premium template page");
    assert.ok(!xml.includes("/g/"), "no gift pages");
  });
});

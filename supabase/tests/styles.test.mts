/**
 * Custom styles test against the live development project and a running dev
 * server: a gift with its own colours, text styles and stickers is served to
 * the receiver, and malformed style data is dropped without hiding content.
 *
 * Run:  pnpm test:styles   (dev server must be running on port 5173)
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
let html: string;

describe("custom styles", () => {
  before(async () => {
    const email = `styles-${Date.now()}@example.com`;
    const password = `Test-${Math.random().toString(36).slice(2)}-pass`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: "Styles Tester" },
    });
    if (error || !data.user) throw error ?? new Error("createUser failed");
    userId = data.user.id;
    const signIn = await user.auth.signInWithPassword({ email, password });
    if (signIn.error) throw signIn.error;

    const { data: template } = await user.from("templates").select("id").eq("slug", "birthday-postcard").single();
    const { data: gift, error: giftError } = await user
      .from("gifts")
      .insert({
        sender_id: userId,
        template_id: template!.id,
        title: "Styled gift",
        theme: {
          variant: "night",
          opening: "envelope",
          colors: { bg: "#102030", accent: "#12ab34", card: "not-a-colour" },
          stickers: [
            { id: "a", kind: "balloon", x: 90, y: 10, size: 14, rotate: 12 },
            { id: "b", kind: "crown", anchor: 0, x: 50, y: 0, size: 20 },
            { id: "c", kind: "no-such-sticker", x: 50, y: 50, size: 20 },
            { id: "d", kind: "cake", anchor: 1, x: 500, y: 50, size: 20 },
            // A section can be much narrower than the gift, so sizes above 100 are valid.
            { id: "e", kind: "teddy", anchor: 3, x: 50, y: 50, size: 150, rotate: -30 },
          ],
        },
      })
      .select("id, share_token")
      .single();
    if (giftError || !gift) throw giftError ?? new Error("gift insert failed");

    const { error: sectionsError } = await user.from("gift_sections").insert([
      {
        gift_id: gift.id,
        type: "text",
        position: 0,
        content: {
          heading: "Styled heading",
          subheading: "Styled subheading",
          styles: { heading: { color: "#fedcba", scale: 1.75, align: "center", font: "hand", bold: true } },
        },
      },
      {
        gift_id: gift.id,
        type: "message",
        position: 1,
        content: { text: "Message with a broken style.", styles: { text: { color: "red;background:url(x)" } } },
      },
      { gift_id: gift.id, type: "final_message", position: 2, content: { text: "Bye,", signature: "Tester" } },
      {
        gift_id: gift.id,
        type: "quote",
        position: 3,
        content: { text: "ကျေးဇူးတင်ပါတယ်", attribution: "", styles: { text: { font: "padauk", italic: false }, attribution: { font: "comic-sans" } } },
      },
    ]);
    if (sectionsError) throw sectionsError;

    const published = await user.rpc("publish_gift", { p_gift_id: gift.id });
    if (published.error) throw published.error;

    const res = await fetch(`${site}/g/${gift.share_token}`);
    assert.equal(res.status, 200);
    html = await res.text();
  });

  after(async () => {
    if (userId) await admin.auth.admin.deleteUser(userId);
  });

  it("serves the creator's text styles", () => {
    assert.ok(html.includes("Styled heading"));
    assert.ok(html.includes("#fedcba"), "heading colour");
    assert.ok(html.includes("1.75em"), "heading size");
    assert.ok(html.includes("font-hand"), "heading font");
  });

  it("serves the creator's colours over the look", () => {
    assert.ok(html.includes("#102030"), "background");
    assert.ok(html.includes("#12ab34"), "accent");
  });

  it("serves stickers on the gift and on a section", () => {
    assert.ok(html.includes("🎈"), "sticker on the gift");
    assert.ok(html.includes("👑"), "sticker on the cover section");
    assert.ok(html.includes("🧸"), "a sticker wider than its narrow section");
  });

  it("serves a picked font, and gives Burmese text the line height it needs", () => {
    assert.ok(html.includes("font-padauk"), "the picked font");
    assert.ok(html.includes("data-burmese"), "Burmese text is marked for taller lines");
    assert.ok(!html.includes("comic-sans"), "an unknown font is not served");
  });

  it("mixes the design's tints again from a custom accent", () => {
    assert.ok(html.includes("color-mix(in srgb, var(--t-accent) 16%, var(--t-card))"), "soft accent");
    assert.ok(html.includes("color-mix(in srgb, var(--t-accent) 80%, var(--t-fg))"), "highlight");
  });

  it("drops malformed style data but keeps the content", () => {
    assert.ok(html.includes("Message with a broken style."), "text with a bad style is still shown");
    assert.ok(!html.includes("url(x)"), "a bad text colour is not served");
    assert.ok(!html.includes("not-a-colour"), "a bad gift colour is not served");
    assert.ok(!html.includes("no-such-sticker"), "an unknown sticker is not served");
    assert.ok(!html.includes("🎂"), "an out-of-range sticker is not served");
  });
});

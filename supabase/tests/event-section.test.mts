/**
 * The event details section: saved like any other section, shown on the
 * public gift page with its date, place and note. Skips itself, with a
 * message, until migration 0017 has been run on the project.
 * Run:  pnpm test:event
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5173";

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const user = createClient(url, anonKey, { auth: { persistSession: false } });

let userId: string;
let giftId: string;
let token: string;
let migrated = true;

describe("event details section", () => {
  before(async () => {
    const email = `event-${Date.now()}@example.com`;
    const password = `Test-${Math.random().toString(36).slice(2)}-pass`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) throw error ?? new Error("createUser failed");
    userId = data.user.id;
    const signIn = await user.auth.signInWithPassword({ email, password });
    if (signIn.error) throw signIn.error;
    const { data: template } = await user
      .from("templates")
      .select("id")
      .eq("slug", "general-postcard")
      .single();
    const { data: gift } = await user
      .from("gifts")
      .insert({ sender_id: userId, template_id: template!.id, title: "Party" })
      .select("id, share_token")
      .single();
    giftId = gift!.id;
    token = gift!.share_token;
  });

  after(async () => {
    if (userId) await admin.auth.admin.deleteUser(userId);
  });

  it("stores an event section once the enum knows it", async () => {
    const { error } = await user.from("gift_sections").insert([
      {
        gift_id: giftId,
        type: "text",
        position: 0,
        content: { heading: "You are invited", subheading: "" },
      },
      {
        gift_id: giftId,
        type: "event",
        position: 1,
        content: {
          date: "Saturday 21 December",
          time: "7 pm",
          place: "Rooftop, Inya Lake Hotel",
          note: "Dress bright. RSVP by Monday.",
        },
      },
    ]);
    if (error && /invalid input value for enum/.test(error.message)) {
      migrated = false;
      console.log("  ⚠ migration 0017 is not applied on this project; run it in the SQL editor");
      return;
    }
    assert.equal(error, null, error?.message);
  });

  it("shows the date, place and note on the public page", async (t) => {
    if (!migrated) return t.skip("migration 0017 not applied");
    const pub = await user.rpc("publish_gift", { p_gift_id: giftId });
    assert.equal(pub.error, null);
    const html = await (await fetch(`${site}/g/${token}`)).text();
    for (const text of [
      "Saturday 21 December",
      "7 pm",
      "Rooftop, Inya Lake Hotel",
      "RSVP by Monday",
    ]) {
      assert.ok(html.includes(text), `missing: ${text}`);
    }
    // The closed page carries the sections as data; the icons draw once the gift is opened.
    // The closed page carries the section's words as data; its icons draw once the gift is opened.
  });
});

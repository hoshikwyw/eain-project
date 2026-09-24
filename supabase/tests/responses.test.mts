/**
 * Responses and premium unlock, against the live project and a running dev
 * server. Run:  pnpm test:responses
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
let giftId: string;
let token: string;
let choiceQ: string;
let textQ: string;
let optionA: string;
let optionB: string;
const session = `resp-${Date.now()}`;
const headers = { "Content-Type": "application/json" };

const post = (path: string, body: unknown) => fetch(`${site}${path}`, { method: "POST", headers, body: JSON.stringify(body) });

describe("responses and premium unlock", () => {
  before(async () => {
    const email = `resp-${Date.now()}@example.com`;
    const password = `Test-${Math.random().toString(36).slice(2)}-pass`;
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) throw error ?? new Error("createUser failed");
    userId = data.user.id;
    const signIn = await user.auth.signInWithPassword({ email, password });
    if (signIn.error) throw signIn.error;

    const { data: template } = await user.from("templates").select("id").eq("slug", "friendship").single();
    const { data: gift } = await user
      .from("gifts")
      .insert({ sender_id: userId, template_id: template!.id, title: "Question gift" })
      .select("id, share_token")
      .single();
    giftId = gift!.id;
    token = gift!.share_token;

    choiceQ = crypto.randomUUID();
    textQ = crypto.randomUUID();
    optionA = crypto.randomUUID();
    optionB = crypto.randomUUID();

    // What the editor's save does: sections plus mirrored question rows.
    await user.from("gift_sections").insert([
      { gift_id: giftId, type: "text", position: 0, content: { heading: "Hi friend", subheading: "" } },
      {
        gift_id: giftId,
        type: "question",
        position: 1,
        content: {
          questionId: choiceQ,
          kind: "choice",
          prompt: "Favourite memory?",
          required: true,
          options: [{ id: optionA, label: "The trip" }, { id: optionB, label: "The rainy day" }],
        },
      },
      {
        gift_id: giftId,
        type: "question",
        position: 2,
        content: { questionId: textQ, kind: "short_text", prompt: "Anything else?", required: false, options: [] },
      },
    ]);
    const q = await user.from("gift_questions").insert([
      { id: choiceQ, gift_id: giftId, type: "choice", prompt: "Favourite memory?", position: 1, is_required: true },
      { id: textQ, gift_id: giftId, type: "short_text", prompt: "Anything else?", position: 2, is_required: false },
    ]);
    assert.equal(q.error, null);
    const o = await user.from("gift_question_options").insert([
      { id: optionA, question_id: choiceQ, label: "The trip", position: 0 },
      { id: optionB, question_id: choiceQ, label: "The rainy day", position: 1 },
    ]);
    assert.equal(o.error, null);

    const pub = await user.rpc("publish_gift", { p_gift_id: giftId });
    assert.equal(pub.error, null);
  });

  after(async () => {
    if (userId) await admin.auth.admin.deleteUser(userId);
  });

  it("the public page hides question sections from the gift body but ships the questions", async () => {
    const html = await (await fetch(`${site}/g/${token}`)).text();
    assert.ok(html.includes("Favourite memory?"), "question prompt is in the payload for the reply form");
    // The phrase itself is in the message catalogue shipped to the client, so
    // check for the rendered element rather than the bare string.
    assert.ok(!html.includes("They will be asked</p>"), "editor-only question preview must not render");
  });

  it("rejects a response that skips a required question", async () => {
    const res = await post(`/api/g/${token}/responses`, { sessionId: session, answers: [{ questionId: textQ, text: "hello" }] });
    assert.equal(res.status, 400);
  });

  it("rejects an option from another question or gift", async () => {
    const res = await post(`/api/g/${token}/responses`, {
      sessionId: session,
      answers: [{ questionId: choiceQ, optionId: crypto.randomUUID() }],
    });
    assert.equal(res.status, 400);
  });

  it("accepts a valid response, notifies and pays +20 once", async () => {
    const before = await user.from("profiles").select("points_balance").single();
    const res = await post(`/api/g/${token}/responses`, {
      sessionId: session,
      answers: [
        { questionId: choiceQ, optionId: optionA },
        { questionId: textQ, text: "Miss you!" },
      ],
    });
    assert.equal(res.status, 200, await res.text());

    const { data: responses } = await user.from("gift_responses").select("id").eq("gift_id", giftId);
    assert.equal(responses?.length, 1);
    const { data: answers } = await user
      .from("gift_answers")
      .select("question_id, option_id, answer_text")
      .eq("response_id", responses![0]!.id)
      .order("question_id");
    const byQ = new Map(answers!.map((a) => [a.question_id, a]));
    assert.equal(byQ.get(choiceQ)?.option_id, optionA);
    assert.equal(byQ.get(choiceQ)?.answer_text, "The trip", "label snapshot stored");
    assert.equal(byQ.get(textQ)?.answer_text, "Miss you!");

    const { data: events } = await user.from("gift_events").select("event_type").eq("gift_id", giftId).eq("event_type", "responded");
    assert.equal(events?.length, 1);
    const { data: notes } = await user.from("notifications").select("type").eq("gift_id", giftId);
    assert.deepEqual(notes?.map((n) => n.type), ["response_received"]);

    const after = await user.from("profiles").select("points_balance").single();
    assert.equal(after.data!.points_balance, before.data!.points_balance + 20);
  });

  it("one response per browser session", async () => {
    const res = await post(`/api/g/${token}/responses`, { sessionId: session, answers: [{ questionId: choiceQ, optionId: optionB }] });
    assert.equal(res.status, 409);
  });

  it("a second session responds but does not pay again", async () => {
    const before = await user.from("profiles").select("points_balance").single();
    const res = await post(`/api/g/${token}/responses`, { sessionId: `${session}-2`, answers: [{ questionId: choiceQ, optionId: optionB }] });
    assert.equal(res.status, 200);
    const after = await user.from("profiles").select("points_balance").single();
    assert.equal(after.data!.points_balance, before.data!.points_balance);
  });

  it("responses are unreachable by anon and other users", async () => {
    const anon = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data } = await anon.from("gift_responses").select("id").eq("gift_id", giftId);
    assert.equal((data ?? []).length, 0);
    const { data: ans } = await anon.from("gift_answers").select("id");
    assert.equal((ans ?? []).length, 0);
  });

  it("premium unlock spends points once and enables the template", async () => {
    const { data: premium } = await user.from("templates").select("id, point_price").eq("slug", "birthday-surprise").single();
    const before = await user.from("profiles").select("points_balance").single();
    assert.ok(before.data!.points_balance >= premium!.point_price, "test user needs enough points");

    const first = await user.rpc("unlock_template", { p_template_id: premium!.id });
    assert.equal(first.error, null, first.error?.message);
    const second = await user.rpc("unlock_template", { p_template_id: premium!.id });
    assert.equal(second.error, null);

    const after = await user.from("profiles").select("points_balance").single();
    assert.equal(after.data!.points_balance, before.data!.points_balance - premium!.point_price, "charged exactly once");

    const { data: unlocks } = await user.from("template_unlocks").select("template_id");
    assert.deepEqual(unlocks?.map((u) => u.template_id), [premium!.id]);
    const { data: tx } = await user.from("point_transactions").select("type, amount").eq("reference_type", "template_unlock");
    assert.deepEqual(tx, [{ type: "spend", amount: -premium!.point_price }]);
  });

  it("unlock fails cleanly without enough points", async () => {
    const { data: pricey } = await user.from("templates").select("id, point_price").eq("slug", "memory-timeline").single();
    const { data: profile } = await user.from("profiles").select("points_balance").single();
    if (profile!.points_balance >= pricey!.point_price) {
      // Spend down first so the check is meaningful.
      const { data: other } = await user.from("templates").select("id").eq("slug", "anniversary").single();
      await user.rpc("unlock_template", { p_template_id: other!.id });
    }
    const { data: now } = await user.from("profiles").select("points_balance").single();
    if (now!.points_balance >= pricey!.point_price) return; // still rich; nothing to assert
    const res = await user.rpc("unlock_template", { p_template_id: pricey!.id });
    assert.ok(res.error, "should fail");
    assert.match(res.error!.message, /insufficient/);
    const { data: unlocks } = await user.from("template_unlocks").select("template_id").eq("template_id", pricey!.id);
    assert.equal(unlocks?.length, 0);
  });

  it("free templates cannot be 'unlocked'", async () => {
    const { data: free } = await user.from("templates").select("id").eq("slug", "thank-you").single();
    const res = await user.rpc("unlock_template", { p_template_id: free!.id });
    assert.ok(res.error);
  });
});

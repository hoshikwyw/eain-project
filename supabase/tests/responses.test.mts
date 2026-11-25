/**
 * Responses, and premium templates that points do not unlock, against the live project and a running dev
 * server. Run:  pnpm test:responses
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
let choiceQ: string;
let textQ: string;
let optionA: string;
let optionB: string;
const session = `resp-${Date.now()}`;
const headers = { "Content-Type": "application/json" };

const post = (path: string, body: unknown) =>
  fetch(`${site}${path}`, { method: "POST", headers, body: JSON.stringify(body) });

describe("responses and premium unlock", () => {
  before(async () => {
    const email = `resp-${Date.now()}@example.com`;
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
      .eq("slug", "friendship")
      .single();
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
      {
        gift_id: giftId,
        type: "text",
        position: 0,
        content: { heading: "Hi friend", subheading: "" },
      },
      {
        gift_id: giftId,
        type: "question",
        position: 1,
        content: {
          questionId: choiceQ,
          kind: "choice",
          prompt: "Favourite memory?",
          required: true,
          options: [
            { id: optionA, label: "The trip" },
            { id: optionB, label: "The rainy day" },
          ],
        },
      },
      {
        gift_id: giftId,
        type: "question",
        position: 2,
        content: {
          questionId: textQ,
          kind: "short_text",
          prompt: "Anything else?",
          required: false,
          options: [],
        },
      },
    ]);
    const q = await user.from("gift_questions").insert([
      {
        id: choiceQ,
        gift_id: giftId,
        type: "choice",
        prompt: "Favourite memory?",
        position: 1,
        is_required: true,
      },
      {
        id: textQ,
        gift_id: giftId,
        type: "short_text",
        prompt: "Anything else?",
        position: 2,
        is_required: false,
      },
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
    assert.ok(
      html.includes("Favourite memory?"),
      "question prompt is in the payload for the reply form",
    );
    // The phrase itself is in the message catalogue shipped to the client, so
    // check for the rendered element rather than the bare string.
    assert.ok(
      !html.includes("They will be asked</p>"),
      "editor-only question preview must not render",
    );
  });

  it("rejects a response that skips a required question", async () => {
    const res = await post(`/api/g/${token}/responses`, {
      sessionId: session,
      answers: [{ questionId: textQ, text: "hello" }],
    });
    assert.equal(res.status, 400);
  });

  it("rejects an option from another question or gift", async () => {
    const res = await post(`/api/g/${token}/responses`, {
      sessionId: session,
      answers: [{ questionId: choiceQ, optionId: crypto.randomUUID() }],
    });
    assert.equal(res.status, 400);
  });

  it("accepts a valid response and notifies, earning no points", async () => {
    const before = await user.from("profiles").select("points_balance").single();
    const res = await post(`/api/g/${token}/responses`, {
      sessionId: session,
      answers: [
        { questionId: choiceQ, optionId: optionA },
        { questionId: textQ, text: "Miss you!" },
      ],
    });
    assert.equal(res.status, 200, await res.text());

    const { data: responses } = await user
      .from("gift_responses")
      .select("id")
      .eq("gift_id", giftId);
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

    const { data: events } = await user
      .from("gift_events")
      .select("event_type")
      .eq("gift_id", giftId)
      .eq("event_type", "responded");
    assert.equal(events?.length, 1);
    const { data: notes } = await user
      .from("notifications")
      .select("type, payload")
      .eq("gift_id", giftId);
    assert.deepEqual(
      notes?.map((n) => n.type),
      ["response_received"],
    );
    // With migration 0021 the notification says what was answered; before it, only the title.
    const summary = (notes?.[0]?.payload as { summary?: string } | null)?.summary;
    if (summary === undefined)
      console.log(
        "  ⚠ migration 0021 is not applied; the reply summary is missing from notifications",
      );
    else assert.ok(summary.includes("The trip") && summary.includes("Miss you!"), summary);

    const after = await user.from("profiles").select("points_balance").single();
    assert.equal(after.data!.points_balance, before.data!.points_balance, "a reply earns nothing");
  });

  it("one response per browser session", async () => {
    const res = await post(`/api/g/${token}/responses`, {
      sessionId: session,
      answers: [{ questionId: choiceQ, optionId: optionB }],
    });
    assert.equal(res.status, 409);
  });

  it("the same session can change its answer", async () => {
    const res = await post(`/api/g/${token}/responses`, {
      sessionId: session,
      answers: [{ questionId: choiceQ, optionId: optionB }],
      replace: true,
    });
    assert.equal(res.status, 200);
    const { data: rows } = await admin
      .from("gift_responses")
      .select("id, gift_answers(question_id, option_id)")
      .eq("gift_id", giftId)
      .eq("session_id", session);
    assert.equal(rows?.length, 1, "still one reply for this session");
    const answers = (
      rows?.[0] as { gift_answers: { question_id: string; option_id: string | null }[] }
    ).gift_answers;
    assert.deepEqual(
      answers.map((a) => a.option_id),
      [optionB],
      "the earlier answers are gone",
    );
  });

  it("a returning session reads back its own answers, and only its own", async () => {
    const res = await fetch(`${site}/api/g/${token}/responses?session=${session}`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      ok: boolean;
      answers: { questionId: string; optionId: string | null }[];
    };
    assert.deepEqual(
      body.answers.map((a) => [a.questionId, a.optionId]),
      [[choiceQ, optionB]],
      "the answer it last sent",
    );
    const other = await fetch(`${site}/api/g/${token}/responses?session=never-replied-1`);
    assert.deepEqual(await other.json(), { ok: true, answers: [] });
    const bad = await fetch(`${site}/api/g/${token}/responses`);
    assert.equal(bad.status, 400, "no session id, nothing to read");
  });

  it("a second session responds but does not pay again", async () => {
    const before = await user.from("profiles").select("points_balance").single();
    const res = await post(`/api/g/${token}/responses`, {
      sessionId: `${session}-2`,
      answers: [{ questionId: choiceQ, optionId: optionB }],
    });
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

  it("a headcount question stores its number and reads it plainly", async () => {
    const { data: q, error } = await admin
      .from("gift_questions")
      .insert({
        gift_id: giftId,
        type: "count",
        prompt: "How many of you?",
        position: 9,
        is_required: false,
      })
      .select("id")
      .single();
    if (error && /invalid input value for enum/.test(error.message)) {
      console.log("  ⚠ migration 0022 is not applied on this project; run it in the SQL editor");
      return;
    }
    assert.equal(error, null, error?.message);
    const res = await post(`/api/g/${token}/responses`, {
      sessionId: "headcount-1",
      answers: [
        { questionId: choiceQ, optionId: optionA },
        { questionId: q!.id, number: 3 },
      ],
    });
    assert.equal(res.status, 200);
    const { data: stored } = await admin
      .from("gift_answers")
      .select("answer_number")
      .eq("question_id", q!.id)
      .single();
    assert.equal(stored?.answer_number, 3);
    const { data: note } = await admin
      .from("notifications")
      .select("payload")
      .eq("gift_id", giftId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    const summary = String((note?.payload as { summary?: string })?.summary ?? "");
    assert.ok(summary.endsWith("3"), `plain number in the summary, got: ${summary}`);
    assert.ok(!summary.includes("3/5"), "not out of five");
  });

  it("the creator can remove a reply; nobody else can", async () => {
    const { data: rows } = await user
      .from("gift_responses")
      .select("id")
      .eq("gift_id", giftId)
      .order("created_at", { ascending: false });
    const victim = rows![0].id;
    const anon = createClient(url, anonKey, { auth: { persistSession: false } });
    await anon.from("gift_responses").delete().eq("id", victim);
    const still = await user.from("gift_responses").select("id").eq("id", victim);
    assert.equal(still.data?.length, 1, "anon cannot delete");
    const del = await user.from("gift_responses").delete({ count: "exact" }).eq("id", victim);
    assert.equal(del.error, null, del.error?.message);
    assert.equal(del.count, 1);
    const { data: answers } = await admin
      .from("gift_answers")
      .select("id")
      .eq("response_id", victim);
    assert.equal(answers?.length, 0, "its answers go with it");
  });

  it("every premium template is sold in kyat, and points unlock none of them", async () => {
    // Needs migration 0027. Rich in points on purpose: the money is what unlocks.
    const topUp = await admin.rpc("apply_point_transaction", {
      p_user_id: userId,
      p_type: "bonus",
      p_amount: 5000,
      p_reference_type: "test_seed",
      p_reference_id: `kyat-${Date.now()}`,
      p_description: "Test top-up",
    } as never);
    assert.equal(topUp.error, null, topUp.error?.message);
    const before = await user.from("profiles").select("points_balance").single();

    const { data: premium } = await user
      .from("templates")
      .select("id, slug, paid_only, price_mmk")
      .eq("is_premium", true)
      .eq("is_active", true);
    assert.ok(premium && premium.length >= 5, "the premium templates are listed");
    for (const t of premium!) {
      assert.equal(t.paid_only, true, `${t.slug} is paid only`);
      assert.ok((t.price_mmk ?? 0) >= 100, `${t.slug} has a kyat price`);
      const res = await user.rpc("unlock_template", { p_template_id: t.id });
      assert.match(res.error?.message ?? "", /paid only/, `${t.slug} refuses points`);
    }

    const after = await user.from("profiles").select("points_balance").single();
    assert.equal(after.data!.points_balance, before.data!.points_balance, "nothing charged");
    const { data: unlocks } = await user.from("template_unlocks").select("template_id");
    assert.equal(unlocks?.length, 0, "nothing unlocked");
  });

  it("points never unlock a paid-only template", async () => {
    const { data: wedding } = await user
      .from("templates")
      .select("id, paid_only")
      .eq("slug", "wedding-invitation")
      .single();
    assert.equal(wedding?.paid_only, true, "the wedding invitation is paid only");
    const big = await admin.rpc("apply_point_transaction", {
      p_user_id: userId,
      p_type: "bonus",
      p_amount: 1000,
      p_reference_type: "test_seed",
      p_reference_id: `paid-${Date.now()}`,
      p_description: "Test top-up",
    } as never);
    assert.equal(big.error, null, big.error?.message);
    const before = await user.from("profiles").select("points_balance").single();

    const res = await user.rpc("unlock_template", { p_template_id: wedding!.id });
    assert.ok(res.error, "should fail");
    assert.match(res.error!.message, /paid only/);

    const after = await user.from("profiles").select("points_balance").single();
    assert.equal(after.data!.points_balance, before.data!.points_balance, "nothing charged");
    const { data: unlocks } = await user
      .from("template_unlocks")
      .select("template_id")
      .eq("template_id", wedding!.id);
    assert.equal(unlocks?.length, 0);
  });

  it("free templates cannot be 'unlocked'", async () => {
    const { data: free } = await user
      .from("templates")
      .select("id")
      .eq("slug", "thank-you")
      .single();
    const res = await user.rpc("unlock_template", { p_template_id: free!.id });
    assert.ok(res.error);
  });
});

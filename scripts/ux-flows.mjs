/**
 * UX journeys in a real (headless) browser against a running dev server:
 *
 *   visitor   home -> library -> a template page -> try it in the guest editor
 *   guest     open an invitation link, RSVP on the card, come back and find the answer, change it
 *   keyboard  the RSVP card by Tab and arrow keys alone
 *   host      sign in with email and password, read the guest list, find the download,
 *             change the account's picture in settings
 *
 * It makes a throwaway host (…@example.com) with a published invitation and
 * deletes them at the end. Needs the Supabase service role from .env.
 *
 *   node --env-file=.env scripts/ux-flows.mjs            # phone width
 *   node --env-file=.env scripts/ux-flows.mjs --width 1280
 *   node --env-file=.env scripts/ux-flows.mjs --base http://localhost:5173 --keep (leave the user for a look)
 *
 * Prints one line per check and a summary; exits 1 when a check fails.
 * Needs Chrome (preferred) or Microsoft Edge on the machine.
 */
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const opt = { base: "http://localhost:5173", width: 390, keep: false };
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--base") opt.base = args[++i];
  else if (args[i] === "--width") opt.width = Number(args[++i]);
  else if (args[i] === "--keep") opt.keep = true;
}
const BROWSERS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Results ---------------------------------------------------------------------

const results = [];
let flow = "";
function check(name, ok, detail = "") {
  results.push({ flow, name, ok: Boolean(ok), detail });
  console.log(`${ok ? "  ok  " : "  FAIL"} ${name}${detail ? "  (" + detail + ")" : ""}`);
}
function start(name) {
  flow = name;
  console.log(`\n${name}`);
}

// Browser ---------------------------------------------------------------------

async function launch(width) {
  const exe = BROWSERS.find((p) => existsSync(p));
  if (!exe) throw new Error("No Chrome or Edge found; add its path to BROWSERS.");
  const port = 9700 + Math.floor(Math.random() * 200);
  const proc = spawn(
    exe,
    [
      "--headless=new",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${mkdtempSync(join(tmpdir(), "eain-flows-"))}`,
      "--no-first-run",
      "--disable-gpu",
      "--hide-scrollbars",
      `--window-size=${width},900`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  let page;
  for (let i = 0; i < 60 && !page; i++) {
    try {
      page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(
        (t) => t.type === "page",
      );
    } catch {}
    if (!page) await sleep(200);
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  let seq = 0;
  const pending = new Map();
  const errors = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      if (m.error) rej(new Error(m.error.message));
      else res(m.result);
    } else if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") {
      errors.push(
        m.params.args
          .map((a) => a.value ?? a.description ?? "")
          .join(" ")
          .slice(0, 200),
      );
    } else if (m.method === "Runtime.exceptionThrown") {
      errors.push(
        (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text).slice(
          0,
          200,
        ),
      );
    }
  };
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const id = ++seq;
      pending.set(id, { res, rej });
      ws.send(JSON.stringify({ id, method, params }));
    });
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height: 900,
    deviceScaleFactor: 1,
    mobile: width < 700,
  });
  if (width < 700) await send("Emulation.setTouchEmulationEnabled", { enabled: true });
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails)
      throw new Error(r.exceptionDetails.exception?.description ?? "evaluate failed");
    return r.result.value;
  };
  const settle = async (maxMs = 25000) => {
    const startAt = Date.now();
    let last = -1;
    let stableSince = Date.now();
    while (Date.now() - startAt < maxMs) {
      await sleep(400);
      const size = await evaluate(
        'document.readyState === "complete" && ![...document.querySelectorAll("template")].some((t) => t.id.startsWith("B:")) ? document.body.innerHTML.length : -1',
      );
      if (size !== last) {
        last = size;
        stableSince = Date.now();
      } else if (size > 0 && Date.now() - stableSince >= 1200) return;
    }
  };
  const api = {
    errors,
    evaluate,
    settle,
    async goto(path) {
      const t0 = Date.now();
      await send("Page.navigate", { url: path.startsWith("http") ? path : opt.base + path });
      await settle();
      return Date.now() - t0;
    },
    /** Clicks the first visible element in `scope` whose text or label matches. */
    async click(re, scope = "button, a, [role=radio], [role=tab]") {
      const hit = await evaluate(
        `(() => { const re = new RegExp(${JSON.stringify(re)}, "i"); const el = [...document.querySelectorAll(${JSON.stringify(scope)})].find((x) => re.test((x.getAttribute("aria-label") || x.textContent || "").trim()) && x.getClientRects().length); if (!el) return false; el.click(); return true; })()`,
      );
      await sleep(300);
      return hit;
    },
    /** Polls a page expression until it is truthy, up to maxMs. */
    async waitFor(expression, maxMs = 10000) {
      const t0 = Date.now();
      while (Date.now() - t0 < maxMs) {
        if (await evaluate(expression)) return true;
        await sleep(250);
      }
      return false;
    },
    async type(selector, text) {
      return evaluate(
        `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; el.focus(); const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, "value").set.call(el, ${JSON.stringify(text)}); el.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`,
      );
    },
    async key(key) {
      const codes = {
        Tab: 9,
        Enter: 13,
        ArrowDown: 40,
        ArrowUp: 38,
        ArrowRight: 39,
        ArrowLeft: 37,
      };
      const base = { key, code: key, windowsVirtualKeyCode: codes[key] };
      await send("Input.dispatchKeyEvent", { type: "keyDown", ...base });
      await send("Input.dispatchKeyEvent", { type: "keyUp", ...base });
      await sleep(120);
    },
    text: (selector) =>
      evaluate(
        `(document.querySelector(${JSON.stringify(selector)})?.innerText || "").replace(/\\s+/g, " ").trim()`,
      ),
    exists: (selector) => evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`),
    path: () => evaluate("location.pathname"),
    async setCookies(cookies) {
      for (const c of cookies)
        await send("Network.setCookie", { name: c.name, value: c.value, url: opt.base, path: "/" });
    },
    async clearCookies() {
      await send("Network.clearBrowserCookies");
    },
    async close() {
      try {
        await send("Browser.close");
      } catch {}
      try {
        ws.close();
      } catch {}
      proc.kill();
    },
  };
  return api;
}

// A host with an invitation -----------------------------------------------------

async function makeHost() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are needed (node --env-file=.env).",
    );
  }
  const admin = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const email = `ux-flows-${Date.now()}@example.com`;
  const password = `Flow-${randomUUID().slice(0, 8)}-pass`;
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "Flow Host" },
  });
  if (error) throw error;
  const userId = created.user.id;
  const jar = new Map();
  const ssr = createServerClient(url, anon, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (list) =>
        list.forEach((c) => (c.value ? jar.set(c.name, c.value) : jar.delete(c.name))),
    },
  });
  const signIn = await ssr.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;
  const { data: tpl } = await ssr
    .from("templates")
    .select("id")
    .eq("slug", "wedding-invitation")
    .single();
  const { data: gift, error: gErr } = await ssr
    .from("gifts")
    .insert({
      sender_id: userId,
      template_id: tpl.id,
      title: "Flow wedding",
      theme: { variant: "champagne", opening: "envelope" },
    })
    .select("id")
    .single();
  if (gErr) throw gErr;
  const nameQ = randomUUID();
  const rsvpQ = randomUUID();
  const yes = randomUUID();
  const no = randomUUID();
  const sections = [
    {
      type: "text",
      content: {
        heading: "We're getting married",
        subheading: "and we would love to have you there.",
      },
    },
    {
      type: "event",
      content: {
        date: "Saturday, 21 December 2026",
        time: "7:00 PM",
        place: "Rooftop, Inya Lake Hotel",
        note: "",
        startsAt: "2026-12-21T19:00",
        rsvpBy: "2099-12-01",
      },
    },
    {
      type: "question",
      content: {
        questionId: nameQ,
        kind: "short_text",
        prompt: "Your name",
        required: true,
        options: [],
      },
    },
    {
      type: "question",
      content: {
        questionId: rsvpQ,
        kind: "yes_no",
        prompt: "Will you join us?",
        required: true,
        options: [
          { id: yes, label: "Yes, I'll be there" },
          { id: no, label: "Sorry, I can't make it" },
        ],
      },
    },
    { type: "final_message", content: { text: "With love,", signature: "" } },
  ];
  const { error: sErr } = await ssr
    .from("gift_sections")
    .insert(sections.map((s, position) => ({ gift_id: gift.id, position, ...s })));
  if (sErr) throw sErr;
  const { error: qErr } = await admin.from("gift_questions").insert([
    {
      id: nameQ,
      gift_id: gift.id,
      type: "short_text",
      prompt: "Your name",
      position: 2,
      is_required: true,
    },
    {
      id: rsvpQ,
      gift_id: gift.id,
      type: "yes_no",
      prompt: "Will you join us?",
      position: 3,
      is_required: true,
    },
  ]);
  if (qErr) throw qErr;
  await admin.from("gift_question_options").insert([
    { id: yes, question_id: rsvpQ, label: "Yes, I'll be there", position: 0 },
    { id: no, question_id: rsvpQ, label: "Sorry, I can't make it", position: 1 },
  ]);
  const published = await ssr.rpc("publish_gift", { p_gift_id: gift.id });
  if (published.error) throw published.error;
  const { data: row } = await admin.from("gifts").select("share_token").eq("id", gift.id).single();
  return {
    email,
    password,
    giftId: gift.id,
    token: row.share_token,
    cookies: [...jar].map(([name, value]) => ({ name, value })),
    cleanup: () => admin.auth.admin.deleteUser(userId),
  };
}

// The journeys ----------------------------------------------------------------

const host = await makeHost();
const b = await launch(opt.width);
// React's dev build logs a timing exception on some pages; it is not part of the app.
const DEV_NOISE = /negative time stamp|chrome-extension/;
const freshErrors = () => b.errors.splice(0).filter((e) => !DEV_NOISE.test(e));
const SENT = "/sent/.test(document.querySelector('.question [role=status]')?.textContent || '')";

try {
  start("visitor: home -> library -> template -> try it");
  let ms = await b.goto("/");
  check("home loads", await b.exists("h1"), `${ms}ms`);
  check(
    "one h1 on the home page",
    (await b.evaluate("document.querySelectorAll('h1').length")) === 1,
  );
  check(
    "start a gift leads to the library",
    (await b.click("^Start a gift")) && (await b.settle(), (await b.path()) === "/templates"),
  );
  check(
    "library shows template cards",
    (await b.evaluate("document.querySelectorAll('article[id^=template-]').length")) >= 8,
  );
  check(
    "the invitations chip narrows the list",
    (await b.click("^Invitations$", "button[aria-pressed]")) &&
      (await b.waitFor("document.querySelectorAll('article[id^=template-]').length === 7", 4000)),
  );
  await b.goto("/templates/party-invitation");
  check("template page names the template", (await b.text("h1")).includes("Party Invitation"));
  check(
    "try it opens the guest editor",
    (await b.click("Try it free")) &&
      (await b.settle(), (await b.path()).startsWith("/try/")) &&
      (await b.waitFor("Boolean(document.querySelector('[data-section-id]'))")),
  );
  let errs = freshErrors();
  check("no console errors so far", errs.length === 0, errs.join(" | "));

  start("guest: RSVP on the card");
  ms = await b.goto(`/g/${host.token}`);
  check("invitation link opens the closed stage", await b.click("Open the invitation"), `${ms}ms`);
  await b.settle();
  check(
    "the card asks for a name and an answer",
    (await b.evaluate("document.querySelectorAll('.question').length")) === 2,
  );
  check(
    "a required answer blocks sending",
    (await b.click("Send my RSVP")) &&
      (await b.waitFor("Boolean(document.querySelector('.question [role=alert]'))", 3000)),
  );
  check("the name field takes a name", await b.type(".question textarea", "Thuzar"));
  check("yes can be picked", await b.click("^Yes, I'll be there"));
  check("sending succeeds", (await b.click("Send my RSVP")) && (await b.waitFor(SENT, 8000)));
  check(
    "a change button appears",
    await b.evaluate(
      "[...document.querySelectorAll('.question button')].some(x => /Change my RSVP/.test(x.textContent))",
    ),
  );
  await b.goto(`/g/${host.token}`);
  await b.click("Open the invitation");
  await b.settle();
  check(
    "coming back shows the earlier name",
    await b.waitFor("document.querySelector('.question textarea')?.value === 'Thuzar'"),
  );
  check(
    "and the earlier choice, locked",
    await b.evaluate(
      "(() => { const r = document.querySelector('.question [role=radio][aria-checked=true]'); return Boolean(r) && /Yes/.test(r.textContent) && r.disabled; })()",
    ),
  );
  check(
    "change unlocks the card",
    (await b.click("Change my RSVP")) &&
      (await b.waitFor(
        "[...document.querySelectorAll('.question [role=radio]')].every(r => !r.disabled)",
        3000,
      )),
  );
  const changed =
    (await b.click("^Sorry")) && (await b.click("Send my RSVP")) && (await b.waitFor(SENT, 8000));
  check("sorry can be sent instead", changed);
  const lastChip = changed ? "Not coming\\s*1" : "Coming\\s*1";
  errs = freshErrors();
  check("no console errors in the guest flow", errs.length === 0, errs.join(" | "));

  start("keyboard: the card by Tab and arrows");
  await b.evaluate("localStorage.clear(); sessionStorage.clear();");
  await b.goto(`/g/${host.token}`);
  await b.click("Open the invitation");
  await b.settle();
  await b.evaluate("document.querySelector('.question textarea').focus()");
  await b.key("Tab");
  check(
    "Tab from the name lands on the first option",
    await b.evaluate("document.activeElement.getAttribute('role') === 'radio'"),
  );
  await b.key("ArrowDown");
  check(
    "ArrowDown moves and chooses",
    await b.evaluate(
      "document.activeElement.getAttribute('aria-checked') === 'true' && /Sorry/.test(document.activeElement.textContent)",
    ),
  );
  await b.key("Tab");
  check(
    "Tab leaves the group for the send button",
    await b.evaluate("/Send my RSVP/.test(document.activeElement.textContent)"),
  );

  start("host: sign in and read the guest list");
  await b.clearCookies();
  await b.evaluate("localStorage.clear(); sessionStorage.clear();");
  ms = await b.goto("/auth/login");
  check(
    "sign-in page has labelled fields",
    (await b.exists("label[for=email]")) && (await b.exists("label[for=password]")),
    `${ms}ms`,
  );
  await b.type("#email", host.email);
  await b.type("#password", host.password);
  await b.click("^Log in$");
  check(
    "email and password sign in reaches the dashboard",
    await b.waitFor("location.pathname === '/dashboard'", 20000),
  );
  await b.settle();
  ms = await b.goto(`/dashboard/gifts/${host.giftId}`);
  check(
    "the gift page shows the guest list",
    (await b.text("body")).includes("Guest list"),
    `${ms}ms`,
  );
  check(
    "the reply is there with its name and answer",
    await b.evaluate(
      "(() => { const t = document.body.innerText; return t.includes('Thuzar') && (t.includes(\"Sorry, I can't make it\") || t.includes(\"Yes, I'll be there\")); })()",
    ),
  );
  check(
    "the filter chips count the reply",
    await b.evaluate(
      `[...document.querySelectorAll('button[aria-pressed]')].some(b => /${lastChip}/.test(b.textContent))`,
    ),
  );
  check(
    "the spreadsheet download is offered",
    await b.evaluate(
      "[...document.querySelectorAll('button')].some(b => /Download as spreadsheet/.test(b.textContent))",
    ),
  );
  check(
    "the deadline is shown to the host",
    (await b.text("body")).includes("Guests can reply until"),
  );

  // The account's picture: pick a style, see the confirmation and the bar follow.
  ms = await b.goto("/dashboard/settings");
  check(
    "settings offers the picture styles",
    (await b.evaluate("document.querySelectorAll('input[name=variant]').length")) === 6,
    `${ms}ms`,
  );
  const pictureBefore = await b.evaluate(
    "document.querySelector('header button[aria-haspopup] svg')?.innerHTML ?? ''",
  );
  check("a style can be chosen", await b.click("^Ring$", "label"));
  check(
    "choosing a style is confirmed",
    await b.waitFor(
      "[...document.querySelectorAll('.tst')].some((t) => /Picture updated/.test(t.textContent))",
      15000,
    ),
  );
  check(
    "the bar shows the new picture",
    await b.waitFor(
      `(document.querySelector('header button[aria-haspopup] svg')?.innerHTML ?? '') !== ${JSON.stringify(pictureBefore)}`,
      10000,
    ),
  );
  errs = freshErrors();
  check("no console errors in the host flow", errs.length === 0, errs.join(" | "));
} catch (e) {
  check("the run did not throw", false, e.message ?? String(e));
} finally {
  await b.close();
  if (!opt.keep) await host.cleanup();
  else console.log(`\nkept host ${host.email} / ${host.password}, gift ${host.giftId}`);
}

const failed = results.filter((r) => !r.ok);
console.log(
  `\n${results.length} checks, ${results.length - failed.length} passed, ${failed.length} failed @${opt.width}px`,
);
process.exit(failed.length ? 1 : 0);

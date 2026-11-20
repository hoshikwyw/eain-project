/**
 * Idle cost of an opened gift card: how busy the main thread stays once the
 * card is open and nothing is happening, with the CPU throttled the way a
 * mid-range phone would feel. Animations that repaint every frame show up
 * here as style recalcs, layouts and task time; a card that idles well
 * shows a few per cent.
 *
 * It loads the public template page, hides everything around the card so the
 * page's own strips do not count, opens the card, lets it settle, and then
 * samples the browser's performance counters over a quiet window.
 *
 * Run:  pnpm ux:idle [slugs...] [--base http://localhost:5173] [--seconds 5]
 *                    [--throttle 4] [--motion on|off|both] [--width 390] [--json out.json]
 * Needs Chrome or Edge. Reduced motion (--motion off) is the floor: every
 * animation in the app collapses under it, so the difference is the cost of
 * motion alone.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const DEFAULT_SLUGS = [
  "birthday-postcard",
  "birthday-surprise",
  "anniversary",
  "friendship",
  "thank-you",
  "appreciation",
  "miss-you",
  "general-postcard",
  "memory-timeline",
  "places-weve-been",
  "congratulations",
  "party-invitation",
  "wedding-invitation",
  "baby-shower",
  "graduation-party",
  "housewarming",
  "engagement-party",
  "farewell-party",
  "night-garden",
  "blank",
];
const BROWSERS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

const args = process.argv.slice(2);
const opt = {
  base: "http://localhost:5173",
  seconds: 5,
  throttle: 4,
  motion: "on",
  width: 390,
  json: null,
};
const slugs = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--base") opt.base = args[++i];
  else if (a === "--seconds") opt.seconds = Number(args[++i]);
  else if (a === "--throttle") opt.throttle = Number(args[++i]);
  else if (a === "--motion") opt.motion = args[++i];
  else if (a === "--width") opt.width = Number(args[++i]);
  else if (a === "--json") opt.json = args[++i];
  else slugs.push(a);
}
if (slugs.length === 0) slugs.push(...DEFAULT_SLUGS);
const motions = opt.motion === "both" ? ["on", "off"] : [opt.motion];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch() {
  const exe = BROWSERS.find((p) => existsSync(p));
  if (!exe) throw new Error("No Edge or Chrome found; set one of the paths in BROWSERS.");
  const port = 9800 + Math.floor(Math.random() * 150);
  const profile = mkdtempSync(join(tmpdir(), "eain-idle-"));
  const proc = spawn(
    exe,
    [
      "--headless=new",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--disable-gpu",
      "--hide-scrollbars",
      `--window-size=${opt.width},844`,
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
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) rej(new Error(msg.error.message));
      else res(msg.result);
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
  await send("Performance.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: opt.width,
    height: 844,
    deviceScaleFactor: 1,
    mobile: opt.width < 700,
  });
  await send("Emulation.setCPUThrottlingRate", { rate: opt.throttle });
  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result.value;
  };
  return {
    send,
    evaluate,
    async goto(url) {
      await send("Page.navigate", { url });
      for (let i = 0; i < 100; i++) {
        if (await evaluate("document.readyState === 'complete'")) break;
        await sleep(100);
      }
    },
    close() {
      try {
        ws.close();
      } catch {}
      proc.kill();
    },
  };
}

/** The counters as a plain object, in milliseconds. */
async function counters(b) {
  const { metrics } = await b.send("Performance.getMetrics");
  const m = Object.fromEntries(metrics.map((x) => [x.name, x.value]));
  return {
    task: m.TaskDuration * 1000,
    style: m.RecalcStyleDuration * 1000,
    layout: m.LayoutDuration * 1000,
    script: m.ScriptDuration * 1000,
    styles: m.RecalcStyleCount,
    layouts: m.LayoutCount,
  };
}

async function measure(b, slug, motion) {
  await b.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "prefers-reduced-motion", value: motion === "off" ? "reduce" : "no-preference" },
    ],
  });
  await b.goto(`${opt.base}/templates/${slug}`);
  // Hydrated, so the open button works.
  for (let i = 0; i < 100; i++) {
    if (
      await b.evaluate(
        "(() => { const el = document.querySelector('main button'); return Boolean(el && Object.keys(el).some((k) => k.startsWith('__react'))); })()",
      )
    )
      break;
    await sleep(300);
  }
  // Only the card: the page's header, footer and strips around it would count too.
  await b.evaluate(
    "(() => { const s = document.createElement('style'); s.textContent = 'header, footer, main > *:not(:has(.gift-sheet)) { display: none !important }'; document.head.appendChild(s); })()",
  );
  const opened = await b.evaluate(
    "(() => { const btn = [...document.querySelectorAll('main button')].find((x) => /open your gift|open the invitation/i.test(x.textContent || '') || (x.textContent || '').includes('ဖွင့်')); if (!btn) return false; btn.click(); return true; })()",
  );
  if (!opened) return { slug, motion, error: "no open button" };
  // Let the opening and the reveal finish before sampling.
  await sleep(6000);
  await b.evaluate("scrollTo(0, 0)");
  const a = await counters(b);
  const t0 = Date.now();
  const long = await b.evaluate(
    `new Promise((res) => { let n = 0, total = 0; const o = new PerformanceObserver((l) => { for (const e of l.getEntries()) { n++; total += e.duration; } }); o.observe({ type: 'longtask' }); setTimeout(() => { o.disconnect(); res({ n, total }); }, ${opt.seconds * 1000}); })`,
  );
  const elapsed = Date.now() - t0;
  const z = await counters(b);
  const d = (k) => Math.round(z[k] - a[k]);
  return {
    slug,
    motion,
    elapsed,
    task: d("task"),
    style: d("style"),
    layout: d("layout"),
    script: d("script"),
    styles: d("styles"),
    layouts: d("layouts"),
    longTasks: long.n,
    longMs: Math.round(long.total),
    busy: Math.round((d("task") / elapsed) * 100),
  };
}

const b = await launch();
const rows = [];
try {
  console.log(
    `Idle cost of opened cards at ${opt.base}, ${opt.width}px, CPU ×${opt.throttle}, ${opt.seconds}s windows, motion ${opt.motion}\n`,
  );
  console.log(
    "template".padEnd(22) + "motion  busy  task ms  style (n)   layout (n)  script  long tasks",
  );
  for (const slug of slugs) {
    for (const motion of motions) {
      const r = await measure(b, slug, motion);
      rows.push(r);
      if (r.error) {
        console.log(slug.padEnd(22) + motion.padEnd(8) + r.error);
        continue;
      }
      console.log(
        slug.padEnd(22) +
          motion.padEnd(8) +
          `${r.busy}%`.padStart(4) +
          `${r.task}`.padStart(9) +
          `${r.style} (${r.styles})`.padStart(12) +
          `${r.layout} (${r.layouts})`.padStart(13) +
          `${r.script}`.padStart(8) +
          `${r.longTasks} / ${r.longMs}ms`.padStart(14),
      );
    }
  }
} finally {
  b.close();
}
const worst = rows.filter((r) => !r.error).sort((x, y) => y.busy - x.busy)[0];
if (worst)
  console.log(
    `\nBusiest: ${worst.slug} (motion ${worst.motion}) at ${worst.busy}% of a throttled core.`,
  );
if (opt.json) writeFileSync(opt.json, JSON.stringify(rows, null, 2));
process.exit(0);

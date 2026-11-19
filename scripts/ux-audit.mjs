/**
 * UX audit of live pages in a real (headless) browser, against the checks in
 * design-system/eain/MASTER.md: touch targets, spacing between them, text
 * contrast, controls without names, inputs without labels, images without
 * alt, focus rings, horizontal overflow, tiny text, heading order, zoom.
 *
 *   node scripts/ux-audit.mjs                       # the public pages, phone and desktop, both themes
 *   node scripts/ux-audit.mjs /templates /contact   # just these paths
 *   node scripts/ux-audit.mjs --width 390 --theme dark --cookie "sb-x=y" /dashboard
 *   node scripts/ux-audit.mjs --json report.json
 *
 * Options: --base http://localhost:5173  --width 390,1280  --theme light,dark
 *          --cookie "name=value" (repeatable)  --json <file>  --max 8 (examples per finding)
 * Needs Chrome (preferred) or Microsoft Edge on the machine (headless, no dependencies).
 */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const DEFAULT_PAGES = [
  "/",
  "/templates",
  "/templates/party-invitation",
  "/templates/birthday-postcard",
  "/contact",
  "/privacy",
  "/auth/login",
  "/auth/signup",
  "/auth/forgot",
];
// Chrome first: headless Edge (new mode) stops completing React's streamed sections after a
// few page loads in one session, which would read as empty pages.
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
  widths: [390, 1280],
  themes: ["light", "dark"],
  cookies: [],
  json: null,
  max: 8,
};
const pages = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--base") opt.base = args[++i];
  else if (a === "--width") opt.widths = args[++i].split(",").map(Number);
  else if (a === "--theme") opt.themes = args[++i].split(",");
  else if (a === "--cookie") opt.cookies.push(args[++i]);
  else if (a === "--json") opt.json = args[++i];
  else if (a === "--max") opt.max = Number(args[++i]);
  else pages.push(a);
}
if (pages.length === 0) pages.push(...DEFAULT_PAGES);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch(width) {
  const exe = BROWSERS.find((p) => existsSync(p));
  if (!exe) throw new Error("No Edge or Chrome found; set one of the paths in BROWSERS.");
  const port = 9400 + Math.floor(Math.random() * 400);
  const profile = mkdtempSync(join(tmpdir(), "eain-audit-"));
  const proc = spawn(
    exe,
    [
      "--headless=new",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
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
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height: 900,
    deviceScaleFactor: 1,
    mobile: width < 700,
  });
  if (width < 700) await send("Emulation.setTouchEmulationEnabled", { enabled: true });
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
  return {
    send,
    evaluate,
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
}

/** Runs inside the page. Returns the findings for the current viewport. */
const AUDIT = String.raw`(() => {
  const MAX = __MAX__;
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0"; };
  const text = (el) => (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
  const desc = (el) => el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "") + ' "' + text(el) + '"';
  const hidden = (el) => el.closest('[aria-hidden="true"], [inert], .sr-only, [data-audit-ignore]');
  const interactive = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=radio], [role=checkbox], [role=tab], [role=switch], [role=menuitem], summary, [tabindex="0"]')].filter((el) => vis(el) && !hidden(el) && !el.disabled);

  // Touch targets: 44x44 on touch widths; with a mouse (1024px and up) the WCAG floor of 24px
  // applies. Links inside running text get the 24px floor everywhere.
  const TOUCH = window.innerWidth < 1024;
  const MIN = TOUCH ? 44 : 24;
  const small = [];
  for (const el of interactive) {
    const r = el.getBoundingClientRect();
    const inline = el.tagName === "A" && getComputedStyle(el).display === "inline" && el.closest("p, li, dd, td, label, figcaption");
    const m = Math.min(r.width, r.height);
    if (m < MIN && !(inline && m >= 24)) small.push({ el: desc(el), w: Math.round(r.width), h: Math.round(r.height), inline: Boolean(inline) });
  }

  // Spacing: two targets closer than 8px, both under 44px. A touch concern only.
  const tight = [];
  const rects = interactive.map((el) => ({ el, r: el.getBoundingClientRect() }));
  for (let i = 0; TOUCH && i < rects.length && tight.length < 40; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j];
    if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
    if (Math.min(a.r.width, a.r.height) >= 44 && Math.min(b.r.width, b.r.height) >= 44) continue;
    const gapX = Math.max(b.r.left - a.r.right, a.r.left - b.r.right);
    const gapY = Math.max(b.r.top - a.r.bottom, a.r.top - b.r.bottom);
    if (gapX < 8 && gapY < 8 && gapX > -1e9 && (gapX >= 0 || gapY >= 0)) tight.push({ a: desc(a.el), b: desc(b.el), gap: Math.round(Math.max(gapX, gapY)) });
  }

  // Names on controls.
  const unnamed = interactive.filter((el) => el.tagName === "A" || el.tagName === "BUTTON" || el.getAttribute("role") === "button").filter((el) => {
    const name = (el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || "").trim();
    return !name && !el.getAttribute("aria-labelledby") && !el.querySelector('img[alt]:not([alt=""]), svg[aria-label], svg title, [aria-label]');
  }).map(desc);

  // Labels on inputs.
  const unlabeled = [...document.querySelectorAll("input:not([type=hidden]), select, textarea")].filter(vis).filter((el) => !["submit", "button", "reset", "image"].includes(el.type) && !(el.labels && el.labels.length) && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby")).map(desc);

  // Images.
  const noAlt = [...document.querySelectorAll("img")].filter(vis).filter((i) => !i.hasAttribute("alt")).map((i) => (i.currentSrc || i.src).split("/").pop().slice(0, 60));

  // Contrast of text against its composited background.
  const parse = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c || ""); if (!m) return null; const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const over = (top, bottom) => { const a = top.a + bottom.a * (1 - top.a); if (a === 0) return { r: 0, g: 0, b: 0, a: 0 }; const mix = (k) => (top[k] * top.a + bottom[k] * bottom.a * (1 - top.a)) / a; return { r: mix("r"), g: mix("g"), b: mix("b"), a }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const pageBg = parse(getComputedStyle(document.documentElement).backgroundColor);
  const bodyBg = parse(getComputedStyle(document.body).backgroundColor);
  const base = over(bodyBg && bodyBg.a > 0 ? bodyBg : { r: 255, g: 255, b: 255, a: 0 }, pageBg && pageBg.a > 0 ? pageBg : { r: 255, g: 255, b: 255, a: 1 });
  const bgOf = (el) => {
    let acc = { r: 0, g: 0, b: 0, a: 0 };
    for (let node = el; node && node !== document.body; node = node.parentElement) {
      const cs = getComputedStyle(node);
      if (cs.backgroundImage && cs.backgroundImage !== "none") return null;
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) { acc = over(acc, c); if (acc.a >= 0.995) return acc; }
    }
    return over(acc, base);
  };
  const contrast = [];
  let unknownBg = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  let node;
  while ((node = walker.nextNode())) {
    const el = node.parentElement;
    if (!el || seen.has(el) || !node.textContent.trim() || !vis(el) || hidden(el)) continue;
    if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(el.tagName)) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    if (cs.webkitTextFillColor && cs.webkitTextFillColor !== cs.color) continue;
    if (cs.backgroundClip === "text" || cs.webkitBackgroundClip === "text") continue;
    const fg = parse(cs.color);
    if (!fg || fg.a === 0) continue;
    const bg = bgOf(el);
    if (!bg) { unknownBg++; continue; }
    const colour = fg.a < 1 ? over(fg, bg) : fg;
    const size = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    const r = ratio(colour, bg);
    if (r < need) contrast.push({ el: desc(el), text: node.textContent.trim().replace(/\s+/g, " ").slice(0, 36), ratio: Math.round(r * 100) / 100, need, size: Math.round(size) });
  }
  contrast.sort((a, b) => a.ratio - b.ratio);

  // Tiny text.
  const tiny = [...seen].filter((el) => parseFloat(getComputedStyle(el).fontSize) < 12).map((el) => desc(el) + " " + Math.round(parseFloat(getComputedStyle(el).fontSize)) + "px");

  // Overflow.
  const docW = document.documentElement.clientWidth;
  const overflow = document.documentElement.scrollWidth > docW + 1 ? [...document.querySelectorAll("body *")].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > docW + 1 && getComputedStyle(el).position !== "fixed"; }).slice(0, 6).map((el) => desc(el) + " right=" + Math.round(el.getBoundingClientRect().right)) : [];

  // Headings.
  const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(vis).map((h) => Number(h.tagName[1]));
  const h1s = document.querySelectorAll("h1").length;
  const skips = [];
  for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i - 1] + 1) skips.push("h" + hs[i - 1] + " -> h" + hs[i]);

  // Zoom.
  const vp = document.querySelector('meta[name="viewport"]')?.getAttribute("content") || "";
  const zoomLocked = /user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?(?![.\d])/i.test(vp);

  // Pointer cursor on controls.
  const noPointer = interactive.filter((el) => (el.tagName === "BUTTON" || el.getAttribute("role") === "button" || el.tagName === "A") && getComputedStyle(el).cursor !== "pointer").map(desc);

  // Baseline styles for the focus check that follows (keyed by element).
  const look = (el) => getComputedStyle(el).outlineStyle + "|" + getComputedStyle(el).outlineWidth + "|" + getComputedStyle(el).boxShadow;
  window.__eainBase = new Map();
  for (const el of interactive) {
    window.__eainBase.set(el, look(el));
    if (el.parentElement) window.__eainBase.set(el.parentElement, look(el.parentElement));
  }

  const cut = (xs) => ({ count: xs.length, examples: xs.slice(0, MAX) });
  return {
    interactive: interactive.length,
    small: cut(small), tight: cut(tight), unnamed: cut(unnamed), unlabeled: cut(unlabeled), noAlt: cut(noAlt),
    contrast: cut(contrast), unknownBg, tiny: cut(tiny), overflow: cut(overflow),
    headings: { h1: h1s, skips }, zoomLocked, viewport: vp, noPointer: cut(noPointer),
  };
})()`;

/**
 * Waits until the page has stopped changing: loaded, no streamed section still
 * pending, and its markup the same size for 1.5s. A fixed wait would measure
 * the loading shell of a page that is still arriving. If a streamed section
 * never arrives (the dev server sometimes drops one), the page is reloaded
 * once and the wait starts over.
 */
async function settle(b, maxMs = 25000, reloaded = false) {
  const start = Date.now();
  let last = -1;
  let stableSince = Date.now();
  while (Date.now() - start < maxMs) {
    await sleep(500);
    const state = await b.evaluate(
      'JSON.stringify({ size: document.readyState === "complete" ? document.body.innerHTML.length : -1, pending: [...document.querySelectorAll("template")].some((t) => t.id.startsWith("B:")) })',
    );
    const { size, pending } = JSON.parse(state);
    if (size !== last) {
      last = size;
      stableSince = Date.now();
    } else if (size > 0 && !pending && Date.now() - stableSince >= 1500) return;
  }
  const pending = await b.evaluate(
    '[...document.querySelectorAll("template")].some((t) => t.id.startsWith("B:"))',
  );
  if (pending && !reloaded) {
    stalled++;
    await b.send("Page.reload");
    return settle(b, maxMs, true);
  }
}
let stalled = 0;

/** Presses Tab through the page and reports focused controls whose look did not change. */
async function focusCheck(b, max = 60) {
  const noRing = [];
  const seen = new Set();
  for (let i = 0; i < max; i++) {
    await b.send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
    });
    await b.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
    });
    const r = await b.evaluate(`(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return null;
      // The Next.js dev overlay is not part of the page.
      if (a.tagName === "NEXTJS-PORTAL" || a.tagName === "IFRAME" || a.closest("[data-audit-ignore]"))
        return { key: "skip" + Math.random(), ring: true, desc: "" };
      const cs = getComputedStyle(a);
      const now = cs.outlineStyle + "|" + cs.outlineWidth + "|" + cs.boxShadow;
      const base = window.__eainBase && window.__eainBase.get(a);
      const key = a.tagName + ":" + (a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 30);
      const parent = a.parentElement;
      const pcs = parent && getComputedStyle(parent);
      const parentNow = pcs ? pcs.outlineStyle + "|" + pcs.outlineWidth + "|" + pcs.boxShadow : "";
      const parentBase = parent && window.__eainBase ? window.__eainBase.get(parent) : undefined;
      const ring =
        (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) ||
        (base !== undefined && now !== base) ||
        cs.boxShadow !== "none" ||
        (parentBase !== undefined && parentNow !== parentBase);
      return { key, ring, desc: a.tagName.toLowerCase() + ' "' + (a.getAttribute("aria-label") || a.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 40) + '"' };
    })()`);
    if (!r) break;
    if (seen.has(r.key)) break;
    seen.add(r.key);
    if (!r.ring) noRing.push(r.desc);
  }
  return { stops: seen.size, noRing: { count: noRing.length, examples: noRing.slice(0, opt.max) } };
}

const report = [];
for (const width of opt.widths) {
  const b = await launch(width);
  try {
    // Cookies go in once per browser: a session cookie set again later would overwrite
    // the fresher one the server has since issued and sign the user out.
    if (opt.cookies.length) {
      for (const c of opt.cookies) {
        const i = c.indexOf("=");
        await b.send("Network.setCookie", {
          name: c.slice(0, i),
          value: c.slice(i + 1),
          url: opt.base,
          path: "/",
        });
      }
    }
    for (const theme of opt.themes) {
      await b.send("Page.addScriptToEvaluateOnNewDocument", {
        source: `try { localStorage.setItem("theme", ${JSON.stringify(theme)}); } catch {}`,
      });
      await b.send("Emulation.setEmulatedMedia", {
        features: [
          { name: "prefers-color-scheme", value: theme },
          { name: "prefers-reduced-motion", value: "reduce" },
        ],
      });
      for (const path of pages) {
        await b.send("Page.navigate", { url: opt.base + path });
        await settle(b);
        await b.evaluate(
          `document.documentElement.classList.toggle("dark", ${JSON.stringify(theme)} === "dark"); document.documentElement.classList.toggle("light", ${JSON.stringify(theme)} === "light"); window.scrollTo(0, 0);`,
        );
        await sleep(400);
        const findings = await b.evaluate(AUDIT.replace("__MAX__", String(opt.max)));
        const focus = await focusCheck(b);
        // Where the browser actually ended up: a redirect to sign-in would otherwise pass as a page.
        const landed = await b.evaluate("location.pathname + location.search");
        report.push({ path, width, theme, landed, ...findings, focus });
      }
    }
  } finally {
    await b.close();
  }
}

// Print.
const issues = (r) =>
  (r.landed && r.landed !== r.path ? 1 : 0) +
  r.small.count +
  r.tight.count +
  r.unnamed.count +
  r.unlabeled.count +
  r.noAlt.count +
  r.contrast.count +
  r.tiny.count +
  r.overflow.count +
  r.focus.noRing.count +
  (r.headings.h1 === 1 ? 0 : 1) +
  r.headings.skips.length +
  (r.zoomLocked ? 1 : 0);
console.log(
  `\nUX audit of ${opt.base} — ${pages.length} page(s) × ${opt.widths.join("/")}px × ${opt.themes.join("/")}\n`,
);
console.log(
  "page".padEnd(34) +
    "w".padStart(5) +
    " theme " +
    "targets".padStart(8) +
    "tight".padStart(6) +
    "names".padStart(6) +
    "labels".padStart(7) +
    "alt".padStart(4) +
    "contrast".padStart(9) +
    "tiny".padStart(5) +
    "overflow".padStart(9) +
    "focus".padStart(6) +
    "h1".padStart(3) +
    "  cursor",
);
for (const r of report) {
  console.log(
    r.path.slice(0, 33).padEnd(34) +
      String(r.width).padStart(5) +
      " " +
      r.theme.padEnd(5) +
      " " +
      String(r.small.count).padStart(8) +
      String(r.tight.count).padStart(6) +
      String(r.unnamed.count).padStart(6) +
      String(r.unlabeled.count).padStart(7) +
      String(r.noAlt.count).padStart(4) +
      String(r.contrast.count).padStart(9) +
      String(r.tiny.count).padStart(5) +
      String(r.overflow.count).padStart(9) +
      String(r.focus.noRing.count).padStart(6) +
      String(r.headings.h1).padStart(3) +
      "  " +
      r.noPointer.count +
      "/" +
      r.interactive,
  );
}
console.log("\nDetails (first examples per finding):");
for (const r of report) {
  if (issues(r) === 0) continue;
  console.log(`\n== ${r.path} @${r.width} ${r.theme}`);
  if (r.landed && r.landed !== r.path) console.log(`  landed on ${r.landed}`);
  const list = (label, xs, fmt = (x) => x) => {
    if (xs.count) console.log(`  ${label} (${xs.count}):`);
    for (const x of xs.examples) console.log("    - " + fmt(x));
  };
  list(
    "targets under 44px",
    r.small,
    (x) => `${x.el} ${x.w}x${x.h}${x.inline ? " (inline link)" : ""}`,
  );
  list("targets closer than 8px", r.tight, (x) => `${x.a} | ${x.b} gap ${x.gap}px`);
  list("controls without a name", r.unnamed);
  list("inputs without a label", r.unlabeled);
  list("images without alt", r.noAlt);
  list(
    "text contrast",
    r.contrast,
    (x) => `${x.el} "${x.text}" ${x.ratio}:1 (needs ${x.need}, ${x.size}px)`,
  );
  list("text under 12px", r.tiny);
  list("overflows the viewport", r.overflow);
  list("focused without a visible ring", r.focus.noRing);
  if (r.headings.h1 !== 1) console.log(`  h1 count: ${r.headings.h1}`);
  if (r.headings.skips.length)
    console.log(`  heading levels skipped: ${r.headings.skips.join(", ")}`);
  if (r.zoomLocked) console.log(`  zoom disabled by viewport meta: ${r.viewport}`);
  if (r.unknownBg)
    console.log(
      `  (contrast not measured for ${r.unknownBg} text element(s) over images or gradients)`,
    );
}
if (opt.json) {
  writeFileSync(opt.json, JSON.stringify(report, null, 2));
  console.log(`\nwritten ${opt.json}`);
}
const total = report.reduce((n, r) => n + issues(r), 0);
if (stalled)
  console.log(`${stalled} page load(s) stalled on a streamed section and were reloaded.`);
console.log(`\n${total} finding(s) in all.`);
process.exit(0);

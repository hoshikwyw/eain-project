/**
 * Composes one illustration per template from the brand cutouts, so each
 * occasion looks different without new artwork: birds mirrored, resized and
 * arranged, plus vector decorations in the template's colours.
 *
 * Inputs:  public/brand/lovebirds.webp, bird-pink.webp, bird-blue.webp
 * Outputs: public/brand/illustrations/<slug>.webp  (1200x800, transparent)
 *
 * Usage: node scripts/compose-illustrations.mjs
 * Run scripts/process-brand-images.mjs first when the source art changes.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"), "..");
const brand = path.join(root, "public", "brand");
const outDir = path.join(brand, "illustrations");
const W = 1200;
const H = 800;

// Deterministic scatter so re-running produces identical files.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const shapes = {
  heart: (x, y, s, c, o) =>
    `<path transform="translate(${x} ${y}) scale(${s / 24})" fill="${c}" opacity="${o}" d="M12 21s-7-4.6-9.5-9.2C.6 8 3 4 6.8 4c2 0 3.6 1.2 5.2 3 1.6-1.8 3.2-3 5.2-3 3.8 0 6.2 4 4.3 7.8C19 16.4 12 21 12 21z"/>`,
  dot: (x, y, s, c, o) => `<circle cx="${x}" cy="${y}" r="${s / 2}" fill="${c}" opacity="${o}"/>`,
  confetti: (x, y, s, c, o, r) => `<rect x="${x}" y="${y}" width="${s * 0.45}" height="${s}" rx="${s * 0.12}" fill="${c}" opacity="${o}" transform="rotate(${r} ${x} ${y})"/>`,
  sparkle: (x, y, s, c, o) =>
    `<path transform="translate(${x} ${y}) scale(${s / 24})" fill="${c}" opacity="${o}" d="M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12 7-1 11-5 12-12z"/>`,
  star: (x, y, s, c, o) => `<circle cx="${x}" cy="${y}" r="${s / 6}" fill="${c}" opacity="${o}"/><circle cx="${x}" cy="${y}" r="${s / 2}" fill="${c}" opacity="${o * 0.18}"/>`,
  leaf: (x, y, s, c, o, r) => `<ellipse cx="${x}" cy="${y}" rx="${s * 0.28}" ry="${s * 0.6}" fill="${c}" opacity="${o}" transform="rotate(${r} ${x} ${y})"/>`,
  petal: (x, y, s, c, o, r) => `<ellipse cx="${x}" cy="${y}" rx="${s * 0.35}" ry="${s * 0.55}" fill="${c}" opacity="${o}" transform="rotate(${r} ${x} ${y})"/>`,
  balloonString: (x, y, s, c, o) => `<path d="M${x} ${y} q ${s * 0.3} ${s * 0.6} 0 ${s * 1.2} q -${s * 0.3} ${s * 0.6} 0 ${s * 1.2}" stroke="${c}" stroke-width="3" fill="none" opacity="${o}"/>`,
  balloon: (x, y, s, c, o) =>
    `<ellipse cx="${x}" cy="${y}" rx="${s * 0.42}" ry="${s * 0.5}" fill="${c}" opacity="${o}"/><path d="M${x - s * 0.06} ${y + s * 0.5} l ${s * 0.06} ${s * 0.1} l ${s * 0.06} -${s * 0.1} z" fill="${c}" opacity="${o}"/>`,
};

/** Scatter `count` shapes in a band, avoiding a central keep-out box where the birds sit. */
function scatter(kind, count, colors, seed, { band = [0, H * 0.7], size = [18, 40], opacity = [0.5, 0.95], keepOut } = {}) {
  const r = rng(seed);
  const parts = [];
  let tries = 0;
  while (parts.length < count && tries++ < count * 20) {
    const x = 40 + r() * (W - 80);
    const y = band[0] + r() * (band[1] - band[0]);
    if (keepOut && x > keepOut[0] && x < keepOut[2] && y > keepOut[1] && y < keepOut[3]) continue;
    const s = size[0] + r() * (size[1] - size[0]);
    const o = opacity[0] + r() * (opacity[1] - opacity[0]);
    const c = colors[Math.floor(r() * colors.length)];
    parts.push(shapes[kind](x.toFixed(1), y.toFixed(1), s.toFixed(1), c, o.toFixed(2), Math.round(r() * 360)));
  }
  return parts.join("");
}

// Drawn props -----------------------------------------------------------------

/** Two-tier cake on a plate with candles. (x, y) is the plate centre; s is the cake width. */
function cake(x, y, s, { base = "#f7c7d4", frosting = "#fff4f6", accent = "#e8476c", candles = 3 } = {}) {
  const h1 = s * 0.42;
  const w2 = s * 0.7;
  const h2 = s * 0.34;
  const top1 = y - h1;
  const top2 = top1 - h2;
  const drip = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${frosting}"/>`;
  let out = `<ellipse cx="${x}" cy="${y}" rx="${s * 0.62}" ry="${s * 0.12}" fill="#e9e2ea"/>`;
  out += `<rect x="${x - s / 2}" y="${top1}" width="${s}" height="${h1}" rx="${s * 0.06}" fill="${base}"/>`;
  out += `<rect x="${x - s / 2}" y="${top1}" width="${s}" height="${h1 * 0.32}" rx="${s * 0.06}" fill="${frosting}"/>`;
  for (let i = 0; i < 6; i++) out += drip(x - s / 2 + (i + 0.5) * (s / 6), top1 + h1 * 0.32, s * 0.07);
  out += `<rect x="${x - w2 / 2}" y="${top2}" width="${w2}" height="${h2}" rx="${s * 0.05}" fill="${base}"/>`;
  out += `<rect x="${x - w2 / 2}" y="${top2}" width="${w2}" height="${h2 * 0.35}" rx="${s * 0.05}" fill="${frosting}"/>`;
  for (let i = 0; i < 4; i++) out += drip(x - w2 / 2 + (i + 0.5) * (w2 / 4), top2 + h2 * 0.35, s * 0.06);
  for (let i = 0; i < candles; i++) {
    const cx = x - ((candles - 1) * s * 0.14) / 2 + i * s * 0.14;
    const ch = s * 0.22;
    out += `<rect x="${cx - s * 0.02}" y="${top2 - ch}" width="${s * 0.04}" height="${ch}" rx="${s * 0.01}" fill="${i % 2 ? accent : "#7fb2d0"}"/>`;
    out += `<ellipse cx="${cx}" cy="${top2 - ch - s * 0.06}" rx="${s * 0.05}" ry="${s * 0.08}" fill="#ffd27a" opacity="0.35"/>`;
    out += `<ellipse cx="${cx}" cy="${top2 - ch - s * 0.05}" rx="${s * 0.025}" ry="${s * 0.045}" fill="#ffb347"/>`;
  }
  const r = rng(7);
  for (let i = 0; i < 14; i++) {
    const sx = x - s / 2 + s * 0.08 + r() * (s - s * 0.16);
    const sy = top1 + h1 * 0.45 + r() * (h1 * 0.45);
    out += `<rect x="${sx}" y="${sy}" width="${s * 0.03}" height="${s * 0.012}" rx="1" fill="${["#ffd27a", "#7fb2d0", accent, "#8fd6b4"][i % 4]}" transform="rotate(${Math.round(r() * 180)} ${sx} ${sy})"/>`;
  }
  return out;
}

/** Wrapped gift box with ribbon and bow. (x, y) is the bottom centre. */
function giftBox(x, y, s, color, ribbon) {
  const lidH = s * 0.22;
  const top = y - s;
  let out = `<rect x="${x - s / 2}" y="${top + lidH}" width="${s}" height="${s - lidH}" rx="${s * 0.06}" fill="${color}"/>`;
  out += `<rect x="${x - s * 0.55}" y="${top}" width="${s * 1.1}" height="${lidH}" rx="${s * 0.05}" fill="${color}" filter="brightness(1.1)"/>`;
  out += `<rect x="${x - s * 0.08}" y="${top}" width="${s * 0.16}" height="${s}" fill="${ribbon}"/>`;
  out += `<rect x="${x - s / 2}" y="${top + lidH + (s - lidH) * 0.42}" width="${s}" height="${s * 0.14}" fill="${ribbon}"/>`;
  out += `<ellipse cx="${x - s * 0.16}" cy="${top - s * 0.05}" rx="${s * 0.16}" ry="${s * 0.1}" fill="${ribbon}" transform="rotate(-20 ${x - s * 0.16} ${top - s * 0.05})"/>`;
  out += `<ellipse cx="${x + s * 0.16}" cy="${top - s * 0.05}" rx="${s * 0.16}" ry="${s * 0.1}" fill="${ribbon}" transform="rotate(20 ${x + s * 0.16} ${top - s * 0.05})"/>`;
  out += `<circle cx="${x}" cy="${top - s * 0.02}" r="${s * 0.06}" fill="${ribbon}"/>`;
  return out;
}

/** Golden trophy. (x, y) is the base centre; s is the height. */
function trophy(x, y, s) {
  const gold = "#f2b53d";
  const dark = "#d1901f";
  const cupTop = y - s;
  const cupH = s * 0.5;
  let out = `<rect x="${x - s * 0.22}" y="${y - s * 0.08}" width="${s * 0.44}" height="${s * 0.08}" rx="${s * 0.02}" fill="${dark}"/>`;
  out += `<rect x="${x - s * 0.14}" y="${y - s * 0.16}" width="${s * 0.28}" height="${s * 0.08}" fill="${gold}"/>`;
  out += `<rect x="${x - s * 0.05}" y="${y - s * 0.52}" width="${s * 0.1}" height="${s * 0.38}" fill="${dark}"/>`;
  out += `<ellipse cx="${x}" cy="${y - s * 0.5}" rx="${s * 0.12}" ry="${s * 0.04}" fill="${dark}"/>`;
  out += `<path d="M${x - s * 0.3} ${cupTop} h${s * 0.6} v${cupH * 0.45} a${s * 0.3} ${cupH * 0.55} 0 0 1 -${s * 0.6} 0 z" fill="${gold}"/>`;
  out += `<path d="M${x - s * 0.3} ${cupTop + s * 0.06} a${s * 0.16} ${s * 0.16} 0 1 0 0 ${s * 0.3}" stroke="${gold}" stroke-width="${s * 0.05}" fill="none"/>`;
  out += `<path d="M${x + s * 0.3} ${cupTop + s * 0.06} a${s * 0.16} ${s * 0.16} 0 1 1 0 ${s * 0.3}" stroke="${gold}" stroke-width="${s * 0.05}" fill="none"/>`;
  out += `<rect x="${x - s * 0.3}" y="${cupTop}" width="${s * 0.6}" height="${s * 0.06}" fill="#ffe08a"/>`;
  out += shapes.sparkle(x + s * 0.02, cupTop + s * 0.2, s * 0.14, "#fff6d6", 0.95);
  return out;
}

/** Party popper cone with a burst. (x, y) is the cone tip; rot points the cone. */
function popper(x, y, s, rot, color) {
  const r = rng(Math.round(x + y));
  let burst = "";
  for (let i = 0; i < 12; i++) {
    const a = -90 + (r() - 0.5) * 100;
    const d = s * (0.9 + r() * 1.2);
    const px = x + Math.cos((a * Math.PI) / 180) * d;
    const py = y - s * 0.9 + Math.sin((a * Math.PI) / 180) * d;
    burst += shapes.confetti(px, py, s * 0.22, [C.orange, C.gold, C.pink, C.mintSoft, C.blue][i % 5], 0.9, Math.round(r() * 360));
    if (i % 3 === 0) burst += `<path d="M${x} ${y - s * 0.9} Q${(x + px) / 2 + 20} ${(y - s * 0.9 + py) / 2 - 30} ${px} ${py}" stroke="${C.gold}" stroke-width="3" fill="none" opacity="0.6"/>`;
  }
  const cone = `<path d="M${x} ${y} l${-s * 0.28} ${-s * 0.9} h${s * 0.56} z" fill="${color}"/><path d="M${x - s * 0.2} ${y - s * 0.62} l${s * 0.4} 0" stroke="#fff" stroke-width="3" opacity="0.6"/><path d="M${x - s * 0.12} ${y - s * 0.36} l${s * 0.24} 0" stroke="#fff" stroke-width="3" opacity="0.6"/>`;
  return `<g transform="rotate(${rot} ${x} ${y})">${burst}${cone}</g>`;
}

/** Bunting flags hanging along a gentle curve across the top. */
function bunting(colors) {
  const y0 = 60;
  let out = `<path d="M-10 ${y0} Q${W / 2} ${y0 + 120} ${W + 10} ${y0}" stroke="#9a7b6a" stroke-width="3" fill="none"/>`;
  const n = 13;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = t * W;
    const y = y0 + 4 * t * (1 - t) * 60;
    out += `<path d="M${x - 26} ${y} h52 l-26 48 z" fill="${colors[i % colors.length]}" opacity="0.95"/>`;
  }
  return out;
}

function svg(inner) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${inner}</svg>`);
}

async function bird(name, height, { flop = false } = {}) {
  let img = sharp(path.join(brand, `${name}.webp`)).resize({ height, kernel: "lanczos3" });
  if (flop) img = img.flop();
  const buf = await img.png().toBuffer();
  const meta = await sharp(buf).metadata();
  return { buf, w: meta.width, h: meta.height };
}

/** Ground shadow under a figure. */
function shadow(cx, bottom, w) {
  return `<ellipse cx="${cx}" cy="${bottom - 6}" rx="${w * 0.42}" ry="${w * 0.06}" fill="#000" opacity="0.10"/>`;
}

const C = {
  pink: "#e8476c",
  pinkSoft: "#f4a3b5",
  purple: "#8b5cf6",
  glow: "#fcd9a8",
  gold: "#ffd27a",
  orange: "#e0642d",
  mint: "#1f8a5b",
  mintSoft: "#8fd6b4",
  blue: "#7fb2d0",
  cream: "#fff3e8",
};

const scenes = {
  // Couple beside a birthday cake, gift boxes on the other side, confetti above.
  "birthday-postcard": async () => {
    const couple = await bird("lovebirds", 540);
    const x = Math.round((W - couple.w) / 2 - 20);
    const y = H - couple.h - 30;
    const props =
      cake(190, H - 40, 220, { base: "#f7c7d4", frosting: "#fff6f8", accent: C.pink, candles: 3 }) +
      giftBox(1040, H - 40, 150, C.blue, C.gold) +
      giftBox(1150, H - 40, 105, C.pinkSoft, C.pink);
    return {
      under: svg(
        shadow(x + couple.w / 2, H - 30, couple.w) +
          props +
          scatter("confetti", 34, [C.pink, C.gold, C.blue, C.mintSoft], 11, { band: [0, 420], size: [14, 28], opacity: [0.45, 0.9], keepOut: [x + 60, y + 40, x + couple.w - 60, H] }),
      ),
      layers: [{ input: couple.buf, left: x, top: y }],
      over: svg(""),
    };
  },
  // Blue bird with balloons, a cake, a stack of gifts and confetti.
  "birthday-surprise": async () => {
    const b = await bird("bird-blue", 500);
    const x = Math.round(W / 2 - b.w / 2 + 40);
    const y = H - b.h - 30;
    const balloons = [
      [230, 190, 140, C.orange],
      [330, 130, 120, C.gold],
      [150, 300, 110, C.pinkSoft],
    ]
      .map(([bx, by, s, c]) => shapes.balloonString(bx, by + s * 0.55, s, "#9a7b6a", 0.7) + shapes.balloon(bx, by, s, c, 0.95))
      .join("");
    const props =
      cake(1010, H - 40, 200, { base: "#ffd9b3", frosting: "#fff8f0", accent: C.orange, candles: 5 }) +
      giftBox(300, H - 40, 130, C.orange, C.gold) +
      giftBox(300, H - 40 - 130, 95, C.gold, C.orange) +
      giftBox(420, H - 40, 90, C.pinkSoft, C.pink);
    return {
      under: svg(
        shadow(x + b.w / 2, H - 30, b.w) +
          balloons +
          props +
          scatter("confetti", 44, [C.orange, C.gold, C.pinkSoft, C.blue], 21, { band: [0, 480], size: [14, 30], opacity: [0.5, 0.95], keepOut: [x, y, x + b.w, H] }),
      ),
      layers: [{ input: b.buf, left: x, top: y }],
      over: svg(""),
    };
  },
  // Couple with drifting hearts, evening glow.
  anniversary: async () => {
    const couple = await bird("lovebirds", 580);
    const x = Math.round((W - couple.w) / 2);
    const y = H - couple.h - 30;
    return {
      under: svg(shadow(W / 2, H - 30, couple.w) + scatter("heart", 18, [C.pink, C.pinkSoft, C.purple], 31, { band: [20, 520], size: [22, 54], opacity: [0.35, 0.85], keepOut: [x + 60, y + 40, x + couple.w - 60, H] }) + scatter("star", 30, [C.glow], 32, { band: [0, 420], size: [10, 22], opacity: [0.6, 1] })),
      layers: [{ input: couple.buf, left: x, top: y }],
      over: svg(""),
    };
  },
  // Two friends side by side, facing each other, with sparkles.
  friendship: async () => {
    const pink = await bird("bird-pink", 480);
    const blue = await bird("bird-blue", 470, { flop: true });
    const gap = 60;
    const total = pink.w + gap + blue.w;
    const x1 = Math.round((W - total) / 2);
    const x2 = x1 + pink.w + gap;
    return {
      under: svg(shadow(x1 + pink.w / 2, H - 30, pink.w) + shadow(x2 + blue.w / 2, H - 30, blue.w) + scatter("sparkle", 22, [C.gold, C.mintSoft, C.cream], 41, { band: [20, 520], size: [16, 40], opacity: [0.5, 0.95], keepOut: [x1, H - pink.h, x2 + blue.w, H] })),
      layers: [
        { input: pink.buf, left: x1, top: H - pink.h - 30 },
        { input: blue.buf, left: x2, top: H - blue.h - 30 },
      ],
      over: svg(""),
    };
  },
  // Pink bird among green leaves.
  "thank-you": async () => {
    const b = await bird("bird-pink", 540);
    const x = Math.round((W - b.w) / 2);
    const y = H - b.h - 30;
    return {
      under: svg(shadow(W / 2, H - 30, b.w) + scatter("leaf", 34, [C.mintSoft, C.mint, "#b7e3c9"], 51, { band: [0, 620], size: [30, 64], opacity: [0.35, 0.8], keepOut: [x + 40, y + 40, x + b.w - 40, H] })),
      layers: [{ input: b.buf, left: x, top: y }],
      over: svg(""),
    };
  },
  // Blue bird with a warm sparkle halo.
  appreciation: async () => {
    const b = await bird("bird-blue", 540);
    const x = Math.round((W - b.w) / 2);
    const y = H - b.h - 30;
    return {
      under: svg(shadow(W / 2, H - 30, b.w) + `<circle cx="${W / 2}" cy="${y + 200}" r="300" fill="${C.gold}" opacity="0.18"/>` + scatter("sparkle", 24, [C.gold, C.orange, C.cream], 61, { band: [0, 600], size: [18, 44], opacity: [0.5, 1], keepOut: [x + 40, y + 40, x + b.w - 40, H] })),
      layers: [{ input: b.buf, left: x, top: y }],
      over: svg(""),
    };
  },
  // Far apart, a trail of hearts between them, night stars.
  "miss-you": async () => {
    const pink = await bird("bird-pink", 400);
    const blue = await bird("bird-blue", 390, { flop: true });
    const x1 = 70;
    const x2 = W - blue.w - 70;
    const trail = Array.from({ length: 7 }, (_, i) => {
      const t = (i + 1) / 8;
      const hx = x1 + pink.w + t * (x2 - x1 - pink.w);
      const hy = 430 - Math.sin(t * Math.PI) * 190;
      return shapes.heart(hx, hy, 18 + Math.sin(t * Math.PI) * 14, i % 2 ? C.pink : C.pinkSoft, 0.85);
    }).join("");
    return {
      under: svg(shadow(x1 + pink.w / 2, H - 30, pink.w) + shadow(x2 + blue.w / 2, H - 30, blue.w) + scatter("star", 40, [C.glow, C.cream], 71, { band: [0, 380], size: [8, 20], opacity: [0.6, 1] }) + trail),
      layers: [
        { input: pink.buf, left: x1, top: H - pink.h - 30 },
        { input: blue.buf, left: x2, top: H - blue.h - 30 },
      ],
      over: svg(""),
    };
  },
  // Plain couple with a few petals.
  "general-postcard": async () => {
    const couple = await bird("lovebirds", 600);
    const x = Math.round((W - couple.w) / 2);
    return {
      under: svg(shadow(W / 2, H - 30, couple.w) + scatter("petal", 12, [C.pinkSoft, C.cream], 81, { band: [40, 400], size: [18, 30], opacity: [0.3, 0.6], keepOut: [x, 100, x + couple.w, H] })),
      layers: [{ input: couple.buf, left: x, top: H - couple.h - 30 }],
      over: svg(""),
    };
  },
  // Couple looking up at a starry sky with a crescent moon.
  "memory-timeline": async () => {
    const couple = await bird("lovebirds", 540);
    const x = Math.round((W - couple.w) / 2);
    const moon = `<circle cx="960" cy="150" r="70" fill="${C.glow}" opacity="0.95"/><circle cx="1000" cy="130" r="62" fill="#1b1442" opacity="0"/>`;
    return {
      under: svg(shadow(W / 2, H - 30, couple.w) + moon + scatter("star", 60, [C.glow, C.cream], 91, { band: [0, 460], size: [6, 22], opacity: [0.5, 1], keepOut: [880, 60, 1050, 240] })),
      layers: [{ input: couple.buf, left: x, top: H - couple.h - 30 }],
      over: svg(""),
    };
  },
  // Blue bird with a trophy, party poppers, bunting and a confetti burst.
  congratulations: async () => {
    const b = await bird("bird-blue", 520);
    const x = Math.round((W - b.w) / 2 + 30);
    const y = H - b.h - 30;
    const props =
      bunting([C.orange, C.gold, C.pink, C.mintSoft, C.blue]) +
      trophy(230, H - 40, 300) +
      popper(1080, H - 60, 120, -35, C.pink) +
      popper(120, 420, 90, 40, C.orange);
    return {
      under: svg(
        shadow(x + b.w / 2, H - 30, b.w) +
          props +
          scatter("confetti", 40, [C.orange, C.gold, C.pink, C.mintSoft, C.blue], 101, { band: [140, 560], size: [16, 34], opacity: [0.55, 0.95], keepOut: [x + 30, y + 30, x + b.w - 30, H] }) +
          scatter("sparkle", 10, [C.gold], 102, { band: [150, 320], size: [20, 40], opacity: [0.7, 1] }),
      ),
      layers: [{ input: b.buf, left: x, top: y }],
      over: svg(""),
    };
  },
};

await mkdir(outDir, { recursive: true });
for (const [slug, build] of Object.entries(scenes)) {
  const scene = await build();
  const info = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: scene.under, left: 0, top: 0 }, ...scene.layers, { input: scene.over, left: 0, top: 0 }])
    .webp({ quality: 86, alphaQuality: 90, effort: 6 })
    .toFile(path.join(outDir, `${slug}.webp`));
  console.log(`${slug}.webp: ${info.width}x${info.height} ${Math.round(info.size / 1024)} KB`);
}

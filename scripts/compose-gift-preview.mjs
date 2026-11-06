/**
 * Link preview image (1200x630) for gift links, shown by chat apps when a
 * gift is shared: a wrapped present and "A gift for you" in English and
 * Burmese. It is the same for every gift on purpose: a preview must never
 * show the message, a name or a photo. Written to public/brand/gift-preview.png
 * and referenced by app/g/[token]/page.tsx.
 * Usage: node scripts/compose-gift-preview.mjs
 * The Burmese line needs a Myanmar font on the machine that runs this
 * (Windows ships "Myanmar Text"); check the picture after running it.
 */
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(
  new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"),
  "..",
);
const W = 1200;
const H = 630;

const heart = (x, y, s, fill, opacity = 1, rotate = 0) =>
  `<path transform="translate(${x} ${y}) rotate(${rotate}) scale(${s})" fill="${fill}" opacity="${opacity}" d="M0 9 C -14 -3, -9 -15, 0 -7 C 9 -15, 14 -3, 0 9 Z"/>`;
const sparkle = (x, y, s, fill, opacity = 1) =>
  `<path transform="translate(${x} ${y}) scale(${s})" fill="${fill}" opacity="${opacity}" d="M0 -12 C 1.5 -4, 4 -1.5, 12 0 C 4 1.5, 1.5 4, 0 12 C -1.5 4, -4 1.5, -12 0 C -4 -1.5, -1.5 -4, 0 -12 Z"/>`;

const art = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff7f1"/><stop offset="0.5" stop-color="#ffe6e9"/><stop offset="1" stop-color="#ffd0db"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="box" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#f4688a"/><stop offset="1" stop-color="#e0416a"/>
    </linearGradient>
    <linearGradient id="lid" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#f77d9b"/><stop offset="1" stop-color="#e94f76"/>
    </linearGradient>
    <linearGradient id="ribbon" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff1c2"/><stop offset="1" stop-color="#ffd76f"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="880" cy="330" r="330" fill="url(#glow)"/>

  <!-- Hearts and sparkles drifting up from the present -->
  ${heart(742, 150, 2.6, "#f25c7e", 0.9, -14)}
  ${heart(1030, 118, 3.4, "#ff8fab", 0.95, 12)}
  ${heart(1096, 250, 2, "#f25c7e", 0.75, 20)}
  ${heart(905, 82, 2.2, "#ffb3c4", 0.95, 4)}
  ${sparkle(820, 110, 1.5, "#ffc94d")}
  ${sparkle(1120, 380, 1.3, "#ffc94d", 0.9)}
  ${sparkle(676, 196, 1.1, "#ffc94d", 0.85)}
  ${sparkle(980, 210, 0.9, "#ffffff")}
  ${[
    [92, 548, 9],
    [1150, 70, 8],
    [596, 56, 6],
    [1128, 566, 10],
    [44, 300, 7],
  ]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f4a3b5" opacity="0.45"/>`)
    .join("")}

  <!-- The present -->
  <ellipse cx="880" cy="548" rx="210" ry="20" fill="#c9506e" opacity="0.18"/>
  <rect x="720" y="318" width="320" height="226" rx="20" fill="url(#box)"/>
  <rect x="720" y="318" width="320" height="30" fill="#b8284f" opacity="0.2"/>
  <rect x="856" y="318" width="48" height="226" fill="url(#ribbon)"/>
  <rect x="698" y="252" width="364" height="78" rx="18" fill="url(#lid)"/>
  <rect x="856" y="252" width="48" height="78" fill="url(#ribbon)"/>
  <!-- Bow -->
  <path d="M880 250 C 838 176, 760 186, 776 232 C 786 262, 846 262, 880 250 Z" fill="#ffe08a" stroke="#f2bd45" stroke-width="3"/>
  <path d="M880 250 C 922 176, 1000 186, 984 232 C 974 262, 914 262, 880 250 Z" fill="#ffe9a6" stroke="#f2bd45" stroke-width="3"/>
  <path d="M868 250 C 850 280, 838 296, 822 306" fill="none" stroke="#f2bd45" stroke-width="12" stroke-linecap="round"/>
  <path d="M892 250 C 910 280, 922 296, 938 306" fill="none" stroke="#f2bd45" stroke-width="12" stroke-linecap="round"/>
  <circle cx="880" cy="248" r="19" fill="#ffd257" stroke="#f2bd45" stroke-width="3"/>
  <!-- Tag -->
  <g transform="translate(760 392) rotate(-8)">
    <rect x="0" y="0" width="118" height="56" rx="12" fill="#fffaf3"/>
    <circle cx="16" cy="28" r="5" fill="#f4a3b5"/>
    ${heart(70, 29, 1.7, "#e0416a")}
  </g>

  <!-- Words -->
  <text x="158" y="108" font-family="Georgia, 'Noto Serif', serif" font-weight="600" font-size="44" fill="#2b1f21">Eain</text>
  <text x="80" y="300" font-family="Georgia, 'Noto Serif', serif" font-weight="600" font-size="84" fill="#2b1f21">A gift for you</text>
  <text x="82" y="376" font-family="'Myanmar Text', 'Noto Sans Myanmar', Padauk, sans-serif" font-size="42" fill="#b03257">သင့်အတွက် လက်ဆောင်တစ်ခု</text>
  <text x="82" y="442" font-family="Arial, Helvetica, sans-serif" font-size="27" fill="#7a6568">Someone made something special, just for you.</text>
  <rect x="80" y="482" width="270" height="62" rx="31" fill="#db3358"/>
  <text x="215" y="522" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="26" fill="#ffffff">Tap to open</text>
</svg>`);

const mark = await sharp(path.join(root, "public", "brand", "logo-mark.webp"))
  .resize({ height: 64 })
  .png()
  .toBuffer();

const out = path.join(root, "public", "brand", "gift-preview.png");
const info = await sharp(art)
  .composite([{ input: mark, left: 78, top: 58 }])
  .png({ compressionLevel: 9, palette: true, quality: 90 })
  .toFile(out);
console.log(`gift-preview.png: ${info.width}x${info.height} ${Math.round(info.size / 1024)} KB`);

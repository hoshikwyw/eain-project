/**
 * Link preview image (1200x630) for invitation links, shown by chat apps
 * when an invitation is shared: a sealed envelope with a card peeking out and
 * "You're invited" in English and Burmese. Like the gift preview it is the
 * same for every invitation on purpose: a preview must never show the host,
 * the place or the date. Written to public/brand/invitation-preview.png and
 * referenced by app/g/[token]/page.tsx for gifts with an invitation design.
 * Usage: node scripts/compose-invitation-preview.mjs
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

const sparkle = (x, y, s, fill, opacity = 1) =>
  `<path transform="translate(${x} ${y}) scale(${s})" fill="${fill}" opacity="${opacity}" d="M0 -12 C 1.5 -4, 4 -1.5, 12 0 C 4 1.5, 1.5 4, 0 12 C -1.5 4, -4 1.5, -12 0 C -4 -1.5, -1.5 -4, 0 -12 Z"/>`;
const confetti = (x, y, w, h, fill, rotate, opacity = 0.9) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(w, h) / 2}" fill="${fill}" opacity="${opacity}" transform="rotate(${rotate} ${x} ${y})"/>`;

const art = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fffaf3"/><stop offset="0.55" stop-color="#fbeedd"/><stop offset="1" stop-color="#f3dcc0"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="env" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fdf6ea"/><stop offset="1" stop-color="#f1e2c8"/>
    </linearGradient>
    <linearGradient id="flap" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f7ecd8"/><stop offset="1" stop-color="#e9d6b6"/>
    </linearGradient>
    <linearGradient id="seal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#d9a441"/><stop offset="1" stop-color="#a9772a"/>
    </linearGradient>
    <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#fbf4e8"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="880" cy="330" r="330" fill="url(#glow)"/>

  <!-- Confetti and sparkles around the envelope -->
  ${confetti(722, 128, 26, 9, "#d9a441", -28)}
  ${confetti(1064, 112, 22, 8, "#c96a7a", 18)}
  ${confetti(1112, 262, 24, 8, "#d9a441", 64, 0.8)}
  ${confetti(668, 236, 20, 7, "#c96a7a", 40, 0.8)}
  ${confetti(960, 84, 18, 7, "#8aa7a0", -12, 0.85)}
  ${confetti(1130, 440, 22, 8, "#8aa7a0", 30, 0.75)}
  ${sparkle(812, 104, 1.5, "#d9a441")}
  ${sparkle(1130, 352, 1.2, "#d9a441", 0.9)}
  ${sparkle(652, 162, 1.1, "#d9a441", 0.8)}
  ${sparkle(996, 190, 0.9, "#ffffff")}
  ${[
    [92, 548, 9],
    [1150, 70, 8],
    [596, 56, 6],
    [1128, 566, 10],
    [44, 300, 7],
  ]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#e3c08f" opacity="0.45"/>`)
    .join("")}

  <!-- The envelope, flap open, card rising out of it -->
  <ellipse cx="880" cy="556" rx="230" ry="20" fill="#9c7a4a" opacity="0.16"/>
  <!-- back of the envelope -->
  <rect x="690" y="286" width="380" height="250" rx="18" fill="#e4d0ad"/>
  <!-- open flap, folded back -->
  <path d="M690 300 L880 160 L1070 300 Z" fill="url(#flap)"/>
  <path d="M690 300 L880 160 L1070 300" fill="none" stroke="#d4bb91" stroke-width="3" stroke-linejoin="round"/>
  <!-- the card inside -->
  <g transform="translate(736 206)">
    <rect x="0" y="0" width="288" height="300" rx="14" fill="url(#card)" stroke="#e6d6bb" stroke-width="2"/>
    <rect x="22" y="22" width="244" height="256" rx="8" fill="none" stroke="#d9a441" stroke-width="2" opacity="0.7"/>
    <line x1="74" y1="88" x2="214" y2="88" stroke="#c9b48e" stroke-width="5" stroke-linecap="round"/>
    <line x1="56" y1="118" x2="232" y2="118" stroke="#e0d2b6" stroke-width="5" stroke-linecap="round"/>
    <line x1="88" y1="148" x2="200" y2="148" stroke="#e0d2b6" stroke-width="5" stroke-linecap="round"/>
    <!-- two little rings -->
    <circle cx="130" cy="58" r="13" fill="none" stroke="#d9a441" stroke-width="4"/>
    <circle cx="158" cy="58" r="13" fill="none" stroke="#d9a441" stroke-width="4"/>
  </g>
  <!-- front pocket of the envelope -->
  <path d="M690 320 L880 456 L1070 320 L1070 518 Q1070 536 1052 536 L708 536 Q690 536 690 518 Z" fill="url(#env)"/>
  <path d="M690 320 L880 456 L1070 320" fill="none" stroke="#dcc8a3" stroke-width="3" stroke-linejoin="round"/>
  <path d="M690 536 L846 430 M1070 536 L914 430" fill="none" stroke="#dcc8a3" stroke-width="3" stroke-linecap="round"/>
  <!-- wax seal -->
  <circle cx="880" cy="452" r="34" fill="url(#seal)"/>
  <circle cx="880" cy="452" r="25" fill="none" stroke="#f3dca0" stroke-width="2.5" opacity="0.9"/>
  <path d="M880 440 C 873 433, 862 439, 866 447 C 869 453, 876 458, 880 464 C 884 458, 891 453, 894 447 C 898 439, 887 433, 880 440 Z" fill="#f7e6b5"/>

  <!-- Words -->
  <text x="158" y="108" font-family="Georgia, 'Noto Serif', serif" font-weight="600" font-size="44" fill="#2b2420">Eain</text>
  <text x="80" y="300" font-family="Georgia, 'Noto Serif', serif" font-weight="600" font-size="84" fill="#2b2420">You're invited</text>
  <text x="82" y="376" font-family="'Myanmar Text', 'Noto Sans Myanmar', Padauk, sans-serif" font-size="42" fill="#9a6b1f">သင့်ကို ဖိတ်ကြားပါတယ်</text>
  <text x="82" y="442" font-family="Arial, Helvetica, sans-serif" font-size="27" fill="#7a6a58">Open the link to see when and where.</text>
  <rect x="80" y="482" width="270" height="62" rx="31" fill="#b07c22"/>
  <text x="215" y="522" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="26" fill="#ffffff">Tap to open</text>
</svg>`);

const mark = await sharp(path.join(root, "public", "brand", "logo-mark.webp"))
  .resize({ height: 64 })
  .png()
  .toBuffer();

const out = path.join(root, "public", "brand", "invitation-preview.png");
const info = await sharp(art)
  .composite([{ input: mark, left: 78, top: 58 }])
  .png({ compressionLevel: 9, palette: true, quality: 90 })
  .toFile(out);
console.log(
  `invitation-preview.png: ${info.width}x${info.height} ${Math.round(info.size / 1024)} KB`,
);

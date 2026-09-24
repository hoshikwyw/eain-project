/**
 * Social preview image (1200x630) for link previews: brand gradient, the
 * lovebirds, the wordmark and tagline. Written to app/opengraph-image.png,
 * which Next.js serves for every page that does not set its own.
 * Usage: node scripts/compose-og-image.mjs
 */
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"), "..");
const W = 1200;
const H = 630;

const background = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff5ef"/><stop offset="0.55" stop-color="#ffe3e6"/><stop offset="1" stop-color="#ffd3da"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  ${[
    [90, 90, 10],
    [1120, 70, 8],
    [1040, 560, 12],
    [160, 540, 9],
    [620, 40, 6],
    [980, 300, 7],
  ]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f4a3b5" opacity="0.5"/>`)
    .join("")}
  <text x="80" y="290" font-family="Georgia, 'Noto Serif', serif" font-weight="600" font-size="120" fill="#2b1f21">Eain</text>
  <text x="80" y="360" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#7a6568">Digital gifts that feel like home.</text>
  <text x="80" y="420" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#8a7477">Make something special. Give it to someone.</text>
  <rect x="80" y="470" width="300" height="52" rx="26" fill="#db3358"/>
  <text x="230" y="505" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="22" fill="#ffffff">Create a gift</text>
</svg>`);

const birds = await sharp(path.join(root, "public", "brand", "lovebirds.webp")).resize({ height: 440 }).png().toBuffer();
const birdMeta = await sharp(birds).metadata();

const out = path.join(root, "app", "opengraph-image.png");
const info = await sharp(background)
  .composite([{ input: birds, left: W - birdMeta.width - 60, top: H - birdMeta.height - 30 }])
  .png({ compressionLevel: 9 })
  .toFile(out);
console.log(`opengraph-image.png: ${info.width}x${info.height} ${Math.round(info.size / 1024)} KB`);

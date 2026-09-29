/**
 * Turns the raw brand exports in public/brand into the files the app uses.
 *
 *   public/brand/logo-mark.webp   house + birds cut from the logo lockup, background removed
 *   public/brand/lovebirds.webp   the couple, background removed, 1200 px wide
 *   public/brand/bird-pink.webp   single pink bird, background removed, 600 px wide
 *   public/brand/bird-blue.webp   single blue bird, background removed, 600 px wide
 *   app/icon.png (512) and app/apple-icon.png (180) from the app icon tile
 *
 * Background removal flood-fills from the image border, so only background
 * connected to the outside becomes transparent. White areas inside a bird stay.
 * Edge pixels get partial alpha and their colour is un-mixed from the
 * background so no green halo remains.
 *
 * Usage: node scripts/process-brand-images.mjs
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"), "..");
const brand = path.join(root, "public", "brand");
const appDir = path.join(root, "app");

async function loadRaw(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

function cornerColor({ data, width, height }) {
  const pts = [
    [2, 2],
    [width - 3, 2],
    [2, height - 3],
    [width - 3, height - 3],
  ];
  const sum = [0, 0, 0];
  for (const [x, y] of pts) {
    const i = (y * width + x) * 4;
    sum[0] += data[i];
    sum[1] += data[i + 1];
    sum[2] += data[i + 2];
  }
  return sum.map((v) => v / pts.length);
}

/**
 * Flood fill from the border over pixels close to the background colour.
 * innerT: fully transparent below this distance. outerT: fully opaque above.
 */
function removeBackground(img, { innerT = 18, outerT = 60, extraSeeds = [], allow = () => true } = {}) {
  const { data, width, height } = img;
  const bg = cornerColor(img);
  const dist = new Float32Array(width * height);
  for (let p = 0, i = 0; p < width * height; p++, i += 4) {
    const dr = data[i] - bg[0];
    const dg = data[i + 1] - bg[1];
    const db = data[i + 2] - bg[2];
    dist[p] = Math.sqrt(dr * dr + dg * dg + db * db);
  }

  const connected = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const push = (p) => {
    if (!connected[p] && dist[p] < outerT && allow(data[p * 4], data[p * 4 + 1], data[p * 4 + 2])) {
      connected[p] = 1;
      queue[tail++] = p;
    }
  };
  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }
  for (const [x, y] of extraSeeds) push(y * width + x);
  while (head < tail) {
    const p = queue[head++];
    const x = p % width;
    const y = (p - x) / width;
    if (x > 0) push(p - 1);
    if (x < width - 1) push(p + 1);
    if (y > 0) push(p - width);
    if (y < height - 1) push(p + width);
  }

  const out = Buffer.from(data);
  for (let p = 0, i = 0; p < width * height; p++, i += 4) {
    if (!connected[p]) continue;
    const d = dist[p];
    const t = d <= innerT ? 0 : d >= outerT ? 1 : (d - innerT) / (outerT - innerT);
    const alpha = Math.round(t * t * (3 - 2 * t) * 255);
    out[i + 3] = alpha;
    if (alpha > 0 && alpha < 255) {
      // Un-mix the background out of the edge colour: c = a*fg + (1-a)*bg.
      const a = alpha / 255;
      for (let c = 0; c < 3; c++) {
        out[i + c] = Math.max(0, Math.min(255, Math.round((data[i + c] - (1 - a) * bg[c]) / a)));
      }
    }
  }
  return { data: out, width, height };
}

/**
 * Cutout for the mascot art, which sits on a pale green backdrop.
 *
 * Colour distance cannot separate white fur from a pale background (they
 * differ by only ~35), which punched holes in the birds on dark pages.
 * Green tint can: greenness = G - (R + B) / 2 measures 10..16 on the
 * backdrop and its ground shadow, and -4..+2.5 on white fur (measured on
 * all three source images). So:
 *  1. Flood from the border through green-tinted pixels only (g >= gCut).
 *     White, pink and blue fur stop the fill, so nothing inside is lost.
 *     The ground shadow is green-tinted and connected, so it goes too.
 *  2. Alpha ramps from opaque at g <= gFg to transparent at g >= gBg.
 *  3. Edge colours are un-mixed from the backdrop.
 *  4. The alpha is eroded by one pixel so no green fringe survives on
 *     dark backgrounds.
 */
const TINTS = {
  /** Pale green backdrop of the mascot art. Backdrop 10..16, white fur -4..+2.5. */
  green: {
    metric: (r, g, b) => g - (r + b) / 2,
    cut: 6,
    fg: 6,
    bg: 9.5,
    candidate: () => true,
    /** Enclosed pale green-grey shadow patches (e.g. between feet). Green must lead red, so yellow never qualifies. */
    enclosed: (r, g, b, m) => m >= 8 && g > r && Math.min(r, b) > 140,
    /**
     * Grey contact-shadow core under the feet: slightly green-tinted (3..5), darker than
     * white fur. Only cleared in the bottom band and only where it touches the backdrop,
     * so dark grey feet (not green-tinted) and white fur are kept.
     */
    groundBand: 0.14,
    ground: (r, g, b, m) => m >= 2.5 && (r + g + b) / 3 < 228,
  },
  /** Warm cream backdrop of the logo lockup. Backdrop 12..17, white areas -1..+6. */
  warm: {
    metric: (r, g, b) => r - b,
    cut: 10,
    fg: 7,
    bg: 12,
    // Only light, low-saturation pixels can be backdrop, so the yellow and green parrot never are.
    candidate: (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b) <= 30 && (r + g + b) / 3 >= 200,
    enclosed: () => false,
  },
};

function removeGreenBackground(img, { tint = "green", ground = true } = {}) {
  const T = TINTS[tint];
  const { data, width, height } = img;
  const bg = cornerColor(img);
  const n = width * height;
  const green = new Float32Array(n);
  const candidate = new Uint8Array(n);
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    green[p] = T.metric(data[i], data[i + 1], data[i + 2]);
    candidate[p] = T.candidate(data[i], data[i + 1], data[i + 2]) ? 1 : 0;
  }
  const gFg = T.fg;
  const gBg = T.bg;

  const inRegion = new Uint8Array(n);
  const queue = new Int32Array(n);
  let head = 0;
  let tail = 0;
  const push = (p) => {
    if (!inRegion[p] && candidate[p] && green[p] >= T.cut) {
      inRegion[p] = 1;
      queue[tail++] = p;
    }
  };
  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }
  while (head < tail) {
    const p = queue[head++];
    const x = p % width;
    const y = (p - x) / width;
    if (x > 0) push(p - 1);
    if (x < width - 1) push(p + 1);
    if (y > 0) push(p - width);
    if (y < height - 1) push(p + width);
  }

  // Backdrop trapped inside the figure, such as shadow between the feet.
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    if (!inRegion[p] && T.enclosed(data[i], data[i + 1], data[i + 2], green[p])) inRegion[p] = 1;
  }

  // Grey contact shadow in the ground band, grown outward from the backdrop.
  const groundShadow = new Uint8Array(n);
  if (T.ground && ground) {
    const bandTop = Math.floor(height * (1 - T.groundBand));
    head = 0;
    tail = 0;
    const isGround = (p) => {
      const i = p * 4;
      return !inRegion[p] && !groundShadow[p] && p >= bandTop * width && T.ground(data[i], data[i + 1], data[i + 2], green[p]);
    };
    for (let p = bandTop * width; p < n; p++) {
      if (!inRegion[p]) continue;
      const x = p % width;
      for (const q of [p - 1, p + 1, p - width, p + width]) {
        if (q >= 0 && q < n && Math.abs((q % width) - x) <= 1 && isGround(q)) {
          groundShadow[q] = 1;
          queue[tail++] = q;
        }
      }
    }
    while (head < tail) {
      const p = queue[head++];
      const x = p % width;
      for (const q of [p - 1, p + 1, p - width, p + width]) {
        if (q >= 0 && q < n && Math.abs((q % width) - x) <= 1 && isGround(q)) {
          groundShadow[q] = 1;
          queue[tail++] = q;
        }
      }
    }
  }

  const alpha = new Uint8Array(n).fill(255);
  for (let p = 0; p < n; p++) {
    if (groundShadow[p]) {
      alpha[p] = 0;
      continue;
    }
    if (!inRegion[p]) continue;
    const t = Math.min(1, Math.max(0, (gBg - green[p]) / (gBg - gFg)));
    alpha[p] = Math.round(t * t * (3 - 2 * t) * 255);
  }

  // One-pixel erosion: each pixel takes the lowest alpha of itself and its 4 neighbours.
  const eroded = new Uint8Array(alpha);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      let a = alpha[p];
      if (x > 0 && alpha[p - 1] < a) a = alpha[p - 1];
      if (x < width - 1 && alpha[p + 1] < a) a = alpha[p + 1];
      if (y > 0 && alpha[p - width] < a) a = alpha[p - width];
      if (y < height - 1 && alpha[p + width] < a) a = alpha[p + width];
      eroded[p] = a;
    }
  }

  const out = Buffer.from(data);
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    const a255 = eroded[p];
    out[i + 3] = a255;
    if (a255 > 0 && a255 < 255 && inRegion[p]) {
      const a = a255 / 255;
      for (let c = 0; c < 3; c++) {
        out[i + c] = Math.max(0, Math.min(255, Math.round((data[i + c] - (1 - a) * bg[c]) / a)));
      }
    }
  }
  return { data: out, width, height };
}

function contentBounds({ data, width, height }, pad = 4) {
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return {
    left: Math.max(0, minX - pad),
    top: Math.max(0, minY - pad),
    width: Math.min(width, maxX + pad + 1) - Math.max(0, minX - pad),
    height: Math.min(height, maxY + pad + 1) - Math.max(0, minY - pad),
  };
}

async function writeWebp(img, outFile, targetWidth) {
  const box = contentBounds(img);
  const pipeline = sharp(img.data, { raw: { width: img.width, height: img.height, channels: 4 } })
    .extract(box)
    .resize({ width: targetWidth, withoutEnlargement: true, kernel: "lanczos3" })
    .webp({ quality: 88, alphaQuality: 90, effort: 6 });
  const info = await pipeline.toFile(outFile);
  console.log(`${path.basename(outFile)}: ${info.width}x${info.height} ${Math.round(info.size / 1024)} KB`);
  return info;
}

async function cutout(srcName, outName, width, options) {
  const img = await loadRaw(path.join(brand, srcName));
  return writeWebp(removeGreenBackground(img, options), path.join(brand, outName), width);
}

await mkdir(brand, { recursive: true });

// Logo mark: the lockup above the "Eain" text. Crop first, then remove background.
{
  const lockup = sharp(path.join(brand, "eain-mainLogo2.png"));
  const meta = await lockup.metadata();
  const cropH = Math.round(meta.height * 0.67);
  const { data, info } = await lockup.extract({ left: 0, top: 0, width: meta.width, height: cropH }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const img = { data, width: info.width, height: info.height };
  // Colour distance gives clean edges on the green roof and leaves. The cream backdrop is warm
  // (red minus blue 12..17) and the white parrot face is not (-1..6), so the fill may only pass
  // through warm pixels and can no longer punch a hole in the face.
  const logo = removeBackground(img, { innerT: 10, outerT: 40, allow: (r, g, b) => r - b >= 8 });
  await writeWebp(logo, path.join(brand, "logo-mark.webp"), 512);
}

// The couple's white belly reaches the ground band, so the ground-shadow rule is off for it.
await cutout("couple.png", "lovebirds.webp", 1200, { ground: false });
await cutout("female.png", "bird-pink.webp", 600);
await cutout("male.png", "bird-blue.webp", 600);

// App icon: crop the rounded tile out of the export and keep its own background.
{
  const img = await loadRaw(path.join(brand, "eain-appIcon.png"));
  const bg = cornerColor(img);
  let minX = img.width, minY = img.height, maxX = -1, maxY = -1;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4;
      const d = Math.abs(img.data[i] - bg[0]) + Math.abs(img.data[i + 1] - bg[1]) + Math.abs(img.data[i + 2] - bg[2]);
      if (d > 24) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const side = Math.max(maxX - minX + 1, maxY - minY + 1);
  const left = Math.max(0, Math.min(img.width - side, Math.round(minX + (maxX - minX + 1 - side) / 2)));
  const top = Math.max(0, Math.min(img.height - side, Math.round(minY + (maxY - minY + 1 - side) / 2)));
  const tile = sharp(path.join(brand, "eain-appIcon.png")).extract({ left, top, width: side, height: side });
  for (const [size, name] of [
    [512, "icon.png"],
    [180, "apple-icon.png"],
  ]) {
    const info = await tile.clone().resize(size, size, { kernel: "lanczos3" }).png({ compressionLevel: 9 }).toFile(path.join(appDir, name));
    console.log(`${name}: ${info.width}x${info.height} ${Math.round(info.size / 1024)} KB`);
  }
}

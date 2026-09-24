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
function removeBackground(img, { innerT = 18, outerT = 60, extraSeeds = [] } = {}) {
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
    if (!connected[p] && dist[p] < outerT) {
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
  return writeWebp(removeBackground(img, options), path.join(brand, outName), width);
}

await mkdir(brand, { recursive: true });

// Logo mark: the lockup above the "Eain" text. Crop first, then remove background.
{
  const lockup = sharp(path.join(brand, "eain-mainLogo2.png"));
  const meta = await lockup.metadata();
  const cropH = Math.round(meta.height * 0.67);
  const { data, info } = await lockup.extract({ left: 0, top: 0, width: meta.width, height: cropH }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const img = { data, width: info.width, height: info.height };
  await writeWebp(removeBackground(img, { innerT: 10, outerT: 40 }), path.join(brand, "logo-mark.webp"), 512);
}

await cutout("couple.png", "lovebirds.webp", 1200);
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

"use client";

/**
 * Browser-side image preparation. Resizes and compresses before upload so
 * free-tier storage and bandwidth go further. Output is WebP where the
 * browser supports it, otherwise JPEG.
 */
export const MAX_EDGE = 1600;
export const THUMB_EDGE = 400;
const MAX_INPUT_BYTES = 12 * 1024 * 1024;

export type ProcessedImage = {
  blob: Blob;
  thumb: Blob;
  width: number;
  height: number;
  mime: "image/webp" | "image/jpeg";
};

export async function processImage(file: File): Promise<ProcessedImage> {
  if (!file.type.startsWith("image/")) throw new Error("not-image");
  if (file.size > MAX_INPUT_BYTES) throw new Error("too-large");

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const mime = supportsWebp() ? "image/webp" : "image/jpeg";
  const blob = await draw(bitmap, width, height, mime, 0.82);

  const tScale = Math.min(1, THUMB_EDGE / Math.max(width, height));
  const thumb = await draw(bitmap, Math.round(width * tScale), Math.round(height * tScale), mime, 0.75);
  bitmap.close();

  return { blob, thumb, width, height, mime };
}

function draw(bitmap: ImageBitmap, w: number, h: number, mime: string, quality: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), mime, quality);
  });
}

let webpSupport: boolean | null = null;
function supportsWebp(): boolean {
  if (webpSupport !== null) return webpSupport;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  webpSupport = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  return webpSupport;
}

/** Server-side checks for uploaded images. Never trust the declared type. */

export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedMime = (typeof ALLOWED_MIME)[number];

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_THUMB_BYTES = 400 * 1024;
export const MAX_DIMENSION = 4000;

/** Detects the real image type from the first bytes. */
export function sniffImageType(bytes: Uint8Array): AllowedMime | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  const riff = String.fromCharCode(bytes[0]!, bytes[1]!, bytes[2]!, bytes[3]!);
  const webp = String.fromCharCode(bytes[8]!, bytes[9]!, bytes[10]!, bytes[11]!);
  if (riff === "RIFF" && webp === "WEBP") return "image/webp";
  return null;
}

export function extensionFor(mime: AllowedMime): string {
  return mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";
}

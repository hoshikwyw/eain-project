import "server-only";

import QRCode from "qrcode";

export type QrImages = { svg: string; pngDataUrl: string };

/** QR for a gift link. SVG for display, PNG data URL for download. */
export async function makeQr(url: string): Promise<QrImages> {
  const [svg, pngDataUrl] = await Promise.all([
    QRCode.toString(url, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#2b1f21", light: "#ffffff" },
    }),
    QRCode.toDataURL(url, {
      margin: 2,
      width: 720,
      errorCorrectionLevel: "M",
      color: { dark: "#2b1f21", light: "#ffffff" },
    }),
  ]);
  return { svg, pngDataUrl };
}

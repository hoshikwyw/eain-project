"use client";

import { Check, Copy, Download, Lock, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { markGiftShared } from "@/features/gifts/actions";

type Props = { giftId: string; url: string; qrSvg: string; qrPngDataUrl: string; title: string };

const neverChanges = () => () => {};

/**
 * Everything needed to pass a gift on: the link with a copy button, the
 * phone's own share sheet where there is one, and a QR code. Laid out as
 * one narrow column, so it reads the same in a side panel and on a phone.
 */
export function SharePanel({ giftId, url, qrSvg, qrPngDataUrl, title }: Props) {
  const t = useTranslations("share");
  const [copied, setCopied] = useState(false);
  // False on the server and for the first client render, so the two match; then the browser's answer.
  const canShare = useSyncExternalStore(
    neverChanges,
    () => typeof navigator.share === "function",
    () => false,
  );

  // "Shared" in the timeline means the creator passed the link on. Recorded once per gift.
  const recordShared = () => void markGiftShared(giftId).catch(() => undefined);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      recordShared();
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the URL is visible in the field for manual copy.
    }
  }

  async function share() {
    try {
      await navigator.share({ title, text: t("shareText"), url });
      recordShared();
    } catch {
      // User cancelled or share is unsupported.
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* The link and its copy button, as one pill. */}
      <div className="flex items-center gap-2 glass rounded-full border p-1.5 pl-4 focus-within:ring-2 focus-within:ring-ring/60">
        <label htmlFor="share-url" className="sr-only">
          {t("link")}
        </label>
        <input
          id="share-url"
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 bg-transparent font-mono text-xs outline-none"
        />
        <Button type="button" size="sm" onClick={copy} aria-live="polite">
          {copied ? <Check /> : <Copy />}
          {copied ? t("copied") : t("copy")}
        </Button>
      </div>

      {canShare && (
        <Button type="button" variant="secondary" onClick={share} className="w-full">
          <Share2 />
          {t("nativeShare")}
        </Button>
      )}

      <div className="flex items-center gap-4 glass rounded-2xl border p-3">
        <div
          className="size-28 shrink-0 overflow-hidden rounded-xl bg-white p-1.5 [&_svg]:size-full"
          role="img"
          aria-label={t("qrAlt")}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <div className="flex min-w-0 flex-col items-start gap-2">
          <div>
            <p className="text-sm font-semibold">{t("qrTitle")}</p>
            <p className="text-xs text-muted-foreground">{t("qrHint")}</p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <a href={qrPngDataUrl} download="eain-gift-qr.png" onClick={recordShared}>
              <Download />
              {t("downloadQr")}
            </a>
          </Button>
        </div>
      </div>

      <p className="flex gap-2 px-1 text-xs text-muted-foreground">
        <Lock className="mt-0.5 size-3.5 shrink-0" />
        {t("anyoneWithLink")}
      </p>
    </div>
  );
}

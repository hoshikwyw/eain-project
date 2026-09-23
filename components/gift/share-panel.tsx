"use client";

import { Check, Copy, Download, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = { url: string; qrSvg: string; qrPngDataUrl: string; title: string };

export function SharePanel({ url, qrSvg, qrPngDataUrl, title }: Props) {
  const t = useTranslations("share");
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the URL is visible in the input for manual copy.
    }
  }

  async function share() {
    try {
      await navigator.share({ title, text: t("shareText"), url });
    } catch {
      // User cancelled or share is unsupported.
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_auto]">
      <div className="flex flex-col gap-3">
        <label htmlFor="share-url" className="text-sm font-semibold">
          {t("link")}
        </label>
        <div className="flex gap-2">
          <Input id="share-url" readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
          <Button type="button" variant="secondary" onClick={copy} aria-live="polite" className="shrink-0">
            {copied ? <Check /> : <Copy />}
            {copied ? t("copied") : t("copy")}
          </Button>
        </div>
        {canShare && (
          <Button type="button" variant="soft" onClick={share} className="self-start">
            <Share2 />
            {t("nativeShare")}
          </Button>
        )}
        <p className="rounded-xl bg-accent px-3.5 py-2.5 text-sm text-accent-foreground">{t("anyoneWithLink")}</p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div
          className="size-44 overflow-hidden rounded-2xl border border-border bg-white p-2 [&_svg]:size-full"
          role="img"
          aria-label={t("qrAlt")}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <Button asChild variant="secondary" size="sm">
          <a href={qrPngDataUrl} download="eain-gift-qr.png">
            <Download />
            {t("downloadQr")}
          </a>
        </Button>
      </div>
    </div>
  );
}

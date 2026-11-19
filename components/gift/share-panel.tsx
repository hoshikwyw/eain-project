"use client";

import {
  Check,
  Copy,
  Download,
  Lock,
  MessageCircle,
  MessageSquareText,
  Phone,
  Send,
  Share2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { markGiftShared } from "@/features/gifts/actions";
import { toast } from "@/lib/toast";

type Props = {
  giftId: string;
  url: string;
  qrSvg: string;
  qrPngDataUrl: string;
  title: string;
  /** An invitation goes to many guests, so the words say so. */
  invitation?: boolean;
};

const neverChanges = () => () => {};

/**
 * The apps people in Myanmar actually send links with, each opened with the
 * message and link filled in. Plain icons in the apps' colours, with the name
 * under each, rather than the brand marks themselves. Messenger has no web
 * share without a Facebook app id, so its button is only shown on phones.
 */
const SHARE_APPS = [
  {
    name: "Viber",
    color: "#7360F2",
    Icon: Phone,
    href: (text: string) => `viber://forward?text=${encodeURIComponent(text)}`,
    app: true,
  },
  {
    name: "Messenger",
    color: "#0084FF",
    Icon: MessageCircle,
    href: (_text: string, url: string) => `fb-messenger://share/?link=${encodeURIComponent(url)}`,
    app: true,
    phoneOnly: true,
  },
  {
    name: "Telegram",
    color: "#26A5E4",
    Icon: Send,
    href: (text: string, url: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    name: "WhatsApp",
    color: "#25D366",
    Icon: MessageSquareText,
    href: (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`,
  },
] as const;

/**
 * Everything needed to pass a gift on: the link with a copy button, the
 * phone's own share sheet where there is one, and a QR code. Laid out as
 * one narrow column, so it reads the same in a side panel and on a phone.
 */
export function SharePanel({ giftId, url, qrSvg, qrPngDataUrl, title, invitation }: Props) {
  const t = useTranslations("share");
  const w = (key: "shareText" | "anyoneWithLink") => (invitation ? t(`invitation.${key}`) : t(key));
  const [copied, setCopied] = useState(false);
  // False on the server and for the first client render, so the two match; then the browser's answer.
  const canShare = useSyncExternalStore(
    neverChanges,
    () => typeof navigator.share === "function",
    () => false,
  );
  const onPhone = useSyncExternalStore(
    neverChanges,
    () => /Android|iPhone|iPad/i.test(navigator.userAgent),
    () => false,
  );
  const apps = SHARE_APPS.filter((a) => !("phoneOnly" in a && a.phoneOnly) || onPhone);

  // "Shared" in the timeline means the creator passed the link on. Recorded once per gift.
  const recordShared = () => void markGiftShared(giftId).catch(() => undefined);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      recordShared();
      toast.success(t("copiedToast"), { duration: 2500 });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the URL stays visible in the field for manual copy.
      toast.error(t("copyFailed"));
    }
  }

  async function share() {
    try {
      await navigator.share({ title, text: w("shareText"), url });
      recordShared();
    } catch {
      // User cancelled or share is unsupported.
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* The link and its copy button, as one pill. */}
      <div className="flex items-center gap-2 rounded-full border glass p-1.5 pl-4 focus-within:ring-2 focus-within:ring-ring/60">
        <label htmlFor="share-url" className="sr-only">
          {t("link")}
        </label>
        <input
          id="share-url"
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="h-11 min-w-0 flex-1 bg-transparent font-mono text-xs outline-none sm:h-9"
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

      <div className="rounded-2xl border glass p-3">
        <p className="mb-2 text-sm font-semibold">{t("sendWith")}</p>
        <ul className="grid grid-cols-4 gap-1">
          {apps.map(({ name, color, Icon, href, ...rest }) => (
            <li key={name}>
              <a
                href={href(`${w("shareText")} ${url}`, url)}
                // App links open in place; web ones in a new tab, so this page stays.
                target={"app" in rest && rest.app ? undefined : "_blank"}
                rel="noopener noreferrer"
                onClick={recordShared}
                className="flex flex-col items-center gap-1.5 rounded-xl py-2 text-xs text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
              >
                <span
                  style={{ backgroundColor: color }}
                  className="flex size-11 items-center justify-center rounded-full text-white shadow-sm"
                >
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                {name}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border glass p-3">
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
        {w("anyoneWithLink")}
      </p>
    </div>
  );
}

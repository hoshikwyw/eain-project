"use client";

import { Eye, Save, Send } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { BirthdayPostcard } from "@/components/gift/templates/birthday-postcard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { publishGift, savePostcard } from "@/features/gifts/actions";
import type { PostcardContent, SaveGiftState } from "@/features/gifts/schemas";
import { cn } from "@/lib/utils";

type Props = {
  giftId: string;
  title: string;
  status: string;
  initial: PostcardContent;
  senderName: string;
  publishError?: boolean;
};

export function PostcardEditor({ giftId, title, status, initial, senderName, publishError }: Props) {
  const t = useTranslations("editor");
  const [content, setContent] = useState<PostcardContent>(initial);
  const [giftTitle, setGiftTitle] = useState(title);
  const [showPreview, setShowPreview] = useState(false);
  const saveAction = savePostcard.bind(null, giftId);
  const [state, formAction, saving] = useActionState<SaveGiftState, FormData>(saveAction, {});

  const update = (patch: Partial<PostcardContent>) => setContent((c) => ({ ...c, ...patch }));
  const publishAction = publishGift.bind(null, giftId);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <form action={formAction} className={cn("flex flex-col gap-5", showPreview && "hidden lg:flex")}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">{t("title")}</Label>
          <Input id="title" name="title" value={giftTitle} onChange={(e) => setGiftTitle(e.target.value)} maxLength={120} required />
          <p className="text-xs text-muted-foreground">{t("titleHint")}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="recipientName">{t("recipientName")}</Label>
          <Input
            id="recipientName"
            name="recipientName"
            value={content.recipientName}
            onChange={(e) => update({ recipientName: e.target.value })}
            maxLength={80}
            placeholder={t("recipientPlaceholder")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="heading">{t("heading")}</Label>
          <Input id="heading" name="heading" value={content.heading} onChange={(e) => update({ heading: e.target.value })} maxLength={80} required />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="message">{t("message")}</Label>
          <textarea
            id="message"
            name="message"
            value={content.message}
            onChange={(e) => update({ message: e.target.value })}
            maxLength={1000}
            rows={6}
            required
            className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <p className="text-right text-xs text-muted-foreground">{content.message.length}/1000</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="finalMessage">{t("finalMessage")}</Label>
            <Input id="finalMessage" name="finalMessage" value={content.finalMessage} onChange={(e) => update({ finalMessage: e.target.value })} maxLength={300} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="signature">{t("signature")}</Label>
            <Input id="signature" name="signature" value={content.signature} onChange={(e) => update({ signature: e.target.value })} maxLength={80} placeholder={senderName} />
          </div>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-semibold">{t("theme")}</legend>
          <div className="flex gap-2">
            {(["blossom", "night"] as const).map((variant) => (
              <label
                key={variant}
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold",
                  content.variant === variant ? "border-primary bg-accent text-accent-foreground" : "border-border",
                )}
              >
                <input
                  type="radio"
                  name="variant"
                  value={variant}
                  checked={content.variant === variant}
                  onChange={() => update({ variant })}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cn("size-4 rounded-full", variant === "blossom" ? "bg-[#f4a3b5]" : "bg-[#3a2372]")}
                />
                {t(`variants.${variant}`)}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <Button type="submit" disabled={saving}>
            <Save />
            {t("save")}
          </Button>
          <Button type="button" variant="secondary" className="lg:hidden" onClick={() => setShowPreview(true)}>
            <Eye />
            {t("preview")}
          </Button>
          {state.status === "saved" && <span className="text-sm text-success">{t("saved")}</span>}
          {state.status === "invalid" && <span className="text-sm text-destructive">{t("invalid")}</span>}
          {state.status === "error" && <span className="text-sm text-destructive">{t("error")}</span>}
        </div>
      </form>

      <div className={cn("flex flex-col gap-4", !showPreview && "hidden lg:flex")}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">{t("livePreview")}</h2>
          <Button type="button" variant="ghost" size="sm" className="lg:hidden" onClick={() => setShowPreview(false)}>
            {t("backToEdit")}
          </Button>
        </div>
        <BirthdayPostcard content={content} senderName={senderName} compact />

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">{status === "published" ? t("publishedHint") : t("publishHint")}</p>
          {publishError && <p className="text-sm text-destructive">{t("publishError")}</p>}
          <div className="flex flex-wrap gap-2">
            <form action={publishAction}>
              <Button type="submit" variant={status === "published" ? "secondary" : "primary"}>
                <Send />
                {status === "published" ? t("republish") : t("publish")}
              </Button>
            </form>
            <Button asChild variant="ghost">
              <Link href={`/dashboard/gifts/${giftId}`}>{t("manage")}</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t("saveFirst")}</p>
        </div>
      </div>
    </div>
  );
}

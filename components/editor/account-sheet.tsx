"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef } from "react";
import { Lovebirds } from "@/components/brand/lovebirds";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Where to come back to after signing in. */
  next: string;
};

const REASONS = ["keep", "link", "opened", "points"] as const;

/**
 * Asked for at the moment an account is needed: when a visitor trying a
 * template wants to save or publish. Says what the account is for, and
 * offers to sign up or log in. The gift stays in the browser meanwhile.
 */
export function AccountSheet({ open, onClose, next }: Props) {
  const t = useTranslations("editor.guest");
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const query = `?next=${encodeURIComponent(next)}`;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-3xl border glass-strong p-0 text-left text-foreground shadow-2xl backdrop:bg-scrim backdrop:backdrop-blur-md"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex flex-col gap-5 p-6 sm:p-7">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 size-9"
          aria-label={t("notNow")}
          onClick={onClose}
        >
          <X />
        </Button>
        <div className="mx-auto w-24">
          <Lovebirds />
        </div>
        <div className="text-center">
          <h2
            id={titleId}
            className="font-display text-2xl font-semibold text-balance my:text-wrap"
          >
            {t("sheetTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("sheetText")}</p>
        </div>
        <ul className="flex flex-col gap-2 text-sm">
          {REASONS.map((key) => (
            <li key={key} className="flex items-start gap-2.5">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success-soft text-success">
                <Check className="size-3" />
              </span>
              {t(`reasons.${key}`)}
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2">
          <Button asChild size="lg">
            <Link href={`/auth/signup${query}`}>{t("createAccount")}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/auth/login${query}`}>{t("logIn")}</Link>
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {t("notNow")}
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground">{t("sheetNote")}</p>
      </div>
    </dialog>
  );
}

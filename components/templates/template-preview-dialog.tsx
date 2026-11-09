"use client";

import { Eye, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TemplateDemo } from "./template-demo";

type Props = {
  slug: string;
  name: string;
  locale: "en" | "my";
  /** A labelled "Preview" button, or a round eye for sitting over a picture. */
  trigger?: "button" | "icon";
  triggerClassName?: string;
  /** What to do with the template, shown under the preview: the card's own button. */
  children: React.ReactNode;
};

/**
 * "Preview" on a template card: opens the receiver's experience of a sample
 * gift over the whole screen, with the card's own action under it, so the
 * template can be chosen from inside the preview. The browser's modal dialog
 * keeps focus inside and closes on Escape.
 */
export function TemplatePreviewDialog({
  slug,
  name,
  locale,
  trigger = "button",
  triggerClassName,
  children,
}: Props) {
  const t = useTranslations("create.demo");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      {trigger === "icon" ? (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className={cn("size-9 rounded-full shadow-soft", triggerClassName)}
          aria-label={t("open", { template: name })}
          onClick={() => setOpen(true)}
        >
          <Eye />
        </Button>
      ) : (
        <Button
          type="button"
          variant="secondary"
          className={triggerClassName}
          aria-label={t("open", { template: name })}
          onClick={() => setOpen(true)}
        >
          <Eye />
          {t("preview")}
        </Button>
      )}

      <dialog
        ref={ref}
        aria-labelledby={titleId}
        className="m-0 h-svh max-h-none w-screen max-w-none bg-background p-0 text-foreground backdrop:bg-scrim"
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
      >
        {/* Drawn only while open, so each preview starts closed and no scene loads unseen. */}
        {open && (
          <div className="flex h-full flex-col">
            <header className="z-10 flex items-center justify-between gap-4 glass-bar px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <p id={titleId} className="truncate font-display text-lg font-semibold">
                  {t("title", { template: name })}
                </p>
                <p className="truncate text-xs text-muted-foreground">{t("hint")}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label={t("close")}
                onClick={() => setOpen(false)}
              >
                <X />
              </Button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <TemplateDemo slug={slug} locale={locale} />
            </div>
            <footer className="flex justify-center border-t glass-bar px-4 py-3">
              <div className="w-full max-w-sm">{children}</div>
            </footer>
          </div>
        )}
      </dialog>
    </>
  );
}

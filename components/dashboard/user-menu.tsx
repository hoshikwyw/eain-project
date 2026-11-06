"use client";

import { LogOut, Settings, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { LocaleToggle } from "@/components/settings/locale-toggle";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { SubmitButton } from "@/components/ui/submit-button";
import { signOut } from "@/features/auth/actions";
import { adminHref } from "@/lib/app-mode";
import { cn } from "@/lib/utils";

type Props = { displayName: string; email: string; isAdmin?: boolean };

const itemClass =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-foreground transition-colors outline-none hover:bg-secondary focus-visible:bg-secondary [&_svg]:size-4.5 [&_svg]:text-muted-foreground";

/**
 * The avatar in the top bar and the menu under it: who is signed in,
 * settings, language, theme, the admin console for admins, and sign out.
 * Everything about the account lives here, so the bar itself stays short.
 */
export function UserMenu({ displayName, email, isAdmin }: Props) {
  const t = useTranslations("dashboard");
  const tSettings = useTranslations("settings");
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // A press anywhere else, or Escape, closes the menu.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!(e.target instanceof Node) || !root.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initial = displayName.trim().charAt(0).toUpperCase() || "E";
  const avatar = (className: string) => (
    <span aria-hidden="true" className={cn("grid shrink-0 place-items-center rounded-full bg-brand-soft font-bold text-accent-foreground dark:text-brand", className)}>
      {initial}
    </span>
  );

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t("nav.account")}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "block cursor-pointer rounded-full ring-2 ring-offset-2 ring-offset-background transition outline-none focus-visible:ring-ring",
          open ? "ring-primary" : "ring-transparent hover:ring-border",
        )}
      >
        {avatar("size-9 text-sm")}
      </button>

      {open && (
        <div className="absolute top-[calc(100%+0.75rem)] right-0 z-50 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="flex items-center gap-3 p-4">
            {avatar("size-11 text-base")}
            <div className="min-w-0">
              <p className="truncate font-semibold">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>

          <div className="border-t border-border p-1.5">
            <Link href="/dashboard/settings" className={itemClass} onClick={() => setOpen(false)}>
              <Settings />
              {t("nav.settings")}
            </Link>
            {isAdmin && (
              // Plain anchor: the admin console may run on its own origin.
              <a href={adminHref("/admin")} className={itemClass}>
                <ShieldCheck />
                {t("nav.admin")}
              </a>
            )}
          </div>

          <div className="flex flex-col gap-1 border-t border-border px-4.5 py-2.5 text-sm font-semibold">
            <div className="flex items-center justify-between gap-3">
              <span>{tSettings("language")}</span>
              <LocaleToggle />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>{tSettings("theme")}</span>
              <ThemeToggle />
            </div>
          </div>

          <form action={signOut} className="border-t border-border p-1.5">
            <SubmitButton variant="ghost" className={cn(itemClass, "h-auto justify-start")}>
              <LogOut />
              {t("settings.signOut")}
            </SubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";
import { clearGuestDraft, readGuestDraft } from "@/components/editor/use-guest-draft";
import { Button } from "@/components/ui/button";

const neverChanges = () => () => {};

/**
 * On the home screen: the gift someone made before signing up is still on
 * this device, when they signed in some other way than through the guest
 * editor (a confirmation link opened later, or a plain log-in). Offers to
 * save it to the account, or to let it go.
 */
export function LeftoverDraft() {
  const t = useTranslations("dashboard.leftoverDraft");
  const [dismissed, setDismissed] = useState(false);
  const hasDraft = useSyncExternalStore(
    neverChanges,
    () => Boolean(readGuestDraft()),
    () => false,
  );
  if (!hasDraft || dismissed) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-accent px-3.5 py-2.5 text-sm text-accent-foreground"
    >
      <p className="flex-1 basis-60">{t("text")}</p>
      <div className="flex items-center gap-1">
        <Button asChild size="sm">
          <Link href="/create/continue">{t("save")}</Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            clearGuestDraft();
            setDismissed(true);
          }}
        >
          {t("discard")}
        </Button>
      </div>
    </div>
  );
}

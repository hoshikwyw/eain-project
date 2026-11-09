"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { readGuestDraft } from "@/components/editor/use-guest-draft";
import { Notice } from "@/components/ui/notice";

const neverChanges = () => () => {};

/**
 * On the sign-in pages, when the visitor arrives from the guest editor:
 * says that the gift they made is kept and will be saved to the account.
 * Shown only once the browser has confirmed a draft is there.
 */
export function GuestDraftNotice() {
  const t = useTranslations("auth");
  const hasDraft = useSyncExternalStore(
    neverChanges,
    () => Boolean(readGuestDraft()),
    () => false,
  );
  if (!hasDraft) return null;
  return (
    <Notice tone="success" role="status">
      {t("guestDraftKept")}
    </Notice>
  );
}

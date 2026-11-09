"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";
import { createGiftFromDraft, type DraftError } from "@/features/gifts/actions";
import { clearGuestDraft, readGuestDraft } from "./use-guest-draft";

type Props = {
  /**
   * Only a draft of this template counts; without one the creator gets a
   * fresh gift of it. Omitted: any draft counts, and without one the creator
   * goes to the template picker.
   */
  template?: string;
};

/**
 * Turns the gift a visitor made before signing up into a saved gift. Runs
 * once the browser is there to ask for the draft; shows what it is doing,
 * then opens the editor on the new gift. A draft that cannot be saved stays
 * on the device, so nothing typed is lost.
 */
export function ContinueDraft({ template }: Props) {
  const t = useTranslations("editor.guest");
  const router = useRouter();
  // "signin" and "premium" send the person elsewhere; the rest are shown here.
  const [error, setError] = useState<Exclude<DraftError, "signin" | "premium"> | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const draft = readGuestDraft();
    if (!draft || (template && draft.template !== template)) {
      router.replace(template ? `/create?template=${template}` : "/create");
      return;
    }
    createGiftFromDraft(draft.template, JSON.stringify(draft.payload))
      .then((result) => {
        if ("giftId" in result) {
          clearGuestDraft();
          router.replace(`/create/${result.giftId}`);
        } else if (result.error === "signin") {
          router.replace(`/auth/login?next=${encodeURIComponent("/create/continue")}`);
        } else if (result.error === "premium") {
          // Unlocking is done from the picker; the draft waits on the device meanwhile.
          router.replace(`/create?error=premium&template=${draft.template}`);
        } else {
          setError(result.error);
        }
      })
      .catch(() => setError("unknown"));
  }, [template, router]);

  if (error) {
    return (
      <StatusPage
        bird="pink"
        title={t("continueFailed")}
        text={t(`continueErrors.${error}`)}
        className="min-h-svh"
      >
        {error === "limit" ? (
          <Button asChild>
            <Link href="/dashboard/gifts">{t("continueGifts")}</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/create">{t("continuePicker")}</Link>
          </Button>
        )}
        {error !== "invalid" && error !== "template" && (
          <Button asChild variant="secondary">
            <Link href="/create/continue">{t("continueRetry")}</Link>
          </Button>
        )}
      </StatusPage>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <Loader2 className="size-8 animate-spin text-primary-ink" />
      <div>
        <p className="font-display text-2xl font-semibold">{t("continueTitle")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("continueText")}</p>
      </div>
    </div>
  );
}

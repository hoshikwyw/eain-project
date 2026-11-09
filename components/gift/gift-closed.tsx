"use client";

import { Gift } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import type { GiftColors, Opening, ThemeVariant } from "@/features/gifts/schemas";
import { cn } from "@/lib/utils";
import { GiftOpening, type OpeningStage } from "./gift-opening";
import { giftPalette } from "./palettes";

type Props = {
  opening: Opening;
  variant: ThemeVariant;
  colors?: GiftColors;
  stage: OpeningStage;
  recipientName: string;
  onOpen: () => void;
  /** Replaces the full-screen height, for a preview inside a smaller frame. */
  className?: string;
};

/**
 * What a receiver sees first: the closed gift in its look, "someone made
 * something special for you", and the button that opens it. Pressing the
 * gift itself opens it too. While it opens, the words fade out.
 */
export function GiftClosed({
  opening,
  variant,
  colors,
  stage,
  recipientName,
  onOpen,
  className,
}: Props) {
  const t = useTranslations("gift");
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-8 px-6 py-12 text-center",
        className ?? "min-h-svh",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        disabled={stage === "opening"}
        tabIndex={-1}
        className="relative flex min-h-80 w-full max-w-sm cursor-pointer items-center justify-center rounded-3xl outline-none disabled:cursor-default"
      >
        <span
          aria-hidden="true"
          className="absolute inset-6 rounded-full opacity-60 blur-3xl"
          style={{ ...giftPalette(variant, colors), background: "var(--t-accent-soft)" }}
        />
        <span className="relative">
          <GiftOpening
            kind={opening}
            variant={variant}
            colors={colors}
            stage={stage}
            label={recipientName ? t("forName", { name: recipientName }) : t("forYou")}
          />
        </span>
      </button>
      <div
        className={cn(
          "flex flex-col items-center gap-3 transition-opacity duration-500",
          stage === "opening" && "opacity-0",
        )}
      >
        <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          {t("someone")}
        </p>
        <PageTitle className="text-balance">{t("specialForYou")}</PageTitle>
      </div>
      <Button
        size="lg"
        onClick={onOpen}
        disabled={stage === "opening"}
        className={cn(
          "min-w-52 transition-opacity duration-500",
          stage === "opening" && "opacity-0",
        )}
      >
        <Gift />
        {t("openYourGift")}
      </Button>
      <p className="text-xs text-muted-foreground">{t("noAccountNeeded")}</p>
    </div>
  );
}

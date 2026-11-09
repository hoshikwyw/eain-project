"use client";

import { Gift } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Lovebirds } from "@/components/brand/lovebirds";
import { Button } from "@/components/ui/button";
import type { GiftColors, Opening, PublicQuestion, ThemeVariant } from "@/features/gifts/schemas";
import { GiftClosed } from "./gift-closed";
import { openingDuration } from "./gift-opening";
import { ResponseForm } from "./response-form";

type Stage = "closed" | "opening" | "open";

const SESSION_KEY = "eain_session";

/** One random id per browser. Lets the server ignore repeat opens. */
function getSessionId(): string {
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing && /^[A-Za-z0-9_-]{8,64}$/.test(existing)) return existing;
    const fresh = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    return crypto.randomUUID();
  }
}

async function sendEvent(token: string, type: "opened" | "viewed" | "response_started") {
  try {
    await fetch(`/api/g/${token}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, sessionId: getSessionId() }),
      keepalive: true,
    });
  } catch {
    // Tracking must never break the gift.
  }
}

type Props = {
  token: string;
  questions: PublicQuestion[];
  opening: Opening;
  variant: ThemeVariant;
  colors?: GiftColors;
  recipientName: string;
  /** Where "Make your own gift" goes: the same template to try, or the library. */
  tryHref: string;
  children: React.ReactNode;
};

export function GiftReveal({
  token,
  questions,
  opening,
  variant,
  colors,
  recipientName,
  tryHref,
  children,
}: Props) {
  const t = useTranslations("gift");
  const [stage, setStage] = useState<Stage>("closed");
  const endRef = useRef<HTMLDivElement>(null);
  const viewedSent = useRef(false);

  function open() {
    if (stage !== "closed") return;
    setStage("opening");
    // Recorded on the tap, not the page load, so link previews never count.
    void sendEvent(token, "opened");
    window.setTimeout(() => setStage("open"), openingDuration(opening));
  }

  useEffect(() => {
    if (stage !== "open" || !endRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !viewedSent.current) {
        viewedSent.current = true;
        void sendEvent(token, "viewed");
        observer.disconnect();
      }
    });
    observer.observe(endRef.current);
    return () => observer.disconnect();
  }, [stage, token]);

  if (stage !== "open") {
    return (
      <GiftClosed
        opening={opening}
        variant={variant}
        colors={colors}
        stage={stage}
        recipientName={recipientName}
        onOpen={open}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl animate-in flex-col gap-8 px-4 py-8 duration-700 zoom-in-95 fade-in sm:py-14">
      {children}
      <ResponseForm
        token={token}
        questions={questions}
        sessionId={getSessionId}
        onStarted={() => void sendEvent(token, "response_started")}
      />
      <div ref={endRef} className="flex flex-col items-center gap-4 text-center">
        <div className="bg-hero flex w-full flex-col items-center gap-3 rounded-3xl px-6 py-8">
          <div className="w-24">
            <Lovebirds />
          </div>
          <p className="text-sm text-muted-foreground">{t("madeWith")}</p>
          <Link href="/" className="inline-flex rounded-lg" aria-label="Eain">
            <Logo />
          </Link>
          <Button asChild className="mt-1">
            <Link href={tryHref}>
              <Gift />
              {t("makeYourOwn")}
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">{t("makeYourOwnHint")}</p>
        </div>
        <Link
          href={`/g/${token}/report`}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("reportThis")}
        </Link>
      </div>
    </div>
  );
}

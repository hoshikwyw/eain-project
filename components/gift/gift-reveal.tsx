"use client";

import { Gift } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Lovebirds } from "@/components/brand/lovebirds";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import type { PublicQuestion } from "@/features/gifts/schemas";
import { cn } from "@/lib/utils";
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

type Props = { token: string; questions: PublicQuestion[]; children: React.ReactNode };

export function GiftReveal({ token, questions, children }: Props) {
  const t = useTranslations("gift");
  const [stage, setStage] = useState<Stage>("closed");
  const endRef = useRef<HTMLDivElement>(null);
  const viewedSent = useRef(false);

  function open() {
    if (stage !== "closed") return;
    setStage("opening");
    // Recorded on the tap, not the page load, so link previews never count.
    void sendEvent(token, "opened");
    window.setTimeout(() => setStage("open"), 900);
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
      <div className="flex min-h-svh flex-col items-center justify-center gap-8 px-6 py-12 text-center">
        <div className={cn("w-full max-w-xs transition-transform duration-700", stage === "opening" && "scale-110 opacity-0")}>
          <Lovebirds />
        </div>
        <div className={cn("flex flex-col items-center gap-3", stage === "opening" && "animate-out fade-out")}>
          <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{t("someone")}</p>
          <h1 className="font-display text-3xl font-semibold text-balance sm:text-4xl">{t("specialForYou")}</h1>
        </div>
        <Button size="lg" onClick={open} disabled={stage === "opening"} className="min-w-52">
          <Gift />
          {t("openYourGift")}
        </Button>
        <p className="text-xs text-muted-foreground">{t("noAccountNeeded")}</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in zoom-in-95 mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 duration-700 sm:py-14">
      {children}
      <ResponseForm
        token={token}
        questions={questions}
        sessionId={getSessionId}
        onStarted={() => void sendEvent(token, "response_started")}
      />
      <div ref={endRef} className="flex flex-col items-center gap-3 pt-4 text-center">
        <p className="text-sm text-muted-foreground">{t("madeWith")}</p>
        <Link href="/" className="inline-flex" aria-label="Eain">
          <Logo />
        </Link>
        <Button asChild variant="soft" size="sm">
          <Link href="/create">{t("makeYourOwn")}</Link>
        </Button>
      </div>
    </div>
  );
}

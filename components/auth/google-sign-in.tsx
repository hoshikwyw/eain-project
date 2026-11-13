"use client";

import { Loader2 } from "lucide-react";
import Script from "next/script";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { signInWithGoogleToken, type GoogleSignInError } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

type GoogleIdentity = {
  accounts: {
    id: {
      initialize(options: Record<string, unknown>): void;
      renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

type Props = {
  /** The web OAuth client id from Google Cloud. */
  clientId: string;
  /** Where to go once signed in. */
  next: string;
};

/** The widest Google draws its button. */
const MAX_BUTTON_WIDTH = 400;

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * "Continue with Google" drawn by Google's own sign-in library. The browser
 * gets an ID token straight from accounts.google.com and hands it to our
 * server, which finishes the sign-in with Supabase. The browser never
 * contacts the Supabase host, which some networks (Myanmar among them)
 * cannot reach. The token carries a hashed nonce; the server gets the raw
 * one, so a token minted for another site cannot be replayed here.
 */
export function GoogleSignIn({ clientId, next }: Props) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  const slot = useRef<HTMLDivElement>(null);
  // Google is set up once per page; the nonce lives as long as the page does.
  const nonce = useRef<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [error, setError] = useState<GoogleSignInError | null>(null);
  const [pending, startTransition] = useTransition();

  const draw = useCallback(async () => {
    const google = window.google?.accounts.id;
    const parent = slot.current;
    if (!google || !parent) return;
    if (!nonce.current) {
      const raw = crypto.randomUUID();
      nonce.current = raw;
      google.initialize({
        client_id: clientId,
        nonce: await sha256Hex(raw),
        ux_mode: "popup",
        callback: ({ credential }: { credential: string }) => {
          setError(null);
          startTransition(async () => {
            const result = await signInWithGoogleToken({ credential, nonce: raw, next });
            if (result?.error) setError(result.error);
          });
        },
      });
    }
    parent.replaceChildren();
    google.renderButton(parent, {
      theme: resolvedTheme === "dark" ? "filled_black" : "outline",
      size: "large",
      shape: "pill",
      text: "continue_with",
      logo_alignment: "center",
      width: Math.min(MAX_BUTTON_WIDTH, parent.clientWidth || MAX_BUTTON_WIDTH),
      locale,
    });
    setStatus("ready");
  }, [clientId, next, locale, resolvedTheme]);

  // The script is shared between the login and sign-up pages, so it may be
  // there already when this page draws; and the button is painted again when
  // the theme changes, since Google paints it once.
  useEffect(() => {
    if (window.google) void draw();
  }, [draw]);

  return (
    <div className="flex flex-col gap-3">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => void draw()}
        onError={() => setStatus("failed")}
      />
      {status !== "failed" && (
        <div className="relative min-h-11">
          <div
            ref={slot}
            aria-busy={pending}
            className={cn(
              "flex justify-center transition-opacity",
              pending && "pointer-events-none opacity-40",
            )}
          />
          {status === "loading" && (
            <Skeleton className="absolute inset-x-0 top-0 h-11 rounded-full" />
          )}
          {pending && (
            <p
              role="status"
              className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-semibold"
            >
              <Loader2 className="size-4 animate-spin" />
              {t("googleWorking")}
            </p>
          )}
        </div>
      )}
      {status === "failed" && (
        <p className="text-center text-xs text-muted-foreground">{t("googleUnavailable")}</p>
      )}
      {error && <Notice role="alert">{t(`errors.${error}`)}</Notice>}
    </div>
  );
}

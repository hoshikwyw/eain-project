"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { signIn, signUp } from "@/features/auth/actions";
import type { AuthFormState } from "@/features/auth/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { GoogleSignIn } from "./google-sign-in";
import { GuestDraftNotice } from "./guest-draft-notice";

type Props = {
  mode: "login" | "signup";
  next: string;
  notice?: string;
  configured: boolean;
  /** Google's web client id, when the provider is on in Supabase. No button without it. */
  googleClientId?: string;
  /** False on the admin site, which has no sign-up. */
  allowSignup?: boolean;
};

const initialState: AuthFormState = {};

const NOTICES = ["confirm", "oauthFailed", "notConfigured"] as const;
type Notice = (typeof NOTICES)[number];

function asNotice(value: string | undefined): Notice | undefined {
  return NOTICES.find((n) => n === value);
}

export function AuthForm({
  mode,
  next,
  notice,
  configured,
  googleClientId,
  allowSignup = true,
}: Props) {
  const t = useTranslations("auth");
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, initialState);

  const errorKey = !configured ? "notConfigured" : state.error;
  const noticeKey = asNotice(notice);

  return (
    <div className="flex flex-col gap-5">
      {googleClientId && configured && (
        <>
          <GoogleSignIn clientId={googleClientId} next={next} />

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t("or")}
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      {/* Arriving from the guest editor: the gift they made is waiting for this account. */}
      {next.startsWith("/create/continue") && <GuestDraftNotice />}

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="next" value={next} />

        {mode === "signup" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayName">{t("displayName")}</Label>
            <Input
              id="displayName"
              name="displayName"
              autoComplete="name"
              maxLength={80}
              required
              defaultValue={state.fields?.displayName}
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            defaultValue={state.fields?.email}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("password")}</Label>
            {mode === "login" && (
              <Link
                href="/auth/forgot"
                className="text-xs font-semibold text-primary-ink underline-offset-4 hover:underline"
              >
                {t("forgotLink")}
              </Link>
            )}
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={8}
            maxLength={72}
            required
          />
          {mode === "signup" && (
            <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
          )}
        </div>

        {errorKey ? (
          <Notice role="alert">{t(`errors.${errorKey}`)}</Notice>
        ) : noticeKey ? (
          <Notice role="status">{t(`notices.${noticeKey}`)}</Notice>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending || !configured}>
          {mode === "login" ? t("logIn") : t("createAccount")}
        </Button>
      </form>

      {allowSignup && (
        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? t("noAccount") : t("haveAccount")}{" "}
          <Link
            href={{ pathname: mode === "login" ? "/auth/signup" : "/auth/login", query: { next } }}
            className="font-semibold text-primary-ink underline-offset-4 hover:underline"
          >
            {mode === "login" ? t("signUp") : t("logIn")}
          </Link>
        </p>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { signIn, signInWithGoogle, signUp } from "@/features/auth/actions";
import type { AuthFormState } from "@/features/auth/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  mode: "login" | "signup";
  next: string;
  notice?: string;
  configured: boolean;
};

const initialState: AuthFormState = {};

const NOTICES = ["confirm", "oauthFailed", "notConfigured"] as const;
type Notice = (typeof NOTICES)[number];

function asNotice(value: string | undefined): Notice | undefined {
  return NOTICES.find((n) => n === value);
}

export function AuthForm({ mode, next, notice, configured }: Props) {
  const t = useTranslations("auth");
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, initialState);

  const errorKey = !configured ? "notConfigured" : state.error;
  const noticeKey = asNotice(notice);

  return (
    <div className="flex flex-col gap-5">
      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <Button type="submit" variant="secondary" className="w-full" disabled={!configured}>
          <GoogleMark />
          {t("continueWithGoogle")}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("or")}
        <span className="h-px flex-1 bg-border" />
      </div>

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
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={8}
            maxLength={72}
            required
          />
          {mode === "signup" && <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>}
        </div>

        {errorKey ? (
          <p role="alert" className="rounded-xl bg-accent px-3.5 py-2.5 text-sm text-accent-foreground">
            {t(`errors.${errorKey}`)}
          </p>
        ) : noticeKey ? (
          <p role="status" className="rounded-xl bg-accent px-3.5 py-2.5 text-sm text-accent-foreground">
            {t(`notices.${noticeKey}`)}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending || !configured}>
          {mode === "login" ? t("logIn") : t("createAccount")}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? t("noAccount") : t("haveAccount")}{" "}
        <Link
          href={{ pathname: mode === "login" ? "/auth/signup" : "/auth/login", query: { next } }}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          {mode === "login" ? t("signUp") : t("logIn")}
        </Link>
      </p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.6-2.6C16.8 3.1 14.6 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4 9.6-9.8 0-.7-.1-1.2-.2-1.7H12Z" />
    </svg>
  );
}

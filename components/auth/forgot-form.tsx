"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { requestPasswordReset, type ForgotState } from "@/features/auth/password";

export function ForgotForm({ expired }: { expired?: boolean }) {
  const t = useTranslations("auth.forgot");
  const [state, formAction] = useActionState<ForgotState, FormData>(requestPasswordReset, {});

  if (state.status === "sent") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-success-soft text-success">
          <Check className="size-6" />
        </span>
        <p className="font-semibold">{t("sentTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("sentText")}</p>
        <Link href="/auth/login" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
          {t("backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {expired && (
        <p role="status" className="rounded-xl bg-accent px-3.5 py-2.5 text-sm text-accent-foreground">
          {t("expired")}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required />
      </div>
      {state.status && (
        <p role="alert" className="rounded-xl bg-accent px-3.5 py-2.5 text-sm text-accent-foreground">
          {t(`errors.${state.status}`)}
        </p>
      )}
      <SubmitButton className="w-full" pendingLabel={t("sending")}>
        {t("send")}
      </SubmitButton>
      <p className="text-center text-xs text-muted-foreground">{t("sameDevice")}</p>
      <Link href="/auth/login" className="text-center text-sm font-semibold text-primary underline-offset-4 hover:underline">
        {t("backToLogin")}
      </Link>
    </form>
  );
}

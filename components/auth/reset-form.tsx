"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { updatePassword, type ResetState } from "@/features/auth/password";

export function ResetForm() {
  const t = useTranslations("auth.reset");
  const [state, formAction] = useActionState<ResetState, FormData>(updatePassword, {});

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t("password")}</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required />
        <p className="text-xs text-muted-foreground">{t("hint")}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm">{t("confirm")}</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} maxLength={72} required />
      </div>
      {state.status && (
        <p role="alert" className="rounded-xl bg-accent px-3.5 py-2.5 text-sm text-accent-foreground">
          {t(`errors.${state.status}`)}
          {state.status === "expired" && (
            <>
              {" "}
              <Link href="/auth/forgot" className="font-semibold underline">
                {t("requestNew")}
              </Link>
            </>
          )}
        </p>
      )}
      <SubmitButton className="w-full" pendingLabel={t("saving")}>
        {t("save")}
      </SubmitButton>
    </form>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { ConfirmButton } from "@/components/gift/confirm-button";
import { Input } from "@/components/ui/input";
import { deleteMyAccount, type DeleteAccountState } from "@/features/profile/delete-account";
import { toast } from "@/lib/toast";

export function DeleteAccountForm({ email }: { email: string }) {
  const t = useTranslations("dashboard.settings");
  const [state, formAction] = useActionState<DeleteAccountState, FormData>(deleteMyAccount, {});
  useEffect(() => {
    if (state.status) toast.error(t(`deleteErrors.${state.status}`));
  }, [state, t]);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-3">
      <label htmlFor="confirmEmail" className="text-sm text-muted-foreground">
        {t("typeEmail", { email })}
      </label>
      <Input
        id="confirmEmail"
        name="confirmEmail"
        type="email"
        autoComplete="off"
        required
        placeholder={email}
      />
      {state.status && (
        <p role="alert" className="text-sm text-destructive">
          {t(`deleteErrors.${state.status}`)}
        </p>
      )}
      <ConfirmButton
        variant="ghost"
        className="self-start text-destructive"
        confirmText={t("deleteConfirm")}
        danger
      >
        {t("deleteAccount")}
      </ConfirmButton>
    </form>
  );
}

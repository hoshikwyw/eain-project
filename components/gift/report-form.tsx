"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { submitReport } from "@/features/reports/actions";
import { REPORT_REASONS, type ReportState } from "@/features/reports/schemas";

export function ReportForm({ token }: { token: string }) {
  const t = useTranslations("report");
  const action = submitReport.bind(null, token);
  const [state, formAction, pending] = useActionState<ReportState, FormData>(action, {});

  if (state.status === "sent") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-success-soft text-success">
          <Check className="size-6" />
        </span>
        <p className="font-display text-xl font-semibold">{t("sentTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("sentText")}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">{t("reason")}</legend>
        {REPORT_REASONS.map((reason) => (
          <label key={reason} className="flex items-center gap-3 rounded-xl border border-border px-4 py-2.5 text-sm has-checked:border-primary has-checked:bg-accent">
            <input type="radio" name="reason" value={reason} required className="accent-primary" />
            {t(`reasons.${reason}`)}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="details">{t("details")}</Label>
        <textarea
          id="details"
          name="details"
          rows={4}
          maxLength={1000}
          placeholder={t("detailsPlaceholder")}
          className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </div>

      {state.status && (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${state.status}`)}
        </p>
      )}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? t("sending") : t("send")}
      </Button>
      <p className="text-xs text-muted-foreground">{t("privacy")}</p>
    </form>
  );
}
